from django.test import TestCase
from django.core.files.uploadedfile import SimpleUploadedFile
from openbook.auth.middleware.current_user import reset_current_user
from openbook.test import ModelViewSetTestMixin
from openbook.auth.models import User
from ..models.challenge import Challenge
from ..models.submission import Submission

class Submission_Model_Tests(TestCase):
    def setUp(self):
        reset_current_user()
        self.user      = User.objects.create_user(username="student1", email="student1@example.com", password="pass")
        self.challenge = Challenge.objects.create(name="FizzBuzz", description="desc", created_by=self.user)

    def test_can_create_submission_with_minimal_data(self):
        zip_file   = SimpleUploadedFile("solution.zip", b"dummy content")
        submission = Submission.objects.create(challenge=self.challenge, user=self.user, zip_file=zip_file)
        self.assertIsNotNone(submission.id)
        self.assertEqual(submission.challenge, self.challenge)
        self.assertEqual(submission.user, self.user)

    def test_required_fields_validation(self):
        submission = Submission()
        with self.assertRaises(Exception):
            submission.full_clean()

class Submission_Test_Mixin:
    def setUp(self):
        super().setUp()
        reset_current_user()
        self.user       = User.objects.create_user(username="student1", email="student1@example.com", password="pass")
        self.challenge  = Challenge.objects.create(name="FizzBuzz", description="desc", created_by=self.user)
        self.submission = Submission.objects.create(challenge=self.challenge, user=self.user, zip_file="")

class Submission_ViewSet_Tests(ModelViewSetTestMixin, Submission_Test_Mixin, TestCase):
    base_name  = "submission"
    model      = Submission
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
        return self.submission.pk
