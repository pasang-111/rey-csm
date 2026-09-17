"""
Manual / one-off email sends:
- Thank You (enquiry, registration, event)
- Event Invitation
- Custom message

Admin selects:
1. Sender company (parent REY Corporate Group OR any subgroup)
2. Template (or write free content)
3. Subject + body (personalised with {{ full_name }})
4. Recipients (select all / none / individual / filters)
"""
from rest_framework import serializers, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.utils import timezone
from django.core.mail import EmailMultiAlternatives
from django.template import Template, Context
from django.db.models import Q
import uuid

from apps.companies.models import Company
from apps.core.email_service import format_from_email, format_reply_to
from .tasks import send_bulk_email_task
from apps.subscribers.models import Subscriber
from apps.templates_app.models import EmailTemplate
from .models import Newsletter, NewsletterRecipient


class ManualSendSerializer(serializers.Serializer):
    # Who is sending
    company_id = serializers.UUIDField(help_text="Parent or any subgroup UUID")
    send_as_parent = serializers.BooleanField(
        default=False,
        help_text="If true, brand as REY Corporate Group even when a subgroup is selected"
    )

    # What type
    email_type = serializers.ChoiceField(
        choices=[
            'thank_you_enquiry',
            'thank_you_registration',
            'thank_you_event',
            'invitation',
            'custom',
        ],
        default='custom'
    )

    # Content
    subject = serializers.CharField(max_length=300)
    preheader = serializers.CharField(max_length=200, required=False, allow_blank=True)
    html_content = serializers.CharField(help_text="Full HTML or plain text; supports {{ full_name }}, {{ company.name }}")
    plain_text = serializers.CharField(required=False, allow_blank=True)

    # Optional: start from a saved template
    template_id = serializers.UUIDField(required=False, allow_null=True)

    # Recipients – three modes
    # 1) Explicit list of subscriber IDs
    subscriber_ids = serializers.ListField(
        child=serializers.UUIDField(),
        required=False,
        allow_empty=True
    )
    # 2) Select all matching filter
    select_all = serializers.BooleanField(default=False)
    # 3) Filter (used when select_all=True or as extra constraint)
    filter_company_ids = serializers.ListField(
        child=serializers.UUIDField(),
        required=False,
        allow_empty=True
    )
    filter_tags = serializers.ListField(
        child=serializers.CharField(),
        required=False,
        allow_empty=True
    )
    filter_is_subscribed = serializers.BooleanField(default=True)

    # Behaviour
    send_immediately = serializers.BooleanField(default=True)
    scheduled_at = serializers.DateTimeField(required=False, allow_null=True)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def manual_send(request):
    """
    Compose and send a Thank You / Invitation / Custom email
    to selected users from any company (parent or subgroup).

    POST /api/newsletters/manual-send/
    """
    ser = ManualSendSerializer(data=request.data)
    ser.is_valid(raise_exception=True)
    data = ser.validated_data

    try:
        company = Company.objects.get(id=data['company_id'], is_active=True)
    except Company.DoesNotExist:
        return Response({'error': 'Company not found'}, status=404)

    # Resolve branding company
    brand_company = company
    if data.get('send_as_parent') and company.parent_id:
        brand_company = company.parent
    elif data.get('send_as_parent') and company.is_parent:
        brand_company = company

    # Build recipient queryset
    qs = Subscriber.objects.filter(is_active=True)
    if data.get('filter_is_subscribed', True):
        qs = qs.filter(is_subscribed=True)

    if data.get('subscriber_ids'):
        qs = qs.filter(id__in=data['subscriber_ids'])
    elif data.get('select_all'):
        # Scope to company hierarchy
        if data.get('filter_company_ids'):
            qs = qs.filter(company_id__in=data['filter_company_ids'])
        elif company.is_parent:
            # All under parent
            sub_ids = list(company.subsidiaries.filter(is_active=True).values_list('id', flat=True))
            sub_ids.append(company.id)
            qs = qs.filter(company_id__in=sub_ids)
        else:
            qs = qs.filter(company=company)
    else:
        # Default: only this company's subscribers if no IDs given
        if not data.get('subscriber_ids'):
            return Response(
                {'error': 'Provide subscriber_ids or set select_all=true'},
                status=400
            )

    if data.get('filter_tags'):
        qs = qs.filter(tags__name__in=data['filter_tags']).distinct()

    recipients = list(qs.select_related('company'))
    if not recipients:
        return Response({'error': 'No recipients matched'}, status=400)

    # Create a Newsletter record for tracking (acts as campaign)
    campaign = Newsletter.objects.create(
        company=company,
        send_as_parent=data.get('send_as_parent', False),
        subject=data['subject'],
        preheader=data.get('preheader', ''),
        html_content=data['html_content'],
        plain_text=data.get('plain_text', ''),
        status='queued',
        scheduled_at=data.get('scheduled_at'),
        recipient_filter={
            'manual': True,
            'email_type': data['email_type'],
            'subscriber_ids': [str(s.id) for s in recipients],
        },
        total_recipients=len(recipients),
        created_by=request.user,
    )

    # Optional: load base template for extra branding
    base_html = data['html_content']
    if data.get('template_id'):
        try:
            tpl = EmailTemplate.objects.get(id=data['template_id'], is_active=True)
            # If user provided only body, wrap with template – otherwise use as-is
            campaign.base_template = tpl
            campaign.save(update_fields=['base_template'])
        except EmailTemplate.DoesNotExist:
            pass

    # Cap at 500 for safety (covers ~458 Teej list)
    if len(recipients) > 500:
        recipients = recipients[:500]

    # Create pending rows in bulk (fast)
    NewsletterRecipient.objects.bulk_create(
        [
            NewsletterRecipient(
                newsletter=campaign,
                subscriber=sub,
                status="pending",
            )
            for sub in recipients
        ],
        batch_size=200,
        ignore_conflicts=True,
    )

    campaign.status = "queued"
    campaign.total_recipients = len(recipients)
    campaign.save(update_fields=["status", "total_recipients"])

    # Background send via Celery – API returns immediately
    try:
        async_result = send_bulk_email_task.delay(str(campaign.id))
        task_id = async_result.id
    except Exception as e:
        # Fallback: if Redis/Celery is down, mark failed and report
        campaign.status = "failed"
        campaign.save(update_fields=["status"])
        return Response(
            {
                "success": False,
                "error": "Could not queue email job. Is Redis and Celery running?",
                "detail": str(e)[:300],
                "campaign_id": str(campaign.id),
            },
            status=status.HTTP_503_SERVICE_UNAVAILABLE,
        )

    return Response(
        {
            "success": True,
            "queued": True,
            "campaign_id": str(campaign.id),
            "task_id": task_id,
            "email_type": data["email_type"],
            "sender": brand_company.name,
            "from_email": format_from_email(brand_company),
            "total_recipients": len(recipients),
            "message": (
                f"Queued {len(recipients)} email(s) as {brand_company.name}. "
                "Sending in the background – you can leave this page."
            ),
        },
        status=status.HTTP_202_ACCEPTED,
    )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_recipients_for_compose(request):
    """
    Helper for the compose UI: list subscribers with filters
    so the admin can Select All / None / individual.
    GET /api/newsletters/compose-recipients/?company=uuid&tags=vip&q=search
    """
    qs = Subscriber.objects.filter(is_active=True, is_subscribed=True).select_related('company')

    company = request.query_params.get('company')
    if company:
        try:
            c = Company.objects.get(id=company)
            if c.is_parent and request.query_params.get('include_subsidiaries') == '1':
                ids = list(c.subsidiaries.filter(is_active=True).values_list('id', flat=True))
                ids.append(c.id)
                qs = qs.filter(company_id__in=ids)
            else:
                qs = qs.filter(company_id=company)
        except Company.DoesNotExist:
            pass

    tags = request.query_params.getlist('tags') or request.query_params.get('tags', '').split(',')
    tags = [t.strip() for t in tags if t.strip()]
    if tags:
        qs = qs.filter(tags__name__in=tags).distinct()

    q = request.query_params.get('q', '').strip()
    if q:
        qs = qs.filter(
            Q(full_name__icontains=q) | Q(email__icontains=q) | Q(phone__icontains=q)
        )

    page_size = min(int(request.query_params.get('page_size', 50)), 200)
    total = qs.count()
    results = list(qs[:page_size].values(
        'id', 'full_name', 'email', 'phone', 'company_id',
        'company__name', 'company__short_name'
    ))

    return Response({
        'count': total,
        'results': [
            {
                'id': str(r['id']),
                'full_name': r['full_name'],
                'email': r['email'],
                'phone': r['phone'] or '',
                'company_id': str(r['company_id']),
                'company_name': r['company__short_name'] or r['company__name'],
            }
            for r in results
        ],
    })
