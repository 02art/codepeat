from openbook.admin import CustomModelAdmin
from ..models.legal_document import LegalDocument

class LegalDocumentAdmin(CustomModelAdmin):
    model = LegalDocument
    list_display = ["slug", "modified_at"]
    ordering = ["slug"]
