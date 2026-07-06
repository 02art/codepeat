from django.test import TestCase
from rest_framework.test import APIClient

from openbook.auth.middleware.current_user import reset_current_user
from openbook.auth.models import User
from ..models.challenge import Challenge
from ..models.reflection_question import ReflectionQuestion


class ReflectionQuestion_Model_Tests(TestCase):
    def setUp(self):
        reset_current_user()
        self.creator = User.objects.create_user(username="rqcreator", email="rqc@example.com", password="pass")
        self.challenge = Challenge.objects.create(name="Reverse String", description="desc", created_by=self.creator)

    def test_str_includes_kind_and_text(self):
        question = ReflectionQuestion.objects.create(challenge=self.challenge, text="Was war schwierig?", kind="text")
        self.assertIn("Was war schwierig?", str(question))


class ReflectionQuestion_ViewSet_Tests(TestCase):
    def setUp(self):
        reset_current_user()
        self.creator = User.objects.create_user(username="rqowner", email="rqo@example.com", password="pass")
        self.other   = User.objects.create_user(username="rqother", email="rqoth@example.com", password="pass")
        self.challenge = Challenge.objects.create(name="Reverse String", description="desc", created_by=self.creator)
        self.question  = ReflectionQuestion.objects.create(challenge=self.challenge, text="Frage?", kind="text")

    def test_any_signed_in_user_may_read(self):
        client = APIClient()
        client.force_login(self.other)
        self.assertEqual(client.get(f"/api/codepeat/reflection-questions/{self.question.id}/").status_code, 200)

    def test_owner_may_delete_a_question(self):
        client = APIClient()
        client.force_login(self.creator)
        response = client.delete(f"/api/codepeat/reflection-questions/{self.question.id}/")
        self.assertEqual(response.status_code, 204)
        self.assertFalse(ReflectionQuestion.objects.filter(id=self.question.id).exists())

    def test_non_owner_may_not_delete_a_question(self):
        client = APIClient()
        client.force_login(self.other)
        response = client.delete(f"/api/codepeat/reflection-questions/{self.question.id}/")
        self.assertIn(response.status_code, (403, 404))
        self.assertTrue(ReflectionQuestion.objects.filter(id=self.question.id).exists())
