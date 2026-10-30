# RELAY frontend: working log

RELAY is a hosted webhook capture and forwarding SaaS: users create an endpoint (public URL) and every HTTP request to it is captured and shown in an inspector.
Design doc: https://claude.ai/code/artifact/f69bd9a8-ff89-4860-81d7-391cddee88a4

## Decisions

- Vite + React 19 in JavaScript (JSX), not TypeScript. Tailwind v4 + shadcn/ui (`components.json` has `"tsx": false`, alias `@` -> `src`).
- No state library: React state plus `src/api/client.js` (`apiFetch`, throws `ApiError {status, code, message, requestId, details}`). Network failures throw `ApiError` with status 0 and code `NETWORK`; `AbortError` passes through; `apiFetch` takes a `signal` option; a 401 on a path outside `/auth/` redirects to `/login` and never resolves. Pages keep their data and show the error inline when a refetch fails. The `<title>` comes from `PageHeader` and `AuthCard`. `useMe` has no refresh; the Outlet context is `{ me }`. "New endpoint" is disabled until the email is verified.
- Live updates are Socket.IO pushes (`socket.io-client`) with polling kept as a fallback. One module-level socket (`src/lib/socket.js`, `autoConnect: false`, `withCredentials`, same origin via the `/socket.io` Vite proxy with `ws: true`) is connected when `AppLayout` mounts and disconnected when it unmounts (logout navigates away), so a new login always gets a fresh handshake with the cookie. `AppLayout` retries `socket.connect()` 5 s after a `connect_error`, because socket.io-client does not retry a failed handshake. Inspector, delivery and event views (`EventPanel` included) refetch on the `connect` event. `useRealtimeEvent(name, handler)` and `useRealtimeConnected()` live in `hooks/useRealtime.js`. Fallback `usePolling` runs every 5 s while disconnected and 30 s while connected, because the backend does not push sweeper and replay transitions yet.
- Server events consumed: `event.created {endpointId, eventId}` (inspector calls `fetchNew` for the current endpoint), `delivery.updated {deliveryId, eventId, status}` (`DeliveryDetail` reloads for its delivery; `EventPanel` reloads the event, deliveries included, when `eventId` matches). The inspector shows "Live" when connected and a muted "Reconnecting" otherwise. Inspector fetches are keyed by `id:method`, coalesced, and time out after 15 s.
- Dev server proxies `/api` and `/h` to `http://localhost:3000`, so cookies are same-origin.
- Lint is `oxlint` (what the current Vite template ships), not eslint.
- Design system: Geist Sans/Mono (`@fontsource-variable`), zinc neutrals with one violet accent (`brand`, `brand-text`), semantic `success`/`warning`/`info` tokens in `index.css`. Dark-first via class on `<html>`; `useTheme` follows the system until the user toggles, persisted in localStorage (try/catch). Toasts via `sonner`; motion via `motion` with `MotionConfig reducedMotion="user"`, plus reduced-motion CSS. `index.html` loads the theme script from `public/theme.js` (external, so the nginx CSP needs no inline script) and has `color-scheme` and `description` meta tags.
- Routes: `/` landing (public), auth pages, `/app/*` behind `RequireAuth`; old `/endpoints...` and `/events/:id` redirect to `/app/...`.
- App shell: `Sidebar` (nav: Endpoints, Usage, Analytics, API tokens, and Admin for operators; endpoint and monthly-events usage meters fetched per navigation; user dropdown with Account, theme and sign out) in `AppLayout`; below `lg` it renders inside a `Sheet`. Inspector is two-pane at `lg` (`matchMedia` via `useSyncExternalStore`); below that rows link to `/app/events/:id`. `EventPanel` (exported from `EventDetail.jsx`) is shared by the pane and the page.
- Payloads render as text only. Never use `dangerouslySetInnerHTML`.

## API contract used (all under /api/v1)

