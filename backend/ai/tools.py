"""Tool definitions (JSON schemas for Groq) + Python executors for chat tool calling."""
from datetime import timedelta

from django.db.models import Count, F, Sum
from django.utils import timezone

from core.models import Product, Sale

# JSON schemas sent to Groq so the LLM knows what tools are available.
TOOL_SCHEMAS = [
    {
        "type": "function",
        "function": {
            "name": "get_low_stock_products",
            "description": (
                "Returns products at or below their low-stock threshold. "
                "Use when the user asks about what's running low, what needs restocking, "
                "or low inventory."
            ),
            "parameters": {"type": "object", "properties": {}, "required": []},
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_top_selling_products",
            "description": (
                "Returns top selling products by quantity in the last N days. "
                "Use for best sellers, popular items, what's hot."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "days": {
                        "type": "integer",
                        "description": "Days to look back (1-30, default 7)",
                    },
                    "limit": {
                        "type": "integer",
                        "description": "Number to return (1-10, default 5)",
                    },
                },
                "required": [],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_revenue_total",
            "description": (
                "Returns total revenue and sales count for a period. "
                "Use for earnings, total sales, how much was made."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "period": {
                        "type": "string",
                        "enum": ["today", "week", "month"],
                        "description": "today, week (7d), or month (30d)",
                    }
                },
                "required": ["period"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_product_by_name",
            "description": (
                "Find products by partial name match. Returns name, sku, price, stock, "
                "category. Use when the user asks about a specific product."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "name": {
                        "type": "string",
                        "description": "Partial or full product name",
                    }
                },
                "required": ["name"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_sales_summary",
            "description": (
                "Summary of sales for a period: revenue, count, average sale, "
                "unique products sold."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "period": {
                        "type": "string",
                        "enum": ["today", "week", "month"],
                    }
                },
                "required": ["period"],
            },
        },
    },
]


def _period_to_start(period: str):
    now = timezone.now()
    if period == "today":
        return now.replace(hour=0, minute=0, second=0, microsecond=0)
    if period == "month":
        return now - timedelta(days=30)
    return now - timedelta(days=7)  # default: week


def execute_tool(name: str, args: dict, user) -> dict:
    """Execute a tool call and return a compact JSON-serializable dict."""
    if name == "get_low_stock_products":
        qs = (
            Product.objects.filter(user=user)
            .filter(stock_quantity__lte=F("low_stock_threshold"))
            .order_by("stock_quantity")[:10]
        )
        items = [
            {
                "name": p.name,
                "sku": p.sku,
                "stock": p.stock_quantity,
                "threshold": p.low_stock_threshold,
            }
            for p in qs
        ]
        return {"products": items, "count": len(items)}

    if name == "get_top_selling_products":
        days = max(1, min(int(args.get("days", 7)), 30))
        limit = max(1, min(int(args.get("limit", 5)), 10))
        start = timezone.now() - timedelta(days=days)
        qs = (
            Sale.objects.filter(user=user, sold_at__gte=start)
            .values("product__name", "product__sku")
            .annotate(total_qty=Sum("quantity"), total_revenue=Sum("total_price"))
            .order_by("-total_qty")[:limit]
        )
        return {
            "products": [
                {
                    "name": item["product__name"],
                    "sku": item["product__sku"],
                    "units_sold": item["total_qty"],
                    "revenue": float(item["total_revenue"]),
                }
                for item in qs
            ],
            "period_days": days,
        }

    if name == "get_revenue_total":
        period = args.get("period", "week")
        start = _period_to_start(period)
        result = Sale.objects.filter(user=user, sold_at__gte=start).aggregate(
            total=Sum("total_price"), count=Count("id")
        )
        return {
            "period": period,
            "revenue": float(result["total"] or 0),
            "sales_count": result["count"],
        }

    if name == "get_product_by_name":
        name_query = (args.get("name") or "").strip()
        if not name_query:
            return {"error": "name parameter required"}
        products = (
            Product.objects.filter(user=user, name__icontains=name_query)
            .select_related("category", "supplier")[:5]
        )
        return {
            "matches": [
                {
                    "name": p.name,
                    "sku": p.sku,
                    "price": float(p.price),
                    "stock": p.stock_quantity,
                    "category": p.category.name,
                    "supplier": p.supplier.name if p.supplier else None,
                    "is_low_stock": p.is_low_stock,
                }
                for p in products
            ]
        }

    if name == "get_sales_summary":
        period = args.get("period", "week")
        start = _period_to_start(period)
        sales = Sale.objects.filter(user=user, sold_at__gte=start)
        agg = sales.aggregate(
            total=Sum("total_price"),
            count=Count("id"),
            products_sold=Count("product", distinct=True),
        )
        revenue = float(agg["total"] or 0)
        count = agg["count"]
        return {
            "period": period,
            "revenue": revenue,
            "sales_count": count,
            "average_sale_value": round(revenue / count, 2) if count else 0,
            "unique_products_sold": agg["products_sold"],
        }

    return {"error": f"Unknown tool: {name}"}
