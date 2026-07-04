import django_filters
from django.db.models import Q
from openbook.drf.flex_serializers import FlexFieldsModelSerializer
from openbook.drf.viewsets import ModelViewSetMixin, with_flex_fields_parameters
from rest_flex_fields2.filter_backends import FlexFieldsFilterBackend
from rest_framework import serializers
from rest_framework.decorators import action
from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework.mixins import ListModelMixin, RetrieveModelMixin, CreateModelMixin, DestroyModelMixin
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.viewsets import GenericViewSet
from django_filters.filterset import FilterSet
from django_filters.rest_framework import DjangoFilterBackend
from drf_spectacular.utils import extend_schema, extend_schema_view, inline_serializer
from ..models.feedback import Feedback
from ..models.submission import Submission
from ..xp import xp_outcome_for


# Multipart upload body for creating a submission. Declared explicitly so the generated client
# treats zip_file as a binary file upload; the full serializer accepts the same input at runtime.
SUBMISSION_CREATE_SCHEMA = {
    "type": "object",
    "properties": {
        "challenge": {"type": "string", "format": "uuid"},
        "zip_file": {"type": "string", "format": "binary"},
    },
    "required": ["challenge", "zip_file"],
}


class SubmissionFilter(FilterSet):
    # "mine" = the student's own submissions; "to_grade" = submissions on my challenges.
    scope = django_filters.ChoiceFilter(
        choices=[("mine", "mine"), ("to_grade", "to_grade")],
        method="filter_scope",
    )

    class Meta:
        model = Submission
        fields = {
            "challenge": ["exact"],
            "user": ["exact"],
            "status": ["exact"],
            "submitted_at": ["date", "date__gte", "date__lte"],
        }

    def filter_scope(self, queryset, name, value):
        user = self.request.user
        if value == "mine":
            return queryset.filter(user=user, hidden_from_student=False)
        if value == "to_grade":
            return queryset.filter(challenge__created_by=user)
        return queryset


class SubmissionSerializer(FlexFieldsModelSerializer):
    # Set from the session on create, never accepted from the client.
    user = serializers.PrimaryKeyRelatedField(read_only=True)
    feedback = serializers.SerializerMethodField()
    xp_outcome = serializers.SerializerMethodField()
    reflection_answers = serializers.SerializerMethodField()

    class Meta:
        model = Submission
        fields = ["id", "challenge", "user", "zip_file", "status", "feedback", "xp_outcome", "reflection_answers", "submitted_at", "created_at", "modified_at"]
        read_only_fields = ["id", "status", "submitted_at", "created_at", "modified_at"]
        expandable_fields = {
            "challenge": "openbook.codepeat.viewsets.challenge.ChallengeSerializer",
            "user": "openbook.auth.viewsets.user.UserSerializer",
        }

    def get_feedback(self, obj) -> str | None:
        latest = obj.feedbacks.all().order_by("-created_at").first()
        return latest.comments if latest else None

    def get_reflection_answers(self, obj) -> list | None:
        return obj.reflection.answers if hasattr(obj, "reflection") else None

    def get_xp_outcome(self, obj) -> str:
        return xp_outcome_for(obj.user, obj.challenge, exclude_submission_id=obj.id)

    def validate(self, attrs):
        request = self.context.get("request")
        if request is not None and request.user.is_authenticated and self.instance is None:
            challenge = attrs.get("challenge")
            if challenge is not None and challenge.created_by_id == request.user.id:
                raise serializers.ValidationError("Du kannst nicht bei deiner eigenen Challenge einreichen.")
            attrs["user"] = request.user  # the user FK is required but never comes from the client
        return super().validate(attrs)


@extend_schema(tags=["Codepeat: Submissions"])
@extend_schema_view(create=extend_schema(request={"multipart/form-data": SUBMISSION_CREATE_SCHEMA}, responses=SubmissionSerializer))
@with_flex_fields_parameters()
class SubmissionViewSet(ModelViewSetMixin, ListModelMixin, RetrieveModelMixin, CreateModelMixin, DestroyModelMixin, GenericViewSet):
    serializer_class = SubmissionSerializer
    filterset_class = SubmissionFilter
    search_fields = ["challenge__name", "user__username"]
    ordering = ["-submitted_at"]
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    # Submissions are scoped in get_queryset, not by per-object grants; drop the default
    # object-permission filter (it would otherwise empty every list).
    filter_backends = [FlexFieldsFilterBackend, DjangoFilterBackend, SearchFilter, OrderingFilter]

    def get_queryset(self):
        user = getattr(self.request, "user", None)
        if user is None or not user.is_authenticated:
            return Submission.objects.none()
        # A user sees their own submissions and any submission on a challenge they created.
        return (
            Submission.objects.filter(Q(user=user) | Q(challenge__created_by=user))
            .select_related("challenge", "user")
            .prefetch_related("feedbacks", "reflection")
        )

    @extend_schema(
        request=inline_serializer(name="SubmissionGrade", fields={
            "decision": serializers.ChoiceField(choices=["accept", "reject"]),
            "comment": serializers.CharField(required=False, allow_blank=True),
        }),
        responses=SubmissionSerializer,
    )
    @action(detail=True, methods=["post"])
    def grade(self, request, pk=None):
        """Accept or reject a submission (challenge creator only); an optional comment is stored as feedback."""
        submission = self.get_object()
        user = request.user
        if submission.challenge.created_by_id != user.id and not user.is_staff:
            return Response({"detail": "Nur der Ersteller der Challenge darf bewerten."}, status=403)

        decision = request.data.get("decision")
        if decision not in ("accept", "reject"):
            return Response({"detail": "Ungültige Entscheidung."}, status=400)

        submission.status = Submission.StatusChoices.ACCEPTED if decision == "accept" else Submission.StatusChoices.REJECTED
        submission.hidden_from_student = False  # a fresh result resurfaces for the student
        submission.save()
        Feedback.objects.create(submission=submission, lecturer=user, comments=request.data.get("comment") or "")
        return Response(self.get_serializer(submission).data)

    def destroy(self, request, *args, **kwargs):
        """Students drop a submission from their own list; a lecturer's delete rejects and returns it."""
        submission = self.get_object()
        user = request.user
        if submission.user_id == user.id:
            submission.hidden_from_student = True
            submission.save()
        else:  # get_queryset guarantees the only other case is the challenge creator
            submission.status = Submission.StatusChoices.REJECTED
            submission.hidden_from_student = False
            submission.save()
        return Response(status=204)
