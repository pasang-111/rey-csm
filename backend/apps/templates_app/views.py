from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django.template import Template, Context
from .models import EmailTemplate, TemplateBlock
from .serializers import EmailTemplateSerializer, TemplateBlockSerializer


class EmailTemplateViewSet(viewsets.ModelViewSet):
    parser_classes = [JSONParser, MultiPartParser, FormParser]
    serializer_class = EmailTemplateSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['company', 'type', 'is_default', 'is_active']
    search_fields = ['name', 'subject']

    def get_queryset(self):
        return EmailTemplate.objects.select_related('company').distinct()

    @action(detail=True, methods=['post'])
    def preview(self, request, pk=None):
        """Render template with sample / provided context"""
        template = self.get_object()
        context = request.data.get('context', {
            'full_name': 'John Doe',
            'body_content': 'Thank you for your enquiry. Our team will contact you shortly.',
            'cta_text': 'Visit Our Website',
            'cta_url': 'https://reycorporate.com',
        })
        html = template.get_rendered_html(context)
        return Response({'html': html, 'subject': template.subject})

    @action(detail=True, methods=['post'])
    def send_test(self, request, pk=None):
        """Send a test email to the current user"""
        from django.core.mail import EmailMultiAlternatives
        template = self.get_object()
        to_email = request.data.get('to') or request.user.email
        context = request.data.get('context', {'full_name': request.user.get_full_name() or 'Test User'})
        html = template.get_rendered_html(context)
        
        msg = EmailMultiAlternatives(
            subject=f"[TEST] {template.subject}",
            body=template.plain_text or 'Test email',
            from_email=template.company.from_email,
            to=[to_email]
        )
        msg.attach_alternative(html, "text/html")
        msg.send(fail_silently=False)
        return Response({'status': 'sent', 'to': to_email})



    @action(detail=True, methods=['post'], url_path='upload_header_logo')
    def upload_header_logo(self, request, pk=None):
        """POST multipart: logo|file|header_logo → saves header logo media."""
        template = self.get_object()
        f = request.FILES.get('logo') or request.FILES.get('file') or request.FILES.get('header_logo')
        if not f:
            return Response({'error': 'Provide file field: logo, file, or header_logo'}, status=400)
        template.header_logo = f
        template.save(update_fields=['header_logo', 'updated_at'])
        url = request.build_absolute_uri(template.header_logo.url)
        settings = dict(template.logo_settings or {})
        settings['headerUrl'] = url
        template.logo_settings = settings
        template.save(update_fields=['logo_settings'])
        return Response({'header_logo_url': url, 'logo_settings': settings})

    @action(detail=True, methods=['post'], url_path='upload_footer_logo')
    def upload_footer_logo(self, request, pk=None):
        """POST multipart: logo|file|footer_logo → saves footer logo media."""
        template = self.get_object()
        f = request.FILES.get('logo') or request.FILES.get('file') or request.FILES.get('footer_logo')
        if not f:
            return Response({'error': 'Provide file field: logo, file, or footer_logo'}, status=400)
        template.footer_logo = f
        template.save(update_fields=['footer_logo', 'updated_at'])
        url = request.build_absolute_uri(template.footer_logo.url)
        settings = dict(template.logo_settings or {})
        settings['footerUrl'] = url
        template.logo_settings = settings
        template.save(update_fields=['logo_settings'])
        return Response({'footer_logo_url': url, 'logo_settings': settings})

    @action(detail=True, methods=['post'], url_path='clear_header_logo')
    def clear_header_logo(self, request, pk=None):
        template = self.get_object()
        if template.header_logo:
            template.header_logo.delete(save=False)
        template.header_logo = None
        settings = dict(template.logo_settings or {})
        settings.pop('headerUrl', None)
        template.logo_settings = settings
        template.save()
        return Response({'ok': True})

    @action(detail=True, methods=['post'], url_path='clear_footer_logo')
    def clear_footer_logo(self, request, pk=None):
        template = self.get_object()
        if template.footer_logo:
            template.footer_logo.delete(save=False)
        template.footer_logo = None
        settings = dict(template.logo_settings or {})
        settings.pop('footerUrl', None)
        template.logo_settings = settings
        template.save()
        return Response({'ok': True})


    @action(detail=True, methods=['post'])
    def duplicate(self, request, pk=None):
        tpl = self.get_object()
        tpl.pk = None
        tpl.id = None
        tpl.name = f"{tpl.name} (copy)"
        tpl.slug = ""
        tpl.is_default = False
        tpl.save()
        return Response(EmailTemplateSerializer(tpl, context={'request': request}).data, status=status.HTTP_201_CREATED).distinct()

class TemplateBlockViewSet(viewsets.ModelViewSet):
    serializer_class = TemplateBlockSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['block_type', 'is_global', 'company']

    def get_queryset(self):
        return TemplateBlock.objects.all().distinct()
