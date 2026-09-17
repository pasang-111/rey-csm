from django.contrib import admin
from .models import Company, CompanyDomain


class CompanyDomainInline(admin.TabularInline):
    model = CompanyDomain
    extra = 1


@admin.register(Company)
class CompanyAdmin(admin.ModelAdmin):
    list_display = ['name', 'short_name', 'is_parent', 'parent', 'is_active', 'sort_order']
    list_filter = ['is_parent', 'is_active']
    search_fields = ['name', 'slug', 'domain']
    prepopulated_fields = {'slug': ('name',)}
    inlines = [CompanyDomainInline]
    fieldsets = (
        (None, {'fields': ('name', 'short_name', 'slug', 'parent', 'is_parent', 'is_active', 'sort_order')}),
        ('Branding', {'fields': ('logo', 'logo_dark', 'favicon', 'primary_color', 'secondary_color', 'accent_color')}),
        ('Contact', {'fields': ('domain', 'website', 'from_email', 'reply_to_email', 'support_email', 'phone', 'address')}),
        ('Social', {'fields': ('facebook', 'instagram', 'linkedin', 'twitter')}),
        ('About', {'fields': ('tagline', 'description')}),
    )
