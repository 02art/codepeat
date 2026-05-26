from openbook.admin import CustomModelAdmin
from ..models.challenge import Challenge

class ChallengeAdmin(CustomModelAdmin):
    model = Challenge
    list_display = ["title", "difficulty", "visibility", "type", "created_by", "created_at"]
    ordering = ["-created_at"]
    search_fields = ["title", "description", "created_by__username"]
    list_filter = ["difficulty", "visibility", "type", "created_by"]
    list_select_related = ["created_by"]
