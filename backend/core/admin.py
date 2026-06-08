from django.contrib import admin

from .models import (
    Category,
    DailyInsight,
    Product,
    Sale,
    Supplier,
    UserProfile,
)


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ("name", "user", "created_at")
    list_filter = ("user",)
    search_fields = ("name",)


@admin.register(Supplier)
class SupplierAdmin(admin.ModelAdmin):
    list_display = ("name", "user", "contact_email", "phone")
    list_filter = ("user",)
    search_fields = ("name", "contact_email")


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = (
        "name",
        "sku",
        "price",
        "stock_quantity",
        "low_stock_threshold",
        "category",
        "user",
    )
    list_filter = ("user", "category")
    search_fields = ("name", "sku")
    readonly_fields = ("created_at", "updated_at")


@admin.register(Sale)
class SaleAdmin(admin.ModelAdmin):
    list_display = (
        "product",
        "quantity",
        "total_price",
        "customer_name",
        "sold_at",
        "user",
    )
    list_filter = ("user", "sold_at")
    readonly_fields = ("sold_at",)


@admin.register(DailyInsight)
class DailyInsightAdmin(admin.ModelAdmin):
    list_display = ("user", "date", "created_at")
    list_filter = ("user", "date")
    readonly_fields = ("created_at",)


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ("user", "preferred_language", "preferred_currency", "updated_at")
    readonly_fields = ("created_at", "updated_at")
