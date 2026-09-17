from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Company
from .serializers import CompanySerializer, CompanyListSerializer


class CompanyViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = Company.objects.all().prefetch_related('subsidiaries')
        include_inactive = self.request.query_params.get('include_inactive') == 'true'
        if self.action == 'public_list' or (self.action == 'list' and not include_inactive):
            qs = qs.filter(is_active=True)
        return qs

    def perform_destroy(self, instance):
        # Soft-delete so historical emails still resolve company name
        instance.is_active = False
        instance.save(update_fields=['is_active', 'updated_at'])


    def get_serializer_class(self):
        if self.action == 'list':
            return CompanyListSerializer
        return CompanySerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve', 'public_list']:
            return [AllowAny()]
        return super().get_permissions()

    @action(detail=False, methods=['get'], permission_classes=[AllowAny])
    def public_list(self, request):
        """Lightweight list for public forms / company switcher"""
        qs = self.get_queryset().order_by('sort_order')
        serializer = CompanyListSerializer(qs, many=True, context={'request': request})
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def hierarchy(self, request, pk=None):
        company = self.get_object()
        return Response({
            'path': company.full_hierarchy,
            'is_parent': company.is_parent,
            'subsidiaries': CompanyListSerializer(
                company.subsidiaries.filter(is_active=True),
                many=True,
                context={'request': request}
            ).data
        })

    @action(detail=True, methods=["post"], url_path="upload_logo")
    def upload_logo(self, request, pk=None):
        """Upload main company logo from local file."""
        company = self.get_object()
        f = request.FILES.get("logo") or request.FILES.get("file")
        if not f:
            return Response({"error": "Provide logo file"}, status=400)
        company.logo = f
        company.save(update_fields=["logo", "updated_at"])
        url = request.build_absolute_uri(company.logo.url)
        return Response({"logo_url": url})

    @action(detail=True, methods=["post"], url_path="upload_logo_dark")
    def upload_logo_dark(self, request, pk=None):
        company = self.get_object()
        f = request.FILES.get("logo") or request.FILES.get("file")
        if not f:
            return Response({"error": "Provide logo file"}, status=400)
        company.logo_dark = f
        company.save(update_fields=["logo_dark", "updated_at"])
        url = request.build_absolute_uri(company.logo_dark.url)
        return Response({"logo_url": url})

