from types import SimpleNamespace

from django.conf import settings

from openbook.auth.allauth.adapter import AccountAdapter as OpenbookAccountAdapter

# Shown as the product name in allauth's own transactional emails (email verification, login code).
BRAND_NAME = "CodePeat"


class AccountAdapter(OpenbookAccountAdapter):
    """Give allauth's own emails a light CodePeat identity (sender, subject, greeting)."""

    def get_from_email(self) -> str:
        """Send from the CodePeat sender name over the configured address."""
        return f"{BRAND_NAME} <{settings.DEFAULT_FROM_EMAIL}>"

    def format_email_subject(self, subject) -> str:
        """Prefix every subject with the CodePeat brand instead of the shared site name."""
        return f"[{BRAND_NAME}] {subject}"

    def render_mail(self, template_prefix, email, context, headers=None):
        """Render allauth's default body with the brand name in place of the site name."""
        site = context.get("current_site")
        if site is not None:
            context = {**context, "current_site": SimpleNamespace(name=BRAND_NAME, domain=site.domain)}
        return super().render_mail(template_prefix, email, context, headers)
