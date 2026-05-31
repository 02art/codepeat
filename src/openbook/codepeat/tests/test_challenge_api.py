from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from openbook_auth.models import User
from ..models.challenge import Challenge

class Challenge_ViewSet_Tests(TestCase):
    """Tests for the ChallengeViewSet REST API."""

    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(username="lecturer1", email="lecturer1@example.com", password="pass")
        self.client.login(username="lecturer1", password="pass")
        self.list_url = reverse("challenge-list")

    def test_list_ok(self):
        Challenge.objects.create(title="FizzBuzz", description="desc", created_by=self.user)
        response = self.client.get(self.list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(response.data), 1)

    def test_create_ok(self):
        data = {"title": "FizzBuzz", "description": "desc", "created_by": self.user.id}
        response = self.client.post(self.list_url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["title"], "FizzBuzz")

    def test_create_forbidden(self):
        self.client.logout()
        data = {"title": "FizzBuzz", "description": "desc", "created_by": self.user.id}
        response = self.client.post(self.list_url, data)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
