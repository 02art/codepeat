from django.db                                      import models
from django.utils.translation                       import gettext_lazy as _
from openbook.core.models.mixins.uuid               import UUIDMixin
from openbook.auth.models.mixins.audit              import CreatedModifiedByMixin
from openbook.core.models.mixins.text               import NameDescriptionMixin

# ask to change init in models.mixins

class Challenge(UUIDMixin, CreatedModifiedByMixin, NameDescriptionMixin):
    class DifficultyChoices(models.TextChoices):
        EASY = "easy", _("Easy")
        MEDIUM = "medium", _("Medium")
        HARD = "hard", _("Hard")

    class VisibilityChoices(models.TextChoices):
        PUBLIC = "public", _("Public")
        PRIVATE = "private", _("Private")

    class TypeChoices(models.TextChoices):
        SOLO = "solo", _("Solo")
        GROUP = "group", _("Group")

    difficulty = models.CharField(max_length=10, choices=DifficultyChoices.choices, default=DifficultyChoices.EASY, verbose_name=_("Difficulty"))
    visibility = models.CharField(max_length=10, choices=VisibilityChoices.choices, default=VisibilityChoices.PUBLIC, verbose_name=_("Visibility"))
    type = models.CharField(max_length=10, choices=TypeChoices.choices, default=TypeChoices.SOLO, verbose_name=_("Type"))
    course = models.ForeignKey(
        "openbook_content.Course",
        verbose_name = _("Course"),
        on_delete    = models.SET_NULL,
        related_name = "challenges",
        null         = True,
        blank        = True,
    )  # Optional

    class Meta:
        verbose_name = _("Challenge")
        verbose_name_plural = _("Challenges")
        ordering = ["-created_at"]
