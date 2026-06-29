# CodePeat – Backend Documentation

CodePeat is a coding challenge platform integrated into OpenBook. It allows lecturers to create
programming challenges, students to submit solutions as ZIP files, and the system to automatically
run tests and collect feedback.

---

## Data Model

```
Challenge
    ├── Submission (many)
    │       ├── TestResult (many)       ← created by worker
    │       ├── Feedback (many)         ← created by lecturers
    │       └── Reflection (one)        ← created by student
```

### Challenge
A programming task created by a lecturer or admin.

| Field              | Type     | Description                                         |
|--------------------|----------|-----------------------------------------------------|
| `id`               | UUID     | Primary key                                         |
| `name`             | string   | Short title                                         |
| `description`      | string   | Task description (plain text, HTML, or Markdown)    |
| `text_format`      | enum     | `TEXT`, `HTML`, `MD`                                |
| `difficulty`       | enum     | `easy`, `medium`, `hard`                            |
| `visibility`       | enum     | `public`, `private`                                 |
| `type`             | enum     | `solo`, `group`                                     |
| `constraints`      | string   | Detail-page constraints, one per line               |
| `example_language` | string   | Language label for the worked example (e.g. `Java`) |
| `example_input`    | string   | Worked example input                                |
| `example_output`   | string   | Worked example output                               |
| `views`            | int      | View counter (read-only via the API)                |
| `course`           | FK       | Optional link to a Course                           |
| `created_by`       | FK(User) | Set automatically                                   |
| `created_at`       | datetime | Set automatically                                   |
| `modified_at`      | datetime | Set automatically                                   |

### Submission
A student's solution upload for a challenge.

| Field          | Type     | Description                    |
|----------------|----------|--------------------------------|
| `id`           | UUID     | Primary key                    |
| `challenge`    | FK       | The challenge being solved     |
| `user`         | FK(User) | The submitting student         |
| `zip_file`     | file     | Uploaded ZIP file              |
| `submitted_at` | datetime | Set automatically on creation  |

### TestResult
Automatically created by a background worker after a submission.

| Field        | Type   | Description                            |
|--------------|--------|----------------------------------------|
| `id`         | UUID   | Primary key                            |
| `submission` | FK     | The submission being tested            |
| `status`     | enum   | `pending`, `passed`, `failed`, `error` |
| `output`     | string | Test runner output                     |

### Feedback
Lecturer feedback on a submission.

| Field        | Type     | Description              |
|--------------|----------|--------------------------|
| `id`         | UUID     | Primary key              |
| `submission` | FK       | The submission reviewed  |
| `lecturer`   | FK(User) | The reviewing lecturer   |
| `comments`   | string   | Written feedback         |
| `rating`     | integer  | Numeric rating           |

### Reflection
A student's self-reflection on their submission (one per submission).

| Field        | Type | Description                          |
|--------------|------|--------------------------------------|
| `id`         | UUID | Primary key                          |
| `submission` | FK   | The submission being reflected on    |
| `answers`    | JSON | Free-form reflection answers         |

### ChallengeAccess
A permanent unlock of a private challenge for one user (created when an invite link is opened).

| Field        | Type     | Description                          |
|--------------|----------|--------------------------------------|
| `id`         | UUID     | Primary key                          |
| `challenge`  | FK       | The unlocked challenge               |
| `user`       | FK(User) | The user who gained access           |
| `created_at` | datetime | When access was granted              |

### ReflectionQuestion
A reflection question a challenge creator attaches (from the catalogue or custom-authored).

| Field       | Type | Description                                                            |
|-------------|------|-----------------------------------------------------------------------|
| `id`        | UUID | Primary key                                                           |
| `challenge` | FK   | The challenge the question belongs to                                 |
| `text`      | str  | The question text                                                     |
| `kind`      | enum | `text`, `scale`, `choice`                                             |
| `options`   | JSON | `choice` → option list; `scale` → `[min_label, max_label]`; else `[]` |
| `position`  | int  | Display order                                                         |

CodePeat (system/admin) challenges additionally show up to three default questions at fill-in
time; these are provided by the frontend and not stored per challenge. Student answers are saved
on the existing `Reflection` (one per submission) as a self-describing JSON array.

---

## REST API

Base URL: `/api/codepeat/`

