from rest_framework import serializers
from .models import EmailTemplate, TemplateBlock


class EmailTemplateSerializer(serializers.ModelSerializer):
    company_name = serializers.CharField(source='company.name', read_only=True)
    header_logo_url = serializers.SerializerMethodField()
    footer_logo_url = serializers.SerializerMethodField()

    class Meta:
        model = EmailTemplate
        fields = [
            'id', 'company', 'company_name', 'name', 'slug', 'type',
            'subject', 'preheader', 'html_body', 'plain_text',
            'primary_color', 'secondary_color', 'header_bg', 'footer_bg',
            'logo_settings', 'header_logo', 'footer_logo',
            'header_logo_url', 'footer_logo_url',
            'is_default', 'is_active', 'version',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'slug', 'version', 'created_at', 'updated_at', 'header_logo_url', 'footer_logo_url']

    def _abs(self, field):
        if not field:
            return ''
        request = self.context.get('request')
        try:
            url = field.url
        except ValueError:
            return ''
        if request:
            return request.build_absolute_uri(url)
        return url

    def get_header_logo_url(self, obj):
        if obj.header_logo:
            return self._abs(obj.header_logo)
        return obj.header_logo_url or ''

    def get_footer_logo_url(self, obj):
        if obj.footer_logo:
            return self._abs(obj.footer_logo)
        return obj.footer_logo_url or ''


class EmailTemplateListSerializer(serializers.ModelSerializer):
    company_name = serializers.CharField(source='company.name', read_only=True)
    header_logo_url = serializers.SerializerMethodField()

    class Meta:
        model = EmailTemplate
        fields = [
            'id', 'company', 'company_name', 'name', 'slug', 'type',
            'subject', 'is_default', 'is_active', 'version',
            'header_logo_url', 'updated_at',
        ]

    def get_header_logo_url(self, obj):
        if obj.header_logo:
            request = self.context.get('request')
            try:
                url = obj.header_logo.url
                return request.build_absolute_uri(url) if request else url
            except ValueError:
                pass
        return ''


class TemplateBlockSerializer(serializers.ModelSerializer):
    class Meta:
        model = TemplateBlock
        fields = '__all__'
