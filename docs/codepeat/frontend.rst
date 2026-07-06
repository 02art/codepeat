Frontend
========

Das Frontend ist eine Svelte-Single-Page-App mit TypeScript unter
``src/frontend/codepeat``. Routing übernimmt der ``svelte-spa-router``
(Hash-basiert), das Styling Tailwind CSS und daisyUI (Mobile-First). Einstieg ist
``src/index.ts``, das ``ApplicationFrame.svelte`` mountet. Die Ansichten sind
rollenabhängig.

Was der Code tut
----------------

Die Oberfläche zeigt Challenges (mit Filtern, Themen-Tags und Favoriten), nimmt
Abgaben entgegen, führt durch den Reflexionsbogen und stellt Feedback sowie
XP/Level dar. Der Datenzugriff ist streng gekapselt:

.. graphviz::

   digraph codepeat_frontend {
       rankdir=TB;
       node [shape=box, style="rounded,filled", fillcolor="#f5f5f5", fontname="Helvetica", fontsize=10];
       edge [fontname="Helvetica", fontsize=9];
       Pages    [label="Svelte-Seiten\n(src/components/pages)"];
       Services [label="Service-Layer\n(src/services)"];
       Mapper   [label="Mapper\n(DTO → Domäne)"];
       Backend  [label="backend.ts\n(Client-Instanzen + CSRF)"];
       Clients  [label="api-client / auth-client\n(generiert)"];
       API      [label="Django REST API\n:8000", shape=cylinder, fillcolor="#e8f0fe"];
       Pages -> Services -> Mapper;
       Services -> Backend -> Clients -> API;
   }

* **Komponenten** (``src/components``) rufen **nie** direkt HTTP auf, sondern den
  Service-Layer.
* **Service-Layer** (``src/services``: ``auth``, ``challenges``, ``submissions``,
  ``reflections``, ``legal``, ``user``) kapselt jeden API-Zugriff und bildet die
  Backend-DTOs über **Mapper** auf das Frontend-Domänenmodell ab.
* **Generierte Clients** (``src/api-client``, ``src/auth-client``) werden aus den
  OpenAPI-Schemas des Backends erzeugt und **nicht** von Hand bearbeitet.
* **``backend.ts``** instanziiert die Clients, liest die Backend-URL aus
  ``static/server.url`` (Standard ``http://localhost:8000``) und hängt bei jedem
  Request einen frischen CSRF-Token an.

*Warum so:* Das OpenAPI-Schema ist die einzige Wahrheitsquelle – generierte,
typsichere Clients verhindern Drift zwischen Frontend und API. Service-Layer und
Mapper entkoppeln die UI vom konkreten DTO-Format; ändert sich das Schema, sind
nur Services/Mapper betroffen, nicht jede Komponente.

Anmeldung (inkl. GitHub)
------------------------

Login und Registrierung laufen über die allauth-Headless-API (``auth-client``).
Neben Benutzername/Passwort gibt es eine **GitHub-Anmeldung**: Die Buttons „Mit
GitHub anmelden/registrieren" (``LoginPage`` / ``RegisterPage``) rufen
``loginWithProvider("github")`` in ``src/services/auth/auth.service.ts``.

*Wie es funktioniert:* Der allauth-Provider-Redirect muss ein **echter
Form-POST** sein (kein XHR), damit der Browser der 302-Weiterleitung zum Provider
folgt. Die Funktion baut ein Formular auf
``/auth-api/browser/v1/auth/provider/redirect`` mit ``provider=github``,
``process=login``, CSRF-Token und
``callback_url=/codepeat/index.html#/challenges`` und schickt es ab. Da alles
same-origin läuft, wird das Session-Cookie geteilt; nach erfolgreicher
GitHub-Authentifizierung landet man wieder in der App.

Zusätzlich gibt es einen **passwortlosen Login per E-Mail-Code** (allauth
login-by-code): Die ``LoginPage`` hat drei Modi – Passwort, Code anfordern und
Code bestätigen.

Routen
------

Aus ``src/components/routes.ts`` (Auszug der Kernseiten):

.. list-table::
   :header-rows: 1
   :widths: 48 37 15

   * - Pfad
     - Komponente
     - Status
   * - ``/`` · ``/challenges`` · ``/challenges/:id``
     - Home / Übersicht / Detail
     - fertig
   * - ``/challenges/new`` · ``/challenges/:id/edit``
     - ``ChallengeEditorPage``
     - fertig
   * - ``/challenges/:id/reflection``
     - ``ReflectionPage``
     - fertig
   * - ``/challenges/:id/unlock/:token``
     - ``ChallengeUnlockPage``
     - fertig
   * - ``/activities`` · ``/activities/:id``
     - Abgaben / Detail
     - fertig
   * - ``/login`` · ``/register`` · Passwort-/E-Mail-Flows
     - Auth-Seiten
     - fertig
   * - ``/settings`` · ``/datenschutz`` · ``/impressum``
     - Profil / Rechtsseiten
     - fertig
   * - ``/courses``
     - ``PlaceholderPage``
     - Platzhalter

Build-Kette
-----------

``npm run build`` führt der Reihe nach aus: ``build:avatars`` (Avatar-Manifest),
``build:tailwind`` (CSS), ``build:api-client`` + ``build:auth-client``
(Client-Generierung) und ``build:src`` (Svelte-Bundle via esbuild). Ergebnis:
``dist/openbook/codepeat``.

.. important::

   ``build:api-client`` / ``build:auth-client`` laden das OpenAPI-Schema vom
   **laufenden** Backend (``http://localhost:8000``) und brauchen daher Backend +
   **Java-Laufzeit**. Die generierten Clients sind aber **eingecheckt** – für
   reine Frontend-Änderungen genügt ``npm run build:src`` (ohne Backend/Java).

Benutzen & Verändern
--------------------

**Neue Seite / Route hinzufügen**

1. Svelte-Komponente unter ``src/components/pages/<Name>.svelte`` anlegen.
2. In ``src/components/routes.ts`` einen Pfad auf die Komponente mappen.

**Daten anbinden** – keinen ``fetch`` in Komponenten schreiben, sondern eine
Methode im passenden Service (``src/services/...``) ergänzen bzw. nutzen. Der
Service ruft den generierten Client auf und mappt das Ergebnis auf das
Domänenmodell.

**Nach API-Änderung** – Clients neu generieren (Backend muss laufen):

.. code-block:: bash

   cd src/frontend/codepeat
   npm run build:api-client     # bzw. build:auth-client

**Bauen / ausliefern**

.. code-block:: bash

   npm run build:src        # Svelte-Bundle (ohne Client-Generierung)
   npm run build:tailwind   # nur CSS
   npm run check            # ESLint + TypeScript

Das gebaute Frontend liegt in ``dist/openbook/codepeat`` und wird von Django
ausgeliefert.

.. tip::

   Für den Alltag genügt von der Repository-Wurzel ``npm run dev:codepeat`` – das
   startet Backend, Frontend-Watch und Maildev zusammen. Django liefert das
   Frontend unter ``http://localhost:8000/codepeat/`` aus.
