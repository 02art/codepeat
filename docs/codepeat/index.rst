:orphan:

CodePeat
========

CodePeat ist eine in OpenBook integrierte Lernplattform für
Programmier-Challenges. Studierende bearbeiten Aufgaben in ihrer eigenen
Entwicklungsumgebung, geben ihre Lösung als ZIP-Datei ab und füllen anschließend
einen verpflichtenden Reflexionsbogen aus. Ein Schwerpunkt ist die reflektierte
Auseinandersetzung mit dem Einsatz von KI beim Programmieren. Dozenten stellen
Challenges bereit, steuern deren Sichtbarkeit und bewerten Abgaben manuell.

Diese Dokumentation beschreibt, **was der Code tut, wie er funktioniert und wie
man ihn benutzt bzw. verändert**. Sie ist in drei Teile gegliedert:

.. toctree::
   :maxdepth: 2

   backend
   frontend

Rollen
------

* **Studierende** – bearbeiten Challenges, geben Lösungen ab, reflektieren, sehen
  Feedback und Fortschritt.
* **Dozenten** – erstellen und bearbeiten Challenges, steuern die Sichtbarkeit,
  bewerten Abgaben.
* **Administratoren** – Verwaltung über die OpenBook-Admin.

Anmeldung per Benutzername/Passwort, per einmaligem E-Mail-Code **oder per
GitHub** (OAuth). Siehe :doc:`frontend`.

Aufbau
------

Die Anwendung besteht aus zwei Sub-Projekten:

* **Backend** – Django-App unter ``src/openbook/codepeat`` (Datenmodell,
  REST-API, Admin). Siehe :doc:`backend`.
* **Frontend** – Svelte-Single-Page-App unter ``src/frontend/codepeat``, die über
  generierte API-Clients mit dem Backend spricht. Siehe :doc:`frontend`.

.. graphviz::

   digraph codepeat_architektur {
       rankdir=LR;
       fontname="Helvetica";
       node  [shape=box, style="rounded,filled", fillcolor="#f5f5f5", fontname="Helvetica", fontsize=10];
       edge  [fontname="Helvetica", fontsize=9];

       subgraph cluster_frontend {
           label = "Frontend  (src/frontend/codepeat)";
           style = dashed; color = "#888888";
           Pages    [label="Svelte-Seiten\n(svelte-spa-router)"];
           Services [label="Service-Layer\n(src/services)"];
           Clients  [label="Generierte API-Clients"];
           Pages -> Services -> Clients;
       }
       subgraph cluster_backend {
           label = "Backend  (src/openbook/codepeat)";
           style = dashed; color = "#888888";
           API    [label="DRF ViewSets\n/api/codepeat/"];
           Models [label="Django-Modelle"];
           DB     [label="SQLite (Django ORM)", shape=cylinder, fillcolor="#e8f0fe"];
           API -> Models -> DB;
       }
       Clients -> API [label="REST / JSON\nSession + CSRF"];
   }

Lokale Ausführung
-----------------

Der Prototyp läuft nur lokal. Alles von der Repository-Wurzel:

.. code-block:: bash

   npm install             # einmalig (npm-Workspace)
   npm run setup:codepeat  # einmalig bei frischer DB: Migrationen, Grunddaten, Demo-Challenges
   npm run dev:codepeat    # Backend (:8000) + Frontend-Watch + Maildev

Danach im Browser:

.. code-block:: text

   http://localhost:8000/codepeat/

``dev:codepeat`` migriert vor dem Start automatisch – nach neuen Migrationen ist
also kein Extraschritt nötig. ``setup:codepeat`` (``migrate`` +
``load_initial_data`` + Demo-Challenges) wird nur bei frischer Datenbank oder
neuen Grunddaten gebraucht.

Anforderungen aus dem Pflichtenheft
-----------------------------------

Abgleich **aller** Anforderungen (US-01–US-24) mit dem aktuellen Stand
(MVP, 6. Semester). Priorität in Klammern (MUSS/SOLL/WÜRDE/KANN). Status:
``umgesetzt`` / ``teilweise`` / ``nicht im MVP`` / ``offen``.

