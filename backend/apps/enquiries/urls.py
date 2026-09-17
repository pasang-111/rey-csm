from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import EnquiryViewSet, public_enquiry

router = DefaultRouter()
router.register(r'', EnquiryViewSet, basename='enquiry')

urlpatterns = [
    path('submit/', public_enquiry, name='public-enquiry'),
    path('', include(router.urls)),
]
