from django_filters.rest_framework import DjangoFilterBackend
from drf_spectacular.utils import extend_schema
from rest_flex_fields2.filter_backends import FlexFieldsFilterBackend
from rest_framework import serializers
from rest_framework.filters import OrderingFilter
from rest_framework.mixins import ListModelMixin, RetrieveModelMixin, UpdateModelMixin
from rest_framework.permissions import BasePermission, SAFE_METHODS
from rest_framework.viewsets import GenericViewSet

from openbook.drf.flex_serializers import FlexFieldsModelSerializer
from openbook.drf.viewsets import ModelViewSetMixin, with_flex_fields_parameters
from ..models.legal_document import LegalDocument


class ReadOnlyOrAdmin(BasePermission):
    """Anyone may read the legal pages; only staff (openbook admins) may edit them."""

    def has_permission(self, request, view):
        return request.method in SAFE_METHODS or bool(request.user and request.user.is_staff)


class LegalDocumentSerializer(FlexFieldsModelSerializer):
    can_edit = serializers.SerializerMethodField()

    class Meta:
        model = LegalDocument
        fields = ["id", "slug", "content", "can_edit", "created_at", "modified_at"]
        read_only_fields = ["id", "slug", "can_edit", "created_at", "modified_at"]

    def get_can_edit(self, obj) -> bool:
        request = self.context.get("request")
        return bool(request and request.user and request.user.is_staff)


@extend_schema(tags=["Codepeat: Legal"])
@with_flex_fields_parameters()
class LegalDocumentViewSet(ModelViewSetMixin, ListModelMixin, RetrieveModelMixin, UpdateModelMixin, GenericViewSet):
    queryset = LegalDocument.objects.all()
    serializer_class = LegalDocumentSerializer
    permission_classes = [ReadOnlyOrAdmin]
    lookup_field = "slug"
    ordering = ["slug"]
    # Fixed set of documents: readable by everyone, editable (PATCH) by admins only.
    http_method_names = ["get", "patch", "head", "options"]
    # Flat public catalogue; drop the default object-permission filter that would empty the list.
    filter_backends = [FlexFieldsFilterBackend, DjangoFilterBackend, OrderingFilter]
