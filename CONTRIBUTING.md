# Contributing

## Setup

1. Run the backend ([relay-backend](https://github.com/parthgupta21/relay-backend)) on port 3000. The Vite dev server proxies `/api`, `/h` and `/socket.io` to it.
2. `npm install`
3. `npm run dev` (http://localhost:5173)

## Conventions

- JavaScript with JSX, not TypeScript.
- shadcn/ui components live in `src/components/ui`; add new ones there.
- Colors, fonts and radii come from the design tokens in `src/index.css`. Do not hard-code new colors.
- Never use `dangerouslySetInnerHTML`. Captured payloads render as text.
- Commit messages: subject only, imperative mood, under 60 characters (for example `Add replay button to delivery detail`).

## Gates

Both must pass before a PR merges; CI runs them on every push and pull request to `main`.

```
npm run lint
npm run build
```
