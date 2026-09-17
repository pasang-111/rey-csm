"""
Seed REY Corporate Group + subsidiaries with official logos from reycorp.com.au
Usage: python manage.py seed_rey_companies
"""
from django.core.management.base import BaseCommand
from apps.companies.models import Company

# Official assets hosted on https://www.reycorp.com.au
BASE = "https://www.reycorp.com.au"

COMPANIES = [
    {
        "name": "REY Corporate Group",
        "short_name": "REY",
        "slug": "rey-corporate-group",
        "is_parent": True,
        "primary_color": "#0A2540",
        "secondary_color": "#C9A227",
        "from_email": "noreply@reycorp.com.au",
        "website": "https://www.reycorp.com.au/",
        "domain": "reycorp.com.au",
        "tagline": "One Vision. Many Businesses. Built for Generations.",
        "footer_text": "REY Corporate Group",
        "external_logo_url": f"{BASE}/Rey-Corp-Group.png",
        "sort_order": 0,
    },
    {
        "name": "Rey Homes",
        "short_name": "Rey Homes",
        "slug": "rey-homes",
        "primary_color": "#2B6CB0",
        "secondary_color": "#63B3ED",
        "from_email": "hello@reyhomes.com.au",
        "website": "https://reyhomes.com.au/",
        "domain": "reyhomes.com.au",
        "tagline": "Luxury Residential",
        "footer_text": "Rey Homes — A Part of the REY Corporate Group.",
        "external_logo_url": f"{BASE}/logos/rey-homes.png",
        "sort_order": 10,
    },
    {
        "name": "Rey Properties",
        "short_name": "Rey Properties",
        "slug": "rey-properties",
        "primary_color": "#3B5BDB",
        "secondary_color": "#748FFC",
        "from_email": "hello@reyproperties.com.au",
        "website": "https://www.reyproperties.com.au/",
        "domain": "reyproperties.com.au",
        "tagline": "Buy · Sell · Build · Rent",
        "footer_text": "Rey Properties — A Part of the REY Corporate Group.",
        "external_logo_url": f"{BASE}/logos/rey-properties.png",
        "sort_order": 20,
    },
    {
        "name": "Sandstone Constructions",
        "short_name": "Sandstone",
        "slug": "sandstone-constructions",
        "primary_color": "#744210",
        "secondary_color": "#D69E2E",
        "from_email": "projects@sandstoneconstructions.com.au",
        "website": "https://sandstoneconstructions.com.au/",
        "domain": "sandstoneconstructions.com.au",
        "tagline": "Residential Construction",
        "footer_text": "Sandstone Constructions — A Part of the REY Corporate Group.",
        "external_logo_url": f"{BASE}/logos/sandstone.svg",
        "sort_order": 30,
    },
    {
        "name": "Stonegrove Homes",
        "short_name": "Stonegrove",
        "slug": "stonegrove-homes",
        "primary_color": "#2D3748",
        "secondary_color": "#ECC94B",
        "from_email": "homes@stonegrovehomes.com.au",
        "website": "https://stonegrovehomes.com.au/",
        "domain": "stonegrovehomes.com.au",
        "tagline": "Residential Construction",
        "footer_text": "Stonegrove Homes — A Part of the REY Corporate Group.",
        "external_logo_url": f"{BASE}/logos/stone-grove-homes.png",
        "sort_order": 40,
    },
    {
        "name": "Rigid Landscaping",
        "short_name": "Rigid",
        "slug": "rigid-landscaping",
        "primary_color": "#1A202C",
        "secondary_color": "#48BB78",
        "from_email": "hello@rigidlandscaping.com.au",
        "website": "https://www.reycorp.com.au/",
        "domain": "reycorp.com.au",
        "tagline": "Landscaping & Outdoor Living",
        "footer_text": "Rigid Landscaping — A Part of the REY Corporate Group.",
        "external_logo_url": f"{BASE}/logos/rigid-landscaping.png",
        "sort_order": 50,
    },
    {
        "name": "After Build Solutions",
        "short_name": "ABS",
        "slug": "after-build-solutions",
        "primary_color": "#276749",
        "secondary_color": "#D69E2E",
        "from_email": "support@afterbuildsolutions.com.au",
        "website": "https://www.reycorp.com.au/",
        "domain": "reycorp.com.au",
        "tagline": "Property Improvement",
        "footer_text": "After Build Solutions — A Part of the REY Corporate Group.",
        "external_logo_url": f"{BASE}/logos/after-build-solutions.png",
        "sort_order": 60,
    },
    {
        "name": "Alpha Investment & Development",
        "short_name": "Alpha",
        "slug": "alpha-investment",
        "primary_color": "#1A365D",
        "secondary_color": "#ED8936",
        "from_email": "info@alphainvestment.com.au",
        "website": "https://www.reycorp.com.au/",
        "domain": "reycorp.com.au",
        "tagline": "Investment & Development",
        "footer_text": "Alpha Investment & Development — A Part of the REY Corporate Group.",
        # No dedicated logo on site yet — use parent mark
        "external_logo_url": f"{BASE}/Rey-Corp-Group.png",
        "sort_order": 70,
    },
]


class Command(BaseCommand):
    help = "Seed REY companies with official logos from reycorp.com.au"

    def handle(self, *args, **options):
        parent = None
        for data in COMPANIES:
            slug = data["slug"]
            defaults = {k: v for k, v in data.items() if k != "slug"}
            if not data.get("is_parent"):
                defaults["parent"] = parent
                defaults["is_parent"] = False
            else:
                defaults["parent"] = None

            obj, created = Company.objects.update_or_create(
                slug=slug,
                defaults=defaults,
            )
            if data.get("is_parent"):
                parent = obj
            action = "Created" if created else "Updated"
            logo = data.get("external_logo_url", "")
            self.stdout.write(f"  {action}: {obj.name}  →  {logo}")

        self.stdout.write(self.style.SUCCESS(
            f"Done. {Company.objects.count()} companies. Logos from {BASE}"
        ))
