"""
Create admin users for REY Corporate Group (Australia).
Usage: python manage.py seed_admins
"""
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model

User = get_user_model()

ADMINS = [
    {
        'username': 'admin@reycorp.com.au',
        'email': 'admin@reycorp.com.au',
        'password': 'ReyCorp@2026!',
        'first_name': 'REY',
        'last_name': 'Admin',
        'is_staff': True,
        'is_superuser': True,
    },
    {
        'username': 'admin@reyhomes.com.au',
        'email': 'admin@reyhomes.com.au',
        'password': 'ReyHomes@2026!',
        'first_name': 'Rey',
        'last_name': 'Homes',
        'is_staff': True,
        'is_superuser': False,
    },
]


class Command(BaseCommand):
    help = 'Seed admin users (admin@reycorp.com.au, admin@reyhomes.com.au)'

    def handle(self, *args, **options):
        for data in ADMINS:
            password = data.pop('password')
            user, created = User.objects.update_or_create(
                username=data['username'],
                defaults=data
            )
            user.set_password(password)
            user.save()
            status = 'Created' if created else 'Updated'
            self.stdout.write(self.style.SUCCESS(
                f'{status}: {user.email} (password set)'
            ))
        self.stdout.write(self.style.WARNING(
            '\nDefault passwords are temporary – change them after first login.'
        ))
