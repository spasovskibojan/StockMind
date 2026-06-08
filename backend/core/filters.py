from django_filters import rest_framework as filters

from .models import Sale


class SaleFilter(filters.FilterSet):
    start_date = filters.DateFilter(field_name="sold_at", lookup_expr="date__gte")
    end_date = filters.DateFilter(field_name="sold_at", lookup_expr="date__lte")

    class Meta:
        model = Sale
        fields = ["product", "start_date", "end_date"]
