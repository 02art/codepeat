from rest_flex_fields.serializers import FlexFieldsModelSerializer
from rest_flex_fields.views import FlexFieldsMixin
from rest_framework import viewsets
from django_filters import rest_framework as filters
from drf_spectacular.utils import extend_schema, with_flex_fields_parameters
from ..models.test_result import TestResult

class TestResultFilter(filters.FilterSet):
    class Meta:
        model = TestResult
        fields = {
            "submission": ["exact"],
            "status": ["exact"],
            "created_at": ["date", "date__gte", "date__lte"],
        }

class TestResultSerializer(FlexFieldsModelSerializer):
    class Meta:
        model = TestResult
        fields = [
            "id", "submission", "status", "output", "created_at", "modified_at"
        ]
        read_only_fields = ["id", "created_at", "modified_at"]
    expandable_fields = {
        "submission": "openbook.codepeat.viewsets.submission.SubmissionSerializer",
    }

@extend_schema(tags=["Codepeat: Test Results"])
@with_flex_fields_parameters()
class TestResultViewSet(FlexFieldsMixin, viewsets.ModelViewSet):
    queryset = TestResult.objects.all()
    serializer_class = TestResultSerializer
    filterset_class = TestResultFilter
    search_fields = ["submission__user__username", "status"]
    ordering = ["-created_at"]
