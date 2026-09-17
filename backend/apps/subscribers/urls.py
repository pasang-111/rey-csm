from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import SubscriberViewSet, public_subscribe
from .public_views import public_subscribe_page

router = DefaultRouter()
router.register(r'', SubscriberViewSet, basename='subscriber')

urlpatterns = [
    path('subscribe/', public_subscribe, name='public-subscribe'),
    path('subscribe-form/', public_subscribe_page, name='public-subscribe-form'),
    path('', include(router.urls)),
]
