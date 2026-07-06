from django.conf import settings
from django.core import mail
from django.test import TestCase

from ..allauth.adapter import AccountAdapter, BRAND_NAME


class AccountAdapter_Unit_Tests(TestCase):
    def setUp(self):
        self.adapter = AccountAdapter()

    def test_from_email_carries_the_brand_name(self):
        self.assertEqual(self.adapter.get_from_email(), f"{BRAND_NAME} <{settings.DEFAULT_FROM_EMAIL}>")

    def test_subject_is_prefixed_with_the_brand(self):
        self.assertEqual(self.adapter.format_email_subject("Confirm your email"), f"[{BRAND_NAME}] Confirm your email")


class AccountAdapter_Email_Tests(TestCase):
    """The allauth-owned emails (verification, login code) carry a light CodePeat identity."""

    def test_verification_email_is_codepeat_branded(self):
        response = self.client.post(
            "/auth-api/browser/v1/auth/signup",
            {"email": "adaptertest@example.com", "username": "adaptertester", "password": "Abcdef1!xy"},
            content_type="application/json",
        )
        # allauth answers with a pending "verify email" flow (401), having sent the confirmation mail.
        self.assertEqual(response.status_code, 401)
        self.assertEqual(len(mail.outbox), 1)

        message = mail.outbox[0]
        self.assertTrue(message.from_email.startswith(f"{BRAND_NAME} <"))
        self.assertTrue(message.subject.startswith(f"[{BRAND_NAME}]"))
        self.assertIn(f"Hello from {BRAND_NAME}", message.body)
