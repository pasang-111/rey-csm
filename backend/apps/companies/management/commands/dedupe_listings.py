"""
Remove accidental duplicate companies (same slug) and duplicate templates (same company+slug).
Usage: python manage.py dedupe_listings
"""
from django.core.management.base import BaseCommand
from django.db.models import Count
from apps.companies.models import Company
from apps.templates_app.models import EmailTemplate


class Command(BaseCommand):
    help = "Deduplicate companies by slug and templates by company+slug"

    def handle(self, *args, **options):
        # Companies: keep oldest per slug
        removed_c = 0
        for row in (
            Company.objects.values("slug")
            .annotate(n=Count("id"))
            .filter(n__gt=1)
        ):
            qs = Company.objects.filter(slug=row["slug"]).order_by("created_at")
            keep = qs.first()
            for extra in qs.exclude(pk=keep.pk):
                self.stdout.write(f"  Removing company dup: {extra.name} ({extra.id})")
                extra.delete()
                removed_c += 1

        removed_t = 0
        for row in (
            EmailTemplate.objects.values("company_id", "slug")
            .annotate(n=Count("id"))
            .filter(n__gt=1)
        ):
            qs = EmailTemplate.objects.filter(
                company_id=row["company_id"], slug=row["slug"]
            ).order_by("created_at")
            keep = qs.first()
            for extra in qs.exclude(pk=keep.pk):
                self.stdout.write(f"  Removing template dup: {extra.name} ({extra.id})")
                extra.delete()
                removed_t += 1

        self.stdout.write(
            self.style.SUCCESS(
                f"Done. Removed {removed_c} company dups, {removed_t} template dups."
            )
        )
