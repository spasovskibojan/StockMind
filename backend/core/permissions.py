from rest_framework import permissions


class IsOwner(permissions.BasePermission):
    """Only the user who owns the object can access it."""

    def has_object_permission(self, request, view, obj):
        return obj.user_id == request.user.id
