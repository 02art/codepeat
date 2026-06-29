from django.conf import settings
from django.contrib.auth.hashers import make_password
from django.contrib.auth.password_validation import validate_password
from django.core import signing
from django.core.exceptions import ValidationError
from django.core.mail import send_mail
from rest_framework import serializers
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.viewsets import ViewSet
from drf_spectacular.utils import extend_schema, inline_serializer

from ..models.account_deletion_request import AccountDeletionRequest
from ..models.password_change_request import PasswordChangeRequest
from ..models.user_avatar import UserAvatar
from ..xp import progress_for_user

# Signed, time-limited token for the email-confirmed account deletion flow.
DELETION_SALT = "codepeat.account.deletion"
DELETION_MAX_AGE_SECONDS = 60 * 60  # 1 hour

# Signed, time-limited token for the email-confirmed password change flow.
PASSWORD_CHANGE_SALT = "codepeat.account.password-change"
PASSWORD_CHANGE_MAX_AGE_SECONDS = 60 * 60  # 1 hour

_pending_serializer = inline_serializer(name="AccountDeletionStatus", fields={"pending": serializers.BooleanField()})
_detail_serializer = inline_serializer(name="AccountActionResult", fields={"detail": serializers.CharField()})

# Profile pictures are chosen from a fixed pool of static files under the frontend's `PB/` folder.
AVATAR_PATTERN = r"^PB/[A-Za-z0-9._-]+\.(jpg|jpeg|png|webp)$"


class AvatarSerializer(serializers.Serializer):
    """A profile picture: the relative path of an image from the CodePeat avatar pool."""
    avatar = serializers.RegexField(AVATAR_PATTERN, allow_null=True)


class PasswordChangeRequestSerializer(serializers.Serializer):
    """Validates a request to change the password: current password must match, new one must be valid."""
    current_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True)

    def validate_current_password(self, value):
        user = self.context["request"].user
        if not user.check_password(value):
            raise serializers.ValidationError("Das aktuelle Passwort ist falsch.")
        return value

    def validate_new_password(self, value):
        user = self.context["request"].user
        try:
            validate_password(value, user=user)
        except ValidationError as error:
            raise serializers.ValidationError(list(error.messages)) from error
        return value


