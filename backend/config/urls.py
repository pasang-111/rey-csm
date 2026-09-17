from django.contrib import admin
from django.urls import path, include
from apps.subscribers.public_views import public_subscribe_page
from django.conf import settings
from django.conf.urls.static import static
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView, SpectacularRedocView
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView, TokenBlacklistView

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # Auth
    path('api/auth/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/auth/token/blacklist/', TokenBlacklistView.as_view(), name='token_blacklist'),
    
    # API docs
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),
    
    # Apps
    path('api/companies/', include('apps.companies.urls')),
    path('api/subscribers/', include('apps.subscribers.urls')),
    path('api/newsletters/', include('apps.newsletters.urls')),
    path('api/track/', include('apps.newsletters.tracking_urls')),
    path('unsubscribe/<uuid:token>/', __import__('apps.newsletters.tracking', fromlist=['track_unsubscribe']).track_unsubscribe),
    path('subscribe/', public_subscribe_page, name='public-subscribe-page'),
    path('api/templates/', include('apps.templates_app.urls')),
    path('api/enquiries/', include('apps.enquiries.urls')),
    path('api/articles/', include('apps.articles.urls')),
    path('api/', include('apps.core.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)

# Customize admin
admin.site.site_header = "REY Corporate Group CMS"
admin.site.site_title = "REY CMS"
admin.site.index_title = "Welcome to REY Corporate Group Administration"
