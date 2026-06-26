from django.test import TestCase
from openbook.auth.middleware.current_user import reset_current_user
from openbook.test import ModelViewSetTestMixin
from openbook.auth.models import User
from ..models.challenge import Challenge
from ..models.submission import Submission
from ..models.test_result import TestResult

class TestResult_Model_Tests(TestCase):
    def setUp(self):
        reset_current_user()
        self.user       = User.objects.create_user(username="student3", email="student3@example.com", password="pass")
        self.challenge  = Challenge.objects.create(name="FizzBuzz", description="desc", created_by=self.user)
        self.submission = Submission.objects.create(challenge=self.challenge, user=self.user, zip_file="")

    def test_can_create_test_result_with_minimal_data(self):
        test_result = TestResult.objects.create(submission=self.submission, status="passed", output="All tests passed.")
        self.assertIsNotNone(test_result.id)
        self.assertEqual(test_result.submission, self.submission)
        self.assertEqual(test_result.status, "passed")

    def test_required_fields_validation(self):
        test_result = TestResult()
        with self.assertRaises(Exception):
            test_result.full_clean()

class TestResult_Test_Mixin:
    def setUp(self):
        super().setUp()
        reset_current_user()
        self.user        = User.objects.create_user(username="student3", email="student3@example.com", password="pass")
        self.challenge   = Challenge.objects.create(name="FizzBuzz", description="desc", created_by=self.user)
        self.submission  = Submission.objects.create(challenge=self.challenge, user=self.user, zip_file="")
        self.test_result = TestResult.objects.create(submission=self.submission, status="passed", output="All tests passed.")

class TestResult_ViewSet_Tests(ModelViewSetTestMixin, TestResult_Test_Mixin, TestCase):
    base_name  = "testresult"
    model      = TestResult
    sort_field = ""

    operations = {
        "list":           {"requires_auth": True},
        "retrieve":       {"requires_auth": True},
        "create":         {"supported": False},
        "update":         {"supported": False},
        "partial_update": {"supported": False},
        "destroy":        {"supported": False},
    }

    def pk_found(self):
        return self.test_result.pk
