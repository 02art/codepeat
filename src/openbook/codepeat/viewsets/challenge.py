from django.core import signing
from django.db.models import Q
from openbook.drf.flex_serializers import FlexFieldsModelSerializer
from openbook.drf.permissions import DjangoObjectPermissionsOnly
from openbook.drf.viewsets import AllowAnonymousListRetrieveViewSetMixin, ModelViewSetMixin, with_flex_fields_parameters
from rest_framework.mixins import ListModelMixin, RetrieveModelMixin, CreateModelMixin, UpdateModelMixin, DestroyModelMixin
from rest_framework.viewsets import GenericViewSet
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, BasePermission, IsAuthenticated, SAFE_METHODS
from rest_framework.response import Response
from rest_framework.filters import OrderingFilter, SearchFilter
from rest_flex_fields2.filter_backends import FlexFieldsFilterBackend
from django_filters.filterset import FilterSet
from django_filters.rest_framework import DjangoFilterBackend
from drf_spectacular.utils import extend_schema, inline_serializer
from rest_framework import serializers
from ..models.challenge import Challenge
from ..models.challenge_access import ChallengeAccess

# Signed, time-limited token that unlocks a private challenge for whoever opens the link.
INVITE_SALT = "codepeat.challenge.invite"
INVITE_MAX_AGE_SECONDS = 30 * 60  # 30 minutes, refreshable


class IsChallengeCreatorForWrite(BasePermission):
    """
    Object-level guard: a saved challenge may only be modified or deleted by its creator
    (or staff). Reads and not-yet-created instances are always allowed; the action-level
    model permissions (add/change/delete_challenge) still apply on top of this.
    """
    def has_permission(self, request, view):
        return True

    def has_object_permission(self, request, view, obj):
        if request.method in SAFE_METHODS:
            return True
        if obj.created_by_id is None:  # instance is being created, no owner yet
            return True
        return obj.created_by_id == getattr(request.user, "id", None) or request.user.is_staff


class ChallengeFilter(FilterSet):
    class Meta:
        model = Challenge
        fields = {
            "difficulty": ["exact"],
            "visibility": ["exact"],
            "type": ["exact"],
            "course": ["exact"],
            "created_by": ["exact"],
        }

class ChallengeSerializer(FlexFieldsModelSerializer):
    class Meta:
        model = Challenge
        fields = ["id", "name", "description", "text_format", "difficulty", "visibility", "type", "constraints", "example_language", "example_input", "example_output", "views", "course", "created_by", "created_at", "modified_at"]
        read_only_fields = ["id", "views", "created_by", "created_at", "modified_at"]
        expandable_fields = {
            "created_by": "openbook.auth.viewsets.user.UserSerializer",
            "course": "openbook.content.viewsets.course.CourseSerializer",
        }

@extend_schema(tags=["Codepeat: Challenges"])
@with_flex_fields_parameters()
class ChallengeViewSet(AllowAnonymousListRetrieveViewSetMixin, ModelViewSetMixin, ListModelMixin, RetrieveModelMixin, CreateModelMixin, UpdateModelMixin, DestroyModelMixin, GenericViewSet):
    serializer_class = ChallengeSerializer
    filterset_class = ChallengeFilter
    search_fields = ["name", "description", "created_by__username"]
    ordering = ["-created_at"]
    permission_classes = [IsAuthenticated, DjangoObjectPermissionsOnly, IsChallengeCreatorForWrite]

    # Challenges are a public, flat catalogue (not object-scoped). The default object-permission
    # filter is intentionally omitted here — it would otherwise hide every challenge from users
    # without per-object grants. Write actions remain permission-gated via the permission classes.
    filter_backends = [FlexFieldsFilterBackend, DjangoFilterBackend, SearchFilter, OrderingFilter]

    def get_queryset(self):
        """Public challenges are visible to everyone; private ones only to the creator, staff and unlocked users."""
        qs = Challenge.objects.all()
        user = getattr(self.request, "user", None)
        if user is None or not user.is_authenticated:
            return qs.filter(visibility=Challenge.VisibilityChoices.PUBLIC)
        if user.is_staff:
            return qs
        return qs.filter(
            Q(visibility=Challenge.VisibilityChoices.PUBLIC)
            | Q(created_by=user)
            | Q(access_grants__user=user)
        ).distinct()

    def perform_update(self, serializer):
        """Switching a challenge to public clears all unlock grants (re-privatising starts fresh)."""
        instance = serializer.save()
        if instance.visibility == Challenge.VisibilityChoices.PUBLIC:
            instance.access_grants.all().delete()

    @extend_schema(responses=inline_serializer(
        name="ChallengeCanCreate",
        fields={"can_create": serializers.BooleanField()},
    ))
    @action(detail=False, methods=["get"], url_path="can-create", permission_classes=[AllowAny])
    def can_create(self, request):
        """Report whether the requesting user may create challenges (teacher or admin)."""
        allowed = request.user.is_authenticated and request.user.has_perm("codepeat.add_challenge")
        return Response({"can_create": allowed})

    @extend_schema(request=None, responses=inline_serializer(
        name="ChallengeInviteLink",
        fields={"url": serializers.CharField(), "expires_in": serializers.IntegerField()},
    ))
    @action(detail=True, methods=["post"], url_path="invite-link")
    def invite_link(self, request, pk=None):
        """Create a fresh, time-limited invitation link for a private challenge (creator only)."""
        challenge = self.get_object()  # enforces creator/staff via the object permission
        if challenge.visibility != Challenge.VisibilityChoices.PRIVATE:
            return Response({"detail": "Einladungslinks gibt es nur für private Challenges."}, status=400)

        token = signing.dumps(str(challenge.id), salt=INVITE_SALT)
        url = f"{request.scheme}://{request.get_host()}/codepeat/index.html#/challenges/{challenge.id}/unlock/{token}"
        return Response({"url": url, "expires_in": INVITE_MAX_AGE_SECONDS})

    @extend_schema(
        request=inline_serializer(name="ChallengeUnlock", fields={"token": serializers.CharField()}),
        responses=inline_serializer(name="ChallengeUnlockResult", fields={"challenge": serializers.UUIDField(), "detail": serializers.CharField()}),
    )
    @action(detail=False, methods=["post"], url_path="unlock", permission_classes=[IsAuthenticated])
    def unlock(self, request):
        """Redeem an invitation link: grant the signed-in user permanent access to the challenge."""
        try:
            challenge_id = signing.loads(request.data.get("token", ""), salt=INVITE_SALT, max_age=INVITE_MAX_AGE_SECONDS)
        except signing.SignatureExpired:
            return Response({"detail": "Der Einladungslink ist abgelaufen."}, status=400)
        except signing.BadSignature:
            return Response({"detail": "Der Einladungslink ist ungültig."}, status=400)

        # Bypass the visibility-scoped queryset on purpose: the token *is* the authorisation.
        challenge = Challenge.objects.filter(id=challenge_id).first()
        if challenge is None:
            return Response({"detail": "Die Challenge existiert nicht mehr."}, status=400)

        if challenge.visibility == Challenge.VisibilityChoices.PRIVATE:
            ChallengeAccess.objects.get_or_create(challenge=challenge, user=request.user)
        return Response({"challenge": str(challenge.id), "detail": "Challenge freigeschaltet."})
