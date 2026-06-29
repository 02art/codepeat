from openbook.drf.flex_serializers import FlexFieldsModelSerializer
from openbook.drf.viewsets import ModelViewSetMixin, with_flex_fields_parameters
from rest_framework.mixins import ListModelMixin, RetrieveModelMixin, CreateModelMixin, DestroyModelMixin
from rest_framework.permissions import BasePermission, IsAuthenticated, SAFE_METHODS
from rest_framework.filters import OrderingFilter
from rest_framework.viewsets import GenericViewSet
from rest_flex_fields2.filter_backends import FlexFieldsFilterBackend
from django_filters.filterset import FilterSet
from django_filters.rest_framework import DjangoFilterBackend
from drf_spectacular.utils import extend_schema
from ..models.reflection_question import ReflectionQuestion


class IsChallengeOwnerForWrite(BasePermission):
    """Reading is open to any signed-in user; only the parent challenge's creator (or staff) may write."""
    def has_permission(self, request, view):
        return True

    def has_object_permission(self, request, view, obj):
        if request.method in SAFE_METHODS:
            return True
        return obj.challenge.created_by_id == getattr(request.user, "id", None) or request.user.is_staff


class ReflectionQuestionFilter(FilterSet):
    class Meta:
        model = ReflectionQuestion
        fields = {"challenge": ["exact"]}


class ReflectionQuestionSerializer(FlexFieldsModelSerializer):
    class Meta:
        model = ReflectionQuestion
        fields = ["id", "challenge", "text", "kind", "options", "position", "created_at", "modified_at"]
        read_only_fields = ["id", "created_at", "modified_at"]


@extend_schema(tags=["Codepeat: Reflection Questions"])
@with_flex_fields_parameters()
class ReflectionQuestionViewSet(ModelViewSetMixin, ListModelMixin, RetrieveModelMixin, CreateModelMixin, DestroyModelMixin, GenericViewSet):
    queryset = ReflectionQuestion.objects.all()
    serializer_class = ReflectionQuestionSerializer
    filterset_class = ReflectionQuestionFilter
    ordering = ["position", "created_at"]
    # Any signed-in user may read the questions (to fill them in); only the challenge owner may edit.
    permission_classes = [IsAuthenticated, IsChallengeOwnerForWrite]
    # Reflection questions are not object-scoped; drop the default object-permission filter that
    # would otherwise empty the list for users without per-object grants (same as ChallengeViewSet).
    filter_backends = [FlexFieldsFilterBackend, DjangoFilterBackend, OrderingFilter]
