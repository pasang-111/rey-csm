from django.db import models
from django.core.validators import EmailValidator
import uuid


class Subscriber(models.Model):
    """
    Contact / subscriber. UUID pk (works with SQLite).
    Tags as JSON list — not django-taggit (taggit breaks UUID + SQLite).
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    company = models.ForeignKey(
        'companies.Company',
        on_delete=models.CASCADE,
        related_name='subscribers',
    )

    full_name = models.CharField(max_length=255)
    email = models.EmailField(validators=[EmailValidator()])
    phone = models.CharField(max_length=40, blank=True)
    home_address = models.TextField(blank=True)

    is_subscribed = models.BooleanField(default=True, db_index=True)
    subscribed_at = models.DateTimeField(null=True, blank=True)
    unsubscribed_at = models.DateTimeField(null=True, blank=True)
    unsubscribe_reason = models.CharField(max_length=255, blank=True)

    SOURCE_CHOICES = [
        ('manual', 'Manual Entry'),
        ('import', 'Spreadsheet Import'),
        ('website', 'Website Form'),
        ('enquiry', 'Enquiry Form'),
        ('registration', 'Registration'),
        ('api', 'API'),
        ('other', 'Other'),
    ]
    source = models.CharField(max_length=30, choices=SOURCE_CHOICES, default='manual')
    source_detail = models.CharField(max_length=255, blank=True)

    tags = models.JSONField(default=list, blank=True)

    preferred_language = models.CharField(max_length=10, default='en')
    marketing_consent = models.BooleanField(default=True)
    sms_consent = models.BooleanField(default=False)

    last_email_sent_at = models.DateTimeField(null=True, blank=True)
    last_email_opened_at = models.DateTimeField(null=True, blank=True)
    total_emails_sent = models.PositiveIntegerField(default=0)
    total_emails_opened = models.PositiveIntegerField(default=0)

    notes = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(
        'auth.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='created_subscribers',
    )

    class Meta:
        unique_together = [('company', 'email')]
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['email']),
            models.Index(fields=['company', 'is_subscribed']),
            models.Index(fields=['is_subscribed', 'is_active']),
        ]

    def __str__(self):
        return f"{self.full_name} <{self.email}> [{self.company.short_name or self.company.name}]"

    def subscribe(self):
        from django.utils import timezone
        self.is_subscribed = True
        self.subscribed_at = timezone.now()
        self.unsubscribed_at = None
        self.save(update_fields=['is_subscribed', 'subscribed_at', 'unsubscribed_at', 'updated_at'])

    def unsubscribe(self, reason=''):
        from django.utils import timezone
        self.is_subscribed = False
        self.unsubscribed_at = timezone.now()
        self.unsubscribe_reason = reason
        self.save(update_fields=['is_subscribed', 'unsubscribed_at', 'unsubscribe_reason', 'updated_at'])


class SubscriberImportLog(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    company = models.ForeignKey('companies.Company', on_delete=models.CASCADE)
    uploaded_by = models.ForeignKey('auth.User', on_delete=models.SET_NULL, null=True)
    file_name = models.CharField(max_length=255)
    total_rows = models.PositiveIntegerField(default=0)
    created_count = models.PositiveIntegerField(default=0)
    updated_count = models.PositiveIntegerField(default=0)
    skipped_count = models.PositiveIntegerField(default=0)
    error_count = models.PositiveIntegerField(default=0)
    errors = models.JSONField(default=list, blank=True)
    status = models.CharField(
        max_length=20,
        choices=[
            ('pending', 'Pending'),
            ('processing', 'Processing'),
            ('completed', 'Completed'),
            ('failed', 'Failed'),
        ],
        default='pending',
    )
    created_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"Import {self.file_name} → {self.company.name} ({self.status})"