from django.test import TestCase
from openbook.auth.models import User
from ..models.challenge import Challenge
from ..models.submission import Submission
from ..models.test_result import TestResult

class TestResult_Model_Tests(TestCase):
    """Tests for the TestResult model."""

    def setUp(self):
        self.user = User.objects.create(username="student3", email="student3@example.com", password="password123")
        self.challenge = Challenge.objects.create(name="FizzBuzz", description="desc", created_by=self.user)
        self.submission = Submission.objects.create(
            challenge=self.challenge,
            user=self.user,
            zip_file=""
        )

    def test_can_create_test_result_with_minimal_data(self):
        test_result = TestResult.objects.create(
            submission=self.submission,
            status="passed",
            output="All tests passed."
        )
        self.assertIsNotNone(test_result.id)
        self.assertEqual(test_result.submission, self.submission)
        self.assertEqual(test_result.status, "passed")

    def test_required_fields_validation(self):
        test_result = TestResult()
        with self.assertRaises(Exception):
            test_result.full_clean()
