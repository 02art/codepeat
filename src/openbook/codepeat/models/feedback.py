from django.db import models
from django.utils.translation import gettext_lazy as _
from openbook.auth.models import User # User import from django.conf settings ?
from openbook.core.models import UUIDMixin, CreatedModifiedByMixin
from .submission import Submission

class Feedback(UUIDMixin, CreatedModifiedByMixin):
    submission = models.ForeignKey(Submission, on_delete=models.CASCADE, related_name="feedbacks", verbose_name=_("Submission"))
    lecturer = models.ForeignKey(User, on_delete=models.CASCADE, related_name="given_feedbacks", verbose_name=_("Lecturer"))
    comments = models.TextField(verbose_name=_("Comments"))
    rating = models.PositiveSmallIntegerField(verbose_name=_("Rating"))

    class Meta:
        verbose_name = _("Feedback")
        verbose_name_plural = _("Feedbacks")

    def __str__(self):
        return f"Feedback by {self.lecturer} for {self.submission}"
