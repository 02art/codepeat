from django.test import TestCase
from django.core.exceptions import ValidationError
from openbook.auth.middleware.current_user import reset_current_user
from openbook.test import ModelViewSetTestMixin
from openbook.auth.models import User
from ..models.challenge import Challenge
from ..models.submission import Submission
from ..models.feedback import Feedback

class Feedback_Model_Tests(TestCase):
    def setUp(self):
        reset_current_user()
        self.lecturer = User.objects.create_user(username="lecturer2", email="lecturer2@example.com", password="pass")
        self.student  = User.objects.create_user(username="student4",  email="student4@example.com",  password="pass")
        self.challenge = Challenge.objects.create(name="FizzBuzz", description="desc", created_by=self.lecturer)
        self.submission = Submission.objects.create(challenge=self.challenge, user=self.student, zip_file="")

    def test_can_create_feedback_with_minimal_data(self):
        feedback = Feedback.objects.create(submission=self.submission, lecturer=self.lecturer, comments="Good job!", rating=5)
        self.assertIsNotNone(feedback.id)
        self.assertEqual(feedback.submission, self.submission)
        self.assertEqual(feedback.lecturer, self.lecturer)
        self.assertEqual(feedback.rating, 5)

    def test_required_fields_validation(self):
        feedback = Feedback()
        with self.assertRaises(Exception):
            feedback.full_clean()

class Feedback_Test_Mixin:
    def setUp(self):
        super().setUp()
        reset_current_user()
        self.lecturer   = User.objects.create_user(username="lecturer2", email="lecturer2@example.com", password="pass")
        self.student    = User.objects.create_user(username="student4",  email="student4@example.com",  password="pass")
        self.challenge  = Challenge.objects.create(name="FizzBuzz", description="desc", created_by=self.lecturer)
        self.submission = Submission.objects.create(challenge=self.challenge, user=self.student, zip_file="")
        self.feedback   = Feedback.objects.create(submission=self.submission, lecturer=self.lecturer, comments="Good job!", rating=5)

class Feedback_ViewSet_Tests(ModelViewSetTestMixin, Feedback_Test_Mixin, TestCase):
    base_name     = "feedback"
    model         = Feedback
    sort_field    = "rating"

    operations = {
        "list":           {"requires_auth": True},
        "retrieve":       {"requires_auth": True},
        "create":         {"supported": False},
        "update":         {"supported": False},
        "partial_update": {"supported": False},
        "destroy":        {"supported": False},
    }

    def pk_found(self):
        return self.feedback.pk
