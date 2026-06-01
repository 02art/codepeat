from openbook.drf.flex_serializers import FlexFieldsModelSerializer
from openbook.drf.viewsets import ModelViewSetMixin, with_flex_fields_parameters
from rest_framework.mixins import ListModelMixin, RetrieveModelMixin, CreateModelMixin
from rest_framework.viewsets import GenericViewSet
from django_filters.filterset import FilterSet
from drf_spectacular.utils import extend_schema
from ..models.challenge import Challenge

class ChallengeFilter(FilterSet):
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
        fields = ["id", "name", "description", "difficulty", "visibility", "type", "created_by", "created_at", "modified_at"]
        read_only_fields = ["id", "created_by", "created_at", "modified_at"]
        expandable_fields = {
            "created_by": "openbook.auth.viewsets.user.UserSerializer",
        }

@extend_schema(tags=["Codepeat: Challenges"])
@with_flex_fields_parameters()
class ChallengeViewSet(ModelViewSetMixin, ListModelMixin, RetrieveModelMixin, CreateModelMixin, GenericViewSet):
    queryset = Challenge.objects.all()
    serializer_class = ChallengeSerializer
    filterset_class = ChallengeFilter
    search_fields = ["name", "description", "created_by__username"]
    ordering = ["-created_at"]
