# Task Manager — Spring Boot + React

A minimal full-stack CRUD app: a Spring Boot REST API backed by PostgreSQL, and a
React (Vite) single-page frontend. No authentication — everything is open, which
keeps it suitable for local development and learning only.

```
myspringbootcrud/
├── backend/            Spring Boot 3.5 · Java 21 · Maven
├── frontend/           React 19 · Vite
└── docker-compose.yml  Optional PostgreSQL container
```

## Prerequisites

| Tool       | Version used |
|------------|--------------|
| JDK        | 21           |
| Maven      | 3.9+         |
| Node.js    | 20+          |
| PostgreSQL | 16           |

## 1. Start PostgreSQL

Either run the bundled container:

```bash
docker compose up -d
```

…or point the app at a PostgreSQL you already have, creating the database by hand:

```bash
psql -U postgres -c "CREATE USER taskuser WITH PASSWORD 'taskpass';"
psql -U postgres -c "CREATE DATABASE taskmanager OWNER taskuser;"
```

Either way the defaults are database `taskmanager`, user `taskuser`, password
`taskpass` on `localhost:5432`. Override with the `DB_HOST`, `DB_PORT`, `DB_NAME`,
`DB_USER` and `DB_PASSWORD` environment variables.

The `tasks` table is created automatically on first start
(`spring.jpa.hibernate.ddl-auto=update`).

## 2. Run the backend

```bash
cd backend
mvn spring-boot:run
```

The API listens on <http://localhost:8080>.

## 3. Run the frontend

```bash
cd frontend
npm install
npm run dev
```

The UI is served at <http://localhost:5173> and talks to the API at
`http://localhost:8080` by default. To point it elsewhere, copy `.env.example`
to `.env` and set `VITE_API_URL`.

## API

Base path `/api/tasks`.

| Method   | Path              | Purpose                        | Success |
|----------|-------------------|--------------------------------|---------|
| `GET`    | `/api/tasks`      | List tasks, newest first       | 200     |
| `GET`    | `/api/tasks?status=DONE` | List tasks with one status | 200 |
| `GET`    | `/api/tasks/{id}` | Fetch a single task            | 200     |
| `POST`   | `/api/tasks`      | Create a task                  | 201     |
| `PUT`    | `/api/tasks/{id}` | Replace a task                 | 200     |
| `DELETE` | `/api/tasks/{id}` | Delete a task                  | 204     |

### Task

| Field         | Type                                | Notes                              |
|---------------|-------------------------------------|------------------------------------|
| `id`          | number                              | Assigned by the server             |
| `title`       | string                              | Required, 1–200 characters         |
| `description` | string \| null                      | Optional, up to 2000 characters    |
| `status`      | `TODO` \| `IN_PROGRESS` \| `DONE`   | Defaults to `TODO` when omitted    |
| `dueDate`     | `YYYY-MM-DD` \| null                | Optional                           |
| `createdAt`   | ISO-8601 instant                    | Read-only                          |
| `updatedAt`   | ISO-8601 instant                    | Read-only                          |

### Example

```bash
curl -X POST http://localhost:8080/api/tasks \
  -H 'Content-Type: application/json' \
  -d '{"title":"Buy milk","description":"2 litres","status":"TODO","dueDate":"2026-10-01"}'
```

```json
{
  "id": 1,
  "title": "Buy milk",
  "description": "2 litres",
  "status": "TODO",
  "dueDate": "2026-10-01",
  "createdAt": "2026-09-19T17:20:45.153343733Z",
  "updatedAt": "2026-09-19T17:20:45.153343733Z"
}
```

Errors come back as RFC 7807 problem details. Validation failures add a per-field
`errors` object:

```json
{
  "type": "about:blank",
  "title": "Validation failed",
  "status": 400,
  "detail": "One or more fields are invalid",
  "instance": "/api/tasks",
  "errors": { "title": "title must not be blank" }
}
```

## Tests

```bash
cd backend && mvn test     # 8 integration tests over the full API, on in-memory H2
cd frontend && npm run lint && npm run build
```

## Notes before using this beyond a local machine

- **No authentication or authorisation.** Every endpoint is public by design.
- **CORS** allows only `http://localhost:5173` (see `app.cors.allowed-origins`).
- **Schema management** uses Hibernate's `ddl-auto=update`, which is convenient
  for development but not safe for production — switch to Flyway or Liquibase.
- **Credentials** are checked-in defaults meant for local use; supply real ones
  through environment variables anywhere else.
