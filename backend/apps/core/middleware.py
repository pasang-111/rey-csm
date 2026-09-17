"""
Company context middleware – attaches current company from header or subdomain.
"""
from django.utils.functional import SimpleLazyObject
from apps.companies.models import Company


def get_company_from_request(request):
    # 1. Header (preferred for API)
    company_id = request.headers.get('X-Company-ID')
    if company_id:
        try:
            return Company.objects.get(id=company_id, is_active=True)
        except (Company.DoesNotExist, ValueError):
            pass
    
    # 2. Query param
    company_slug = request.GET.get('company')
    if company_slug:
        try:
            return Company.objects.get(slug=company_slug, is_active=True)
        except Company.DoesNotExist:
            pass
    
    # 3. Subdomain (for public sites)
    host = request.get_host().split(':')[0]
    if host and host != 'localhost':
        try:
            return Company.objects.get(domain=host, is_active=True)
        except Company.DoesNotExist:
            pass
    
    return None


class CompanyContextMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        request.company = SimpleLazyObject(lambda: get_company_from_request(request))
        response = self.get_response(request)
        return response
