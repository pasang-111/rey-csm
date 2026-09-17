from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import NewsletterViewSet
from .manual_send import manual_send, list_recipients_for_compose

router = DefaultRouter()
router.register(r'', NewsletterViewSet, basename='newsletter')

urlpatterns = [
    path('manual-send/', manual_send, name='manual-send'),
    path('compose-recipients/', list_recipients_for_compose, name='compose-recipients'),
    path('', include(router.urls)),
]
