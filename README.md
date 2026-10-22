# IT Resilience Command Center

Frontend foundation for the IT Resilience Index dashboard. Built with Next.js App Router, React, TypeScript, and Tailwind CSS.

## Backend (local development)

The backend is a modular monolith in the same Next.js app: App Router Route Handlers, Prisma ORM 7, and PostgreSQL. It supports one organization and manual score entry. The sample model starts from the dashboard's relative parameter weights, normalized to exactly 100%; subparameter weights also total 100%. Status cutoffs are configurable in the model (Good at 75+, Okay at 50–74.99, Bad below 50).

Scores are from 0 to 100. A parameter score is its subparameter-weighted average. ITRI is the sum of parameter scores multiplied by their configured weights. A missing subparameter makes the official ITRI score `null` and the assessment provisional. The API also returns a clearly labeled `provisionalEstimate`, which averages available parameter results using their configured weights; consumers must keep the provisional flag and coverage count visible.

### Start the database and app

1. Install Docker Desktop, then copy `.env.example` to `.env` (the values are local demo credentials only).
2. Run `npm install`.
3. Run `npm run db:up` to start the PostgreSQL 18 container.
4. Run `npm run db:migrate` to create/update the tables and `npm run db:seed` to insert demo model, assessment, remediation, and user records.
5. Run `npm run dev` and open `http://localhost:3000`.

Use `npm run db:down` to stop the database without deleting its volume. `npm run db:studio` opens Prisma Studio. To remove the local demo database volume, run `docker compose down -v`.

### API routes

All API paths are versioned under `/api/v1` and return a `{ "data": ... }` envelope for successful JSON responses.

| Method and path | Purpose |
| --- | --- |
| `GET /api/v1/health` | App and database readiness |
| `GET /api/v1/dashboard` | Current model, score/coverage, parameter results, history and score contributors |
| `GET /api/v1/configuration` | Published model structure and weights |
| `PUT /api/v1/configuration` | Validate and save a draft model (all weight sets must total 100%) |
| `POST /api/v1/configuration/publish` | Publish the latest valid draft as a new model version |
| `GET /api/v1/assessment-periods/:periodCode/inputs` | Read the period's manual inputs |
| `PUT /api/v1/assessment-periods/:periodCode/inputs` | Upsert scores and notes for subparameters |
| `POST /api/v1/assessment-periods/:periodCode/calculate` | Recalculate a complete or provisional snapshot |
| `GET /api/v1/assessment-periods` / `POST /api/v1/assessment-periods` | List and create half-year assessment periods |
| `GET /api/v1/remediations` / `POST /api/v1/remediations` | List, filter, and create remediation actions |
| `PATCH /api/v1/remediations/:id` | Update status, priority, due date, title or description |
| `GET /api/v1/audit?page=1&pageSize=20&from=&to=` | Paginated model/input/remediation/report audit events |
| `GET /api/v1/reports?page=1&pageSize=20&days=30` | Paginated report download history |
| `POST /api/v1/reports` | Create a report history entry and return its download URL |
| `GET /api/v1/reports/:id/download` | Download a CSV report |

### Current limits

The current UI still uses its frontend fixtures/local storage; these API endpoints and the database are ready to connect to the screens next. The demo API has no login or authorization enforcement yet and is intended for local development only. Add authentication, role checks, request rate limits, and production secret management before exposing it on a network. External monitoring integrations and hosting are intentionally deferred.

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The root path redirects to `/dashboard`.


## Design tokens

Tailwind theme colors are defined in `src/app/globals.css`. Use `score-good`, `score-okay`, and `score-bad` (and their `-soft` variants) for score states. Parameter accent colors are available as `parameter-availability`, `parameter-security`, `parameter-integrity`, `parameter-governance`, `parameter-reliability`, `parameter-continuity`, `parameter-modularity`, `parameter-scalability`, and `parameter-other`. Shared brand shades use the `itri-*` palette.
