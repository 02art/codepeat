from django.db                                       import models
from django.utils.translation                        import gettext_lazy as _
from openbook.auth.models                            import User
from openbook.core.models.mixins.uuid               import UUIDMixin
from openbook.auth.models.mixins.audit              import CreatedModifiedByMixin


class UserAvatar(UUIDMixin, CreatedModifiedByMixin):
    """
    The profile picture a user picked from the CodePeat avatar pool.

    Stored as the relative path to the chosen image (e.g. ``PB/avatar-1.jpg``); the pool
    itself is a set of static files shipped with the frontend.
    """
    user = models.OneToOneField(
        User,
        on_delete    = models.CASCADE,
        related_name = "codepeat_avatar",
        verbose_name = _("User"),
    )

    avatar = models.CharField(_("Avatar"), max_length=255)

    class Meta:
        verbose_name        = _("User Avatar")
        verbose_name_plural = _("User Avatars")

    def __str__(self):
        return f"Avatar for {self.user}: {self.avatar}"
