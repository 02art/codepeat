from django.db import migrations

# Teachers may now also delete their own challenges from the CodePeat challenge editor.
# Object-level ownership is enforced in the viewset; here we add the model-level permission
# to the platform-wide "Teacher" group (mirrors 0003_teacher_challenge_permissions).
TEACHER_GROUP = "Teacher"
TEACHER_SLUG = "teacher"
PERMISSION_CODENAME = "delete_challenge"


def _delete_permission(apps):
    ContentType = apps.get_model("contenttypes", "ContentType")
    Permission = apps.get_model("auth", "Permission")
    content_type, _ = ContentType.objects.get_or_create(app_label="codepeat", model="challenge")
    permission, _ = Permission.objects.get_or_create(
        content_type = content_type,
        codename     = PERMISSION_CODENAME,
        defaults     = {"name": "Can delete challenge"},
    )
    return permission


def grant_delete_permission(apps, schema_editor):
    Group = apps.get_model("openbook_auth", "Group")
    group, _ = Group.objects.get_or_create(name=TEACHER_GROUP, defaults={"slug": TEACHER_SLUG})
    group.permissions.add(_delete_permission(apps))


def revoke_delete_permission(apps, schema_editor):
    Group = apps.get_model("openbook_auth", "Group")
    group = Group.objects.filter(name=TEACHER_GROUP).first()
    if group is None:
        return
    group.permissions.remove(_delete_permission(apps))


class Migration(migrations.Migration):
    dependencies = [
        ("codepeat", "0009_challengeaccess"),
        ("openbook_auth", "0002_initial"),
        ("contenttypes", "__first__"),
    ]

    operations = [
        migrations.RunPython(grant_delete_permission, revoke_delete_permission),
    ]
