from rest_framework import serializers
from .models import Enquiry
from apps.subscribers.models import Subscriber
from django.utils import timezone


class EnquirySerializer(serializers.ModelSerializer):
    company_name = serializers.CharField(source='company.name', read_only=True)
    assigned_to_name = serializers.CharField(source='assigned_to.get_full_name', read_only=True)

    class Meta:
        model = Enquiry
        fields = [
            'id', 'company', 'company_name', 'full_name', 'email', 'phone',
            'message', 'subject', 'property_interest', 'budget',
            'source_page', 'utm_source', 'utm_medium', 'utm_campaign',
            'status', 'priority', 'assigned_to', 'assigned_to_name',
            'thank_you_sent', 'thank_you_sent_at', 'subscriber_created',
            'subscriber', 'internal_notes', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'thank_you_sent', 'thank_you_sent_at',
                            'subscriber_created', 'subscriber', 'created_at', 'updated_at']


class PublicEnquirySerializer(serializers.Serializer):
    company_slug = serializers.SlugField()
    full_name = serializers.CharField(max_length=255)
    email = serializers.EmailField()
    phone = serializers.CharField(max_length=40, required=False, allow_blank=True)
    message = serializers.CharField()
    subject = serializers.CharField(required=False, allow_blank=True)
    property_interest = serializers.CharField(required=False, allow_blank=True)
    budget = serializers.CharField(required=False, allow_blank=True)
    source_page = serializers.URLField(required=False, allow_blank=True)
    create_subscriber = serializers.BooleanField(default=True)
    marketing_consent = serializers.BooleanField(default=True)
