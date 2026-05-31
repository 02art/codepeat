from django.test import TestCase
from django.core.files.uploadedfile import SimpleUploadedFile
from openbook.auth.models import User
from ..models.challenge import Challenge
from ..models.submission import Submission

class Submission_Model_Tests(TestCase):
    """Tests for the Submission model."""

    def setUp(self):
        self.user = User.objects.create(username="student1", email="student1@example.com", password="password123")
        self.challenge = Challenge.objects.create(name="FizzBuzz", description="desc", created_by=self.user)

    def test_can_create_submission_with_minimal_data(self):
        zip_file = SimpleUploadedFile("solution.zip", b"dummy content")
        submission = Submission.objects.create(
            challenge=self.challenge,
            user=self.user,
            zip_file=zip_file
        )
        self.assertIsNotNone(submission.id)
        self.assertEqual(submission.challenge, self.challenge)
        self.assertEqual(submission.user, self.user)

    def test_required_fields_validation(self):
        submission = Submission()
        with self.assertRaises(Exception):
            submission.full_clean()
