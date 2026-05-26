from django.db import models
from django.utils.translation import gettext_lazy as _
from openbook.core.models import UUIDMixin, CreatedModifiedByMixin
from .submission import Submission

class Reflection(UUIDMixin, CreatedModifiedByMixin):
    submission = models.OneToOneField(Submission, on_delete=models.CASCADE, related_name="reflection", verbose_name=_("Submission"))
    answers = models.JSONField(verbose_name=_("Reflection Answers"))
    created_at = models.DateTimeField(auto_now_add=True, verbose_name=_("Created at"))

    class Meta:
        verbose_name = _("Reflection")
        verbose_name_plural = _("Reflections")
        ordering = ["-created_at"]

    def __str__(self):
        return f"Reflection for {self.submission}"