.. list-table::
   :header-rows: 1
   :widths: 40 16 44

   * - Anforderung
     - Status
     - Umsetzung / Anmerkung
   * - US-01 (MUSS) Registrierung & Anmeldung
     - umgesetzt
     - allauth-Headless-Auth, Auth-Seiten, **GitHub-Login (OAuth)**
   * - US-02 (MUSS) Benutzer & Rollen verwalten (Admin)
     - umgesetzt
     - OpenBook-Admin + Gruppen/Rechte (Migration ``Teacher``)
   * - US-03 (SOLL) Eigene Daten einsehen/anfragen
     - teilweise
     - Profil-/Konto-Verwaltung; Datenauskunft/Export offen
   * - US-04 (SOLL) Kurse erstellen/bearbeiten/archivieren
     - teilweise
     - ``Course`` aus OpenBook; Kursverwaltung über OpenBook
   * - US-05 (SOLL) Studierende Kursen/Gruppen zuordnen
     - teilweise
     - über OpenBook-Kurs-/Gruppenverwaltung
   * - US-06 (WÜRDE) Kurse abonnieren
     - offen
     - –
   * - US-07 (KANN) Startseiten-Übersicht
     - teilweise
     - ``HomePage`` vorhanden; Umfang begrenzt
   * - US-08 (MUSS) Challenges bearbeiten & abgeben
     - umgesetzt
     - ZIP-Upload über ``Submission`` / ``POST /submissions/``
   * - US-09 (SOLL) Challenges erstellen/bearbeiten
     - umgesetzt
     - ``Challenge``-CRUD + ``ChallengeEditorPage``
   * - US-10 (SOLL) Sichtbarkeit steuern
     - umgesetzt
     - ``visibility`` + Einladungslink/Unlock
   * - US-11 (SOLL) Feedback vom Dozenten
     - umgesetzt
     - ``Feedback`` (textuell, manuell via ``grade``)
   * - US-12 (WÜRDE) KI-gestütztes Feedback
     - nicht im MVP
     - bewusst ausgesetzt (Kap. 9)
   * - US-13 (MUSS) Verpflichtender Reflexionsbogen
     - umgesetzt
     - ``Reflection`` + ``ReflectionQuestion``
   * - US-14 (WÜRDE) Automatische Test-Überprüfung
     - ausgeklammert
     - eigener Worker vorgesehen, wegen Umfang zurückgestellt; ``TestResult`` bleibt als Grundlage
   * - US-15 (WÜRDE) Pausierbarer Timer
     - offen
     - –
   * - US-16 (SOLL) Erfahrungslevel wählen
     - offen
     - –
   * - US-17 (SOLL) In eigener IDE programmieren
     - umgesetzt
     - Workflow: externe Bearbeitung + ZIP-Upload
   * - US-18 (SOLL) Einzel-/Gruppenchallenges
     - teilweise
     - ``type`` (solo/group) im Modell; Gruppenlogik begrenzt
   * - US-19 (SOLL) Zwei Oberflächen (Student/Lehrender)
     - umgesetzt
     - rollenabhängige Ansichten
   * - US-20 (KANN) Sortierung nach Beliebtheit
     - umgesetzt
     - „Beliebteste zuerst" (Sort nach ``views``) in der Übersicht
   * - US-21 (SOLL) Anonymer Lernfortschritt (Dozent)
     - teilweise
     - Abgaben/Status vorhanden; Aggregat-Ansicht offen
   * - US-22 (WÜRDE) Achievement-/Fortschrittsboard
     - nicht im MVP
     - XP-Grundlage (``xp.py``) vorhanden, Board offen
   * - US-23 (WÜRDE) Lernfortschritte exportieren
     - offen
     - –
   * - US-24 (SOLL) Spielerische Elemente (Gamification)
     - teilweise
     - XP-/Level-System (Navbar-Badge) umgesetzt; Board offen (US-22)

**Erweiterungen über das Pflichtenheft hinaus:**

* **GitHub-Login** – Anmeldung/Registrierung per GitHub (OAuth) über die
  allauth-Provider-Weiterleitung (``loginWithProvider("github")``).
* **Login per E-Mail-Code** – passwortlose Anmeldung (allauth login-by-code).
* **Einladungslinks** zur Freischaltung privater Challenges (``ChallengeAccess``).
* **Favoriten & Gelöst-Status** je Challenge (``ChallengeFavorite`` /
  ``is_favorited``; ``is_solved`` aus akzeptierten Abgaben).
* **Themen-Tags** (``categories``) mit passenden Filtern in der Übersicht.
* **XP-/Level-System** (``xp.py``, ``LevelBadge``); XP werden nach der Bewertung
  freigegeben.
* **Konto-Management** – token-basierter Passwort-Reset, E-Mail-Verifizierung und
  Konto-Löschung.
* **CodePeat-Branding** der allauth-System-Mails (Absender/Betreff/Anrede).
* **Rechtsseiten** (``LegalDocument``) und **Avatar-Auswahl** (``UserAvatar``).

Tests
-----

Backend und Frontend haben eigene Suites; von der Repository-Wurzel:

.. code-block:: bash

   npm run test:codepeat            # Backend + Frontend
   npm run test:codepeat:backend    # Django-Tests (openbook.codepeat)
   npm run test:codepeat:frontend   # Vitest (Komponenten + Services)

Backend-Tests liegen unter ``src/openbook/codepeat/tests`` (Modelle, ViewSets,
Adapter), Frontend-Tests als ``*.test.ts`` neben dem jeweiligen Code.
