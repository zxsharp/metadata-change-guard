# Metadata Change Guard

Fail risky data changes in simulation, not in production.

Metadata Change Guard is a TypeScript application built on OpenMetadata. It simulates proposed schema or contract changes, calculates downstream blast radius, and returns an explainable deployment decision: `allow`, `guarded`, or `block`.

## Submission Links
- Live app: 
- API health: 
- Demo video: 

## What It Does
Metadata Change Guard simulates the impact of proposed schema or contract changes and returns an explainable decision:
- allow
- guarded
- block

The simulation combines metadata signals from OpenMetadata:
- lineage
- ownership
- governance tags/classifications
- quality and freshness context

## Why It Matters
Most teams discover breakage after deployment. This project shifts risk detection left by answering before rollout:
- What will break?
- Who is impacted?
- Should we deploy now?

## Technology Stack
### Primary (TypeScript ecosystem)
- Node.js 20+
- Fastify (API)
- React + Vite (UI)
- Zod or TypeBox (validation)
- TanStack Query (data fetching)
- Vitest + Supertest (testing)
- pnpm workspace (monorepo)

### Secondary (optional)
- Python sidecar with sqlglot only for optional column-level lineage fallback.

## Project Structure
```text
Hacks/
  README.md
  AGENT_IMPLEMENTATION_PLAN.md
  AGENT_EXECUTION_PROMPT.md
  package.json
  pnpm-workspace.yaml
  tsconfig.base.json
  apps/
    api/
      src/
        server.ts
        routes/
          health.ts
          metadata.ts
          simulate.ts
    web/
      src/
        main.tsx
        App.tsx
        api.ts
        components/
          ChangeForm.tsx
          RiskSummary.tsx
          ImpactTable.tsx
  packages/
    shared/
      src/
        types.ts
        schemas.ts
    engine/
      src/
        graph.ts
        scoring.ts
        recommend.ts
        simulate.ts
    openmetadata-client/
      src/
        client.ts
        endpoints.ts
        mapper.ts
  data/
    sample_metadata.json
    demo_payloads/
      low_risk.json
      high_risk.json
  tests/
    api.simulate.test.ts
    engine.scoring.test.ts
```

## OpenMetadata Integration
### Live mode (preferred)
API service calls OpenMetadata REST APIs and normalizes responses for the simulation engine.

Environment variables:
- OPENMETADATA_BASE_URL
- OPENMETADATA_JWT_TOKEN
- OPENMETADATA_MODE=live

Live mode currently fetches:
- tables from `/v1/tables`
- table owners, domains, tags, and classifications when present
- downstream lineage from `/v1/lineage/table/{id}`

The simulation engine uses those normalized signals to calculate blast radius, sensitive-data risk, owner impact, and rollout recommendations.

### Mock mode (fallback)
If live OpenMetadata is unavailable, read `data/sample_metadata.json` with the same normalized contract used by live mode.
Mock mode is included so the demo and tests remain deterministic when an OpenMetadata server is not reachable.

## API Endpoints
- `GET /health`
- `GET /metadata/assets`
- `POST /simulate`

### API examples
Health:
```bash
curl http://localhost:3001/health
```

Metadata assets:
```bash
curl http://localhost:3001/metadata/assets
```

High-risk simulation:
```bash
curl -X POST http://localhost:3001/simulate \
  -H "Content-Type: application/json" \
  -d @data/demo_payloads/high_risk.json
```

Low-risk simulation:
```bash
curl -X POST http://localhost:3001/simulate \
  -H "Content-Type: application/json" \
  -d @data/demo_payloads/low_risk.json
```

## Risk Model (MVP)
Base score by change type:
- `add_column`: +8
- `rename_column`: +25
- `drop_column`: +40
- `type_change`: +35

Modifiers:
- +5 per impacted asset (cap +20)
- +8 per impacted critical asset (cap +24)
- +10 if source has sensitive tags
- +8 if any impacted asset has failing quality status
- +6 if impacted critical assets are stale (`freshness > 180 minutes`)
- +6 if release window is `business_hours`

Decision bands:
- 0-34 => `allow`
- 35-69 => `guarded`
- 70-100 => `block`

## Local Setup and Run
Prerequisites:
- Node.js 20+
- pnpm 9+

Commands:
```bash
pnpm install
pnpm --filter @crashtest/api dev
pnpm --filter @crashtest/web dev
```

Validation:
1. Open `http://localhost:3001/health` and verify status is ok.
2. Open the web app at `http://localhost:5173`.
3. Run one low-risk and one high-risk simulation.

Mock mode is the default:
```bash
OPENMETADATA_MODE=mock pnpm --filter @crashtest/api dev
```

Live mode:
```bash
OPENMETADATA_MODE=live \
OPENMETADATA_BASE_URL=http://localhost:8585/api \
OPENMETADATA_JWT_TOKEN=your_token \
pnpm --filter @crashtest/api dev
```

