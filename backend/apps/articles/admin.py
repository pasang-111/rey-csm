from django.contrib import admin
from .models import Article


@admin.register(Article)
class ArticleAdmin(admin.ModelAdmin):
    list_display = ['title', 'company', 'status', 'author', 'published_at']
    list_filter = ['status', 'company']
    search_fields = ['title', 'excerpt']
    prepopulated_fields = {'slug': ('title',)}
