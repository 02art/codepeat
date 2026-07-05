Backend
=======

Das Backend ist eine Django-App unter ``src/openbook/codepeat``. Es stellt das
Datenmodell, die REST-API und die Admin-Anbindung bereit und folgt den
OpenBook-Konventionen: UUID-Primärschlüssel (``UUIDMixin``), Audit-Felder
(``CreatedModifiedByMixin``) und FlexFields-Serializer. Datenbank ist SQLite
(Zugriff nur über das Django ORM); ZIP-Uploads liegen als Dateien getrennt von
den Metadaten.

Was der Code tut
----------------

Der Kern ist das Zusammenspiel weniger Modelle: Dozenten legen ``Challenge``\ s
an, Studierende reichen dazu ``Submission``\ s ein, an denen ``TestResult``,
``Feedback`` und ``Reflection`` hängen. ``ReflectionQuestion`` definiert die
Fragen des Reflexionsbogens je Challenge, ``ChallengeAccess`` regelt den Zugriff
auf private Challenges.

.. graphviz::

   digraph codepeat_datenmodell {
       rankdir=LR;
       node [shape=record, fontname="Helvetica", fontsize=10];
       edge [fontname="Helvetica", fontsize=9, arrowhead=crow];

       Course     [label="{Course|(openbook.content)}", style=filled, fillcolor="#eeeeee"];
       User       [label="{User|(openbook.auth)}",       style=filled, fillcolor="#eeeeee"];
       Challenge  [label="{Challenge|difficulty\lvisibility\ltype\lrequires_grading\l}"];
       Question   [label="{ReflectionQuestion|kind\loptions\lposition\l}"];
       Access     [label="{ChallengeAccess|(User + Challenge)\l}"];
       Submission [label="{Submission|status\lzip_file\lsubmitted_at\l}"];
       Reflection [label="{Reflection|answers (JSON)\l}"];
       TestResult [label="{TestResult|status\loutput\l}"];
       Feedback   [label="{Feedback|comments\l}"];

       Course     -> Challenge  [label="1 : n"];
       User       -> Challenge  [label="1 : n"];
       Challenge  -> Question   [label="1 : n"];
       Challenge  -> Access     [label="1 : n"];
       User       -> Access     [label="1 : n"];
       Challenge  -> Submission [label="1 : n"];
       User       -> Submission [label="1 : n"];
       Submission -> Reflection [label="1 : 1", arrowhead=none];
       Submission -> TestResult [label="1 : n"];
       Submission -> Feedback   [label="1 : n"];
       User       -> Feedback   [label="1 : n"];
   }

* **Challenge** – Aufgabe mit ``difficulty`` (easy/medium/hard), ``visibility``
  (public/private), ``type`` (solo/group), Detailinhalten (``constraints``,
  Beispiel-Ein-/Ausgabe) und ``requires_grading``; optional einem ``Course``
  zugeordnet.
* **Submission** – Lösungs-Upload (``zip_file``, ``submitted_at``) mit manuell
  gesetztem ``status`` (pending/accepted/rejected); ``hidden_from_student``
  blendet Abgaben aus der Studierenden-Liste aus.
* **Reflection** – verpflichtender Reflexionsbogen, genau einer je Submission
  (``OneToOneField``); Antworten als JSON in ``answers``.
* **ReflectionQuestion** – Frage je Challenge (``text`` / ``scale`` / ``choice``).
* **Feedback** – textuelle Rückmeldung Dozenten zu einer Submission.
* **TestResult** – Prüfergebnis einer Submission (Status, ``output``). Sollte
  automatisch durch einen eigenen Worker erzeugt werden; dieser wurde
  ausgeklammert (zu großer Umfang für das Projekt), Modell und Endpunkt bleiben
  als Grundlage bestehen.
* **ChallengeAccess** – Freischaltung privater Challenges (unique je User +
  Challenge).

Ergänzend: ``LegalDocument``, ``UserAvatar``, ``AccountDeletionRequest`` und
``PasswordChangeRequest`` für Rechts- und Kontofunktionen.

REST-API
--------

Eingebunden über einen DRF-Router: ``routes.py`` registriert die ViewSets per
``register_api_routes`` unter dem Präfix ``codepeat`` → Basis-URL
``/api/codepeat/``. Jede Ressource nutzt einen ``FlexFieldsModelSerializer`` und
einen ``ModelViewSetMixin``; JSON als Format, Listen paginiert.

