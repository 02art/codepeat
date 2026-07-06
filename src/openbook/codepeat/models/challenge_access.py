from django.db                                       import models
from django.utils.translation                        import gettext_lazy as _

from openbook.auth.models                            import User
from openbook.core.models.mixins.uuid               import UUIDMixin
from openbook.auth.models.mixins.audit              import CreatedModifiedByMixin
from .challenge                                      import Challenge


class ChallengeAccess(UUIDMixin, CreatedModifiedByMixin):
    """
    A permanent unlock of a private challenge for a single user.

    Created when a user opens a valid invitation link. Once granted, the user keeps access
    to the (still private) challenge for good — until the challenge is switched to public,
    which clears all grants (so a later switch back to private starts from scratch).
    """
    challenge = models.ForeignKey(
        Challenge,
        on_delete    = models.CASCADE,
        related_name = "access_grants",
        verbose_name = _("Challenge"),
    )
    user = models.ForeignKey(
        User,
        on_delete    = models.CASCADE,
        related_name = "codepeat_challenge_access",
        verbose_name = _("User"),
    )

    class Meta:
        verbose_name        = _("Challenge Access")
        verbose_name_plural = _("Challenge Accesses")
        constraints         = [
            models.UniqueConstraint(fields=["challenge", "user"], name="unique_challenge_access_per_user"),
        ]

    def __str__(self):
        return f"{self.user} → {self.challenge}"
