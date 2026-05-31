from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from django.core.files.uploadedfile import SimpleUploadedFile
from openbook_auth.models import User
from ..models.challenge import Challenge
from ..models.submission import Submission

class Submission_ViewSet_Tests(TestCase):
    """Tests for the SubmissionViewSet REST API."""

    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(username="student1", email="student1@example.com", password="pass")
        self.challenge = Challenge.objects.create(title="FizzBuzz", description="desc", created_by=self.user)
        self.client.login(username="student1", password="pass")
        self.list_url = reverse("submission-list")

    def test_list_ok(self):
        Submission.objects.create(challenge=self.challenge, user=self.user, zip_file=SimpleUploadedFile("solution.zip", b"dummy"))
        response = self.client.get(self.list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(response.data), 1)

    def test_create_ok(self):
        zip_file = SimpleUploadedFile("solution.zip", b"dummy content")
        data = {"challenge": self.challenge.id, "user": self.user.id, "zip_file": zip_file}
        response = self.client.post(self.list_url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_create_forbidden(self):
        self.client.logout()
        zip_file = SimpleUploadedFile("solution.zip", b"dummy content")
        data = {"challenge": self.challenge.id, "user": self.user.id, "zip_file": zip_file}
        response = self.client.post(self.list_url, data)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
