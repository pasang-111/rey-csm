from django.contrib import admin
from .models import Subscriber, SubscriberImportLog


@admin.register(Subscriber)
class SubscriberAdmin(admin.ModelAdmin):
    list_display = ['full_name', 'email', 'company', 'is_subscribed', 'source', 'created_at']
    list_filter = ['is_subscribed', 'source', 'company', 'is_active']
    search_fields = ['full_name', 'email', 'phone']
    readonly_fields = ['subscribed_at', 'unsubscribed_at', 'created_at', 'updated_at']
    filter_horizontal = []  # tags handled by taggit


@admin.register(SubscriberImportLog)
class SubscriberImportLogAdmin(admin.ModelAdmin):
    list_display = ['file_name', 'company', 'status', 'created_count', 'updated_count', 'created_at']
    list_filter = ['status', 'company']
    readonly_fields = ['errors', 'created_at', 'completed_at']
