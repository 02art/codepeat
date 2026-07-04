from rest_framework.routers import DefaultRouter
from .viewsets.challenge import ChallengeViewSet
from .viewsets.submission import SubmissionViewSet
from .viewsets.reflection import ReflectionViewSet
from .viewsets.reflection_question import ReflectionQuestionViewSet
from .viewsets.test_result import TestResultViewSet
from .viewsets.feedback import FeedbackViewSet
from .viewsets.account import AccountViewSet
from .viewsets.legal_document import LegalDocumentViewSet

def register_api_routes(router, prefix):
    router.register(rf'{prefix}/challenges', ChallengeViewSet, basename='challenge')
    router.register(rf'{prefix}/submissions', SubmissionViewSet, basename='submission')
    router.register(rf'{prefix}/reflections', ReflectionViewSet, basename='reflection')
    router.register(rf'{prefix}/reflection-questions', ReflectionQuestionViewSet, basename='reflectionquestion')
    router.register(rf'{prefix}/test-results', TestResultViewSet, basename='testresult')
    router.register(rf'{prefix}/feedbacks', FeedbackViewSet, basename='feedback')
    router.register(rf'{prefix}/account', AccountViewSet, basename='codepeat-account')
    router.register(rf'{prefix}/legal-documents', LegalDocumentViewSet, basename='legaldocument')
