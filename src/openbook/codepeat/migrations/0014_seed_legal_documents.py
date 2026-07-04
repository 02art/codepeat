import uuid

from django.db import migrations

PRIVACY = """\
<h1>Datenschutzerklärung</h1>
<h2>1. Allgemeine Hinweise</h2>
<p>Der Schutz deiner personenbezogenen Daten ist uns wichtig. In dieser Datenschutzerklärung erfährst du, welche Daten wir erheben, wie wir sie verarbeiten und wofür wir sie nutzen.</p>
<h2>2. Verantwortliche Stelle</h2>
<p>Verantwortlich für die Datenverarbeitung im Sinne der Datenschutz-Grundverordnung (DSGVO) ist:</p>
<p>CodePeat</p>
<address>Duale Hochschule Baden-Württemberg Karlsruhe<br>Erzbergerstraße 121<br>76133 Karlsruhe<br>Deutschland<br>E-Mail: info@dhbw-karlsruhe.de</address>
<h2>3. Welche Daten wir speichern</h2>
<p>Wenn du ein Nutzerkonto bei CodePeat erstellst, speichern wir folgende personenbezogene Daten:</p>
<ul><li>Benutzername</li><li>E-Mail-Adresse</li><li>Passwort (ausschließlich verschlüsselt/gehasht)</li></ul>
<p>Diese Daten benötigen wir, um dir einen Login und ein persönliches Nutzerkonto bereitzustellen.</p>
<h2>4. Hochladen und Verarbeiten von Code</h2>
<p>Auf CodePeat kannst du Programmcode hochladen, um ihn automatisch bewerten zu lassen.</p>
<ul><li>Dein hochgeladener Code wird ausschließlich zur Analyse und Bewertung verwendet.</li><li>Die Verarbeitung erfolgt über ein selbstgehostetes KI-Modell innerhalb der bwCloud, einer Cloud-Infrastruktur für Hochschulen in Baden-Württemberg.</li><li>Nach der Verarbeitung wird dein hochgeladener Code vollständig gelöscht.</li><li>Es wird kein Quellcode dauerhaft gespeichert.</li><li>Gespeichert wird nur das personalisierte Feedback, das deinem Nutzerkonto zugeordnet ist.</li></ul>
<h2>5. Serverstandort und Datenverarbeitung</h2>
<p>Alle Daten werden ausschließlich auf Servern innerhalb der bwCloud-Infrastruktur in Deutschland verarbeitet und gespeichert.</p>
<p>Eine Weitergabe deiner personenbezogenen Daten an Dritte findet nicht statt.</p>
<h2>6. Wofür wir deine Daten nutzen</h2>
<p>Wir verarbeiten deine Daten zu folgenden Zwecken:</p>
<ul><li>Bereitstellung und Verwaltung deines Nutzerkontos</li><li>Durchführung der automatisierten Codebewertung</li><li>Speicherung und Anzeige deines persönlichen Feedbacks</li><li>Sicherstellung des technischen Betriebs von CodePeat</li></ul>
<h2>7. Rechtsgrundlage</h2>
<p>Die Verarbeitung deiner personenbezogenen Daten erfolgt gemäß Art. 6 Abs. 1 lit. b DSGVO, da sie für die Nutzung unserer Plattform erforderlich ist.</p>
<h2>8. Speicherdauer</h2>
<ul><li>Deine Kontodaten speichern wir, solange dein Nutzerkonto besteht.</li><li>Hochgeladener Code wird nach der Analyse gelöscht.</li><li>Feedback wird gespeichert, bis du dein Nutzerkonto löschst oder die Löschung verlangst.</li></ul>
<h2>9. Deine Rechte</h2>
<p>Du hast jederzeit das Recht auf:</p>
<ul><li>Auskunft über deine gespeicherten Daten</li><li>Berichtigung unrichtiger Daten</li><li>Löschung deiner Daten</li><li>Einschränkung der Verarbeitung</li><li>Widerspruch gegen die Verarbeitung</li><li>Datenübertragbarkeit</li></ul>
<p>Wende dich dafür einfach an die oben genannte verantwortliche Stelle.</p>
<h2>10. Änderungen</h2>
<p>Wir behalten uns vor, diese Datenschutzerklärung anzupassen, wenn sich rechtliche Vorgaben oder unser Angebot ändern.</p>
"""

IMPRINT = """\
<h1>Impressum</h1>
<address>Duale Hochschule Baden-Württemberg Karlsruhe<br>Erzbergerstraße 121<br>76133 Karlsruhe<br>Deutschland<br>E-Mail: info@dhbw-karlsruhe.de</address>
"""


def seed(apps, schema_editor):
    LegalDocument = apps.get_model("codepeat", "LegalDocument")
    # UUIDMixin assigns the id in save(), which historical models don't run, so set it here.
    LegalDocument.objects.get_or_create(slug="datenschutz", defaults={"id": uuid.uuid4(), "content": PRIVACY})
    LegalDocument.objects.get_or_create(slug="impressum", defaults={"id": uuid.uuid4(), "content": IMPRINT})


def unseed(apps, schema_editor):
    LegalDocument = apps.get_model("codepeat", "LegalDocument")
    LegalDocument.objects.filter(slug__in=["datenschutz", "impressum"]).delete()


class Migration(migrations.Migration):
    dependencies = [
        ("codepeat", "0013_legaldocument"),
    ]

    operations = [
        migrations.RunPython(seed, unseed),
    ]
