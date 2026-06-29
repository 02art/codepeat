from django.db import migrations

# CodePeat reuses OpenBook's platform-wide "Teacher" group instead of defining its own
# lecturer role: teachers may create and edit challenges. Assign users to the group via
# the OpenBook admin. The group itself is provided by the openbook_auth fixtures; we only
# attach the CodePeat-specific challenge permissions to it here.
TEACHER_GROUP = "Teacher"
TEACHER_SLUG = "teacher"
CHALLENGE_PERMISSIONS = ("add_challenge", "change_challenge")


def _challenge_permissions(apps):
    ContentType = apps.get_model("contenttypes", "ContentType")
    Permission = apps.get_model("auth", "Permission")
    content_type, _ = ContentType.objects.get_or_create(app_label="codepeat", model="challenge")
    for codename in CHALLENGE_PERMISSIONS:
        permission, _ = Permission.objects.get_or_create(
            content_type = content_type,
            codename     = codename,
            defaults     = {"name": f"Can {codename.split('_')[0]} challenge"},
        )
        yield permission


def grant_challenge_permissions(apps, schema_editor):
    """Grant challenge create/edit permissions to the Teacher group (created if missing)."""
    # OpenBook moves the Group model into its own app (MTI subclass of auth.Group).
    Group = apps.get_model("openbook_auth", "Group")
    group, _ = Group.objects.get_or_create(name=TEACHER_GROUP, defaults={"slug": TEACHER_SLUG})
    for permission in _challenge_permissions(apps):
        group.permissions.add(permission)


def revoke_challenge_permissions(apps, schema_editor):
    """Remove the challenge permissions from the Teacher group (leave the group itself intact)."""
    Group = apps.get_model("openbook_auth", "Group")
    group = Group.objects.filter(name=TEACHER_GROUP).first()
    if group is None:
        return
    for permission in _challenge_permissions(apps):
        group.permissions.remove(permission)


class Migration(migrations.Migration):
    dependencies = [
        ("codepeat", "0002_challenge_course"),
        ("openbook_auth", "0002_initial"),
        ("contenttypes", "__first__"),
    ]

    operations = [
        migrations.RunPython(grant_challenge_permissions, revoke_challenge_permissions),
    ]
