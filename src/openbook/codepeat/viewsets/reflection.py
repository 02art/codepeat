from openbook.drf.flex_serializers import FlexFieldsModelSerializer
from openbook.drf.viewsets import with_flex_fields_parameters
from rest_framework.mixins import ListModelMixin, RetrieveModelMixin
from rest_framework.viewsets import GenericViewSet
from django_filters.filterset import FilterSet
from drf_spectacular.utils import extend_schema
from ..models.reflection import Reflection

class ReflectionFilter(FilterSet):
    class Meta:
        model = Reflection
        fields = {
            "submission": ["exact"],
            "created_at": ["date", "date__gte", "date__lte"],
        }

class ReflectionSerializer(FlexFieldsModelSerializer):
    class Meta:
        model = Reflection
        fields = ["id", "submission", "answers", "created_at", "modified_at"]
        read_only_fields = ["id", "created_at", "modified_at"]
        expandable_fields = {
            "submission": "openbook.codepeat.viewsets.submission.SubmissionSerializer",
        }

@extend_schema(tags=["Codepeat: Reflections"])
@with_flex_fields_parameters()
class ReflectionViewSet(ListModelMixin, RetrieveModelMixin, GenericViewSet):
    queryset = Reflection.objects.all()
    serializer_class = ReflectionSerializer
    filterset_class = ReflectionFilter
    search_fields = ["submission__user__username", "submission__challenge__name"]
    ordering = ["-created_at"]
