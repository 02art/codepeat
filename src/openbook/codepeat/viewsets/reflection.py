from openbook.drf.flex_serializers import FlexFieldsModelSerializer
from openbook.drf.viewsets import ModelViewSetMixin, with_flex_fields_parameters
from rest_framework import serializers
from rest_framework.mixins import ListModelMixin, RetrieveModelMixin, CreateModelMixin
from rest_framework.permissions import IsAuthenticated
from rest_framework.viewsets import GenericViewSet
from django_filters.filterset import FilterSet
from drf_spectacular.utils import extend_schema
from ..models.reflection import Reflection

class ReflectionFilter(FilterSet):
    class Meta:
        model = Reflection
        fields = {
            "submission": ["exact"],
            "created_at": ["date", "date__gte", "date__lte"],
        }

class ReflectionSerializer(FlexFieldsModelSerializer):
    class Meta:
        model = Reflection
        fields = ["id", "submission", "answers", "created_at", "modified_at"]
        read_only_fields = ["id", "created_at", "modified_at"]
        expandable_fields = {
            "submission": "openbook.codepeat.viewsets.submission.SubmissionSerializer",
        }

    def validate(self, attrs):
        # A reflection may only be written for one's own submission.
        request = self.context.get("request")
        submission = attrs.get("submission")
        if request is not None and submission is not None and self.instance is None:
            user = request.user
            if submission.user_id != user.id and not user.is_staff:
                raise serializers.ValidationError("Du kannst nur zu deiner eigenen Einreichung reflektieren.")
        return super().validate(attrs)

@extend_schema(tags=["Codepeat: Reflections"])
@with_flex_fields_parameters()
class ReflectionViewSet(ModelViewSetMixin, ListModelMixin, RetrieveModelMixin, CreateModelMixin, GenericViewSet):
    queryset = Reflection.objects.all()
    serializer_class = ReflectionSerializer
    filterset_class = ReflectionFilter
    search_fields = ["submission__user__username", "submission__challenge__name"]
    ordering = ["-created_at"]
    # Any signed-in user may record a reflection (only for their own submission, enforced above).
    permission_classes = [IsAuthenticated]