.. list-table::
   :header-rows: 1
   :widths: 30 26 44

   * - Endpunkt
     - Methoden
     - Beschreibung
   * - ``/challenges/``
     - GET, POST, PUT, PATCH, DELETE
     - Challenges (Liste/Detail auch anonym lesbar)
   * - ``/challenges/can-create/``
     - GET
     - Darf der User Challenges anlegen? (steuert „+")
   * - ``/challenges/{id}/invite-link/`` · ``/challenges/unlock/``
     - POST
     - Einladungslink erzeugen bzw. Challenge freischalten
   * - ``/submissions/``
     - GET, POST, DELETE
     - Abgaben lesen/hochladen; DELETE blendet nur aus
   * - ``/submissions/{id}/grade/``
     - POST
     - Bewertung durch den Prüfer (setzt ``status``)
   * - ``/reflections/`` · ``/reflection-questions/``
     - GET, POST (, DELETE)
     - Reflexionsbögen bzw. -fragen
   * - ``/test-results/``
     - GET, POST
     - Test-Ergebnisse
   * - ``/feedbacks/``
     - GET
     - Feedback lesen (Anlage über ``grade``)
   * - ``/account/...`` · ``/legal-documents/``
     - GET, POST / PUT, PATCH
     - Konto-Aktionen bzw. Datenschutz/Impressum

Pro Ressource zusätzlich: Expand (``?_expand=course,created_by``), Filter
(``difficulty``, ``visibility``, ``status`` …), ``?_search=`` und ``?_sort=``.
Schreibende Requests brauchen eine Session (Cookie + CSRF) oder Token-Auth.

Ablauf einer Abgabe
-------------------

.. graphviz::

   digraph codepeat_ablauf {
       rankdir=LR;
       node [shape=box, style="rounded,filled", fillcolor="#f5f5f5", fontname="Helvetica", fontsize=10];
       edge [fontname="Helvetica", fontsize=9];
       Extern   [label="Bearbeitung\nin eigener IDE"];
       Upload   [label="ZIP-Upload\nPOST /submissions/"];
       Worker   [label="Automatischer Test (Worker)\n→ TestResult\n(ausgeklammert)", style="rounded,dashed,filled", fillcolor="#f0f0f0", fontcolor="#888888"];
       Reflect  [label="Reflexionsbogen\nPOST /reflections/"];
       Grade    [label="Bewertung durch Prüfer\nPOST /submissions/{id}/grade/", fillcolor="#fff4e5"];
       Done     [label="status =\naccepted / rejected"];
       Extern -> Upload -> Reflect -> Grade -> Done;
       Upload -> Worker [style=dashed, color="#aaaaaa"];
       Worker -> Grade  [style=dashed, color="#aaaaaa"];
   }

Am Ende steht die **Bewertung durch den Prüfer** (Dozent): Er sichtet die Abgabe
und setzt über ``POST /submissions/{id}/grade/`` den ``status`` auf ``accepted``
oder ``rejected``.

Ursprünglich war zwischen Upload und Bewertung ein **automatischer Test über
einen eigenen Worker** vorgesehen, der die eingereichte ZIP-Datei prüft und ein
``TestResult`` erzeugt. Dieser Schritt (im Diagramm gestrichelt) wurde
**ausgeklammert**, da er den Rahmen des Projekts gesprengt hätte; das
Datenmodell (``TestResult``) und der Endpunkt sind aber bereits vorhanden, sodass
der Worker später ergänzt werden kann.

Rollen & Berechtigungen
-----------------------

CodePeat nutzt die OpenBook-Gruppen. Die Gruppe **``Teacher``** (Dozenten) erhält
per Migration ``0003_teacher_challenge_permissions`` die Rechte ``add_challenge``
und ``change_challenge`` und darf Challenges anlegen sowie Abgaben bewerten
(der ``challenges/can-create``-Endpunkt steuert den „+"-Button). Zuweisung im
Admin unter ``Auth → Users``. Feedback- und Student-Rechte sind nicht per
Migration vorkonfiguriert und werden bei Bedarf im Admin ergänzt.

Benutzen & Verändern
--------------------

**Neues Modell + Endpunkt hinzufügen**

1. Modell in ``models/<name>.py`` anlegen (von ``UUIDMixin`` /
   ``CreatedModifiedByMixin`` erben) und in ``models/__init__.py`` exportieren.
2. Serializer und ViewSet in ``viewsets/<name>.py`` definieren
   (``FlexFieldsModelSerializer`` + passende DRF-Mixins).
3. Das ViewSet in ``routes.py`` bei ``register_api_routes`` registrieren.
4. Migration erzeugen und anwenden:

   .. code-block:: bash

      cd src
      python manage.py makemigrations codepeat
      python manage.py migrate

5. Optional Demo-Daten als Fixture unter ``fixtures/<name>.yaml`` ergänzen.

**Endpunkt-Sonderfall** – für Aktionen jenseits von CRUD (z. B. ``grade``,
``unlock``) eine ``@action``-Methode am ViewSet definieren.

**Rechte anpassen** – analog zu ``0003_teacher_challenge_permissions`` per
Daten-Migration Gruppen-Rechte vergeben, oder manuell im Admin.

**Fixtures laden** (Reihenfolge wegen Abhängigkeiten beachten):

.. code-block:: bash

   python manage.py loaddata challenge submission feedback reflection test_result

**API-Doku** – bei laufendem Server unter
``http://localhost:8000/api/schema/redoc/``.
