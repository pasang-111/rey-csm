from rest_framework import serializers
from .models import Newsletter, NewsletterRecipient, EmailEvent


class NewsletterSerializer(serializers.ModelSerializer):
    company_name = serializers.CharField(source="company.name", read_only=True)
    recipient_count = serializers.SerializerMethodField()
    total_failed = serializers.SerializerMethodField()
    kind = serializers.SerializerMethodField()

    class Meta:
        model = Newsletter
        fields = [
            "id", "company", "company_name", "send_as_parent",
            "subject", "preheader", "html_content", "plain_text",
            "base_template", "status", "kind",
            "total_recipients", "total_sent", "total_failed",
            "total_opened", "total_clicked", "total_bounced", "total_unsubscribed",
            "scheduled_at", "sent_at", "created_at", "updated_at",
            "recipient_count",
        ]
        read_only_fields = [
            "id", "total_recipients", "total_sent", "total_failed",
            "total_opened", "total_clicked", "total_bounced", "total_unsubscribed",
            "sent_at", "created_at", "updated_at", "recipient_count", "kind",
        ]

    def get_recipient_count(self, obj):
        return getattr(obj, "total_recipients", None) or obj.recipients.count()

    def get_total_failed(self, obj):
        return obj.recipients.filter(status="failed").count()

    def get_kind(self, obj):
        return (obj.recipient_filter or {}).get("kind") or "newsletter"


class NewsletterRecipientSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(source="subscriber.full_name", read_only=True)
    email = serializers.SerializerMethodField()

    class Meta:
        model = NewsletterRecipient
        fields = [
            "id", "status", "email", "full_name",
            "sent_at", "opened_at", "clicked_at",
            "open_count", "click_count", "error_message",
            "tracking_token",
        ]

    def get_email(self, obj):
        return obj.email or getattr(obj.subscriber, "email", "")


class EmailEventSerializer(serializers.ModelSerializer):
    class Meta:
        model = EmailEvent
        fields = [
            "id", "event", "email", "detail", "meta", "created_at", "recipient",
        ]
