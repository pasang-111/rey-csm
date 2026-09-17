from rest_framework import serializers
from .models import Company, CompanyDomain


class CompanyDomainSerializer(serializers.ModelSerializer):
    class Meta:
        model = CompanyDomain
        fields = ["id", "domain", "is_primary", "verified"]


class CompanySerializer(serializers.ModelSerializer):
    brand_footer = serializers.CharField(read_only=True)
    logo_url = serializers.SerializerMethodField()
    domains = CompanyDomainSerializer(many=True, read_only=True)
    subsidiaries_count = serializers.SerializerMethodField()

    class Meta:
        model = Company
        fields = [
            "id",
            "name",
            "slug",
            "short_name",
            "parent",
            "is_parent",
            "logo",
            "logo_url",
            "external_logo_url",
            "logo_dark",
            "favicon",
            "primary_color",
            "secondary_color",
            "accent_color",
            "domain",
            "website",
            "from_email",
            "reply_to_email",
            "support_email",
            "phone",
            "address",
            "facebook",
            "instagram",
            "linkedin",
            "twitter",
            "description",
            "tagline",
            "footer_text",
            "brand_footer",
            "is_active",
            "sort_order",
            "domains",
            "subsidiaries_count",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "slug", "created_at", "updated_at", "brand_footer", "logo_url"]

    def get_subsidiaries_count(self, obj):
        return obj.subsidiaries.filter(is_active=True).count()

    def get_logo_url(self, obj):
        request = self.context.get("request")
        if obj.logo:
            try:
                url = obj.logo.url
                return request.build_absolute_uri(url) if request else url
            except ValueError:
                pass
        return getattr(obj, "external_logo_url", None) or ""


class CompanyListSerializer(serializers.ModelSerializer):
    logo_url = serializers.SerializerMethodField()
    brand_footer = serializers.CharField(read_only=True)

    class Meta:
        model = Company
        fields = [
            "id",
            "name",
            "slug",
            "short_name",
            "is_parent",
            "parent",
            "logo_url",
            "primary_color",
            "secondary_color",
            "accent_color",
            "from_email",
            "website",
            "tagline",
            "footer_text",
            "brand_footer",
            "phone",
            "is_active",
        ]

    def get_logo_url(self, obj):
        request = self.context.get("request")
        if obj.logo:
            try:
                url = obj.logo.url
                return request.build_absolute_uri(url) if request else url
            except ValueError:
                pass
        return getattr(obj, "external_logo_url", None) or None
