from django.db import models
from django.utils import timezone
import uuid


class Newsletter(models.Model):
    """
    Advanced newsletter with smart recipient filtering,
    scheduling, and per-company branding.
    """
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('queued', 'Queued'),
        ('scheduled', 'Scheduled'),
        ('sending', 'Sending'),
        ('sent', 'Sent'),
        ('cancelled', 'Cancelled'),
        ('failed', 'Failed'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # Which company is sending (or parent for group-wide)
    company = models.ForeignKey(
        'companies.Company',
        on_delete=models.CASCADE,
        related_name='newsletters'
    )
    
    # Optional: send as the parent brand
    send_as_parent = models.BooleanField(
        default=False,
        help_text="If true and company is a subsidiary, brand as REY Corporate Group"
    )
    
    subject = models.CharField(max_length=300)
    preheader = models.CharField(max_length=200, blank=True)
    
    # Content – can be built from template + drag-drop blocks
    html_content = models.TextField()
    plain_text = models.TextField(blank=True)
    
    # Base template used
    base_template = models.ForeignKey(
        'templates_app.EmailTemplate',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='newsletters'
    )
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft', db_index=True)
    
    # Smart recipient filter (JSON)
    # Example: {"is_subscribed": true, "tags": ["vip", "investor"], "companies": ["uuid1", "uuid2"], "source": ["website"]}
    recipient_filter = models.JSONField(default=dict, blank=True)
    
    # Stats
    total_recipients = models.PositiveIntegerField(default=0)
    total_sent = models.PositiveIntegerField(default=0)
    total_opened = models.PositiveIntegerField(default=0)
    total_clicked = models.PositiveIntegerField(default=0)
    total_bounced = models.PositiveIntegerField(default=0)
    total_unsubscribed = models.PositiveIntegerField(default=0)
    
    scheduled_at = models.DateTimeField(null=True, blank=True)
    sent_at = models.DateTimeField(null=True, blank=True)
    
    created_by = models.ForeignKey('auth.User', on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['company', 'status']),
            models.Index(fields=['status', 'scheduled_at']),
        ]

    def __str__(self):
        return f"{self.subject} [{self.get_status_display()}] – {self.company.short_name or self.company.name}"

    def get_recipient_queryset(self):
        """Build queryset from recipient_filter JSON"""
        from apps.subscribers.models import Subscriber
        from django.db.models import Q
        
        qs = Subscriber.objects.filter(is_active=True, is_subscribed=True)
        
        f = self.recipient_filter or {}
        
        # Company scope
        if self.send_as_parent and self.company.is_parent:
            # All companies under parent
            company_ids = list(self.company.subsidiaries.filter(is_active=True).values_list('id', flat=True))
            company_ids.append(self.company.id)
            qs = qs.filter(company_id__in=company_ids)
        elif f.get('companies'):
            qs = qs.filter(company_id__in=f['companies'])
        else:
            qs = qs.filter(company=self.company)
        
        # Tags
        if f.get('tags'):
            qs = qs.filter(tags__name__in=f['tags']).distinct()
        
        # Source
        if f.get('source'):
            qs = qs.filter(source__in=f['source'])
        
        # Date range
        if f.get('subscribed_after'):
            qs = qs.filter(subscribed_at__gte=f['subscribed_after'])
        if f.get('subscribed_before'):
            qs = qs.filter(subscribed_at__lte=f['subscribed_before'])
        
        return qs.distinct()


class NewsletterRecipient(models.Model):
    """Track individual delivery status"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    newsletter = models.ForeignKey(Newsletter, on_delete=models.CASCADE, related_name='recipients')
    subscriber = models.ForeignKey('subscribers.Subscriber', on_delete=models.CASCADE)
    
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('sent', 'Sent'),
        ('delivered', 'Delivered'),
        ('opened', 'Opened'),
        ('clicked', 'Clicked'),
        ('bounced', 'Bounced'),
        ('failed', 'Failed'),
        ('unsubscribed', 'Unsubscribed'),
    ]
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    
    sent_at = models.DateTimeField(null=True, blank=True)
    opened_at = models.DateTimeField(null=True, blank=True)
    clicked_at = models.DateTimeField(null=True, blank=True)
    error_message = models.TextField(blank=True)
    email = models.EmailField(blank=True, help_text="Denormalised for logs")
    open_count = models.PositiveIntegerField(default=0)
    click_count = models.PositiveIntegerField(default=0)

    # Tracking token for open/click
    tracking_token = models.UUIDField(default=uuid.uuid4, unique=True)

    class Meta:
        unique_together = [('newsletter', 'subscriber')]
        indexes = [
            models.Index(fields=['newsletter', 'status']),
            models.Index(fields=['tracking_token']),
        ]

    def __str__(self):
        return f"{self.subscriber.email} → {self.newsletter.subject} ({self.status})"



class EmailEvent(models.Model):
    """Immutable stream of delivery / engagement events for live logs."""
    EVENT_CHOICES = [
        ("queued", "Queued"),
        ("sent", "Sent"),
        ("failed", "Failed"),
        ("opened", "Opened"),
        ("clicked", "Clicked"),
        ("bounced", "Bounced"),
        ("unsubscribed", "Unsubscribed"),
    ]
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    newsletter = models.ForeignKey(
        Newsletter, on_delete=models.CASCADE, related_name="events"
    )
    recipient = models.ForeignKey(
        NewsletterRecipient,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="events",
    )
    email = models.EmailField(blank=True)
    event = models.CharField(max_length=20, choices=EVENT_CHOICES, db_index=True)
    detail = models.CharField(max_length=500, blank=True)
    meta = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["newsletter", "event"]),
            models.Index(fields=["-created_at"]),
        ]

    def __str__(self):
        return f"{self.event} {self.email} @ {self.created_at}"
