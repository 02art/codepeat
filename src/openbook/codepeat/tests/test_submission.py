import tempfile

from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase, override_settings
from django.urls import reverse
from rest_framework.test import APIClient
from openbook.auth.middleware.current_user import reset_current_user
from openbook.auth.models import User
from ..models.challenge import Challenge
from ..models.reflection import Reflection
from ..models.submission import Submission
from ..xp import progress_for_user, xp_for_difficulty


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


@override_settings(MEDIA_ROOT=tempfile.mkdtemp())
class Submission_Flow_Tests(TestCase):
    """The grading inbox flow: upload, self-submit block, grading, XP release, scoping and deletion."""

    def setUp(self):
        reset_current_user()
        self.client = APIClient()
        self.teacher = User.objects.create_user(username="teacher1", email="t1@example.com", password="pass")
        self.student = User.objects.create_user(username="learner1", email="l1@example.com", password="pass")
        self.graded = Challenge.objects.create(name="Graded", description="d", difficulty="medium", created_by=self.teacher, requires_grading=True)
        self.ungraded = Challenge.objects.create(name="Ungraded", description="d", difficulty="easy", created_by=None, requires_grading=False)

    def _submit(self, user, challenge):
        self.client.force_login(user)
        zip_file = SimpleUploadedFile("solution.zip", b"PK\x03\x04 dummy", content_type="application/zip")
        return self.client.post(reverse("submission-list"), {"challenge": str(challenge.id), "zip_file": zip_file}, format="multipart")

    def _submission_for(self, user, challenge):
        response = self._submit(user, challenge)
        return Submission.objects.get(id=response.json()["id"])

    def test_student_uploads_zip(self):
        response = self._submit(self.student, self.graded)
        self.assertEqual(response.status_code, 201)
        submission = Submission.objects.get(id=response.json()["id"])
        self.assertEqual(submission.user, self.student)
        self.assertTrue(submission.zip_file.name.endswith(".zip"))
        self.assertEqual(submission.status, Submission.StatusChoices.PENDING)

    def test_cannot_submit_to_own_challenge(self):
        response = self._submit(self.teacher, self.graded)
        self.assertEqual(response.status_code, 400)

    def test_accept_sets_status_and_grants_xp(self):
        submission = self._submission_for(self.student, self.graded)
        self.assertEqual(progress_for_user(self.student)["xp"], 0)

        self.client.force_login(self.teacher)
        response = self.client.post(reverse("submission-grade", args=[submission.id]), {"decision": "accept", "comment": "Gut gemacht"}, format="json")

        self.assertEqual(response.status_code, 200)
        submission.refresh_from_db()
        self.assertEqual(submission.status, Submission.StatusChoices.ACCEPTED)
        self.assertEqual(submission.feedbacks.get().comments, "Gut gemacht")
        self.assertEqual(progress_for_user(self.student)["xp"], xp_for_difficulty("medium"))

    def test_reject_records_status_without_xp(self):
        submission = self._submission_for(self.student, self.graded)

        self.client.force_login(self.teacher)
        self.client.post(reverse("submission-grade", args=[submission.id]), {"decision": "reject"}, format="json")

        submission.refresh_from_db()
        self.assertEqual(submission.status, Submission.StatusChoices.REJECTED)
        self.assertEqual(progress_for_user(self.student)["xp"], 0)

    def test_only_challenge_creator_may_grade(self):
        submission = self._submission_for(self.student, self.graded)
        self.client.force_login(self.student)
        response = self.client.post(reverse("submission-grade", args=[submission.id]), {"decision": "accept"}, format="json")
        self.assertEqual(response.status_code, 403)

    def test_scope_separates_mine_from_to_grade(self):
        submission = self._submission_for(self.student, self.graded)

        self.client.force_login(self.student)
        mine = self.client.get(reverse("submission-list"), {"scope": "mine"}).json()["results"]
        self.assertEqual([s["id"] for s in mine], [str(submission.id)])

        self.client.force_login(self.teacher)
        to_grade = self.client.get(reverse("submission-list"), {"scope": "to_grade"}).json()["results"]
        self.assertEqual([s["id"] for s in to_grade], [str(submission.id)])
        self.assertEqual(self.client.get(reverse("submission-list"), {"scope": "mine"}).json()["results"], [])

    def test_student_delete_hides_until_graded(self):
        submission = self._submission_for(self.student, self.graded)

        self.client.force_login(self.student)
        self.client.delete(reverse("submission-detail", args=[submission.id]))
        submission.refresh_from_db()
        self.assertTrue(submission.hidden_from_student)
        self.assertEqual(self.client.get(reverse("submission-list"), {"scope": "mine"}).json()["results"], [])

        self.client.force_login(self.teacher)
        self.client.post(reverse("submission-grade", args=[submission.id]), {"decision": "accept"}, format="json")
        submission.refresh_from_db()
        self.assertFalse(submission.hidden_from_student)

    def test_lecturer_delete_rejects_submission(self):
        submission = self._submission_for(self.student, self.graded)
        self.client.force_login(self.teacher)
        self.client.delete(reverse("submission-detail", args=[submission.id]))
        submission.refresh_from_db()
        self.assertEqual(submission.status, Submission.StatusChoices.REJECTED)

    def test_xp_outcome_reflects_challenge_and_history(self):
        ungraded = self._submission_for(self.student, self.ungraded)
        self.client.force_login(self.student)
        outcome = self.client.get(reverse("submission-detail", args=[ungraded.id])).json()["xp_outcome"]
        self.assertEqual(outcome, "none")

        pending = self._submission_for(self.student, self.graded)
        outcome = self.client.get(reverse("submission-detail", args=[pending.id])).json()["xp_outcome"]
        self.assertEqual(outcome, "pending")

        self.client.force_login(self.teacher)
        self.client.post(reverse("submission-grade", args=[pending.id]), {"decision": "accept"}, format="json")
        retry = self._submission_for(self.student, self.graded)
        self.client.force_login(self.student)
        outcome = self.client.get(reverse("submission-detail", args=[retry.id])).json()["xp_outcome"]
        self.assertEqual(outcome, "already")

    def test_reflection_answers_are_persisted_and_readable(self):
        submission = self._submission_for(self.student, self.graded)
        Reflection.objects.create(submission=submission, answers=[{"question": "Warum?", "kind": "text", "answer": "Weil."}])

        self.client.force_login(self.teacher)
        data = self.client.get(reverse("submission-detail", args=[submission.id])).json()
        self.assertEqual(data["reflection_answers"][0]["answer"], "Weil.")
