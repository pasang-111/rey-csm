from rest_framework import viewsets, status
from rest_framework.decorators import api_view, permission_classes, throttle_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.throttling import AnonRateThrottle
from django.utils import timezone
import logging

from .models import Enquiry
from .serializers import EnquirySerializer, PublicEnquirySerializer
from apps.companies.models import Company
from apps.subscribers.models import Subscriber

logger = logging.getLogger(__name__)


class EnquiryViewSet(viewsets.ModelViewSet):
    serializer_class = EnquirySerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['company', 'status', 'priority', 'assigned_to']
    search_fields = ['full_name', 'email', 'phone', 'message']
    ordering = ['-created_at']

    def get_queryset(self):
        return Enquiry.objects.select_related('company', 'assigned_to', 'subscriber')


@api_view(['POST'])
@permission_classes([AllowAny])
@throttle_classes([AnonRateThrottle])
def public_enquiry(request):
    """Public enquiry – creates enquiry + thank-you email."""
    serializer = PublicEnquirySerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    data = serializer.validated_data

    try:
        company = Company.objects.get(slug=data['company_slug'], is_active=True)
    except Company.DoesNotExist:
        return Response({'error': 'Company not found'}, status=404)

    enquiry = Enquiry.objects.create(
        company=company,
        full_name=data['full_name'],
        email=data['email'].lower().strip(),
        phone=data.get('phone', ''),
        message=data['message'],
        subject=data.get('subject', ''),
        property_interest=data.get('property_interest', ''),
        budget=data.get('budget', ''),
        source_page=data.get('source_page', ''),
    )

    if data.get('create_subscriber') and data.get('marketing_consent'):
        sub, created = Subscriber.objects.get_or_create(
            company=company,
            email=enquiry.email,
            defaults={
                'full_name': enquiry.full_name,
                'phone': enquiry.phone,
                'source': 'enquiry',
                'is_subscribed': True,
                'subscribed_at': timezone.now(),
            },
        )
        enquiry.subscriber = sub
        enquiry.subscriber_created = created
        enquiry.save(update_fields=['subscriber', 'subscriber_created'])

    try:
        from apps.core.email_service import send_smart_email

        send_smart_email(
            company=company,
            to_email=enquiry.email,
            full_name=enquiry.full_name,
            body_content=(
                f"Thank you for contacting <strong>{company.name}</strong>. "
                "We have received your enquiry and our team will get back to you "
                "within 24–48 hours.<br/><br/>"
                "We appreciate your interest and look forward to assisting you."
            ),
            subject=f"Thank you for your enquiry – {company.name}",
            template_type='thank_you_enquiry',
            cta_text='Visit our website',
            cta_url=company.website or '',
        )
        enquiry.thank_you_sent = True
        enquiry.thank_you_sent_at = timezone.now()
        enquiry.save(update_fields=['thank_you_sent', 'thank_you_sent_at'])
    except Exception as e:
        logger.exception('Thank-you email failed: %s', e)

    return Response(
        {
            'success': True,
            'message': 'Enquiry received. A confirmation email has been sent.',
            'enquiry_id': str(enquiry.id),
        },
        status=status.HTTP_201_CREATED,
    )
