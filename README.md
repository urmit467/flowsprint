# FlowSprint — AI-Powered Project Management Platform

Full-stack sprint planning / backlog / workload tracking app with LLM-assisted
task descriptions and sprint summaries.

Stack: React (Vite) · Node.js · Express · MongoDB · LangChain (Groq + Gemini) · JWT (httpOnly cookies)

## Structure
```
flowsprint/
  backend/     Express API, MongoDB models, LangChain AI service
  frontend/    Vite + React client
```

## 1. Backend setup

```bash
cd backend
npm install
cp .env.example .env
```

Fill in `.env`:
- `MONGO_URI` — local MongoDB or Atlas connection string
- `JWT_SECRET` — any long random string
- `GROQ_API_KEY` — from https://console.groq.com
- `GOOGLE_API_KEY` — Gemini key from https://aistudio.google.com/app/apikey

Run:
```bash
npm run dev
```
API runs on `http://localhost:5000`.

## 2. Frontend setup

```bash
cd frontend
npm install
npm run dev
```
App runs on `http://localhost:5173` and proxies `/api` calls to the backend.

## How auth works
- Register/login issue a JWT signed on the server and set as an `httpOnly` cookie
  (`sameSite: strict`). The frontend never touches the token directly — axios is
  configured with `withCredentials: true` so the cookie rides along automatically.
- `protect` middleware reads the cookie, verifies the JWT, attaches `req.user`.
- `authorize(...roles)` middleware gates admin/manager-only routes (creating
  projects, sprints, tasks, deleting things).

## Roles
- **admin** — full access, can delete projects, sees everything
- **manager** — creates/manages their own projects, sprints, tasks
- **member** — sees assigned projects, updates task status

The very first person to register on a fresh database automatically becomes
admin (no manual DB editing needed to bootstrap a workspace). Everyone who
registers after that defaults to `member` unless a manager/admin adds them
to a project or promotes them.

## AI features (LangChain)
`backend/services/llmService.js` wraps two providers — Groq is tried first
(fast, cheap), falling back to Gemini if Groq isn't configured or fails.
Used for:
- Task description generation (from just a title)
- Sprint summary generation (from the sprint's task list)
- Workload/productivity recommendations (from story-point distribution)

## Notes
- Analytics (task completion by status, workload by assignee) are computed
  client-side from the already-fetched task list using `recharts` — no extra
  aggregation endpoint needed for a dataset this size.
- Kept deliberately un-fancy: no state management library, just React
  `useState`/`useEffect` and a small `AuthContext`. Easy to extend to Redux
  Toolkit later if needed.
