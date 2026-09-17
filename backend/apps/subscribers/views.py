from rest_framework import viewsets, status, parsers
from rest_framework.decorators import action, api_view, permission_classes, throttle_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.throttling import AnonRateThrottle
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from django.utils import timezone
import logging

from .models import Subscriber, SubscriberImportLog
from .serializers import (
    SubscriberSerializer,
    PublicSubscribeSerializer,
    SubscriberImportSerializer,
)

logger = logging.getLogger(__name__)


class SubscribeRateThrottle(AnonRateThrottle):
    scope = 'subscribe'


class SubscriberViewSet(viewsets.ModelViewSet):
    serializer_class = SubscriberSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = {
        'company': ['exact'],
        'is_subscribed': ['exact'],
        'source': ['exact'],
        'is_active': ['exact'],
    }
    search_fields = ['full_name', 'email', 'phone', 'home_address']
    ordering_fields = ['created_at', 'full_name', 'email', 'subscribed_at']
    ordering = ['-created_at']

    def get_queryset(self):
        # No taggit prefetch — UUID + SQLite safe
        return Subscriber.objects.select_related('company').all()

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=True, methods=['post'])
    def unsubscribe(self, request, pk=None):
        subscriber = self.get_object()
        reason = request.data.get('reason', '')
        subscriber.unsubscribe(reason=reason)
        return Response({'status': 'unsubscribed', 'email': subscriber.email})

    @action(detail=True, methods=['post'])
    def resubscribe(self, request, pk=None):
        subscriber = self.get_object()
        subscriber.subscribe()
        return Response({'status': 'subscribed', 'email': subscriber.email})

    @action(
        detail=False,
        methods=['post'],
        parser_classes=[parsers.MultiPartParser, parsers.FormParser],
    )
    def import_spreadsheet(self, request):
        serializer = SubscriberImportSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        company = serializer.validated_data['company']
        file = serializer.validated_data['file']

        log = SubscriberImportLog.objects.create(
            company=company,
            uploaded_by=request.user,
            file_name=file.name,
            status='processing',
        )

        try:
            from .smart_import import smart_read_file, row_to_subscriber_data

            df, mapping = smart_read_file(file)

            if 'email' not in mapping:
                raise ValueError(
                    'Could not detect an email column. '
                    f'Found headers: {list(df.columns)}. '
                    'Include a column like Email / E-mail / Email Address.'
                )

            created = updated = skipped = errors = 0
            error_list = []
            detected = {k: v for k, v in mapping.items() if v != '__combine_name__'}

            for idx, row in df.iterrows():
                try:
                    data = row_to_subscriber_data(row, mapping)
                    if not data:
                        skipped += 1
                        continue

                    obj, was_created = Subscriber.objects.update_or_create(
                        company=company,
                        email=data['email'],
                        defaults={
                            'full_name': data['full_name'],
                            'phone': data['phone'],
                            'home_address': data['home_address'],
                            'source': 'import',
                            'is_subscribed': data['is_subscribed'],
                        },
                    )
                    if was_created:
                        created += 1
                        if data['is_subscribed']:
                            obj.subscribed_at = timezone.now()
                            obj.save(update_fields=['subscribed_at'])
                    else:
                        updated += 1
                except Exception as e:
                    errors += 1
                    error_list.append({'row': int(idx) + 2, 'error': str(e)})

            log.total_rows = len(df)
            log.created_count = created
            log.updated_count = updated
            log.skipped_count = skipped
            log.error_count = errors
            log.errors = error_list[:50]
            log.status = 'completed'
            log.completed_at = timezone.now()
            log.save()

            return Response({
                'status': 'completed',
                'log_id': str(log.id),
                'created': created,
                'updated': updated,
                'skipped': skipped,
                'errors': errors,
                'error_details': error_list[:10],
                'detected_columns': detected,
            })
        except Exception as e:
            logger.exception('Import failed')
            log.status = 'failed'
            log.errors = [{'error': str(e)}]
            log.save()
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([AllowAny])
@throttle_classes([SubscribeRateThrottle])
def public_subscribe(request):
    serializer = PublicSubscribeSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    subscriber, created = serializer.save()

    if created and subscriber.is_subscribed:
        try:
            from apps.core.email_service import send_smart_email

            send_smart_email(
                company=subscriber.company,
                to_email=subscriber.email,
                full_name=subscriber.full_name,
                body_content=(
                    f'Thank you for subscribing to <strong>{subscriber.company.name}</strong>. '
                    'You will receive updates, invitations and news from our team.'
                ),
                subject=f'Welcome to {subscriber.company.name}',
                template_type='thank_you_registration',
                cta_text='Visit our website',
                cta_url=subscriber.company.website or '',
            )
        except Exception:
            pass

    return Response(
        {
            'success': True,
            'created': created,
            'message': 'Successfully subscribed' if created else 'Subscription updated',
            'subscriber': {
                'id': str(subscriber.id),
                'full_name': subscriber.full_name,
                'email': subscriber.email,
                'company': subscriber.company.slug,
                'is_subscribed': subscriber.is_subscribed,
            },
        },
        status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
    )