All endpoints require authentication. Use session auth (cookie) or token auth.

### Query Parameters (all endpoints)

| Parameter    | Description                              |
|--------------|------------------------------------------|
| `_search`    | Full-text search                         |
| `_sort`      | Sort field (e.g. `_sort=-created_at`)    |
| `_page`      | Page number                              |
| `_page_size` | Results per page (default: 100)          |
| `_fields`    | Comma-separated fields to include        |
| `_omit`      | Comma-separated fields to exclude        |
| `_expand`    | Comma-separated relationships to expand  |

### Challenges `/api/codepeat/challenges/`

| Method | URL                                          | Permission          | Description                    |
|--------|----------------------------------------------|---------------------|--------------------------------|
| GET    | `/api/codepeat/challenges/`                  | Public              | List challenges                |
| GET    | `/api/codepeat/challenges/{id}/`             | Public              | Get challenge                  |
| POST   | `/api/codepeat/challenges/`                  | Admin / Teacher     | Create challenge               |
| PUT    | `/api/codepeat/challenges/{id}/`             | Creator / Admin     | Update challenge               |
| PATCH  | `/api/codepeat/challenges/{id}/`             | Creator / Admin     | Partial update                 |
| DELETE | `/api/codepeat/challenges/{id}/`             | Creator / Admin     | Delete challenge               |
| POST   | `/api/codepeat/challenges/{id}/invite-link/` | Creator / Admin     | Create a 30-min invite link    |
| POST   | `/api/codepeat/challenges/unlock/`           | Authenticated       | Redeem an invite link          |

Filter parameters: `difficulty`, `visibility`, `type`, `course`, `created_by`

**Visibility.** Public challenges are listed for everyone. `private` challenges are only visible to
their creator, to staff, and to users who have opened a valid invite link (a permanent
`ChallengeAccess` grant). Editing/deleting is restricted to the creator (or staff) on top of the
`change_challenge` / `delete_challenge` group permissions.

**Invite links.** `invite-link` returns a signed, 30-minute URL (`…/#/challenges/{id}/unlock/{token}`);
call it again to refresh. `unlock` validates the token and grants the signed-in user permanent access.
Switching a challenge back to `public` clears all existing grants, so a later switch to `private`
starts with no unlocked users.

### Submissions `/api/codepeat/submissions/`

| Method | URL                               | Permission    | Description      |
|--------|-----------------------------------|---------------|------------------|
| GET    | `/api/codepeat/submissions/`      | Authenticated | List submissions |
| GET    | `/api/codepeat/submissions/{id}/` | Authenticated | Get submission   |
| POST   | `/api/codepeat/submissions/`      | Authenticated | Submit solution  |

Filter parameters: `challenge`, `user`, `submitted_at`

### Feedback `/api/codepeat/feedbacks/`

| Method | URL                             | Permission       | Description     |
|--------|---------------------------------|------------------|-----------------|
| GET    | `/api/codepeat/feedbacks/`      | Authenticated    | List feedback   |
| GET    | `/api/codepeat/feedbacks/{id}/` | Authenticated    | Get feedback    |
| POST   | `/api/codepeat/feedbacks/`      | Admin / Teacher  | Create feedback |
| PUT    | `/api/codepeat/feedbacks/{id}/` | Admin / Teacher  | Update feedback |
| PATCH  | `/api/codepeat/feedbacks/{id}/` | Admin / Teacher  | Partial update  |

Filter parameters: `submission`, `lecturer`, `rating`

### Reflections `/api/codepeat/reflections/`

| Method | URL                               | Permission    | Description        |
|--------|-----------------------------------|---------------|--------------------|
| GET    | `/api/codepeat/reflections/`      | Authenticated | List reflections   |
| GET    | `/api/codepeat/reflections/{id}/` | Authenticated | Get reflection     |
| POST   | `/api/codepeat/reflections/`      | Authenticated | Create reflection  |

Filter parameters: `submission`

### Test Results `/api/codepeat/test-results/`

| Method | URL                                | Permission    | Description        |
|--------|------------------------------------|---------------|--------------------|
| GET    | `/api/codepeat/test-results/`      | Authenticated | List test results  |
| GET    | `/api/codepeat/test-results/{id}/` | Authenticated | Get test result    |
| POST   | `/api/codepeat/test-results/`      | Worker only   | Create test result |

