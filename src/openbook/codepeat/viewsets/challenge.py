from rest_flex_fields.serializers import FlexFieldsModelSerializer
from rest_flex_fields.views import FlexFieldsMixin
from rest_framework import viewsets
from django_filters import rest_framework as filters
from drf_spectacular.utils import extend_schema, with_flex_fields_parameters
from ..models.challenge import Challenge

class ChallengeFilter(filters.FilterSet):
    class Meta:
        model = Challenge
        fields = {
            "difficulty": ["exact"],
            "visibility": ["exact"],
            "type": ["exact"],
            "created_by": ["exact"],
        }

class ChallengeSerializer(FlexFieldsModelSerializer):
    class Meta:
        model = Challenge
        fields = [
            "id", "title", "description", "difficulty", "visibility", "type", "created_by", "created_at", "modified_at"
        ]
        read_only_fields = ["id", "created_by", "created_at", "modified_at"]
    expandable_fields = {
        "created_by": "openbook.auth.viewsets.user.UserSerializer",
    }

@extend_schema(tags=["Codepeat: Challenges"])
@with_flex_fields_parameters()
class ChallengeViewSet(FlexFieldsMixin, viewsets.ModelViewSet):
    queryset = Challenge.objects.all()
    serializer_class = ChallengeSerializer
    filterset_class = ChallengeFilter
    search_fields = ["title", "description", "created_by__username"]
    ordering = ["-created_at"]
