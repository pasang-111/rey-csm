from django.contrib import admin
from .models import EmailTemplate, TemplateBlock


@admin.register(EmailTemplate)
class EmailTemplateAdmin(admin.ModelAdmin):
    list_display = ['name', 'type', 'company', 'is_default', 'is_active', 'version']
    list_filter = ['type', 'is_default', 'is_active', 'company']
    search_fields = ['name', 'subject']
    readonly_fields = ['version', 'created_at', 'updated_at']


@admin.register(TemplateBlock)
class TemplateBlockAdmin(admin.ModelAdmin):
    list_display = ['name', 'block_type', 'is_global', 'company', 'sort_order']
    list_filter = ['block_type', 'is_global']
