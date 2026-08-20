# dragon-todo backend

A REST API for task storage, built so the existing Go TUI and any future client
(web UI, mobile, another CLI) can share one backend instead of each reading a
local `todo.txt` file independently. Multi-user, JWT-authenticated, backed by
SQLite, MySQL, or PostgreSQL.

- **Framework**: Symfony 8 + [API Platform](https://api-platform.com/) (attribute-driven REST + auto-generated OpenAPI docs)
- **Runtime**: [FrankenPHP](https://frankenphp.dev/) (Caddy + PHP, worker mode in prod)
- **Auth**: JWT bearer tokens ([LexikJWTAuthenticationBundle](https://github.com/lexik/LexikJWTAuthenticationBundle)) with rotating refresh tokens ([GesdinetJWTRefreshTokenBundle](https://github.com/markitosgv/JWTRefreshTokenBundle))
- **Database**: Doctrine ORM/DBAL — SQLite (default, zero-config), MySQL, or PostgreSQL via `DATABASE_URL`

## Quick start (Docker)

```bash
cd backend
docker compose up --build
```

This builds the `dev` FrankenPHP image, bind-mounts the source, and serves the API
on `http://localhost:8000` using SQLite (a file under `var/`) — no database service
required. `frankenphp/docker-entrypoint.sh` runs pending migrations automatically
on container start.

To use MySQL or PostgreSQL instead, start the matching profile and point
`DATABASE_URL` (in `.env.local`) at it — see [Database engines](#database-engines) below:

```bash
docker compose --profile mysql up --build
# or
docker compose --profile postgres up --build
```

## Quick start (local PHP)

Requires PHP 8.4+ (target is 8.5; see [PHP/Symfony version note](#phpsymfony-version-note))
and Composer.

```bash
cd backend
composer install
cp .env .env.local   # then fill in APP_SECRET and JWT_PASSPHRASE, see below
bin/console lexik:jwt:generate-keypair
bin/console doctrine:migrations:migrate --no-interaction
symfony server:start   # or: php -S localhost:8000 -t public
```

### Local secrets

`.env` is committed and intentionally has no real secrets in it. Generate your own
in `.env.local` (gitignored):

- `APP_SECRET`: any random string.
- `JWT_PASSPHRASE`: any random string — `bin/console lexik:jwt:generate-keypair`
  reads it from the environment and writes matching keys to `config/jwt/*.pem`
  (also gitignored).

Running the test suite additionally needs an `.env.test.local` (gitignored) with
the *same* `JWT_PASSPHRASE` as `.env.local` — Symfony intentionally does not load
`.env.local` when `APP_ENV=test`, so the passphrase has to be duplicated there for
`bin/phpunit` to be able to sign/verify JWTs against the same `config/jwt/*.pem`
keypair.

## API overview

All endpoints are under `/api`. Interactive OpenAPI docs are at `/api/docs`.

| Endpoint | Auth | Description |
|---|---|---|
| `POST /api/register` | none | Create an account (`email`, `password`) |
| `POST /api/login` | none | Exchange credentials for an access + refresh token |
| `POST /api/token/refresh` | none (refresh token in body) | Exchange a refresh token for a new pair (single-use: the old one stops working) |
| `GET/POST /api/tasks` | Bearer JWT | List / create tasks for the current user |
| `GET/PATCH/DELETE /api/tasks/{id}` | Bearer JWT | Read / partially update / delete one task |

Task fields mirror the Go TUI's todo.txt model (`internal/todotxt/task.go`):
`description`, `details`, `done`, `priority` (A–Z), `createdOn`, `completedOn`,
`dueDate`, `projects`, `contexts`, plus a real `parentTask` relation in place of
the file format's indent-based subtask hierarchy. `extensions` is read-only —
it's derived (currently just a `due` key mirroring `dueDate`) for round-trip
fidelity with the todo.txt format, not a place to write arbitrary key:value pairs.

Requests/responses use JSON-LD (`Content-Type`/`Accept: application/ld+json`);
writes use `application/merge-patch+json` for `PATCH`. See
`internal/apiclient/` at the repo root for a minimal working Go client.

## Database engines

`DATABASE_URL` selects the engine; all three are supported by the same entity
mappings and migrations (verified against SQLite in this environment — see
[Known limitations](#known-limitations) for MySQL/PostgreSQL).

```bash
# SQLite (default)
DATABASE_URL="sqlite:///%kernel.project_dir%/var/data.db"

# MySQL (matches the `mysql` compose profile)
DATABASE_URL="mysql://app:!ChangeMe!@database:3306/dragontodo?serverVersion=8.0&charset=utf8mb4"

# PostgreSQL (matches the `postgres` compose profile)
DATABASE_URL="postgresql://app:!ChangeMe!@database:5432/dragontodo?serverVersion=16&charset=utf8"
```

Schema changes always go through `bin/console doctrine:migrations:migrate` —
including for a brand-new SQLite file — so `migrations/` stays the single source
of truth for the schema on every engine.

## Security design

- **Per-user isolation**: every Task query (list, get, and relation lookups like
  resolving a `parentTask` IRI) is scoped to the authenticated user at the Doctrine
  query-builder level by `src/Doctrine/CurrentUserExtension.php` — a cross-user
  task id is structurally unreachable, not just rejected after the fact. Writes go
  through `src/State/TaskOwnerProcessor.php`, which forces `owner` to the current
  user on create (the field is never client-writable in the first place) and
  double-checks ownership on update/delete, returning 404 (not 403) so a caller
  can't tell a task id exists at all if it isn't theirs.
- **JWT + rotating refresh tokens**: short-lived access tokens (15 min,
  `JWT_TOKEN_TTL`), single-use refresh tokens that reissue on every use, hashed at
  rest (`hash_tokens` in `config/packages/gesdinet_jwt_refresh_token.yaml`).
- **Login throttling**: `login_throttling` on both the `/api/login` and
  `/api/token/refresh` firewalls in `config/packages/security.yaml`.
- **CORS**: `nelmio/cors-bundle`, origins configured via `CORS_ALLOW_ORIGIN`.
- **Registration** is a dedicated controller (not an API Platform CRUD resource on
  `User`) so only `email`/`password` are ever writable — a client can never reach
  `roles` or set a pre-hashed `password`.

## Known limitations

- **doctrine/orm is pinned to `^3.5,<3.6`** (see `composer.json`). `doctrine/orm`
  3.6+ and the `doctrine:migrations:diff`/`doctrine:schema:create` tooling need
  `doctrine/dbal ^4.5`, which is not yet a published stable release (only
  `4.5.x-dev` at the time this was built). Revisit this pin once DBAL 4.5 ships.
- **MySQL/PostgreSQL schema portability was not verified against live
  containers** in the environment this was built in (no Docker daemon available).
  The migration only exercises SQLite. All column types were chosen to be
  portable (Doctrine's `json`, `date_immutable`/`datetime_immutable`, MySQL-safe
  string lengths — see field-level comments in `src/Entity/Task.php`), but before
  a real MySQL/PostgreSQL deployment, run `bin/console doctrine:migrations:diff`
  against a scratch instance of each (`docker compose --profile mysql up` /
  `--profile postgres up`) and confirm it reports no diff.
- **`reuse_detection` (revoking a refresh token's whole session if a spent
  single-use token is replayed) is disabled** in
  `config/packages/gesdinet_jwt_refresh_token.yaml` — its DI wiring for the
  cache-backed spent-token registry doesn't resolve under this Symfony 8
  environment (`%param%`-as-service-id resolution fails at container compile
  time). `single_use: true` rotation is still on, which already bounds a stolen
  refresh token's usefulness to "until the legitimate client's next refresh."
  Revisit once the bundle confirms Symfony 8 compatibility.
- **The FrankenPHP Docker image was not built/run** in this environment (no
  Docker daemon available) — `compose.yaml`/`compose.override.yaml` validate
  cleanly with `docker compose config`, but building the image and running a
  request through it hasn't been exercised end to end. The application itself
  *was* run and manually verified end-to-end via PHP's built-in dev server
  (`php -S`) against SQLite: register → login → create/list/patch/delete a task →
  refresh token rotation, all confirmed working.
- **PHP 8.5 itself wasn't available to test against** in this environment (only
  8.4.19 was installed); the app was built and tested on PHP 8.4, which
  `composer.json`'s `"php": ">=8.4"` and Symfony 8 both support. The FrankenPHP
  Dockerfile targets a `dunglas/frankenphp:1-php8.5` base image with a documented
  fallback to `-php8.4` if that tag isn't available yet.

## Explicitly out of scope (this pass)

A web UI, wiring the Go TUI to actually use this API (`internal/apiclient/` is a
starting point, not yet called from `cmd/`/`internal/tui/`), offline sync/conflict
resolution, third-party OAuth2/OIDC login, GraphQL, an admin UI, and a CI pipeline
definition.

## Tests

```bash
cd backend
bin/console doctrine:migrations:migrate --no-interaction --env=test
bin/phpunit
```

`tests/bootstrap.php` also resets and re-migrates the SQLite test database
automatically at the start of every run, so this is mostly redundant — it's
there for the first run before `var/` exists.
