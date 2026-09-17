from rest_framework.routers import DefaultRouter
from .views import EmailTemplateViewSet, TemplateBlockViewSet

router = DefaultRouter()
router.register(r'', EmailTemplateViewSet, basename='email-template')
router.register(r'blocks', TemplateBlockViewSet, basename='template-block')
urlpatterns = router.urls
