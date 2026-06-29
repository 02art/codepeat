from django.db                                       import models
from django.utils.translation                        import gettext_lazy as _
from openbook.auth.models                            import User
from openbook.core.models.mixins.uuid               import UUIDMixin
from openbook.auth.models.mixins.audit              import CreatedModifiedByMixin


class PasswordChangeRequest(UUIDMixin, CreatedModifiedByMixin):
    """
    A pending, email-confirmed request to change one's own password.

    The new password is stored already hashed and only applied once the user clicks the
    confirmation link; its `id` is the subject of the signed token mailed to the user.
    Re-requesting rotates the record (a fresh id, so older links stop working).
    """
    user = models.OneToOneField(
        User,
        on_delete    = models.CASCADE,
        related_name = "codepeat_password_change_request",
        verbose_name = _("User"),
    )

    # Already-hashed new password (never stored in clear text); applied verbatim on confirmation.
    new_password = models.CharField(_("New Password"), max_length=128)

    class Meta:
        verbose_name        = _("Password Change Request")
        verbose_name_plural = _("Password Change Requests")

    def __str__(self):
        return f"Password change request for {self.user}"
