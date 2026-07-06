import json

from django.test import TestCase
from openbook.auth.middleware.current_user import reset_current_user
from openbook.test import ModelViewSetTestMixin
from openbook.auth.models import User
from ..models.challenge import Challenge
from ..models.submission import Submission
from ..models.reflection import Reflection

class Reflection_Model_Tests(TestCase):
    def setUp(self):
        reset_current_user()
        self.user       = User.objects.create_user(username="student2", email="student2@example.com", password="pass")
        self.challenge  = Challenge.objects.create(name="FizzBuzz", description="desc", created_by=self.user)
        self.submission = Submission.objects.create(challenge=self.challenge, user=self.user, zip_file="")

    def test_can_create_reflection_with_minimal_data(self):
        answers    = {"q1": "answer1"}
        reflection = Reflection.objects.create(submission=self.submission, answers=answers)
        self.assertIsNotNone(reflection.id)
        self.assertEqual(reflection.submission, self.submission)
        self.assertEqual(reflection.answers, answers)

    def test_required_fields_validation(self):
        reflection = Reflection()
        with self.assertRaises(Exception):
            reflection.full_clean()

class Reflection_Test_Mixin:
    def setUp(self):
        super().setUp()
        reset_current_user()
        self.user       = User.objects.create_user(username="student2", email="student2@example.com", password="pass")
        self.challenge  = Challenge.objects.create(name="FizzBuzz", description="desc", created_by=self.user)
        self.submission = Submission.objects.create(challenge=self.challenge, user=self.user, zip_file="")
        self.reflection = Reflection.objects.create(submission=self.submission, answers={"q1": "answer1"})
        # A second submission (reflection is one-to-one) for the create test to attach to.
        self.other_submission = Submission.objects.create(challenge=self.challenge, user=self.user, zip_file="")

class Reflection_ViewSet_Tests(ModelViewSetTestMixin, Reflection_Test_Mixin, TestCase):
    base_name  = "reflection"
    model      = Reflection
    sort_field = ""

    operations = {
        "list":           {"requires_auth": True},
        "retrieve":       {"requires_auth": True},
        # Reflections may only be written for one's own submission; the mixin acts as student2,
        # the owner of other_submission.
        # Create needs no model permission (any signed-in user may reflect on their OWN submission,
        # enforced in the serializer); the mixin acts as student2, the owner of other_submission.
        "create":         {"username": "student2", "password": "pass", "model_permission": (),
                           "content_type": "application/json",
                           "request_data": lambda self: json.dumps({
                               "submission": str(self.other_submission.pk),
                               "answers": {"q1": "a"},
                           })},
        "update":         {"supported": False},
        "partial_update": {"supported": False},
        "destroy":        {"supported": False},
    }

    def pk_found(self):
        return self.reflection.pk
