from openbook.drf.flex_serializers import FlexFieldsModelSerializer
from openbook.drf.viewsets import ModelViewSetMixin, with_flex_fields_parameters
from rest_framework import serializers
from rest_framework.mixins import ListModelMixin, RetrieveModelMixin, CreateModelMixin
from rest_framework.permissions import IsAuthenticated
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
    # Taken from the session on create, never from the client.
    user = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = Submission
        fields = ["id", "challenge", "user", "zip_file", "submitted_at", "created_at", "modified_at"]
        read_only_fields = ["id", "submitted_at", "created_at", "modified_at"]
        expandable_fields = {
            "challenge": "openbook.codepeat.viewsets.challenge.ChallengeSerializer",
            "user": "openbook.auth.viewsets.user.UserSerializer",
        }

    def validate(self, attrs):
        # Inject the submitter before the base serializer runs the model's full_clean()
        # (the user FK is required, but it's never accepted from the client).
        request = self.context.get("request")
        if request is not None and request.user.is_authenticated and self.instance is None:
            attrs["user"] = request.user
        return super().validate(attrs)

@extend_schema(tags=["Codepeat: Submissions"])
@with_flex_fields_parameters()
class SubmissionViewSet(ModelViewSetMixin, ListModelMixin, RetrieveModelMixin, CreateModelMixin, GenericViewSet):
    queryset = Submission.objects.all()
    serializer_class = SubmissionSerializer
    filterset_class = SubmissionFilter
    search_fields = ["challenge__name", "user__username"]
    ordering = ["-submitted_at"]
    # Any signed-in user may submit; the submitter is always the session user (set in the serializer).
    permission_classes = [IsAuthenticated]
