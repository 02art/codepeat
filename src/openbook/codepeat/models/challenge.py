from django.db import models
from django.utils.translation import gettext_lazy as _
from openbook_auth.models import User
from openbook.core.models import UUIDMixin, CreatedModifiedByMixin

class Challenge(UUIDMixin, CreatedModifiedByMixin):
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

    title = models.CharField(max_length=200, verbose_name=_("Title"))
    description = models.TextField(verbose_name=_("Description"))
    difficulty = models.CharField(max_length=10, choices=DifficultyChoices.choices, default=DifficultyChoices.EASY, verbose_name=_("Difficulty"))
    visibility = models.CharField(max_length=10, choices=VisibilityChoices.choices, default=VisibilityChoices.PUBLIC, verbose_name=_("Visibility"))
    type = models.CharField(max_length=10, choices=TypeChoices.choices, default=TypeChoices.SOLO, verbose_name=_("Type"))
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name="created_challenges", verbose_name=_("Created by"))

    class Meta:
        verbose_name = _("Challenge")
        verbose_name_plural = _("Challenges")
        ordering = ["-created_at"]

    def __str__(self):
        return self.title
