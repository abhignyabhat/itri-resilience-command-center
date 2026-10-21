# IT Resilience Command Center

Frontend foundation for the IT Resilience Index dashboard. Built with Next.js App Router, React, TypeScript, and Tailwind CSS.

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The root path redirects to `/dashboard`.

## Current scope

- Dashboard, Configure, and History routes with shared navigation.
- Header download control is present as a placeholder.
- User menu reveals the displayed user's name.
- Screen bodies are intentionally empty for screen-by-screen UI development.

## Design tokens

Tailwind theme colors are defined in `src/app/globals.css`. Use `score-good`, `score-okay`, and `score-bad` (and their `-soft` variants) for score states. Parameter accent colors are available as `parameter-availability`, `parameter-security`, `parameter-integrity`, `parameter-governance`, `parameter-reliability`, `parameter-continuity`, `parameter-modularity`, `parameter-scalability`, and `parameter-other`. Shared brand shades use the `itri-*` palette.
