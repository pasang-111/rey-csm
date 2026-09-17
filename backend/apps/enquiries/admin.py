from django.contrib import admin
from .models import Enquiry


@admin.register(Enquiry)
class EnquiryAdmin(admin.ModelAdmin):
    list_display = ['full_name', 'email', 'company', 'status', 'priority', 'thank_you_sent', 'created_at']
    list_filter = ['status', 'priority', 'company', 'thank_you_sent']
    search_fields = ['full_name', 'email', 'message']
    readonly_fields = ['thank_you_sent', 'thank_you_sent_at', 'subscriber_created', 'created_at']
