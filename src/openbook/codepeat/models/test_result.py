from django.db                                      import models
from django.utils.translation                       import gettext_lazy as _

from openbook.core.models.mixins.uuid               import UUIDMixin
from openbook.auth.models.mixins.audit              import CreatedModifiedByMixin
from .submission                                    import Submission

class TestResult(UUIDMixin, CreatedModifiedByMixin):
    class StatusChoices(models.TextChoices):
        PENDING = "pending", _("Pending")
        PASSED  = "passed",  _("Passed")
        FAILED  = "failed",  _("Failed")
        ERROR   = "error",   _("Error")

    submission = models.ForeignKey(Submission, on_delete=models.CASCADE, related_name="test_results", verbose_name=_("Submission"))
    status     = models.CharField(max_length=20, choices=StatusChoices, default=StatusChoices.PENDING, verbose_name=_("Status"))
    output = models.TextField(verbose_name=_("Output"))

    class Meta:
        verbose_name = _("Test Result")
        verbose_name_plural = _("Test Results")
        ordering = ["-created_at"]

    def __str__(self):
        return f"TestResult for {self.submission} at {self.created_at}"
