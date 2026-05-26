from openbook.admin import CustomModelAdmin
from ..models.submission import Submission

class SubmissionAdmin(CustomModelAdmin):
    model = Submission
    list_display = ["challenge", "user", "submitted_at"]
    ordering = ["-submitted_at"]
    search_fields = ["challenge__title", "user__username"]
    list_filter = ["challenge", "user"]
    list_select_related = ["challenge", "user"]
