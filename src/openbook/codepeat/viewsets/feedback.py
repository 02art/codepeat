from rest_flex_fields.serializers import FlexFieldsModelSerializer
from rest_flex_fields.views import FlexFieldsMixin
from rest_framework import viewsets
from django_filters import rest_framework as filters
from drf_spectacular.utils import extend_schema, with_flex_fields_parameters
from ..models.feedback import Feedback

class FeedbackFilter(filters.FilterSet):
    class Meta:
        model = Feedback
        fields = {
            "submission": ["exact"],
            "lecturer": ["exact"],
            "rating": ["exact"],
            "created_at": ["date", "date__gte", "date__lte"],
        }

class FeedbackSerializer(FlexFieldsModelSerializer):
    class Meta:
        model = Feedback
        fields = [
            "id", "submission", "lecturer", "comments", "rating", "created_at", "modified_at"
        ]
        read_only_fields = ["id", "created_at", "modified_at"]
    expandable_fields = {
        "submission": "openbook.codepeat.viewsets.submission.SubmissionSerializer",
        "lecturer": "openbook.auth.viewsets.user.UserSerializer",
    }

@extend_schema(tags=["Codepeat: Feedback"])
@with_flex_fields_parameters()
class FeedbackViewSet(FlexFieldsMixin, viewsets.ModelViewSet):
    queryset = Feedback.objects.all()
    serializer_class = FeedbackSerializer
    filterset_class = FeedbackFilter
    search_fields = ["submission__user__username", "lecturer__username", "comments"]
    ordering = ["-created_at"]
