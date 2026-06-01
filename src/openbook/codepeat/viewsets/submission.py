from openbook.drf.flex_serializers import FlexFieldsModelSerializer
from openbook.drf.viewsets import with_flex_fields_parameters
from rest_framework.mixins import ListModelMixin, RetrieveModelMixin
from rest_framework.viewsets import GenericViewSet
from django_filters.filterset import FilterSet
from drf_spectacular.utils import extend_schema
from ..models.submission import Submission

class SubmissionFilter(FilterSet):
    class Meta:
        model = Submission
        fields = {
            "challenge": ["exact"],
            "user": ["exact"],
            "submitted_at": ["date", "date__gte", "date__lte"],
        }

class SubmissionSerializer(FlexFieldsModelSerializer):
    class Meta:
        model = Submission
        fields = ["id", "challenge", "user", "zip_file", "submitted_at", "created_at", "modified_at"]
        read_only_fields = ["id", "submitted_at", "created_at", "modified_at"]
        expandable_fields = {
            "challenge": "openbook.codepeat.viewsets.challenge.ChallengeSerializer",
            "user": "openbook.auth.viewsets.user.UserSerializer",
        }

@extend_schema(tags=["Codepeat: Submissions"])
@with_flex_fields_parameters()
class SubmissionViewSet(ListModelMixin, RetrieveModelMixin, GenericViewSet):
    queryset = Submission.objects.all()
    serializer_class = SubmissionSerializer
    filterset_class = SubmissionFilter
    search_fields = ["challenge__name", "user__username"]
    ordering = ["-submitted_at"]
