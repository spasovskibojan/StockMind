from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers

from .models import Category, DailyInsight, Product, Sale, Supplier, UserProfile


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ("id", "username", "email")


class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = ("avatar", "store_name", "preferred_language", "preferred_currency")


class UserDetailSerializer(serializers.ModelSerializer):
    profile = UserProfileSerializer(required=False)

    class Meta:
        model = User
        fields = ("id", "username", "email", "profile")

    def update(self, instance, validated_data):
        profile_data = validated_data.pop("profile", None)
        # Update User fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        # Update profile fields
        if profile_data:
            profile, _ = UserProfile.objects.get_or_create(user=instance)
            for attr, value in profile_data.items():
                setattr(profile, attr, value)
            profile.save()
        return instance


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(
        write_only=True, required=True, validators=[validate_password]
    )
    password_confirm = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = User
        fields = ("username", "email", "password", "password_confirm")
        extra_kwargs = {"email": {"required": True}}

    def validate(self, attrs):
        if attrs["password"] != attrs["password_confirm"]:
            raise serializers.ValidationError(
                {"password": "Password fields didn't match."}
            )
        return attrs

    def create(self, validated_data):
        validated_data.pop("password_confirm")
        return User.objects.create_user(
            username=validated_data["username"],
            email=validated_data["email"],
            password=validated_data["password"],
        )


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ("id", "name", "created_at")
        read_only_fields = ("created_at",)


class SupplierSerializer(serializers.ModelSerializer):
    class Meta:
        model = Supplier
        fields = ("id", "name", "contact_email", "phone", "created_at")
        read_only_fields = ("created_at",)


class ProductSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source="category.name", read_only=True)
    supplier_name = serializers.CharField(
        source="supplier.name", read_only=True, default=None
    )
    is_low_stock = serializers.BooleanField(read_only=True)

    class Meta:
        model = Product
        fields = (
            "id", "name", "sku", "description",
            "price", "cost",
            "stock_quantity", "low_stock_threshold",
            "category", "category_name",
            "supplier", "supplier_name",
            "image", "is_low_stock",
            "created_at", "updated_at",
        )
        read_only_fields = ("created_at", "updated_at")

    def validate_category(self, value):
        user = self.context["request"].user
        if value.user_id != user.id:
            raise serializers.ValidationError("This category does not belong to you.")
        return value

    def validate_supplier(self, value):
        if value is None:
            return value
        user = self.context["request"].user
        if value.user_id != user.id:
            raise serializers.ValidationError("This supplier does not belong to you.")
        return value


class SaleSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source="product.name", read_only=True)
    product_sku = serializers.CharField(source="product.sku", read_only=True)

    class Meta:
        model = Sale
        fields = (
            "id", "product", "product_name", "product_sku",
            "quantity", "unit_price", "total_price",
            "customer_name", "sold_at",
        )
        read_only_fields = ("unit_price", "total_price", "sold_at")

    def validate_product(self, value):
        user = self.context["request"].user
        if value.user_id != user.id:
            raise serializers.ValidationError("This product does not belong to you.")
        return value


class DailyInsightSerializer(serializers.ModelSerializer):
    class Meta:
        model = DailyInsight
        fields = ("id", "date", "summary_text", "created_at")
        read_only_fields = ("created_at",)
