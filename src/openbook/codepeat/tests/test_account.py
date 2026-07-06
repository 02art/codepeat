from django.test import TestCase
from django.core import mail, signing
from rest_framework.test import APIClient

from openbook.auth.middleware.current_user import reset_current_user
from openbook.auth.models import User
from ..models.account_deletion_request import AccountDeletionRequest
from ..models.password_change_request import PasswordChangeRequest
from ..models.user_avatar import UserAvatar
from ..viewsets.account import DELETION_SALT, PASSWORD_CHANGE_SALT


class Account_ViewSet_Tests(TestCase):
    def setUp(self):
        reset_current_user()
        self.user = User.objects.create_user(username="acc1", email="acc1@example.com", password="OldPass1!")
        self.client = APIClient()
        self.client.force_login(self.user)

    # Progress

    def test_progress_requires_authentication(self):
        anon = APIClient()
        self.assertEqual(anon.get("/api/codepeat/account/progress/").status_code, 403)

    def test_progress_returns_level_snapshot(self):
        response = self.client.get("/api/codepeat/account/progress/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(set(response.json()), {"xp", "level", "xp_into_level", "xp_for_next_level"})

    # Avatar

    def test_avatar_defaults_to_null(self):
        response = self.client.get("/api/codepeat/account/avatar/")
        self.assertEqual(response.status_code, 200)
        self.assertIsNone(response.json()["avatar"])

    def test_set_avatar_stores_and_reads_back(self):
        response = self.client.post("/api/codepeat/account/set-avatar/", {"avatar": "PB/avatar-2.jpg"}, format="json")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["avatar"], "PB/avatar-2.jpg")
        self.assertEqual(self.client.get("/api/codepeat/account/avatar/").json()["avatar"], "PB/avatar-2.jpg")

    def test_set_avatar_rejects_paths_outside_the_pool(self):
        response = self.client.post("/api/codepeat/account/set-avatar/", {"avatar": "http://evil/x.jpg"}, format="json")
        self.assertEqual(response.status_code, 400)

    def test_set_avatar_null_clears_the_picture(self):
        UserAvatar.objects.create(user=self.user, avatar="PB/avatar-1.jpg")
        response = self.client.post("/api/codepeat/account/set-avatar/", {"avatar": None}, format="json")
        self.assertEqual(response.status_code, 200)
        self.assertFalse(UserAvatar.objects.filter(user=self.user).exists())

    # Account deletion

    def test_deletion_status_reflects_pending_request(self):
        self.assertFalse(self.client.get("/api/codepeat/account/deletion-status/").json()["pending"])
        AccountDeletionRequest.objects.create(user=self.user)
        self.assertTrue(self.client.get("/api/codepeat/account/deletion-status/").json()["pending"])

    def test_request_deletion_creates_request_and_sends_email(self):
        response = self.client.post("/api/codepeat/account/request-deletion/")
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.json()["pending"])
        self.assertEqual(AccountDeletionRequest.objects.filter(user=self.user).count(), 1)
        self.assertEqual(len(mail.outbox), 1)

    def test_request_deletion_rotates_the_pending_request(self):
        self.client.post("/api/codepeat/account/request-deletion/")
        first = AccountDeletionRequest.objects.get(user=self.user)
        self.client.post("/api/codepeat/account/request-deletion/")
        self.assertFalse(AccountDeletionRequest.objects.filter(id=first.id).exists())
        self.assertEqual(AccountDeletionRequest.objects.filter(user=self.user).count(), 1)

    def test_cancel_deletion_removes_the_request(self):
        AccountDeletionRequest.objects.create(user=self.user)
        response = self.client.post("/api/codepeat/account/cancel-deletion/")
        self.assertEqual(response.status_code, 200)
        self.assertFalse(AccountDeletionRequest.objects.filter(user=self.user).exists())

    def test_confirm_deletion_removes_the_account(self):
        request = AccountDeletionRequest.objects.create(user=self.user)
        token = signing.dumps(str(request.id), salt=DELETION_SALT)
        response = APIClient().post("/api/codepeat/account/confirm-deletion/", {"token": token}, format="json")
        self.assertEqual(response.status_code, 200)
        self.assertFalse(User.objects.filter(id=self.user.id).exists())

    def test_confirm_deletion_rejects_a_bad_token(self):
        response = APIClient().post("/api/codepeat/account/confirm-deletion/", {"token": "garbage"}, format="json")
        self.assertEqual(response.status_code, 400)

    def test_confirm_deletion_rejects_an_already_cancelled_request(self):
        request = AccountDeletionRequest.objects.create(user=self.user)
        token = signing.dumps(str(request.id), salt=DELETION_SALT)
        request.delete()
        response = APIClient().post("/api/codepeat/account/confirm-deletion/", {"token": token}, format="json")
        self.assertEqual(response.status_code, 400)

    # Password change

    def test_request_password_change_rejects_wrong_current_password(self):
        response = self.client.post("/api/codepeat/account/request-password-change/",
                                    {"current_password": "WRONG", "new_password": "BrandNew1!"}, format="json")
        self.assertEqual(response.status_code, 400)
        self.assertFalse(PasswordChangeRequest.objects.filter(user=self.user).exists())

    def test_request_password_change_rejects_weak_new_password(self):
        response = self.client.post("/api/codepeat/account/request-password-change/",
                                    {"current_password": "OldPass1!", "new_password": "123"}, format="json")
        self.assertEqual(response.status_code, 400)

    def test_request_password_change_stages_and_emails(self):
        response = self.client.post("/api/codepeat/account/request-password-change/",
                                    {"current_password": "OldPass1!", "new_password": "BrandNew1!"}, format="json")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(PasswordChangeRequest.objects.filter(user=self.user).count(), 1)
        self.assertEqual(len(mail.outbox), 1)

    def test_confirm_password_change_applies_the_staged_password(self):
        self.client.post("/api/codepeat/account/request-password-change/",
                         {"current_password": "OldPass1!", "new_password": "BrandNew1!"}, format="json")
        request = PasswordChangeRequest.objects.get(user=self.user)
        token = signing.dumps(str(request.id), salt=PASSWORD_CHANGE_SALT)
        response = APIClient().post("/api/codepeat/account/confirm-password-change/", {"token": token}, format="json")
        self.assertEqual(response.status_code, 200)
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password("BrandNew1!"))
        self.assertFalse(PasswordChangeRequest.objects.filter(user=self.user).exists())

    def test_confirm_password_change_rejects_a_bad_token(self):
        response = APIClient().post("/api/codepeat/account/confirm-password-change/", {"token": "garbage"}, format="json")
        self.assertEqual(response.status_code, 400)

    def test_confirm_password_change_rejects_a_consumed_request(self):
        token = signing.dumps("00000000-0000-4000-8000-000000000000", salt=PASSWORD_CHANGE_SALT)
        response = APIClient().post("/api/codepeat/account/confirm-password-change/", {"token": token}, format="json")
        self.assertEqual(response.status_code, 400)
