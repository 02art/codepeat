from django.test import TestCase
from openbook.auth.models import User
from ..models.challenge import Challenge
from ..models.submission import Submission
from ..models.feedback import Feedback

class Feedback_Model_Tests(TestCase):
    """Tests for the Feedback model."""

    def setUp(self):
        self.lecturer = User.objects.create(username="lecturer2", email="lecturer2@example.com", password="password123")
        self.student = User.objects.create(username="student4", email="student4@example.com", password="password123")
        self.challenge = Challenge.objects.create(
            name="FizzBuzz",
            description="desc",
            created_by=self.lecturer
        )
        self.submission = Submission.objects.create(
            challenge=self.challenge,
            user=self.student,
            zip_file=""
        )

    def test_can_create_feedback_with_minimal_data(self):
        feedback = Feedback.objects.create(
            submission=self.submission,
            lecturer=self.lecturer,
            comments="Good job!",
            rating=5
        )
        self.assertIsNotNone(feedback.id)
        self.assertEqual(feedback.submission, self.submission)
        self.assertEqual(feedback.lecturer, self.lecturer)
        self.assertEqual(feedback.rating, 5)

    def test_required_fields_validation(self):
        feedback = Feedback()
        with self.assertRaises(Exception):
            feedback.full_clean()
