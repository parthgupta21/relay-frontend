# RELAY frontend: working log

RELAY is a hosted webhook capture and forwarding SaaS: users create an endpoint (public URL) and every HTTP request to it is captured and shown in an inspector.
Design doc: https://claude.ai/code/artifact/f69bd9a8-ff89-4860-81d7-391cddee88a4

## Decisions
- Vite + React 19 in JavaScript (JSX), not TypeScript. Tailwind v4 + shadcn/ui (`components.json` has `"tsx": false`, alias `@` -> `src`).
- No state library: React state plus `src/api/client.js` (`apiFetch`, throws `ApiError {status, code, message, requestId}`).
- Live updates are polling (`usePolling`, 5 s) until phase 4 adds sockets; swap the hook, not the pages.
- Dev server proxies `/api` and `/h` to `http://localhost:3000`, so cookies are same-origin.
- Lint is `oxlint` (what the current Vite template ships), not eslint.
- Design system: Geist Sans/Mono (`@fontsource-variable`), zinc neutrals with one violet accent (`brand`, `brand-text`), semantic `success`/`warning`/`info` tokens in `index.css`. Dark-first via class on `<html>`; `useTheme` follows the system until the user toggles, persisted in localStorage (try/catch). Toasts via `sonner`; motion via `motion` with `MotionConfig reducedMotion="user"`.
- Routes: `/` landing (public), auth pages, `/app/*` behind `RequireAuth`; old `/endpoints...` and `/events/:id` redirect to `/app/...`.
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
- [x] 1 Capture + inspector: auth pages, endpoints list/create, inspector (events list, polling, rotate/rename/delete), event detail (done; API flow verified through the Vite proxy against the live backend on 2026-10-20)
- [ ] 2 Forwarding / delivery timeline UI
- [ ] 3 Reliability / replay UI
- [ ] 4 Realtime + analytics charts
- [ ] 5 Tokens / usage / account pages
- [ ] 6 Launch

## Known gaps
- API flow (register, verify link, endpoint, ingest, byte-exact body) verified through the proxy; pages not yet clicked through in a real browser. Backend needs `APP_BASE_URL=http://localhost:5173`.
- No automated frontend tests.
- Changing the method filter briefly shows the previous list until the new page loads; a poll in that window can merge stale rows.
- Reloading the endpoints list after create replaces the page with an error if that reload fails.
- Deliveries section is a placeholder until phase 2.
