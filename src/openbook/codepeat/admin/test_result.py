from openbook.admin import CustomModelAdmin
from ..models.test_result import TestResult

class TestResultAdmin(CustomModelAdmin):
    model = TestResult
    list_display = ["submission", "status", "created_at"]
    ordering = ["-created_at"]
    search_fields = ["submission__user__username", "status"]
    list_filter = ["status", "created_at"]
    list_select_related = ["submission"]
