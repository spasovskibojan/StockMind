import random
from datetime import timedelta
from decimal import Decimal

from django.contrib.auth.models import User
from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone

from core.models import Category, Product, Sale, Supplier

CATEGORIES = ["Beverages", "Snacks", "Dairy", "Bakery", "Household"]

SUPPLIERS = [
    ("Acme Distribution", "orders@acme.com", "+1-555-0101"),
    ("FreshFoods Co", "sales@freshfoods.com", "+1-555-0202"),
    ("ProSupply Ltd", "info@prosupply.com", "+1-555-0303"),
]

# (name, sku, price, cost, category, stock, threshold)
PRODUCTS = [
    # Beverages
    ("Coca-Cola 0.5L", "BEV-001", 1.50, 0.80, "Beverages", 45, 20),
    ("Sprite 0.5L", "BEV-002", 1.50, 0.80, "Beverages", 30, 20),
    ("Orange Juice 1L", "BEV-003", 3.50, 2.00, "Beverages", 8, 15),  # low stock
    ("Bottled Water 1L", "BEV-004", 0.99, 0.40, "Beverages", 120, 30),
    ("Coffee Beans 250g", "BEV-005", 8.99, 5.00, "Beverages", 22, 10),
    ("Tea Bags Box", "BEV-006", 4.50, 2.20, "Beverages", 5, 10),  # low stock
    # Snacks
    ("Lays Chips 100g", "SNK-001", 2.20, 1.10, "Snacks", 60, 25),
    ("Snickers Bar", "SNK-002", 1.00, 0.50, "Snacks", 150, 40),
    ("KitKat Bar", "SNK-003", 1.00, 0.50, "Snacks", 12, 40),  # low stock
    ("Pringles 150g", "SNK-004", 3.50, 1.80, "Snacks", 35, 15),
    ("Cookies Pack", "SNK-005", 2.80, 1.40, "Snacks", 48, 20),
    ("Mixed Nuts 200g", "SNK-006", 5.99, 3.20, "Snacks", 18, 10),
    # Dairy
    ("Milk 1L", "DAI-001", 1.80, 1.00, "Dairy", 40, 15),
    ("Greek Yogurt 500g", "DAI-002", 4.20, 2.30, "Dairy", 25, 12),
    ("Cheddar Cheese 250g", "DAI-003", 5.50, 3.00, "Dairy", 4, 10),  # low stock
    ("Butter 250g", "DAI-004", 3.20, 1.80, "Dairy", 28, 12),
    ("Mozzarella 200g", "DAI-005", 4.50, 2.50, "Dairy", 16, 8),
    ("Sour Cream 200g", "DAI-006", 2.10, 1.10, "Dairy", 22, 10),
    # Bakery
    ("White Bread Loaf", "BAK-001", 2.50, 1.20, "Bakery", 35, 15),
    ("Whole Wheat Bread", "BAK-002", 3.00, 1.50, "Bakery", 28, 15),
    ("Croissant Pack", "BAK-003", 4.80, 2.40, "Bakery", 6, 10),  # low stock
    ("Bagels 6-pack", "BAK-004", 5.50, 2.80, "Bakery", 18, 8),
    ("Donuts 6-pack", "BAK-005", 6.00, 3.00, "Bakery", 14, 6),
    ("Muffins 4-pack", "BAK-006", 4.50, 2.30, "Bakery", 11, 6),
    # Household
    ("Toilet Paper 12-pack", "HSE-001", 12.99, 7.00, "Household", 25, 10),
    ("Laundry Detergent 2L", "HSE-002", 14.50, 8.00, "Household", 15, 8),
    ("Dish Soap 750ml", "HSE-003", 3.99, 2.00, "Household", 30, 12),
    ("Paper Towels 6-pack", "HSE-004", 8.50, 4.50, "Household", 3, 8),  # low stock
    ("Trash Bags 30-pack", "HSE-005", 6.99, 3.50, "Household", 22, 10),
    ("All-Purpose Cleaner", "HSE-006", 5.50, 2.80, "Household", 17, 8),
]

CUSTOMER_NAMES = ["", "Walk-in", "John Smith", "Mary Lee", "Anna Doe", "Mike Brown"]


class Command(BaseCommand):
    help = "Seed demo data (5 categories, 3 suppliers, 30 products, 50 sales) for a demo user. Idempotent."

    def add_arguments(self, parser):
        parser.add_argument("--username", default="demo")
        parser.add_argument("--password", default="demo12345")

    @transaction.atomic
    def handle(self, *args, **options):
        username = options["username"]
        password = options["password"]

        user, created = User.objects.get_or_create(
            username=username,
            defaults={"email": f"{username}@stockmind.local"},
        )
        if created:
            user.set_password(password)
            user.save()
            self.stdout.write(
                self.style.SUCCESS(f'User "{username}" created (password: {password})')
            )
        else:
            self.stdout.write(f'User "{username}" already exists — refreshing demo data')

        # Wipe existing demo data for this user (idempotent re-seed)
        Sale.objects.filter(user=user).delete()
        Product.objects.filter(user=user).delete()
        Supplier.objects.filter(user=user).delete()
        Category.objects.filter(user=user).delete()

        categories = {
            name: Category.objects.create(user=user, name=name) for name in CATEGORIES
        }

        suppliers = [
            Supplier.objects.create(
                user=user, name=name, contact_email=email, phone=phone
            )
            for name, email, phone in SUPPLIERS
        ]

        products = []
        for name, sku, price, cost, cat_name, stock, threshold in PRODUCTS:
            p = Product.objects.create(
                user=user,
                name=name,
                sku=sku,
                description=f"{name} — popular retail item.",
                price=Decimal(str(price)),
                cost=Decimal(str(cost)),
                stock_quantity=stock,
                low_stock_threshold=threshold,
                category=categories[cat_name],
                supplier=random.choice(suppliers),
                image=None,
            )
            products.append(p)

        # 50 sales spread across the last 14 days
        now = timezone.now()
        sales_count = 0
        for _ in range(50):
            product = random.choice(products)
            quantity = random.randint(1, 5)
            days_ago = random.randint(0, 14)
            sold_at = now - timedelta(
                days=days_ago,
                hours=random.randint(0, 23),
                minutes=random.randint(0, 59),
            )
            sale = Sale.objects.create(
                user=user,
                product=product,
                quantity=quantity,
                unit_price=product.price,
                total_price=product.price * quantity,
                customer_name=random.choice(CUSTOMER_NAMES),
            )
            # auto_now_add forces sold_at=now; manually backdate after create
            Sale.objects.filter(pk=sale.pk).update(sold_at=sold_at)
            sales_count += 1

        self.stdout.write(
            self.style.SUCCESS(
                f"Seeded {len(categories)} categories, {len(suppliers)} suppliers, "
                f"{len(products)} products, {sales_count} sales for user '{username}'"
            )
        )
