from django.db                                      import models
from django.utils.translation                       import gettext_lazy as _
from openbook.auth.models                           import User # User import from django.conf settings ?
from openbook.core.models.mixins.uuid               import UUIDMixin
from openbook.auth.models.mixins.audit              import CreatedModifiedByMixin
from .challenge                                     import Challenge

class Submission(UUIDMixin, CreatedModifiedByMixin):
    class StatusChoices(models.TextChoices):
        PENDING  = "pending",  _("Pending")
        ACCEPTED = "accepted", _("Accepted")
        REJECTED = "rejected", _("Rejected")

    challenge = models.ForeignKey(Challenge, on_delete=models.CASCADE, related_name="submissions", verbose_name=_("Challenge"))
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="submissions", verbose_name=_("Submitted by"))
    zip_file = models.FileField(upload_to="submissions/", verbose_name=_("Submission ZIP"), blank=True, null=True)
    submitted_at = models.DateTimeField(auto_now_add=True, verbose_name=_("Submitted at"))
    # mixin could be used for this but it is more intuitive to have a separate field for submission time, as it is a key aspect of the submission and may not always align with the created_at timestamp of the model instance.

    # Grading state. hidden_from_student lets a student drop a submission from their own list;
    # it is cleared again when the lecturer grades it, so the result resurfaces.
    status = models.CharField(max_length=10, choices=StatusChoices.choices, default=StatusChoices.PENDING, verbose_name=_("Status"))
    hidden_from_student = models.BooleanField(default=False, verbose_name=_("Hidden from student"))

    class Meta:
        verbose_name = _("Submission")
        verbose_name_plural = _("Submissions")
        ordering = ["-submitted_at"]

    def __str__(self):
        return f"{self.user} - {self.challenge}"
