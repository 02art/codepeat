from django.test import TestCase
from django.core.exceptions import ValidationError

from ..validators import PasswordComplexityValidator


class PasswordComplexityValidator_Tests(TestCase):
    def setUp(self):
        self.validator = PasswordComplexityValidator()

    def test_accepts_password_with_all_character_classes(self):
        # Lower, upper, digit and special character present — no error.
        self.validator.validate("Abcdef1!")

    def test_rejects_missing_uppercase(self):
        with self.assertRaises(ValidationError) as ctx:
            self.validator.validate("abcdef1!")
        self.assertIn("Großbuchstaben", str(ctx.exception))

    def test_rejects_missing_lowercase(self):
        with self.assertRaises(ValidationError):
            self.validator.validate("ABCDEF1!")

    def test_rejects_missing_digit(self):
        with self.assertRaises(ValidationError) as ctx:
            self.validator.validate("Abcdefg!")
        self.assertIn("Zahl", str(ctx.exception))

    def test_rejects_missing_special_character(self):
        with self.assertRaises(ValidationError) as ctx:
            self.validator.validate("Abcdefg1")
        self.assertIn("Sonderzeichen", str(ctx.exception))

    def test_error_lists_every_missing_class(self):
        with self.assertRaises(ValidationError) as ctx:
            self.validator.validate("abc")
        message = str(ctx.exception)
        self.assertIn("Großbuchstaben", message)
        self.assertIn("Zahl", message)
        self.assertIn("Sonderzeichen", message)

    def test_get_help_text_is_non_empty(self):
        self.assertTrue(self.validator.get_help_text())
