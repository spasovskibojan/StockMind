import json
import logging
from datetime import timedelta

from django.db.models import Count, F, Sum
from django.utils import timezone
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from core.models import DailyInsight, Product, Sale

from . import prompts
from .services import LLMService
from .tools import TOOL_SCHEMAS, execute_tool

logger = logging.getLogger(__name__)

MAX_TOOL_ITERATIONS = 5
MAX_CHAT_HISTORY = 12


class GenerateDescriptionView(APIView):
    """POST /api/ai/generate-description/ — generate marketing copy for a product."""

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        name = (request.data.get("name") or "").strip()
        category = (request.data.get("category") or "").strip()
        keywords = (request.data.get("keywords") or "").strip()

        if not name:
            return Response(
                {"error": "name is required"}, status=status.HTTP_400_BAD_REQUEST
            )

        try:
            llm = LLMService()
            description = llm.complete(
                messages=[
                    {"role": "system", "content": prompts.PRODUCT_DESCRIPTION_SYSTEM},
                    {
                        "role": "user",
                        "content": prompts.PRODUCT_DESCRIPTION_USER.format(
                            name=name,
                            category=category or "general retail",
                            keywords=keywords or "none",
                        ),
                    },
                ],
                max_tokens=200,
                temperature=0.7,
            )
            return Response({"description": description.strip().strip('"')})
        except Exception:
            logger.exception("Failed to generate description")
            return Response(
                {"error": "Failed to generate description. Try again in a moment."},
                status=status.HTTP_502_BAD_GATEWAY,
            )


class DailyInsightView(APIView):
    """GET /api/ai/daily-insight/ — 3 AI-generated insights for today (cached)."""

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        today = timezone.now().date()
        user = request.user
        force_refresh = request.query_params.get("refresh") == "true"

        cached = DailyInsight.objects.filter(user=user, date=today).first()
        if cached and not force_refresh:
            try:
                bullets = json.loads(cached.summary_text)
            except json.JSONDecodeError:
                bullets = [cached.summary_text]
            return Response(
                {"date": str(today), "bullets": bullets, "cached": True}
            )

        # Force refresh: delete stale cache before regenerating
        if cached and force_refresh:
            cached.delete()

        try:
            stats = self._collect_stats(user)
            llm = LLMService()
            raw = llm.complete(
                messages=[
                    {"role": "system", "content": prompts.DAILY_INSIGHT_SYSTEM},
                    {
                        "role": "user",
                        "content": prompts.DAILY_INSIGHT_USER.format(**stats),
                    },
                ],
                max_tokens=400,
                temperature=0.4,
                response_format={"type": "json_object"},
            )
            data = json.loads(raw)
            bullets = data.get("bullets", [])

            DailyInsight.objects.create(
                user=user, date=today, summary_text=json.dumps(bullets)
            )
            return Response(
                {"date": str(today), "bullets": bullets, "cached": False}
            )
        except Exception:
            logger.exception("Failed to generate daily insight")
            return Response(
                {"error": "Failed to generate insight. Try again in a moment."},
                status=status.HTTP_502_BAD_GATEWAY,
            )

    def _collect_stats(self, user):
        now = timezone.now()
        today = now.date()
        week_ago = now - timedelta(days=7)

        today_sales = Sale.objects.filter(user=user, sold_at__date=today)
        today_count = today_sales.count()
        today_revenue = (
            today_sales.aggregate(total=Sum("total_price"))["total"] or 0
        )

        top = (
            Sale.objects.filter(user=user, sold_at__gte=week_ago)
            .values("product__name")
            .annotate(qty=Sum("quantity"))
            .order_by("-qty")
            .first()
        )

        low_stock_count = (
            Product.objects.filter(user=user)
            .filter(stock_quantity__lte=F("low_stock_threshold"))
            .count()
        )
        total_products = Product.objects.filter(user=user).count()

        return {
            "today_count": today_count,
            "today_revenue": float(today_revenue),
            "top_product": top["product__name"] if top else "none",
            "low_stock_count": low_stock_count,
            "total_products": total_products,
        }


