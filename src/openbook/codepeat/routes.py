from .viewsets.challenge         import ChallengeViewSet
from .viewsets.submission        import SubmissionViewSet
from .viewsets.reflection        import ReflectionViewSet
from .viewsets.reflection_question import ReflectionQuestionViewSet
from .viewsets.test_result       import TestResultViewSet
from .viewsets.feedback          import FeedbackViewSet
from .viewsets.account           import AccountViewSet
from .viewsets.legal_document    import LegalDocumentViewSet


def register_api_routes(router, prefix):
    router.register(f"{prefix}/challenges",          ChallengeViewSet,          basename="challenge")
    router.register(f"{prefix}/submissions",         SubmissionViewSet,         basename="submission")
    router.register(f"{prefix}/reflections",         ReflectionViewSet,         basename="reflection")
    router.register(f"{prefix}/reflection-questions", ReflectionQuestionViewSet, basename="reflectionquestion")
    router.register(f"{prefix}/test-results",        TestResultViewSet,         basename="testresult")
    router.register(f"{prefix}/feedbacks",           FeedbackViewSet,           basename="feedback")
    router.register(f"{prefix}/account",             AccountViewSet,            basename="codepeat-account")
    router.register(f"{prefix}/legal-documents",     LegalDocumentViewSet,      basename="legaldocument")
