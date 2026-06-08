from datetime import timedelta

from django.core.management.base import BaseCommand
from django.utils import timezone

from core.models import DailyInsight


class Command(BaseCommand):
    help = "Delete DailyInsight records older than N days (default 30)."

    def add_arguments(self, parser):
        parser.add_argument(
            "--days",
            type=int,
            default=30,
            help="Delete insights older than this many days",
        )

    def handle(self, *args, **options):
        days = options["days"]
        cutoff = timezone.now().date() - timedelta(days=days)
        deleted, _ = DailyInsight.objects.filter(date__lt=cutoff).delete()
        self.stdout.write(
            self.style.SUCCESS(
                f"Deleted {deleted} DailyInsight record(s) older than {days} days"
            )
        )