## Cloud Deployment
Recommended split:
1. API on Render or Railway.
2. Web on Vercel or Netlify.

API env vars:
- OPENMETADATA_BASE_URL
- OPENMETADATA_JWT_TOKEN
- NODE_ENV=production

Release checks:
- API health endpoint returns 200.
- API simulation endpoint is deterministic for demo payloads.
- Web can call API with correct CORS.

### Deployment Option A: Render API + Vercel Web
1. Push this repository to GitHub.
2. Create a Render web service for the API:
   - Root directory: `apps/api`
   - Build command: `cd ../.. && pnpm install --frozen-lockfile && pnpm --filter @crashtest/api build`
   - Start command: `pnpm --filter @crashtest/api start`
   - Environment variables:
     - `OPENMETADATA_MODE=mock` for reliable demo fallback, or `live` for a real OpenMetadata server
     - `OPENMETADATA_BASE_URL`
     - `OPENMETADATA_JWT_TOKEN`
     - `NODE_ENV=production`
3. Create a Vercel project for the web app:
   - Root directory: `apps/web`
   - Build command: `cd ../.. && pnpm install --frozen-lockfile && pnpm --filter @crashtest/web build`
   - Output directory: `apps/web/dist`
   - Environment variable: `VITE_API_BASE_URL=https://your-api-host`
4. Add the Vercel URL and Render `/health` URL under "Submission Links".

### Deployment Option B: API-Only Fallback
If the web deployment is not ready, submit the API URL and use the prepared `curl` commands in the demo. This still proves the core OpenMetadata-powered simulation flow.

## Testing
Run tests:
```bash
pnpm test
```

Expected:
- Scoring threshold tests pass.
- API response contract tests pass.

## Demo Video Guide (2:30-3:30)
### Capture settings
- 1080p, 30fps
- clear voice-over
- cursor visible

### Recommended tools
- OBS Studio for screen recording.
- Loom if you want quick browser-based recording.
- macOS QuickTime or Windows Xbox Game Bar if you need the fastest local option.

### Before recording
1. Start the API:
```bash
OPENMETADATA_MODE=mock pnpm --filter @crashtest/api dev
```

2. Start the web app:
```bash
pnpm --filter @crashtest/web dev
```

3. Open:
- Web app: `http://localhost:5173`
- API health: `http://localhost:3001/health`

If port `3001` is busy, start the API on another port:
```bash
PORT=3002 pnpm --filter @crashtest/api dev
```

Then start the web app with:
```bash
VITE_API_BASE_URL=http://localhost:3002 pnpm --filter @crashtest/web dev
```

### Script timeline
- 0:00-0:20 Problem framing: schema changes often break downstream dashboards, models, or reporting after deployment.
- 0:20-0:40 Solution framing: Metadata Change Guard uses OpenMetadata context to simulate impact before rollout.
- 0:40-1:20 Low-risk simulation: run an `add_column` or off-hours change and show `allow` or `guarded`.
- 1:20-2:10 High-risk simulation: run the prepared high-risk payload and show `block`.
- 2:10-2:40 OpenMetadata integration proof: show loaded assets, owners, tags, lineage-driven impacted assets, and `/metadata/assets`.
- 2:40-3:10 Business impact: explain that teams can notify owners, delay risky releases, or create compatibility views.
- 3:10-3:30 Closing: mention live OpenMetadata mode, mock fallback, tests, and roadmap.

### Short voice-over
Use this as the core explanation:

"Metadata Change Guard prevents risky data contract changes from reaching production blindly. It connects to OpenMetadata, reads asset metadata such as tables, owners, tags, domains, and lineage, then simulates a proposed schema change. The engine calculates downstream blast radius, sensitive-data risk, data quality context, and release timing. The result is a clear deployment decision: allow, guarded, or block, with impacted assets and recommended actions. For the demo, mock mode uses the same normalized contract as live OpenMetadata mode, so the product remains deterministic even when a live OpenMetadata server is unavailable."

### Required proof on screen
- API health and one metadata fetch
- two simulation runs with different outcomes
- explainability reasons
- impacted owners/assets

### Fallback if web UI fails
Execute prepared payloads directly against `POST /simulate` and narrate decisions.

## Mapping to Judging Criteria
1. Potential Impact: prevents costly production incidents.
2. Creativity & Innovation: simulation-first metadata gate.
3. Technical Excellence: typed contracts, deterministic engine, tests.
4. Best Use of OpenMetadata: lineage + governance + ownership + quality in one loop.
5. User Experience: single workflow with clear decisions.
6. Presentation Quality: timeboxed narrative and measurable value.

## Known Limitations
- MVP may run in mock mode if live OpenMetadata is unavailable.
- No enterprise auth/RBAC in MVP.
- No full CI gate plugin in MVP.

## Roadmap
- production-grade OpenMetadata adapter with retries and caching
- CI gate for schema migration pull requests
- policy packs per domain and data product
