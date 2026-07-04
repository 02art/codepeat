from django.contrib import admin
from .challenge import ChallengeAdmin
from .submission import SubmissionAdmin
from .reflection import ReflectionAdmin
from .test_result import TestResultAdmin
from .feedback import FeedbackAdmin
from .legal_document import LegalDocumentAdmin
from ..models import Challenge, Submission, Reflection, TestResult, Feedback, LegalDocument

admin.site.register(Challenge, ChallengeAdmin)
admin.site.register(Submission, SubmissionAdmin)
admin.site.register(Reflection, ReflectionAdmin)
admin.site.register(TestResult, TestResultAdmin)
admin.site.register(Feedback, FeedbackAdmin)
admin.site.register(LegalDocument, LegalDocumentAdmin)
