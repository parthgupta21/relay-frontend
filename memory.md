# RELAY frontend: working log

RELAY is a hosted webhook capture and forwarding SaaS: users create an endpoint (public URL) and every HTTP request to it is captured and shown in an inspector.
Design doc: https://claude.ai/code/artifact/f69bd9a8-ff89-4860-81d7-391cddee88a4

## Decisions
- Vite + React 19 in JavaScript (JSX), not TypeScript. Tailwind v4 + shadcn/ui (`components.json` has `"tsx": false`, alias `@` -> `src`).
- No state library: React state plus `src/api/client.js` (`apiFetch`, throws `ApiError {status, code, message, requestId}`).
- Live updates are polling (`usePolling`, 5 s) until phase 4 adds sockets; swap the hook, not the pages.
- Dev server proxies `/api` and `/h` to `http://localhost:3000`, so cookies are same-origin.
- Lint is `oxlint` (what the current Vite template ships), not eslint.
- Payloads render as text only. Never use `dangerouslySetInnerHTML`.

## API contract used (all under /api/v1)
- Errors: `{ error: { code, message, details?, requestId } }`.
- Auth: register, verify-email, resend-verification, login, logout, forgot-password, reset-password, me.
- Endpoints: list, create, get, patch, delete, rotate-slug.
- Events: `GET /endpoints/:id/events?limit&cursor&method`, `GET /events/:id`, `GET /events/:id/body` (download link).

## Run
1. Start the backend on port 3000 (repo `relay-backend`).
2. `npm install`, then `npm run dev` (http://localhost:5173).
3. Gates: `npm run build`, `npm run lint`.

## Phases
- [ ] 1 Capture + inspector: auth pages done (F1); endpoints and inspector (F2) pending
- [ ] 2 Forwarding / delivery timeline UI
- [ ] 3 Reliability / replay UI
- [ ] 4 Realtime + analytics charts
- [ ] 5 Tokens / usage / account pages
- [ ] 6 Launch

## Known gaps
- Not tested against the real backend yet (it was not running during development).
- No automated frontend tests.
