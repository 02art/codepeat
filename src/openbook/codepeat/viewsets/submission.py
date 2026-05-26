from rest_flex_fields.serializers import FlexFieldsModelSerializer
from rest_flex_fields.views import FlexFieldsMixin
from rest_framework import viewsets
from django_filters import rest_framework as filters
from drf_spectacular.utils import extend_schema, with_flex_fields_parameters
from ..models.submission import Submission

class SubmissionFilter(filters.FilterSet):
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
        fields = [
            "id", "challenge", "user", "zip_file", "submitted_at", "created_at", "modified_at"
        ]
        read_only_fields = ["id", "submitted_at", "created_at", "modified_at"]
    expandable_fields = {
        "challenge": "openbook.codepeat.viewsets.challenge.ChallengeSerializer",
        "user": "openbook.auth.viewsets.user.UserSerializer",
    }

@extend_schema(tags=["Codepeat: Submissions"])
@with_flex_fields_parameters()
class SubmissionViewSet(FlexFieldsMixin, viewsets.ModelViewSet):
    queryset = Submission.objects.all()
    serializer_class = SubmissionSerializer
    filterset_class = SubmissionFilter
    search_fields = ["challenge__title", "user__username"]
    ordering = ["-submitted_at"]
