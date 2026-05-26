from openbook.admin import CustomModelAdmin
from ..models.reflection import Reflection

class ReflectionAdmin(CustomModelAdmin):
    model = Reflection
    list_display = ["submission", "created_at"]
    ordering = ["-created_at"]
    search_fields = ["submission__user__username", "submission__challenge__title"]
    list_filter = ["created_at"]
    list_select_related = ["submission"]
