from openbook.admin import CustomModelAdmin
from ..models.feedback import Feedback

class FeedbackAdmin(CustomModelAdmin):
    model = Feedback
    list_display = ["submission", "lecturer", "created_at"]
    ordering = ["-created_at"]
    search_fields = ["submission__user__username", "lecturer__username", "comments"]
    list_filter = ["lecturer", "created_at"]
    list_select_related = ["submission", "lecturer"]
