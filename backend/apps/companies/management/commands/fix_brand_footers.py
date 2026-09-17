
from django.core.management.base import BaseCommand
from apps.companies.models import Company

class Command(BaseCommand):
    help = "Set standard REY brand footers on all companies"

    def handle(self, *args, **options):
        parent = Company.objects.filter(is_parent=True).first()
        parent_name = parent.name if parent else "REY Corporate Group"
        if parent:
            parent.footer_text = parent_name
            parent.save(update_fields=["footer_text"])
            self.stdout.write(f"Parent: {parent.footer_text}")
        for c in Company.objects.filter(is_parent=False):
            c.footer_text = f"{c.name} — A Part of the {parent_name}."
            c.save(update_fields=["footer_text"])
            self.stdout.write(f"  {c.footer_text}")
        self.stdout.write(self.style.SUCCESS("Brand footers updated"))
