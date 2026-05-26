from django.db import models
from django.utils.translation import gettext_lazy as _
from openbook.core.models import UUIDMixin, CreatedModifiedByMixin
from .submission import Submission

class TestResult(UUIDMixin, CreatedModifiedByMixin):
    submission = models.ForeignKey(Submission, on_delete=models.CASCADE, related_name="test_results", verbose_name=_("Submission"))
    status = models.CharField(max_length=20, verbose_name=_("Status"))
    output = models.TextField(verbose_name=_("Output"))
    created_at = models.DateTimeField(auto_now_add=True, verbose_name=_("Created at"))

    class Meta:
        verbose_name = _("Test Result")
        verbose_name_plural = _("Test Results")
        ordering = ["-created_at"]

    def __str__(self):
        return f"TestResult for {self.submission} at {self.created_at}"
