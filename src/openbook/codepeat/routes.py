from rest_framework.routers import DefaultRouter
from .viewsets.challenge import ChallengeViewSet
from .viewsets.submission import SubmissionViewSet
from .viewsets.reflection import ReflectionViewSet
from .viewsets.test_result import TestResultViewSet
from .viewsets.feedback import FeedbackViewSet

router = DefaultRouter()
router.register(r'challenges', ChallengeViewSet, basename='challenge')
router.register(r'submissions', SubmissionViewSet, basename='submission')
router.register(r'reflections', ReflectionViewSet, basename='reflection')
router.register(r'test-results', TestResultViewSet, basename='testresult')
router.register(r'feedbacks', FeedbackViewSet, basename='feedback')

api_urlpatterns = router.urls
