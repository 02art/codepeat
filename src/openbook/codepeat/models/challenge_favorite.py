from django.db                                       import models
from django.utils.translation                        import gettext_lazy as _

from openbook.auth.models                            import User
from openbook.core.models.mixins.uuid               import UUIDMixin
from openbook.auth.models.mixins.audit              import CreatedModifiedByMixin
from .challenge                                      import Challenge


class ChallengeFavorite(UUIDMixin, CreatedModifiedByMixin):
    """A user's bookmark of a challenge, toggled from the overview's star button."""
    challenge = models.ForeignKey(
        Challenge,
        on_delete    = models.CASCADE,
        related_name = "favorites",
        verbose_name = _("Challenge"),
    )
    user = models.ForeignKey(
        User,
        on_delete    = models.CASCADE,
        related_name = "codepeat_challenge_favorites",
        verbose_name = _("User"),
    )

    class Meta:
        verbose_name        = _("Challenge Favorite")
        verbose_name_plural = _("Challenge Favorites")
        constraints         = [
            models.UniqueConstraint(fields=["challenge", "user"], name="unique_challenge_favorite_per_user"),
        ]

    def __str__(self):
        return f"{self.user} ★ {self.challenge}"
