from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated, AllowAny
from .models import Article
from .serializers import ArticleSerializer


class ArticleViewSet(viewsets.ModelViewSet):
    serializer_class = ArticleSerializer
    filterset_fields = ['company', 'status']
    search_fields = ['title', 'excerpt', 'body']
    ordering = ['-published_at', '-created_at']

    def get_queryset(self):
        qs = Article.objects.select_related('company', 'author')
        if self.action in ['list', 'retrieve'] and not self.request.user.is_authenticated:
            qs = qs.filter(status='published')
        return qs

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [AllowAny()]
        return [IsAuthenticated()]

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)
