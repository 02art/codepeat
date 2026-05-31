from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from openbook_auth.models import User
from ..models.challenge import Challenge
from ..models.submission import Submission
from ..models.feedback import Feedback

class Feedback_ViewSet_Tests(TestCase):
    """Tests for the FeedbackViewSet REST API."""

    def setUp(self):
        self.client = APIClient()
        self.lecturer = User.objects.create_user(username="lecturer2", email="lecturer2@example.com", password="pass")
        self.student = User.objects.create_user(username="student4", email="student4@example.com", password="pass")
        self.challenge = Challenge.objects.create(title="FizzBuzz", description="desc", created_by=self.lecturer)
        self.submission = Submission.objects.create(challenge=self.challenge, user=self.student, zip_file=None)
        self.client.login(username="lecturer2", password="pass")
        self.list_url = reverse("feedback-list")

    def test_list_ok(self):
        Feedback.objects.create(submission=self.submission, lecturer=self.lecturer, comments="Good", rating=5)
        response = self.client.get(self.list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(response.data), 1)

    def test_create_ok(self):
        data = {"submission": self.submission.id, "lecturer": self.lecturer.id, "comments": "Well done", "rating": 5}
        response = self.client.post(self.list_url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_create_forbidden(self):
        self.client.logout()
        data = {"submission": self.submission.id, "lecturer": self.lecturer.id, "comments": "Well done", "rating": 5}
        response = self.client.post(self.list_url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
