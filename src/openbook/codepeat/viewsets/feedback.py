from openbook.drf.flex_serializers import FlexFieldsModelSerializer
from openbook.drf.viewsets import ModelViewSetMixin, with_flex_fields_parameters
from rest_framework.mixins import ListModelMixin, RetrieveModelMixin
from rest_framework.viewsets import GenericViewSet
from django_filters.filterset import FilterSet
from drf_spectacular.utils import extend_schema
from ..models.feedback import Feedback

class FeedbackFilter(FilterSet):
    class Meta:
        model = Feedback
        fields = {
            "submission": ["exact"],
            "lecturer": ["exact"],
            "created_at": ["date", "date__gte", "date__lte"],
        }

class FeedbackSerializer(FlexFieldsModelSerializer):
    class Meta:
        model = Feedback
        fields = ["id", "submission", "lecturer", "comments", "created_at", "modified_at"]
        read_only_fields = ["id", "created_at", "modified_at"]
        expandable_fields = {
            "submission": "openbook.codepeat.viewsets.submission.SubmissionSerializer",
            "lecturer": "openbook.auth.viewsets.user.UserSerializer",
        }

@extend_schema(tags=["Codepeat: Feedback"])
@with_flex_fields_parameters()
class FeedbackViewSet(ModelViewSetMixin, ListModelMixin, RetrieveModelMixin, GenericViewSet):
    # Read-only over the API; feedback is written through the submission "grade" action.
    http_method_names = ["get", "head", "options"]
    queryset = Feedback.objects.all()
    serializer_class = FeedbackSerializer
    filterset_class = FeedbackFilter
    search_fields = ["submission__user__username", "lecturer__username", "comments"]
    ordering = ["-created_at"]
