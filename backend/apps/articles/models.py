from django.db import models
from django.utils.text import slugify
from django.utils import timezone
import uuid


class Article(models.Model):
    """
    Per-company articles / blog posts.
    Can be embedded into newsletters.
    """
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('review', 'In Review'),
        ('published', 'Published'),
        ('archived', 'Archived'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    company = models.ForeignKey(
        'companies.Company',
        on_delete=models.CASCADE,
        related_name='articles'
    )
    
    title = models.CharField(max_length=300)
    slug = models.SlugField(max_length=320, blank=True)
    excerpt = models.TextField(blank=True, max_length=500)
    body = models.TextField(help_text="Rich text / Markdown / HTML")
    
    featured_image = models.ImageField(upload_to='articles/%Y/%m/', blank=True, null=True)
    featured_image_alt = models.CharField(max_length=255, blank=True)
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft', db_index=True)
    published_at = models.DateTimeField(null=True, blank=True)
    
    author = models.ForeignKey(
        'auth.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='articles'
    )
    
    # SEO
    meta_title = models.CharField(max_length=70, blank=True)
    meta_description = models.CharField(max_length=160, blank=True)
    
    # Engagement
    view_count = models.PositiveIntegerField(default=0)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-published_at', '-created_at']
        unique_together = [('company', 'slug')]
        indexes = [
            models.Index(fields=['company', 'status']),
            models.Index(fields=['slug']),
        ]

    def __str__(self):
        return self.title

    def save(self, *args, **kwargs):
        if not self.slug:
            base = slugify(self.title)[:280]
            self.slug = base
            counter = 1
            while Article.objects.filter(company=self.company, slug=self.slug).exclude(pk=self.pk).exists():
                self.slug = f"{base}-{counter}"
                counter += 1
        if self.status == 'published' and not self.published_at:
            self.published_at = timezone.now()
        super().save(*args, **kwargs)
