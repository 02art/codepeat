from django.test                                import TestCase
from django.core                                import signing
from django.core.exceptions                     import ValidationError
from rest_framework.test                         import APIClient
from openbook.auth.middleware.current_user      import reset_current_user
from openbook.test                              import ModelViewSetTestMixin
from openbook.auth.models                       import User
from ..models.challenge                         import Challenge
from ..models.challenge_access                  import ChallengeAccess
from ..models.challenge_favorite                import ChallengeFavorite
from ..models.submission                        import Submission
from ..viewsets.challenge                        import INVITE_SALT

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
        # Challenges are a public catalogue: list/retrieve are open to everyone, with no
        # view permission required (so the queryset is not object-permission filtered).
        "list":           {"requires_auth": False, "model_permission": ()},
        "retrieve":       {"requires_auth": False, "model_permission": ()},
        "create":         {"requires_auth": True, "request_data": {"name": "New", "description": "desc"}},
        # Writes are restricted to the challenge's creator (or staff); the mixin acts as lecturer1,
        # who owns self.challenge, so the creator object-permission is satisfied.
        "update":         {"username": "lecturer1", "password": "pass",
                           "request_data": {"name": "FizzBuzz Updated", "description": "updated desc"},
                           "updates": {"name": "FizzBuzz Updated"}},
        "partial_update": {"username": "lecturer1", "password": "pass",
                           "request_data": {"description": "patched desc"},
                           "updates": {"description": "patched desc"}},
        "destroy":        {"username": "lecturer1", "password": "pass"},
    }

    def pk_found(self):
        return self.challenge.pk


class Challenge_Flow_Tests(TestCase):
    """Per-user overview state (solved/favorited) and the private-challenge invite flow."""

    def setUp(self):
        reset_current_user()
        self.creator = User.objects.create_user(username="flowcreator", email="fc@example.com", password="pass")
        self.user    = User.objects.create_user(username="flowuser", email="fu@example.com", password="pass")
        self.challenge = Challenge.objects.create(name="Two Sum", description="desc", created_by=self.creator)
        self.client = APIClient()
        self.client.force_login(self.user)

    def _fetch(self, client, challenge_id):
        results = client.get("/api/codepeat/challenges/?page_size=100").json()["results"]
        return next(row for row in results if row["id"] == str(challenge_id))

    def test_favorite_toggle_persists_and_shows_in_the_list(self):
        row = self._fetch(self.client, self.challenge.id)
        self.assertFalse(row["is_favorited"])

        added = self.client.post(f"/api/codepeat/challenges/{self.challenge.id}/favorite/")
        self.assertEqual(added.status_code, 200)
        self.assertTrue(added.json()["favorited"])
        self.assertTrue(ChallengeFavorite.objects.filter(challenge=self.challenge, user=self.user).exists())
        self.assertTrue(self._fetch(self.client, self.challenge.id)["is_favorited"])

        removed = self.client.delete(f"/api/codepeat/challenges/{self.challenge.id}/favorite/")
        self.assertEqual(removed.status_code, 200)
        self.assertFalse(removed.json()["favorited"])
        self.assertFalse(ChallengeFavorite.objects.filter(challenge=self.challenge, user=self.user).exists())

    def test_favorite_requires_authentication(self):
        self.assertEqual(APIClient().post(f"/api/codepeat/challenges/{self.challenge.id}/favorite/").status_code, 403)

    def test_is_solved_reflects_an_accepted_submission(self):
        self.assertFalse(self._fetch(self.client, self.challenge.id)["is_solved"])
        Submission.objects.create(challenge=self.challenge, user=self.user,
                                  status=Submission.StatusChoices.ACCEPTED, zip_file="")
        self.assertTrue(self._fetch(self.client, self.challenge.id)["is_solved"])

    def test_pending_submission_does_not_count_as_solved(self):
        Submission.objects.create(challenge=self.challenge, user=self.user,
                                  status=Submission.StatusChoices.PENDING, zip_file="")
        self.assertFalse(self._fetch(self.client, self.challenge.id)["is_solved"])

    def test_anonymous_state_is_always_false(self):
        row = self._fetch(APIClient(), self.challenge.id)
        self.assertFalse(row["is_solved"])
        self.assertFalse(row["is_favorited"])

    def test_invite_link_only_for_private_challenges(self):
        staff = User.objects.create_user(username="flowstaff", email="fs@example.com", password="pass", is_staff=True, is_superuser=True)
        private = Challenge.objects.create(name="Secret", description="desc", created_by=staff,
                                           visibility=Challenge.VisibilityChoices.PRIVATE)
        client = APIClient()
        client.force_login(staff)

        ok = client.post(f"/api/codepeat/challenges/{private.id}/invite-link/")
        self.assertEqual(ok.status_code, 200)
        self.assertIn("url", ok.json())
        self.assertGreater(ok.json()["expires_in"], 0)

        rejected = client.post(f"/api/codepeat/challenges/{self.challenge.id}/invite-link/")
        self.assertEqual(rejected.status_code, 400)

    def test_unlock_grants_permanent_access(self):
        private = Challenge.objects.create(name="Gated", description="desc", created_by=self.creator,
                                           visibility=Challenge.VisibilityChoices.PRIVATE)
        token = signing.dumps(str(private.id), salt=INVITE_SALT)

        response = self.client.post("/api/codepeat/challenges/unlock/", {"token": token}, format="json")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["challenge"], str(private.id))
        self.assertTrue(ChallengeAccess.objects.filter(challenge=private, user=self.user).exists())

    def test_unlock_rejects_an_invalid_token(self):
        response = self.client.post("/api/codepeat/challenges/unlock/", {"token": "garbage"}, format="json")
        self.assertEqual(response.status_code, 400)
