from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.http import JsonResponse
from django.urls import include, path


def health(_request):
    print("HEADERS RECEIVED:", _request.headers)
    return JsonResponse({"status": "ok", "service": "stockmind-backend"})


urlpatterns = [
    path("", health),
    path("admin/", admin.site.urls),
    path("api/", include("core.urls")),
    path("api/ai/", include("ai.urls")),
    path("api-auth/", include("rest_framework.urls")),  # login/logout for browsable API
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
