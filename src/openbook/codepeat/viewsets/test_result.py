from openbook.drf.flex_serializers import FlexFieldsModelSerializer
from openbook.drf.viewsets import ModelViewSetMixin, with_flex_fields_parameters
from rest_framework.mixins import ListModelMixin, RetrieveModelMixin, CreateModelMixin
from rest_framework.viewsets import GenericViewSet
from django_filters.filterset import FilterSet
from drf_spectacular.utils import extend_schema
from ..models.test_result import TestResult

class TestResultFilter(FilterSet):
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
        fields = ["id", "submission", "status", "output", "created_at", "modified_at"]
        read_only_fields = ["id", "created_at", "modified_at"]
        expandable_fields = {
            "submission": "openbook.codepeat.viewsets.submission.SubmissionSerializer",
        }

@extend_schema(tags=["Codepeat: Test Results"])
@with_flex_fields_parameters()
class TestResultViewSet(ModelViewSetMixin, ListModelMixin, RetrieveModelMixin, CreateModelMixin, GenericViewSet):
    queryset = TestResult.objects.all()
    serializer_class = TestResultSerializer
    filterset_class = TestResultFilter
    search_fields = ["submission__user__username", "status"]
    ordering = ["-created_at"]