- Errors: `{ error: { code, message, details?, requestId } }`.
- Auth: register, verify-email, resend-verification, login, logout, forgot-password, reset-password, me.
- Endpoints: list, create, get, patch, delete, rotate-slug.
- Events: `GET /endpoints/:id/events?limit&cursor&method`, `GET /events/:id` (includes `deliveries`), `GET /events/:id/body` (download link).
- Destinations: list/create under `/endpoints/:id/destinations`, `PATCH|DELETE /destinations/:id`, `POST /destinations/:id/rotate-secret`. Create and rotate return `signingSecret` once; shown in `DestinationsPanel`'s secret dialog. `ApiError.details` carries 422 field errors (shown under the URL field).
- Deliveries: `GET /deliveries/:id` with `attempts`; `DeliveryDetail` polls every 5 s while disconnected and every 30 s while connected, only while the delivery is pending, in flight or retrying.

- Replay: `POST /deliveries/:id/replay` (body `{}`) returns `{ delivery }`; `POST /events/:id/replay` (`{ destinationIds }`) returns `{ deliveries }`. Both send a fresh `Idempotency-Key` (`crypto.randomUUID()`) per call via `apiFetch`'s `headers` option. 429 `RATE_LIMITED` (ReplayDialog.jsx:41, DeliveryDetail.jsx:96) shows the toast "Replay limit reached, try again later".
- Also used: `GET /usage`, `GET /analytics/deliveries?range&endpointId`, `GET|POST /tokens` and `DELETE /tokens/:id`, `POST /account/delete`, `/admin/workspaces` (list, get, PATCH, `POST .../delete`) and `GET /admin/audit`.
- Delivery fields used: `trigger`, `replayOf`, `failureReason`, `nextAttemptAt`, optional `maxAttempts`.

## Run

1. Start the backend on port 3000 (repo `relay-backend`).
2. `npm install`, then `npm run dev` (http://localhost:5173).
3. Gates: `npm run build`, `npm run lint`.

## Phases

- [x] 1 Capture + inspector: auth pages, endpoints list/create, inspector (events list, polling, rotate/rename/delete), event detail (done; API flow verified through the Vite proxy against the live backend on 2026-10-20)
- [x] 2 Forwarding / delivery timeline UI (destinations tab, event deliveries section, `/app/deliveries/:id`; also landing page and design system; not yet exercised against the phase 2 backend)
- [x] 3 Reliability / replay UI (replay button on delivery, `ReplayDialog` on event, Retrying/manual states, retry countdown; coded against the contract, not run against the phase 3 backend)
- [x] 4 Realtime (Socket.IO pushes with polling fallback) and analytics page (`/app/analytics`)
- [x] 5 API tokens (`/app/settings/tokens`), usage (`/app/usage`), account with delete (`/app/settings/account`), operator admin screens (`/app/admin`, `/app/admin/workspaces/:id`, `/app/admin/audit`, behind `RequireOperator`), suspended screen in `RequireAuth` (403 from `/auth/me`)
- [x] 6 Launch: `Dockerfile` (Vite build, nginx:1.27-alpine), `nginx/default.conf.template` (strict CSP, `/api` `/h` `/socket.io` proxies, Docker DNS re-resolution, X-Forwarded-Proto map, gzip, masked access log; env `RELAY_API_UPSTREAM`, `RELAY_INGEST_UPSTREAM`), GHCR deploy workflow
- Final state: latest frontend commit before the docs commits is 80cbf48. Production-stack smoke test passed 8/8.

## Known gaps

- API flow (register, verify link, endpoint, ingest, byte-exact body) verified through the proxy; pages not yet clicked through in a real browser. Backend needs `APP_BASE_URL=http://localhost:5173`.
- No automated frontend tests.
- UI never clicked through in a real browser; checked only by build, lint and dev-server fetches.
- The CSP and the Socket.IO connection through nginx have not been checked in a real browser.
- Plain-HTTP login returns 500 from a production backend (Secure cookie): needs HTTPS or `X-Forwarded-Proto: https`.
- nginx's error log may include an ingest slug on upstream errors; the access log is masked.
- Browser OPTIONS preflights sent to an ingest URL are captured as events by the backend (no CORS headers on ingest).
- Destination timeout default is unknown to the UI: empty field omits `timeoutMs`.
- `maxAttempts` is not in the delivery contract; "attempt N of max" only renders if the backend sends it.
- `EventPanel` refreshes only on `delivery.updated` pushes, with no polling fallback, so sweeper and replay transitions show after a reload.
- Replay with a stale destination selection (destination deleted meanwhile) surfaces the backend error inline in the dialog.
- Sidebar usage meter refetches the endpoint list on every navigation.
