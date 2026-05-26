from rest_flex_fields.serializers import FlexFieldsModelSerializer
from rest_flex_fields.views import FlexFieldsMixin
from rest_framework import viewsets
from django_filters import rest_framework as filters
from drf_spectacular.utils import extend_schema, with_flex_fields_parameters
from ..models.reflection import Reflection

class ReflectionFilter(filters.FilterSet):
    class Meta:
        model = Reflection
        fields = {
            "submission": ["exact"],
            "created_at": ["date", "date__gte", "date__lte"],
        }

class ReflectionSerializer(FlexFieldsModelSerializer):
    class Meta:
        model = Reflection
        fields = [
            "id", "submission", "answers", "created_at", "modified_at"
        ]
        read_only_fields = ["id", "created_at", "modified_at"]
    expandable_fields = {
        "submission": "openbook.codepeat.viewsets.submission.SubmissionSerializer",
    }

@extend_schema(tags=["Codepeat: Reflections"])
@with_flex_fields_parameters()
class ReflectionViewSet(FlexFieldsMixin, viewsets.ModelViewSet):
    queryset = Reflection.objects.all()
    serializer_class = ReflectionSerializer
    filterset_class = ReflectionFilter
    search_fields = ["submission__user__username", "submission__challenge__title"]
    ordering = ["-created_at"]
