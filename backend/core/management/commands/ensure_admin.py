from django.contrib.auth.models import User
from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = "Create a default admin/admin superuser if it does not exist (dev only)"

    def handle(self, *args, **options):
        username = "admin"
        if User.objects.filter(username=username).exists():
            self.stdout.write(f'Superuser "{username}" already exists')
            return

        User.objects.create_superuser(
            username=username,
            email="admin@stockmind.local",
            password="admin",
        )
        self.stdout.write(
            self.style.SUCCESS(f'Superuser "{username}" created (password: admin)')
        )
