from django.test import TestCase
from openbook.auth.models import User
from ..models.challenge import Challenge
from ..models.submission import Submission
from ..models.reflection import Reflection

class Reflection_Model_Tests(TestCase):
    """Tests for the Reflection model."""

    def setUp(self):
        self.user = User.objects.create(username="student2", email="student2@example.com", password="password123")
        self.challenge = Challenge.objects.create(name="FizzBuzz", description="desc", created_by=self.user)
        self.submission = Submission.objects.create(
            challenge=self.challenge,
            user=self.user,
            zip_file=""
        )

    def test_can_create_reflection_with_minimal_data(self):
        answers = {"q1": "answer1"}
        reflection = Reflection.objects.create(submission=self.submission, answers=answers)
        self.assertIsNotNone(reflection.id)
        self.assertEqual(reflection.submission, self.submission)
        self.assertEqual(reflection.answers, answers)

    def test_required_fields_validation(self):
        reflection = Reflection()
        with self.assertRaises(Exception):
            reflection.full_clean()
