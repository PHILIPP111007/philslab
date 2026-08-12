# AGENTS.md — Instructions for Working with PhilsLab

This file describes the repository structure, development rules, and operational conventions for AI agents and developers. More detailed frontend conventions are documented in [`docs/FRONTEND.md`](docs/FRONTEND.md), [`docs/STYLES.md`](docs/STYLES.md), and [`docs/DATABASE_SCHEMA.md`](docs/DATABASE_SCHEMA.md).

## Project Purpose

PhilsLab is a laboratory journal with a React interface and two API backends:

- Django serves API version `v1`, authentication, the admin interface, and the legacy part of the domain logic.
- FastAPI serves API version `v2`, CRUD operations for laboratory entities, and task management.
- React + Vite is the client application.
- PostgreSQL is used by the Docker environment; local development uses SQLite.

## Repository Structure

```text
Frontend/react/app/       React/Vite application
Services/django/          Django project, API v1, and admin
Services/fastapi/         FastAPI project, API v2
dockerfiles/              Dockerfiles for Django, FastAPI, and React/nginx
docs/                     Database, frontend, and styling documentation
graphify-out/             Generated repository graph index
Makefile                  Main development commands
docker-compose.yml        Full stack with PostgreSQL and nginx
```

Do not treat `graphify-out` as the source of truth: source code and documentation take precedence. Generated graph files must not be edited manually.

## Architecture and Routing

In local development, the frontend runs at `http://localhost:5173`, Django at `http://localhost:8000`, and FastAPI at `http://localhost:8001`.

In the production-like Docker stack, the client nginx accepts traffic on port `80` and proxies it as follows:

```text
/api/v1/      -> django:8080
/api/v2/      -> fastapi:8080
/ws/v1/       -> django:8080 (WebSocket)
/ws/v2/       -> fastapi:8080 (WebSocket)
/admin_page/  -> Django admin
/docs         -> FastAPI OpenAPI docs
/             -> built React application
```

The frontend must access the API through `src/API/Fetch.js`:

- `APIVersion.V1` selects the Django API.
- `APIVersion.V2` selects the FastAPI API.
- Authentication is sent as `Authorization: Token <token>`.
- A normal response is expected to contain an `ok` field; errors may be in `error` or `detail`.
- For `FormData`, pass `is_uploading_file: true` so that a JSON `Content-Type` is not set.

Do not add direct `fetch` calls to pages when the request can be made through `Fetch`.

## Domain Model

The main FastAPI/shared-database entities are:

- `User` — a user who owns samples, batches, and protocols and can create or be assigned tasks.
- `Protocol` — a protocol/SOP created by a user and containing `Stage` records.
- `Stage` — a protocol stage.
- `Task` — a task with priority, deadline, status, protocol, batches, history, and assignees.
- `TaskStage` — a copy of a protocol stage inside a specific task; task progress is calculated from completed copies.
- `Batch` — a batch of samples linked to `Sample` and `Task` through link tables.
- `Sample` — a primary laboratory sample.
- `QueryHistory` — task change history with an action type, old/new values, and a comment.
- `Token` — an authentication token.

Many-to-many relationships are implemented by `BatchSampleLink` and `TaskBatchLink`. `ProtocolStageLink` and `TaskStageLink` also exist in the code; when changing the schema, first check the current models and Django migrations.

FastAPI models use SQLModel and `app_*` table names that match the Django tables. Do not rename tables or foreign keys without checking both backend implementations and the migrations.

Django model changes require migrations. In local development, `make django` runs `makemigrations` and `migrate`; review any new migration files and include them intentionally.

## Backend Change Rules

### FastAPI

- Entry point: `Services/fastapi/app/main.py`.
- API prefix: `/api/v2`.
- Routers are in `Services/fastapi/app/views/`.
- Pydantic request schemas are in `Services/fastapi/app/request_body/`.
- Obtain database sessions through `SessionDep` from `app.database`; use asynchronous SQLAlchemy/SQLModel queries.
- The authenticated user is available as `request.state.user`; middleware reads the Token header and loads the user.
- Do not bypass access checks in existing view functions.
- Task changes should create `QueryHistory` entries when a tracked field changes.
- Main routers: user, sample, protocol, stage, task, batch, and department.

### Django

- Project settings and entry points are in `Services/django/settings/`.
- API prefix: `/api/v1`.
- Auth endpoints include Djoser and token login/logout:
  - `POST /api/v1/auth/users/`
  - `GET /api/v1/auth/users/me/`
  - `POST /api/v1/token/login/`
  - `POST /api/v1/token/logout/`
- The admin interface is available at `/admin_page/`.
- The custom user model is `app.User`; do not change `AUTH_USER_MODEL` without a migration plan.
- Django and FastAPI contain parallel representations of the same domain tables. When changing a shared entity, check both backends.

## Frontend Change Rules

