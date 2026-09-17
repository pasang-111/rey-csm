from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from .models import Newsletter, NewsletterRecipient
from .serializers import NewsletterSerializer, NewsletterRecipientSerializer, EmailEventSerializer
from apps.newsletters.tasks import send_newsletter_task  # Celery task


class NewsletterViewSet(viewsets.ModelViewSet):
    serializer_class = NewsletterSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['company', 'status', 'send_as_parent']
    search_fields = ['subject']
    ordering = ['-created_at']

    def get_queryset(self):
        return Newsletter.objects.select_related('company', 'created_by', 'base_template')

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=True, methods=['get'])
    def preview_recipients(self, request, pk=None):
        newsletter = self.get_object()
        qs = newsletter.get_recipient_queryset()
        count = qs.count()
        sample = list(qs.values('id', 'full_name', 'email', 'company__name')[:20])
        return Response({'count': count, 'sample': sample})

    @action(detail=True, methods=['post'])
    def schedule(self, request, pk=None):
        newsletter = self.get_object()
        scheduled_at = request.data.get('scheduled_at')
        if not scheduled_at:
            return Response({'error': 'scheduled_at required'}, status=400)
        newsletter.scheduled_at = scheduled_at
        newsletter.status = 'scheduled'
        newsletter.save(update_fields=['scheduled_at', 'status', 'updated_at'])
        return Response({'status': 'scheduled', 'scheduled_at': scheduled_at})

    @action(detail=True, methods=['post'])
    def send_now(self, request, pk=None):
        newsletter = self.get_object()
        if newsletter.status not in ('draft', 'scheduled'):
            return Response({'error': 'Can only send draft or scheduled newsletters'}, status=400)
        
        # Trigger Celery task
        try:
            send_newsletter_task.delay(str(newsletter.id))
        except Exception:
            send_newsletter_task(str(newsletter.id))
        newsletter.status = 'sending'
        newsletter.save(update_fields=['status', 'updated_at'])
        return Response({'status': 'sending', 'message': 'Newsletter queued for delivery'})

    @action(detail=True, methods=['get'])
    def stats(self, request, pk=None):
        newsletter = self.get_object()
        return Response({
            'total_recipients': newsletter.total_recipients,
            'total_sent': newsletter.total_sent,
            'total_opened': newsletter.total_opened,
            'total_clicked': newsletter.total_clicked,
            'open_rate': round(newsletter.total_opened / max(newsletter.total_sent, 1) * 100, 1),
            'click_rate': round(newsletter.total_clicked / max(newsletter.total_sent, 1) * 100, 1),
        })

    @action(detail=True, methods=["get"])
    def recipients(self, request, pk=None):
        """Live recipient delivery rows for this campaign."""
        newsletter = self.get_object()
        qs = (
            NewsletterRecipient.objects.filter(newsletter=newsletter)
            .select_related("subscriber")
            .order_by("-sent_at", "-id")
        )
        status_f = request.query_params.get("status")
        if status_f:
            qs = qs.filter(status=status_f)
        search = request.query_params.get("search")
        if search:
            from django.db.models import Q
            qs = qs.filter(
                Q(email__icontains=search)
                | Q(subscriber__email__icontains=search)
                | Q(subscriber__full_name__icontains=search)
            )
        page = self.paginate_queryset(qs)
        ser = NewsletterRecipientSerializer(page or qs, many=True)
        if page is not None:
            return self.get_paginated_response(ser.data)
        return Response(ser.data)

    @action(detail=True, methods=["get"])
    def events(self, request, pk=None):
        """Live event stream (sent / opened / clicked / failed)."""
        newsletter = self.get_object()
        qs = EmailEvent.objects.filter(newsletter=newsletter).order_by("-created_at")[:500]
        return Response(EmailEventSerializer(qs, many=True).data)

    @action(detail=True, methods=["get"])
    def live_stats(self, request, pk=None):
        """Lightweight counters for polling during send."""
        n = self.get_object()
        from django.db.models import Count
        by_status = dict(
            NewsletterRecipient.objects.filter(newsletter=n)
            .values_list("status")
            .annotate(c=Count("id"))
            .values_list("status", "c")
        )
        return Response({
            "status": n.status,
            "total_recipients": n.total_recipients,
            "total_sent": n.total_sent,
            "total_opened": n.total_opened,
            "total_clicked": n.total_clicked,
            "total_unsubscribed": n.total_unsubscribed,
            "by_status": by_status,
            "updated_at": n.updated_at,
        })

