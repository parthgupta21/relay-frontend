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
- App shell: `Sidebar` (nav, "Soon" items disabled, endpoints usage meter fetched per navigation, user dropdown) in `AppLayout`; below `lg` it renders inside a `Sheet`. Inspector is two-pane at `lg` (`matchMedia` via `useSyncExternalStore`); below that rows link to `/app/events/:id`. `EventPanel` (exported from `EventDetail.jsx`) is shared by the pane and the page.
- Payloads render as text only. Never use `dangerouslySetInnerHTML`.

## API contract used (all under /api/v1)
- Errors: `{ error: { code, message, details?, requestId } }`.
- Auth: register, verify-email, resend-verification, login, logout, forgot-password, reset-password, me.
- Endpoints: list, create, get, patch, delete, rotate-slug.
- Events: `GET /endpoints/:id/events?limit&cursor&method`, `GET /events/:id` (includes `deliveries`), `GET /events/:id/body` (download link).
- Destinations: list/create under `/endpoints/:id/destinations`, `PATCH|DELETE /destinations/:id`, `POST /destinations/:id/rotate-secret`. Create and rotate return `signingSecret` once; shown in `DestinationsPanel`'s secret dialog. `ApiError.details` carries 422 field errors (shown under the URL field).
- Deliveries: `GET /deliveries/:id` with `attempts`; `DeliveryDetail` polls every 5s while pending, in flight or retrying.

- Replay: `POST /deliveries/:id/replay` (body `{}`) returns `{ delivery }`; `POST /events/:id/replay` (`{ destinationIds }`) returns `{ deliveries }`. Both send a fresh `Idempotency-Key` (`crypto.randomUUID()`) per call via `apiFetch`'s `headers` option. 429 `QUOTA_EXCEEDED` shows the toast "Replay limit reached, try again later".
- Delivery fields used: `trigger`, `replayOf`, `failureReason`, `nextAttemptAt`, optional `maxAttempts`.

## Run
1. Start the backend on port 3000 (repo `relay-backend`).
2. `npm install`, then `npm run dev` (http://localhost:5173).
3. Gates: `npm run build`, `npm run lint`.

## Phases
- [x] 1 Capture + inspector: auth pages, endpoints list/create, inspector (events list, polling, rotate/rename/delete), event detail (done; API flow verified through the Vite proxy against the live backend on 2026-10-20)
- [x] 2 Forwarding / delivery timeline UI (destinations tab, event deliveries section, `/app/deliveries/:id`; also landing page and design system; not yet exercised against the phase 2 backend)
- [x] 3 Reliability / replay UI (replay button on delivery, `ReplayDialog` on event, Retrying/manual states, retry countdown; coded against the contract, not run against the phase 3 backend)
- [ ] 4 Realtime + analytics charts
- [ ] 5 Tokens / usage / account pages
- [ ] 6 Launch

## Known gaps
- API flow (register, verify link, endpoint, ingest, byte-exact body) verified through the proxy; pages not yet clicked through in a real browser. Backend needs `APP_BASE_URL=http://localhost:5173`.
- No automated frontend tests.
- Changing the method filter briefly shows the previous list until the new page loads; a poll in that window can merge stale rows.
- Reloading the endpoints list after create replaces the page with an error if that reload fails.
- UI never clicked through in a real browser; checked only by build, lint and dev-server fetches.
- Landing code sample uses an assumed signature scheme (`x-relay-signature`-less hex HMAC-SHA256 of the raw body); confirm against the backend delivery signer.
- Destination timeout default is unknown to the UI: empty field omits `timeoutMs`.
- `maxAttempts` is not in the delivery contract; "attempt N of max" only renders if the backend sends it.
- Event page deliveries list does not poll; it refreshes only after a replay or reload.
- Replay with a stale destination selection (destination deleted meanwhile) surfaces the backend error inline in the dialog.
- Sidebar usage meter refetches the endpoint list on every navigation.