- Pages are located in `Frontend/react/app/src/pages/`.
- Shared components are located in `src/pages/components/`; put every new component in its own directory with `.jsx` and `.css` files.
- Public routes are in `src/data/routes.jsx` under `PublicRoutes`; protected routes are under `PrivateRoutes` and go through `ProtectedRoute`.
- Most pages use a `:username` route parameter; preserve the existing route format and `rememberPage` behavior.
- Pages are loaded with `React.lazy`; preserve `SuspenseLoading` for lazy loading.
- The auth token is stored in `localStorage` through `src/modules/token.js`. Do not duplicate token storage logic in pages.
- The current user is provided through `UserContext`; authentication state is provided through `AuthContext`.
- Keep string constants, HTTP methods, API versions, themes, and enum values in `src/data/`.
- Send notifications through `src/modules/notify.js`.
- Preserve memoization (`React.memo`, `useMemo`) where it is already needed for large tables and lists.
- Reuse existing `Button`, `LinkButton`, `Badge`, `Alert`, `Table`, `Spinner`, `ProgressBar`, `Header`, and other UI components instead of duplicating them.

## Styling

The interface follows a VS Code Dark Theme design system. The main CSS variables are defined in `App.css` and the theme files:

```css
--bg, --bg-light, --bg-hover, --bg-selected, --bg-active
--border, --border-light
--text, --text-light, --text-dark, --text-white
--blue, --green, --red, --orange, --pink, --yellow
--radius-sm, --radius-md, --radius-lg
--shadow, --transition
```

Rules:

- Prefer existing classes from `docs/STYLES.md`.
- Use BEM naming: `.block__element--modifier`.
- Take colors, spacing, and animation values from CSS variables whenever possible.
- Do not add inline styles when an existing component or class solves the problem.
- Preserve responsive behavior for `max-width: 768px` and `max-width: 480px`.

## Installation and Running

From the repository root:

```bash
make create_env
```

This creates `Services/fastapi/.venv`, `Services/django/.venv`, and installs frontend npm dependencies.

Run individual parts:

```bash
make react          # Vite at http://localhost:5173
make django         # Django/uvicorn at http://localhost:8000
make fastapi        # FastAPI/uvicorn at http://localhost:8001
make test           # pytest for FastAPI
make createsuperuser
make shell          # Django shell
make update_js_env  # sudo npm update; run only intentionally
```

Run the full Docker stack:

```bash
docker compose up --build
```

Before stopping the stack or removing containers, check the `pgdata` volume. Do not delete the volume without an explicit user request.

In local development:

- Django runs with `DEVELOPMENT=1`, `DEBUG=1`, and uses `Services/django/db.sqlite3`.
- FastAPI runs with `DEVELOPMENT=1`, `TESTING=0`, and connects to the Django SQLite database file.
- FastAPI tests use `TESTING=1` and an in-memory SQLite database.

## Environment Variables

Backend:

```text
DEVELOPMENT=0|1
TESTING=0|1                 # FastAPI
SECRET_KEY=<secret>
DATETIME_FORMAT=%Y-%m-%d %H:%M
PG_NAME, PG_USER, PG_HOST, PG_PORT, PG_PASSWORD
DEBUG=0|1                   # Django
ALLOWED_HOSTS=host1,host2
```

Frontend:

```text
VITE_DEVELOPMENT=1
VITE_PROD_SERVER_HOST=<host>
VITE_PROD_SERVER_PORT=<port>
```

Never commit real secrets, tokens, passwords, `.env` files, or local databases. The secret values in `docker-compose.yml` are examples and must not be used as production secrets.

## Checks Before Handoff

For the backend:

```bash
make test
```

For the frontend:

```bash
cd Frontend/react/app
npm run lint
npm run build
```

If an API change is made, additionally verify the relevant endpoint, the `ok/error/detail` response format, authentication, and both API versions when the entity is used by Django and FastAPI.

Before finishing work:

1. Check `git diff` and `git status`.
2. Do not erase user changes or run `git reset --hard`.
3. Do not add build artifacts, `node_modules`, `.venv`, local databases, or secrets to a commit.
4. If the database schema changed, check migrations and FastAPI model compatibility.

## Graphify

The repository contains a generated index at `graphify-out/graph.json`. The latest build used AST-only code analysis without an LLM: 454 nodes, 1053 links, and 43 communities. It is a navigation index, not a replacement for reading the source code.

When the `/home/froschin/work/philslab/.venv` environment is available, update the graph with:

```bash
source .venv/bin/activate
graphify extract . --code-only
```

For a regular local update without semantic LLM analysis, this is also acceptable:

```bash
source .venv/bin/activate
graphify update .
```

After major changes, compare the graph with the source code. Do not edit `graph.json` manually.

## Source-of-Truth Priority

When information conflicts, use this order of precedence:

1. Actual source code and runtime configuration.
2. Migrations and models from both backend parts.
3. `docs/`.
4. `graphify-out/` as an index.
5. Older examples in the README.

For unclear business logic, first look for an existing analogue in the relevant backend and frontend. If the behavior still cannot be determined safely, ask the user before changing a public API or database schema.
