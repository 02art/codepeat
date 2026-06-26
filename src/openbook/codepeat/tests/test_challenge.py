from django.test                                import TestCase
from django.core.exceptions                     import ValidationError
from openbook.auth.middleware.current_user      import reset_current_user
from openbook.test                              import ModelViewSetTestMixin
from openbook.auth.models                       import User
from ..models.challenge                         import Challenge

class Challenge_Model_Tests(TestCase):
    def setUp(self):
        reset_current_user()
        self.user = User.objects.create_user(username="lecturer1", email="lecturer1@example.com", password="pass")

    def test_can_create_challenge_with_minimal_data(self):
        challenge = Challenge.objects.create(name="FizzBuzz", description="Write FizzBuzz.", created_by=self.user)
        self.assertIsNotNone(challenge.id)
        self.assertEqual(challenge.difficulty, Challenge.DifficultyChoices.EASY)
        self.assertEqual(challenge.visibility, Challenge.VisibilityChoices.PUBLIC)
        self.assertEqual(challenge.type, Challenge.TypeChoices.SOLO)

    def test_required_fields_validation(self):
        challenge = Challenge(created_by=self.user)
        with self.assertRaises(ValidationError):
            challenge.full_clean()

    def test_invalid_choice_fields(self):
        challenge = Challenge(name="FizzBuzz", description="desc", created_by=self.user, difficulty="invalid")
        with self.assertRaises(ValidationError):
            challenge.full_clean()

class Challenge_Test_Mixin:
    def setUp(self):
        super().setUp()
        reset_current_user()
        self.user = User.objects.create_user(username="lecturer1", email="lecturer1@example.com", password="pass")
        self.challenge = Challenge.objects.create(name="FizzBuzz", description="desc", created_by=self.user)

class Challenge_ViewSet_Tests(ModelViewSetTestMixin, Challenge_Test_Mixin, TestCase):
    base_name     = "challenge"
    model         = Challenge
    search_string = "FizzBuzz"
    search_count  = 1
    sort_field    = "name"

    operations = {
        "list":           {"requires_auth": True},
        "retrieve":       {"requires_auth": True},
        "create":         {"requires_auth": True, "request_data": {"name": "New", "description": "desc"}},
        "update":         {"supported": False},
        "partial_update": {"supported": False},
        "destroy":        {"supported": False},
    }

    def pk_found(self):
        return self.challenge.pk
