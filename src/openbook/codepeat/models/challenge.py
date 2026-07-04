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

    # When set, XP is only granted once a lecturer accepts a submission; otherwise the challenge
    # awards no XP (there is no automatic grading yet). CodePeat's own challenges leave this off.
    requires_grading = models.BooleanField(default=True, verbose_name=_("Requires grading"))

    # Detail-page content. Constraints are one per line (like the description's task lines).
    # The worked example is optional; it is only shown when input and output are both present.
    constraints     = models.TextField(verbose_name=_("Constraints"), blank=True, default="")
    example_language = models.CharField(verbose_name=_("Example Language"), max_length=50, blank=True, default="")
    example_input   = models.TextField(verbose_name=_("Example Input"), blank=True, default="")
    example_output  = models.TextField(verbose_name=_("Example Output"), blank=True, default="")
    views           = models.PositiveIntegerField(verbose_name=_("Views"), default=0)

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
