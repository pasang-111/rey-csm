from django.db import models
from django.utils.text import slugify
from django.core.validators import RegexValidator
import uuid


class Company(models.Model):
    """
    REY Corporate Group and all subsidiaries.
    Supports hierarchical structure (parent → subsidiaries).
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=200, help_text="Official company name")
    slug = models.SlugField(max_length=220, unique=True, blank=True)
    short_name = models.CharField(max_length=50, blank=True, help_text="Short display name")
    
    parent = models.ForeignKey(
        'self',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='subsidiaries',
        help_text="Leave empty for REY Corporate Group (parent)"
    )
    is_parent = models.BooleanField(default=False, help_text="True only for REY Corporate Group")
    
    # Branding
    logo = models.ImageField(
        upload_to='logos/%Y/%m/',
        blank=True,
        null=True,
        help_text="Main logo (transparent PNG preferred)"
    )
    # Official CDN / website logo for emails when no local upload
    external_logo_url = models.URLField(
        blank=True,
        help_text="Public logo URL e.g. https://www.reycorp.com.au/logos/rey-homes.png"
    )
    logo_dark = models.ImageField(
        upload_to='logos/%Y/%m/',
        blank=True,
        null=True,
        help_text="Logo for dark backgrounds"
    )
    favicon = models.ImageField(upload_to='favicons/', blank=True, null=True)
    
    primary_color = models.CharField(
        max_length=7,
        default='#0A2540',
        validators=[RegexValidator(r'^#[0-9A-Fa-f]{6}$')],
        help_text="Hex color e.g. #0A2540"
    )
    secondary_color = models.CharField(
        max_length=7,
        default='#C9A227',
        validators=[RegexValidator(r'^#[0-9A-Fa-f]{6}$')]
    )
    accent_color = models.CharField(
        max_length=7,
        default='#1E3A5F',
        validators=[RegexValidator(r'^#[0-9A-Fa-f]{6}$')],
        blank=True
    )
    
    # Contact & Domain
    domain = models.CharField(max_length=255, blank=True, help_text="e.g. sandstone.com.np")
    website = models.URLField(blank=True)
    from_email = models.EmailField(help_text="Default sender for this company")
    reply_to_email = models.EmailField(blank=True)
    support_email = models.EmailField(blank=True)
    phone = models.CharField(max_length=30, blank=True)
    address = models.TextField(blank=True)
    
    # Social
    facebook = models.URLField(blank=True)
    instagram = models.URLField(blank=True)
    linkedin = models.URLField(blank=True)
    twitter = models.URLField(blank=True)
    
    # Meta
    description = models.TextField(blank=True)
    tagline = models.CharField(max_length=255, blank=True)
    # Email footer line. Children: "Sandstone Constructions — A Part of the REY Corporate Group."
    footer_text = models.CharField(max_length=500, blank=True)
    is_active = models.BooleanField(default=True)
    sort_order = models.PositiveIntegerField(default=0)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = "Companies"
        ordering = ['sort_order', 'name']
        indexes = [
            models.Index(fields=['slug']),
            models.Index(fields=['is_parent', 'is_active']),
        ]

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if not self.slug:
            base = slugify(self.short_name or self.name)
            self.slug = base
            counter = 1
            while Company.objects.filter(slug=self.slug).exclude(pk=self.pk).exists():
                self.slug = f"{base}-{counter}"
                counter += 1
        if self.is_parent:
            self.parent = None
        super().save(*args, **kwargs)

    @property
    def brand_footer(self) -> str:
        if self.footer_text:
            return self.footer_text.strip()
        if self.is_parent or not self.parent_id:
            return self.name
        parent_name = getattr(self.parent, "name", None) or "REY Corporate Group"
        return f"{self.name} — A Part of the {parent_name}."

    def resolve_brand(self, send_as_parent: bool = False):
        if send_as_parent and self.parent_id and self.parent:
            return self.parent
        return self

    @property
    def logo_url(self):
        if self.logo:
            try:
                return self.logo.url
            except ValueError:
                pass
        if getattr(self, "external_logo_url", None):
            return self.external_logo_url
        return None

    @property
    def full_hierarchy(self):
        """Return list of company names from parent to self"""
        path = [self.name]
        current = self.parent
        while current:
            path.insert(0, current.name)
            current = current.parent
        return path

    def get_all_subscribers_queryset(self):
        """Include own + all subsidiaries if parent"""
        from apps.subscribers.models import Subscriber
        if self.is_parent:
            company_ids = list(self.subsidiaries.filter(is_active=True).values_list('id', flat=True))
            company_ids.append(self.id)
            return Subscriber.objects.filter(company_id__in=company_ids, is_subscribed=True)
        return self.subscribers.filter(is_subscribed=True)


class CompanyDomain(models.Model):
    """Additional domains / aliases for a company"""
    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name='domains')
    domain = models.CharField(max_length=255, unique=True)
    is_primary = models.BooleanField(default=False)
    verified = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.domain} → {self.company.name}"
