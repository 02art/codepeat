from django.db                                      import models
from django.utils.translation                       import gettext_lazy as _
from openbook.auth.models                           import User
from openbook.core.models.mixins.uuid               import UUIDMixin
from openbook.auth.models.mixins.audit              import CreatedModifiedByMixin


class AccountDeletionRequest(UUIDMixin, CreatedModifiedByMixin):
    """
    A pending, email-confirmed request to delete one's own account.

    Its existence drives the "deletion pending" banner; its `id` is the subject of the signed
    token mailed to the user. Cancelling deletes the record (invalidating the outstanding link),
    and re-requesting rotates it (a fresh record id, so older links stop working).
    """
    user = models.OneToOneField(
        User,
        on_delete    = models.CASCADE,
        related_name = "codepeat_deletion_request",
        verbose_name = _("User"),
    )

    class Meta:
        verbose_name        = _("Account Deletion Request")
        verbose_name_plural = _("Account Deletion Requests")

    def __str__(self):
        return f"Account deletion request for {self.user}"
