from django.urls import path

from .views import (
    ChatView,
    DailyInsightView,
    GenerateDescriptionView,
    RestockSuggestionView,
)

urlpatterns = [
    path("generate-description/", GenerateDescriptionView.as_view(), name="ai-generate-description"),
    path("daily-insight/", DailyInsightView.as_view(), name="ai-daily-insight"),
    path("restock-suggestion/", RestockSuggestionView.as_view(), name="ai-restock-suggestion"),
    path("chat/", ChatView.as_view(), name="ai-chat"),
]
