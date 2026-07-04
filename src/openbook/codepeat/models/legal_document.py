from django.db                                       import models
from django.utils.translation                        import gettext_lazy as _
from openbook.core.models.mixins.uuid               import UUIDMixin
from openbook.auth.models.mixins.audit              import CreatedModifiedByMixin


class LegalDocument(UUIDMixin, CreatedModifiedByMixin):
    """
    A legal page shown in the frontend footer (privacy policy, imprint). The content is
    stored as HTML and edited in-place by admins; there is a fixed row per ``slug``.
    """
    class SlugChoices(models.TextChoices):
        PRIVACY = "datenschutz", _("Privacy policy")
        IMPRINT = "impressum",   _("Imprint")

    slug    = models.SlugField(max_length=32, unique=True, choices=SlugChoices.choices, verbose_name=_("Slug"))
    content = models.TextField(blank=True, default="", verbose_name=_("Content"))

    class Meta:
        verbose_name        = _("Legal Document")
        verbose_name_plural = _("Legal Documents")
        ordering            = ["slug"]

    def __str__(self):
        return self.get_slug_display()