Filter parameters: `submission`, `status`

---

## Frontend Integration

### Authentication

All requests need a session cookie or token. Login via allauth headless API:

```http
POST /auth-api/...
```

For frontend API calls, session authentication works automatically if the user is logged in.
For programmatic access (e.g. the worker), use token authentication:

```http
Authorization: Token <token>
```

### Fetching Challenges

```typescript
const response = await fetch('/api/codepeat/challenges/', {
  credentials: 'include',  // send session cookie
});
const data = await response.json();
// data.results = array of challenges
// data.count   = total count
// data.next    = URL of next page
```

### Expanding Relationships

Use `_expand` to embed related objects instead of just IDs:

```typescript
// Expand the course and created_by user
const response = await fetch(
  '/api/codepeat/challenges/?_expand=course,created_by',
  { credentials: 'include' }
);
```

### Submitting a Solution

```typescript
const formData = new FormData();
formData.append('challenge', '<challenge-uuid>');
formData.append('user', '<user-id>');
formData.append('zip_file', file);  // File object from <input type="file">

const response = await fetch('/api/codepeat/submissions/', {
  method: 'POST',
  credentials: 'include',
  headers: {
    'X-CSRFToken': getCsrfToken(),  // required for POST
  },
  body: formData,
});
```

### Getting CSRF Token

```typescript
function getCsrfToken(): string {
  return document.cookie
    .split('; ')
    .find(row => row.startsWith('csrftoken='))
    ?.split('=')[1] ?? '';
}
```

### Filtering and Sorting

```typescript
// Challenges filtered by difficulty, sorted by name
const url = new URL('/api/codepeat/challenges/', window.location.origin);
url.searchParams.set('difficulty', 'easy');
url.searchParams.set('_sort', 'name');
url.searchParams.set('_search', 'fizz');

const response = await fetch(url.toString(), { credentials: 'include' });
```

### Partial Update (PATCH)

```typescript
const response = await fetch(`/api/codepeat/challenges/${id}/`, {
  method: 'PATCH',
  credentials: 'include',
  headers: {
    'Content-Type': 'application/json',
    'X-CSRFToken': getCsrfToken(),
  },
  body: JSON.stringify({ difficulty: 'hard' }),
});
```

---

## API Documentation

Interactive API docs are available at:

```
http://localhost:8000/api/schema/redoc/
```

---

## Fixtures

Demo data is located in `openbook/codepeat/fixtures/`. Load with:

```bash
python manage.py loaddata challenge
python manage.py loaddata submission
python manage.py loaddata feedback
python manage.py loaddata reflection
python manage.py loaddata test_result
```

> Load in this order — submissions depend on challenges, feedback/reflection/test_result depend on submissions.

---

## Groups & Permissions

CodePeat reuses OpenBook's platform-wide groups rather than defining its own roles.

**Group: `Teacher`** (provided by the openbook_auth fixtures)

- Challenge permissions are attached automatically by migration
  `0003_teacher_challenge_permissions`:
  - `codepeat | challenge | Can add challenge`
  - `codepeat | challenge | Can change challenge`
- Members may create/edit challenges (this drives the "+" button on the challenge
  overview, gated by the `challenges/can-create` endpoint).

To make someone a teacher, assign them to the `Teacher` group under
`/admin/ → Auth → Users`.

> Not yet auto-configured: feedback permissions (`add_feedback`, `change_feedback`)
> and the `Student` submission/reflection permissions. Add these to the relevant
> groups in the admin when those flows are wired up.

---

## TODO: Background Worker

> ⚠️ Not yet implemented. TestResults are currently created manually via the API.

The worker is responsible for automatically running tests on submitted ZIP files and
writing the results back as `TestResult` entries.

Planned approach:
- Trigger via Django Signal on `Submission` creation or via Celery task
- Redis (already in stack) as message broker
- Worker unpacks the ZIP, runs the test suite, and POSTs a `TestResult` to the API

Endpoints the worker will use:
```http
POST /api/codepeat/test-results/
Authorization: Token <worker-token>
Content-Type: application/json

{
  "submission": "<submission-uuid>",
  "status": "passed",
  "output": "All tests passed."
}
```

---

## Migrations

After any model change:

```bash
python manage.py makemigrations codepeat
python manage.py migrate
```
