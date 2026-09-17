from django.contrib import admin
from .models import Newsletter, NewsletterRecipient


class NewsletterRecipientInline(admin.TabularInline):
    model = NewsletterRecipient
    extra = 0
    readonly_fields = ['subscriber', 'status', 'sent_at', 'opened_at']
    can_delete = False


@admin.register(Newsletter)
class NewsletterAdmin(admin.ModelAdmin):
    list_display = ['subject', 'company', 'status', 'total_sent', 'scheduled_at', 'sent_at']
    list_filter = ['status', 'company', 'send_as_parent']
    search_fields = ['subject']
    readonly_fields = ['total_recipients', 'total_sent', 'total_opened', 'total_clicked', 'sent_at']
    inlines = [NewsletterRecipientInline]
