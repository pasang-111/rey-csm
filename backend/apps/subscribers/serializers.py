from rest_framework import serializers
from .models import Subscriber
from apps.companies.models import Company


class SubscriberSerializer(serializers.ModelSerializer):
    company_name = serializers.CharField(source='company.name', read_only=True)
    company_slug = serializers.CharField(source='company.slug', read_only=True)

    class Meta:
        model = Subscriber
        fields = [
            'id', 'company', 'company_name', 'company_slug',
            'full_name', 'email', 'phone', 'home_address',
            'is_subscribed', 'subscribed_at', 'unsubscribed_at',
            'source', 'source_detail', 'tags',
            'preferred_language', 'marketing_consent', 'sms_consent',
            'last_email_sent_at', 'total_emails_sent', 'total_emails_opened',
            'notes', 'is_active', 'created_at', 'updated_at',
        ]
        read_only_fields = [
            'id', 'subscribed_at', 'unsubscribed_at', 'created_at', 'updated_at',
            'last_email_sent_at', 'total_emails_sent', 'total_emails_opened',
        ]


class PublicSubscribeSerializer(serializers.Serializer):
    company_slug = serializers.SlugField()
    full_name = serializers.CharField(max_length=255)
    email = serializers.EmailField()
    phone = serializers.CharField(max_length=40, required=False, allow_blank=True)
    home_address = serializers.CharField(required=False, allow_blank=True)
    tags = serializers.ListField(child=serializers.CharField(), required=False)
    marketing_consent = serializers.BooleanField(default=True)
    source = serializers.CharField(default='website')
    source_detail = serializers.CharField(required=False, allow_blank=True)

    def validate_company_slug(self, value):
        try:
            return Company.objects.get(slug=value, is_active=True)
        except Company.DoesNotExist:
            raise serializers.ValidationError('Company not found or inactive.')

    def create(self, validated_data):
        company = validated_data.pop('company_slug')
        tags = validated_data.pop('tags', []) or []
        email = validated_data['email'].lower().strip()

        subscriber, created = Subscriber.objects.get_or_create(
            company=company,
            email=email,
            defaults={
                **validated_data,
                'source': validated_data.get('source', 'website'),
                'tags': tags,
            },
        )
        if not created:
            if not subscriber.is_subscribed:
                subscriber.subscribe()
            for k, v in validated_data.items():
                if v:
                    setattr(subscriber, k, v)
            if tags:
                subscriber.tags = list(set((subscriber.tags or []) + tags))
            subscriber.save()

        return subscriber, created


class SubscriberImportSerializer(serializers.Serializer):
    company = serializers.PrimaryKeyRelatedField(
        queryset=Company.objects.filter(is_active=True)
    )
    file = serializers.FileField()