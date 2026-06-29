from django.db                                       import models
from django.utils.translation                        import gettext_lazy as _
from openbook.core.models.mixins.uuid               import UUIDMixin
from openbook.auth.models.mixins.audit              import CreatedModifiedByMixin
from .challenge                                      import Challenge


class ReflectionQuestion(UUIDMixin, CreatedModifiedByMixin):
    """
    A reflection question attached to a challenge by its creator (selected from the predefined
    catalogue or authored individually). Students answer these after submitting.

    The ``options`` field carries the type-specific extra data:
      * ``choice`` → the list of selectable answer options
      * ``scale``  → a two-element ``[min_label, max_label]`` for the scale ends
      * ``text``   → unused (empty list)
    """
    class KindChoices(models.TextChoices):
        TEXT   = "text",   _("Free text")
        SCALE  = "scale",  _("Scale")
        CHOICE = "choice", _("Choice")

    challenge = models.ForeignKey(
        Challenge,
        on_delete    = models.CASCADE,
        related_name = "reflection_questions",
        verbose_name = _("Challenge"),
    )
    text     = models.TextField(verbose_name=_("Question"))
    kind     = models.CharField(max_length=10, choices=KindChoices.choices, default=KindChoices.TEXT, verbose_name=_("Answer type"))
    options  = models.JSONField(default=list, blank=True, verbose_name=_("Options"))
    position = models.PositiveIntegerField(default=0, verbose_name=_("Position"))

    class Meta:
        verbose_name        = _("Reflection Question")
        verbose_name_plural = _("Reflection Questions")
        ordering            = ["position", "created_at"]

    def __str__(self):
        return f"{self.get_kind_display()}: {self.text[:50]}"
