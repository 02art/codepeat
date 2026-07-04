import re

from django.core.exceptions import ValidationError


class PasswordComplexityValidator:
    """Require lower- and uppercase letters, a digit and a special character (mirrors the frontend checklist)."""

    RULES = (
        (re.compile(r"[a-z]"),        "einen Kleinbuchstaben"),
        (re.compile(r"[A-Z]"),        "einen Großbuchstaben"),
        (re.compile(r"\d"),           "eine Zahl"),
        (re.compile(r"[^A-Za-z0-9]"), "ein Sonderzeichen"),
    )

    def validate(self, password, user=None):
        missing = [label for pattern, label in self.RULES if not pattern.search(password)]
        if missing:
            raise ValidationError(
                "Das Passwort muss %s enthalten." % ", ".join(missing),
                code="password_too_simple",
            )

    def get_help_text(self):
        return "Dein Passwort muss Groß- und Kleinbuchstaben, eine Zahl und ein Sonderzeichen enthalten."
