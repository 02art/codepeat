from django.test import TestCase
from django.core.exceptions import ValidationError
from openbook.auth.models import User
from ..models.challenge import Challenge

class Challenge_Model_Tests(TestCase):
    """Tests for the Challenge model."""

    def setUp(self):
        self.user = User.objects.create(username="lecturer1", email="lecturer1@example.com") # password create?

    def test_can_create_challenge_with_minimal_data(self):
        challenge = Challenge.objects.create(
            name="FizzBuzz",
            description="Write FizzBuzz.",
            created_by=self.user
        )
        self.assertIsNotNone(challenge.id)
        self.assertEqual(challenge.difficulty, Challenge.DifficultyChoices.EASY)
        self.assertEqual(challenge.visibility, Challenge.VisibilityChoices.PUBLIC)
        self.assertEqual(challenge.type, Challenge.TypeChoices.SOLO)

    def test_required_fields_validation(self):
        challenge = Challenge(created_by=self.user)
        with self.assertRaises(ValidationError):
            challenge.full_clean()

    def test_invalid_choice_fields(self):
        challenge = Challenge(
            name="FizzBuzz",
            description="desc",
            created_by=self.user,
            difficulty="invalid"
        )
        with self.assertRaises(ValidationError):
            challenge.full_clean()
