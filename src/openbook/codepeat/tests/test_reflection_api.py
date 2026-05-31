from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from openbook_auth.models import User
from ..models.challenge import Challenge
from ..models.submission import Submission
from ..models.reflection import Reflection

class Reflection_ViewSet_Tests(TestCase):
    """Tests for the ReflectionViewSet REST API."""

    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(username="student2", email="student2@example.com", password="pass")
        self.challenge = Challenge.objects.create(title="FizzBuzz", description="desc", created_by=self.user)
        self.submission = Submission.objects.create(challenge=self.challenge, user=self.user, zip_file=None)
        self.client.login(username="student2", password="pass")
        self.list_url = reverse("reflection-list")

    def test_list_ok(self):
        Reflection.objects.create(submission=self.submission, answers={"q1": "a1"})
        response = self.client.get(self.list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(response.data), 1)

    def test_create_ok(self):
        data = {"submission": self.submission.id, "answers": {"q1": "a1"}}
        response = self.client.post(self.list_url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_create_forbidden(self):
        self.client.logout()
        data = {"submission": self.submission.id, "answers": {"q1": "a1"}}
        response = self.client.post(self.list_url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
