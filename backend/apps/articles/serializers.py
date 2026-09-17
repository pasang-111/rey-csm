from rest_framework import serializers
from .models import Article


class ArticleSerializer(serializers.ModelSerializer):
    company_name = serializers.CharField(source='company.name', read_only=True)
    author_name = serializers.CharField(source='author.get_full_name', read_only=True)

    class Meta:
        model = Article
        fields = [
            'id', 'company', 'company_name', 'title', 'slug', 'excerpt', 'body',
            'featured_image', 'featured_image_alt', 'status', 'published_at',
            'author', 'author_name', 'meta_title', 'meta_description',
            'view_count', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'slug', 'view_count', 'created_at', 'updated_at']
