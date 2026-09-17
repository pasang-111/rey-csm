import uuid
from django.db import models
from django.conf import settings


TEMPLATE_TYPES = [
    ('thank_you_enquiry', 'Thank You – Enquiry'),
    ('thank_you_registration', 'Thank You – Registration'),
    ('thank_you_event', 'Thank You – Event / Attendance'),
    ('invitation', 'Event Invitation'),
    ('newsletter_base', 'Newsletter Base Layout'),
    ('welcome', 'Welcome Series'),
    ('custom', 'Custom / Manual Send'),
    ('event_reminder', 'Event Reminder'),
    ('announcement', 'Corporate Announcement'),
]


class EmailTemplate(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=200)
    slug = models.SlugField(max_length=220, blank=True)
    type = models.CharField(max_length=40, choices=TEMPLATE_TYPES, db_index=True)
    subject = models.CharField(max_length=300, help_text='Supports {{ variables }}')
    preheader = models.CharField(max_length=200, blank=True)
    html_body = models.TextField(
        help_text='Full HTML. Use {{ full_name }}, {{ company.name }}, etc.'
    )
    plain_text = models.TextField(blank=True, help_text='Auto-generated if left blank')
    primary_color = models.CharField(max_length=7, blank=True)
    secondary_color = models.CharField(max_length=7, blank=True)
    header_bg = models.CharField(max_length=7, blank=True)
    footer_bg = models.CharField(max_length=7, blank=True)
    logo_settings = models.JSONField(
        blank=True,
        default=dict,
        help_text='{"width": 180, "height": 60, "align": "center", "headerWidth": 160, "footerWidth": 100}',
    )
    # Local media uploads for email header & footer logos
    header_logo = models.ImageField(
        upload_to="email-logos/header/%Y/%m/",
        blank=True,
        null=True,
        help_text="Logo shown in the email header (PNG/SVG preferred)",
    )
    footer_logo = models.ImageField(
        upload_to="email-logos/footer/%Y/%m/",
        blank=True,
        null=True,
        help_text="Logo shown in the email footer",
    )
    is_default = models.BooleanField(
        default=False, help_text='Default for this type + company'
    )
    is_active = models.BooleanField(default=True)
    version = models.PositiveIntegerField(default=1)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    company = models.ForeignKey(
        'companies.Company',
        on_delete=models.CASCADE,
        related_name='email_templates',
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )
    parent_template = models.ForeignKey(
        'self',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='versions',
    )

    @property
    def header_logo_url(self):
        if self.header_logo:
            try:
                return self.header_logo.url
            except ValueError:
                pass
        return (self.logo_settings or {}).get("headerUrl") or (self.logo_settings or {}).get("url") or ""

    @property
    def footer_logo_url(self):
        if self.footer_logo:
            try:
                return self.footer_logo.url
            except ValueError:
                pass
        return (self.logo_settings or {}).get("footerUrl") or ""

    class Meta:
        ordering = ['company', 'type', '-is_default', 'name']
        unique_together = [('company', 'slug')]
        indexes = [
            models.Index(fields=['company', 'type', 'is_default']),
        ]

    def __str__(self):
        return f"{self.name} ({self.get_type_display()})"


class TemplateBlock(models.Model):
    BLOCK_TYPES = [
        ('header', 'Header with Logo'),
        ('hero', 'Hero Banner'),
        ('text', 'Rich Text'),
        ('image', 'Image'),
        ('button', 'CTA Button'),
        ('divider', 'Divider'),
        ('spacer', 'Spacer'),
        ('columns', 'Two Columns'),
        ('footer', 'Footer'),
        ('social', 'Social Links'),
        ('product', 'Featured Property / Product'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=120)
    block_type = models.CharField(max_length=30, choices=BLOCK_TYPES)
    html_snippet = models.TextField(help_text='HTML with {{ placeholders }}')
    thumbnail = models.ImageField(upload_to='blocks/', blank=True, null=True)
    is_global = models.BooleanField(
        default=False, help_text='Available to all companies'
    )
    sort_order = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    company = models.ForeignKey(
        'companies.Company',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='blocks',
    )

    class Meta:
        ordering = ['sort_order', 'name']

    def __str__(self):
        return self.name