class RestockSuggestionView(APIView):
    """POST /api/ai/restock-suggestion/ — AI recommends what to reorder."""

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        user = request.user
        try:
            product_data = self._collect_velocity_data(user)
            if not product_data:
                return Response(
                    {
                        "recommendations": [],
                        "note": "No sales data yet — make some sales first.",
                    }
                )

            product_data_str = "\n".join(
                f"- {p['name']} (SKU {p['sku']}): stock={p['stock']}, "
                f"sold/day={p['velocity']:.2f}, threshold={p['threshold']}"
                for p in product_data
            )

            llm = LLMService()
            raw = llm.complete(
                messages=[
                    {"role": "system", "content": prompts.RESTOCK_SYSTEM},
                    {
                        "role": "user",
                        "content": prompts.RESTOCK_USER.format(
                            product_data=product_data_str
                        ),
                    },
                ],
                max_tokens=800,
                temperature=0.2,
                response_format={"type": "json_object"},
            )
            data = json.loads(raw)
            return Response(
                {"recommendations": data.get("recommendations", [])}
            )
        except Exception:
            logger.exception("Failed to generate restock suggestions")
            return Response(
                {"error": "Failed to generate restock plan. Try again."},
                status=status.HTTP_502_BAD_GATEWAY,
            )

    def _collect_velocity_data(self, user):
        """Top 10 products by sales velocity in the last 14 days."""
        start = timezone.now() - timedelta(days=14)
        sales = (
            Sale.objects.filter(user=user, sold_at__gte=start)
            .values("product_id")
            .annotate(units=Sum("quantity"))
            .order_by("-units")[:10]
        )

        product_ids = [s["product_id"] for s in sales]
        velocity_map = {s["product_id"]: s["units"] for s in sales}
        products = Product.objects.filter(id__in=product_ids, user=user)

        return [
            {
                "name": p.name,
                "sku": p.sku,
                "stock": p.stock_quantity,
                "threshold": p.low_stock_threshold,
                "velocity": velocity_map[p.id] / 14.0,
            }
            for p in products
        ]


class ChatView(APIView):
    """POST /api/ai/chat/ — chat assistant with tool calling."""

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        history = request.data.get("messages", [])
        if not isinstance(history, list) or not history:
            return Response(
                {"error": "messages array is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Truncate to last N user/assistant messages
        history = history[-MAX_CHAT_HISTORY:]
        conversation = [
            {"role": "system", "content": prompts.CHAT_SYSTEM}
        ] + history

        try:
            llm = LLMService()
            tools_used = []  # track tool names called this turn

            for _ in range(MAX_TOOL_ITERATIONS):
                response = llm.complete_with_tools(conversation, TOOL_SCHEMAS)
                message = response.choices[0].message

                if not message.tool_calls:
                    return Response(
                        {
                            "message": message.content,
                            "tools_used": tools_used,
                        }
                    )

                # Track which tools were called
                for tc in message.tool_calls:
                    tools_used.append(tc.function.name)

                # Add assistant message with tool_calls to conversation
                conversation.append(
                    {
                        "role": "assistant",
                        "content": message.content or "",
                        "tool_calls": [
                            {
                                "id": tc.id,
                                "type": "function",
                                "function": {
                                    "name": tc.function.name,
                                    "arguments": tc.function.arguments,
                                },
                            }
                            for tc in message.tool_calls
                        ],
                    }
                )

                # Execute each tool and add result
                for tc in message.tool_calls:
                    try:
                        args = json.loads(tc.function.arguments or "{}")
                    except json.JSONDecodeError:
                        args = {}
                    result = execute_tool(tc.function.name, args, request.user)
                    conversation.append(
                        {
                            "role": "tool",
                            "tool_call_id": tc.id,
                            "content": json.dumps(result),
                        }
                    )

            return Response(
                {"error": "Tool loop exceeded max iterations"},
                status=status.HTTP_502_BAD_GATEWAY,
            )
        except Exception:
            logger.exception("Chat failed")
            return Response(
                {"error": "Chat failed. Try again in a moment."},
                status=status.HTTP_502_BAD_GATEWAY,
            )
