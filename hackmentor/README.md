# HackMentor

AI-powered mentor UI for hackathon teams. This repository folder is the **responsive web frontend only**.

It is not a native app, not an APK, and not a PWA yet. Layout and navigation are structured so a service worker / manifest can be added later without rewriting pages.

## Run

```bash
cd hackmentor
npm install
npm run dev
```

Open the local Vite URL. Use **Load TechNova demo** on onboarding for a complete sample hackathon, or complete the three-step setup.

## Demo vs live API

Copy `.env.example` to `.env`.

| Variable | Purpose |
| --- | --- |
| `VITE_API_URL` | Backend origin, no trailing slash. Empty keeps demo mode. |
| `VITE_USE_MOCK` | `true` forces the mock service layer. `false` calls the live API. |

Mock data lives in `src/data/mock.ts`. HTTP + streaming helpers live in `src/api/client.ts`. Endpoint functions live in `src/services/api.ts`.

The UI never implements agent reasoning. It collects input, calls an endpoint, and renders the response (including streamed mentor tokens when the backend sends SSE or a text stream).

## Endpoints expected by the client

- `POST /api/onboarding`
- `POST /api/problem/analyze`
- `POST /api/project/ideas`
- `POST /api/project/validate`
- `POST /api/mentor/chat` (JSON or `text/event-stream` when `stream: true`)
- `POST /api/roadmap/generate`
- `POST /api/tasks/generate`
- `POST /api/project/review`
- `POST /api/resources/search`
- `POST /api/pitch/generate`
- `POST /api/judge/questions`
- `GET /api/project`
- `GET /api/team`
- `GET /api/tasks`

## Scripts

- `npm run dev` — local web app
- `npm run build` — production bundle
- `npm run preview` — serve the build
