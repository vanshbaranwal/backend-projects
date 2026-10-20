## Task Manager API

### Run locally

1. Start MongoDB with `docker start mongodb`, or run the complete stack with `docker compose up --build`.
2. Copy `env.example` to `.env` and set the MongoDB and JWT secrets.
3. Run `npm install` and `npm start`.

The API runs on `http://localhost:8000` by default.

### Main endpoints

| Area     | Endpoints                                                                                                                                 |
| -------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Health   | `GET /api/v1/healthcheck/`                                                                                                                |
| Auth     | `POST /api/v1/auth/register`, `/login`, `/logout`, `/refresh-token`, `/forgot-password`, `/reset-password/:token`, `/verify-email/:token` |
| User     | `GET /api/v1/auth/me`, `PATCH /api/v1/auth/avatar`                                                                                        |
| Projects | `POST/GET /api/v1/projects`, `GET/PATCH/DELETE /api/v1/projects/:projectId`, `GET/PATCH /:projectId/stats|archive`                         |
| Members  | `GET/POST /api/v1/projects/:projectId/members`, `PATCH/DELETE /api/v1/projects/:projectId/members/:userId`                                |
| Tasks    | `POST /api/v1/tasks`, `GET /api/v1/tasks/project/:projectId`, `GET/PATCH/DELETE /api/v1/tasks/:taskId`                                    |
| Subtasks | `POST /api/v1/subtasks`, `GET /api/v1/subtasks/task/:taskId`, `PATCH/DELETE /api/v1/subtasks/:subTaskId`                                  |
| Notes    | `POST /api/v1/notes`, `GET /api/v1/notes/project/:projectId`, `PATCH/DELETE /api/v1/notes/:noteId`                                        |

Protected endpoints accept either the `accessToken` cookie or an `Authorization: Bearer <accessToken>` header.

Task lists support `status`, `priority`, `assignedTo`, `search`, `page`, and `limit` query parameters. Task creation accepts up to five `attachments` files using multipart form data.
