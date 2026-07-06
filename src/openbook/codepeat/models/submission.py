from django.db                                      import models
from django.utils.translation                       import gettext_lazy as _

from openbook.auth.models                           import User
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
    # First-class submission time, independent of the created_at audit timestamp.
    submitted_at = models.DateTimeField(auto_now_add=True, verbose_name=_("Submitted at"))

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

    def grade(self, *, lecturer: User, accepted: bool, comment: str = "") -> None:
        """Accept or reject the submission and store the lecturer's feedback."""
        self.status = self.StatusChoices.ACCEPTED if accepted else self.StatusChoices.REJECTED
        self.hidden_from_student = False  # a graded result resurfaces for the student
        self.save()
        self.feedbacks.create(lecturer=lecturer, comments=comment)

    def hide_from_student_list(self) -> None:
        """Remove the submission from the student's own list; it stays visible to the lecturer."""
        self.hidden_from_student = True
        self.save()

    def reject(self) -> None:
        """Reject the submission and resurface it for the student."""
        self.status = self.StatusChoices.REJECTED
        self.hidden_from_student = False
        self.save()