@extend_schema(tags=["Codepeat: Account"])
class AccountViewSet(ViewSet):
    """Self-service account management for the signed-in CodePeat user."""

    # Plain ViewSet: bypass the object-permission default (there is no model/queryset here).
    permission_classes = [IsAuthenticated]

    def _send_deletion_email(self, request, deletion_request):
        token = signing.dumps(str(deletion_request.id), salt=DELETION_SALT)
        link = f"{request.scheme}://{request.get_host()}/codepeat/index.html#/delete-account/{token}"
        user = request.user

        send_mail(
            subject = "CodePeat – Account-Löschung bestätigen",
            message = (
                f"Hallo {user.get_username()},\n\n"
                "du hast die Löschung deines CodePeat-Kontos angefragt. "
                "Bestätige sie über diesen Link (gültig für 1 Stunde):\n\n"
                f"{link}\n\n"
                "Wenn du das nicht warst oder es dir anders überlegt hast, kannst du die Anfrage "
                "in deinem Profil abbrechen – dann passiert nichts.\n\n"
                "Dein CodePeat-Team"
            ),
            from_email = f"CodePeat <{settings.DEFAULT_FROM_EMAIL}>",
            recipient_list = [user.email],
            fail_silently = False,
        )

    @extend_schema(responses=_pending_serializer)
    @action(detail=False, methods=["get"], url_path="deletion-status")
    def deletion_status(self, request):
        """Whether a deletion confirmation is currently pending (drives the profile banner)."""
        pending = AccountDeletionRequest.objects.filter(user=request.user).exists()
        return Response({"pending": pending})

    @extend_schema(request=None, responses=_pending_serializer)
    @action(detail=False, methods=["post"], url_path="request-deletion")
    def request_deletion(self, request):
        """(Re-)request deletion: rotate the pending request and email a fresh confirmation link."""
        AccountDeletionRequest.objects.filter(user=request.user).delete()
        deletion_request = AccountDeletionRequest.objects.create(user=request.user)
        self._send_deletion_email(request, deletion_request)
        return Response({"pending": True})

    @extend_schema(request=None, responses=_pending_serializer)
    @action(detail=False, methods=["post"], url_path="cancel-deletion")
    def cancel_deletion(self, request):
        """Cancel a pending deletion; any outstanding confirmation link becomes invalid."""
        AccountDeletionRequest.objects.filter(user=request.user).delete()
        return Response({"pending": False})

    @extend_schema(
        request=inline_serializer(name="AccountDeletionConfirm", fields={"token": serializers.CharField()}),
        responses=inline_serializer(name="AccountDeletionResult", fields={"detail": serializers.CharField()}),
    )
    @action(detail=False, methods=["post"], url_path="confirm-deletion", permission_classes=[AllowAny])
    def confirm_deletion(self, request):
        """Verify the emailed token and permanently delete the corresponding account."""
        try:
            request_id = signing.loads(request.data.get("token", ""), salt=DELETION_SALT, max_age=DELETION_MAX_AGE_SECONDS)
        except signing.SignatureExpired:
            return Response({"detail": "Der Bestätigungslink ist abgelaufen."}, status=400)
        except signing.BadSignature:
            return Response({"detail": "Der Bestätigungslink ist ungültig."}, status=400)

        deletion_request = AccountDeletionRequest.objects.filter(id=request_id).select_related("user").first()
        if deletion_request is None:
            return Response({"detail": "Die Löschanfrage wurde bereits abgebrochen oder verwendet."}, status=400)

        deletion_request.user.delete()  # cascades and removes the request itself
        return Response({"detail": "Account gelöscht."})

    # Password change (email-confirmed)

    def _send_password_change_email(self, request, change_request):
        token = signing.dumps(str(change_request.id), salt=PASSWORD_CHANGE_SALT)
        link = f"{request.scheme}://{request.get_host()}/codepeat/index.html#/change-password/{token}"
        user = request.user

        send_mail(
            subject = "CodePeat – Passwortänderung bestätigen",
            message = (
                f"Hallo {user.get_username()},\n\n"
                "du hast eine Änderung deines CodePeat-Passworts angefragt. "
                "Bestätige sie über diesen Link (gültig für 1 Stunde):\n\n"
                f"{link}\n\n"
                "Erst nach dem Klick wird dein neues Passwort aktiv. "
                "Wenn du das nicht warst, ignoriere diese E-Mail – dein Passwort bleibt unverändert.\n\n"
                "Dein CodePeat-Team"
            ),
            from_email = f"CodePeat <{settings.DEFAULT_FROM_EMAIL}>",
            recipient_list = [user.email],
            fail_silently = False,
        )

    @extend_schema(request=PasswordChangeRequestSerializer, responses=_detail_serializer)
    @action(detail=False, methods=["post"], url_path="request-password-change")
    def request_password_change(self, request):
        """(Re-)request a password change: stage the new (hashed) password and email a confirmation link."""
        serializer = PasswordChangeRequestSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)

        PasswordChangeRequest.objects.filter(user=request.user).delete()
        change_request = PasswordChangeRequest.objects.create(
            user         = request.user,
            new_password = make_password(serializer.validated_data["new_password"]),
        )
        self._send_password_change_email(request, change_request)
        return Response({"detail": "Bestätigungs-E-Mail gesendet."})

    @extend_schema(
        request=inline_serializer(name="PasswordChangeConfirm", fields={"token": serializers.CharField()}),
        responses=_detail_serializer,
    )
    @action(detail=False, methods=["post"], url_path="confirm-password-change", permission_classes=[AllowAny])
    def confirm_password_change(self, request):
        """Verify the emailed token and apply the previously staged password."""
        try:
            request_id = signing.loads(request.data.get("token", ""), salt=PASSWORD_CHANGE_SALT, max_age=PASSWORD_CHANGE_MAX_AGE_SECONDS)
        except signing.SignatureExpired:
            return Response({"detail": "Der Bestätigungslink ist abgelaufen."}, status=400)
        except signing.BadSignature:
            return Response({"detail": "Der Bestätigungslink ist ungültig."}, status=400)

        change_request = PasswordChangeRequest.objects.filter(id=request_id).select_related("user").first()
        if change_request is None:
            return Response({"detail": "Die Anfrage wurde bereits verwendet oder ist nicht mehr gültig."}, status=400)

        user = change_request.user
        user.password = change_request.new_password  # already hashed when staged
        user.save(update_fields=["password"])
        change_request.delete()
        return Response({"detail": "Passwort geändert."})

    # XP / level progress

    @extend_schema(responses=inline_serializer(name="UserProgress", fields={
        "xp": serializers.IntegerField(),
        "level": serializers.IntegerField(),
        "xp_into_level": serializers.IntegerField(),
        "xp_for_next_level": serializers.IntegerField(),
    }))
    @action(detail=False, methods=["get"], url_path="progress")
    def progress(self, request):
        """The signed-in user's XP and level (drives the navbar progress bar)."""
        return Response(progress_for_user(request.user))

    # Profile picture

    @extend_schema(responses=AvatarSerializer)
    @action(detail=False, methods=["get"], url_path="avatar")
    def avatar(self, request):
        """The signed-in user's chosen profile picture, or null when none is set."""
        record = UserAvatar.objects.filter(user=request.user).first()
        return Response({"avatar": record.avatar if record else None})

    @extend_schema(request=AvatarSerializer, responses=AvatarSerializer)
    @action(detail=False, methods=["post"], url_path="set-avatar")
    def set_avatar(self, request):
        """Set (or clear) the signed-in user's profile picture from the avatar pool."""
        serializer = AvatarSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        chosen = serializer.validated_data["avatar"]

        if chosen is None:
            UserAvatar.objects.filter(user=request.user).delete()
        else:
            UserAvatar.objects.update_or_create(user=request.user, defaults={"avatar": chosen})
        return Response({"avatar": chosen})
