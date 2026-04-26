# Metadata Change Guard

Metadata Change Guard is a TypeScript application that uses OpenMetadata context to simulate proposed schema and contract changes before they are deployed. It calculates downstream blast radius, explains the risk, and returns a clear deployment decision: `allow`, `guarded`, or `block`.

## Problem

Data teams often discover breaking schema changes after they have already affected dashboards, models, reports, or downstream pipelines. By then, the right owners may not have been notified, rollback paths may be unclear, and the business impact is already visible.

Metadata Change Guard shifts that decision earlier. Before a change is released, it asks:

- What downstream assets are impacted?
- Which owners or teams need to know?
- Is the affected data sensitive or business-critical?
- Should this change ship now, ship with guardrails, or be blocked?

## How It Works

1. A user submits a proposed data change, such as dropping a column or changing a type.
2. The API loads metadata context from OpenMetadata or from a deterministic fallback dataset.
3. The simulation engine traverses downstream lineage and scores risk.
4. The UI shows the decision, impacted assets, explanations, and recommended actions.

The result is designed to be simple enough for a release decision and detailed enough for data owners to act on.

## OpenMetadata Integration

OpenMetadata is used as the metadata source of truth.

Live mode fetches and normalizes:

- tables from `/v1/tables`
- owners, domains, tags, and classifications when present
- downstream lineage from `/v1/lineage/table/{id}`

The normalized metadata is used by the simulation engine to calculate:

- downstream blast radius
- sensitive-data risk
- business criticality
- owner impact
- rollout recommendations

Mock mode is also available. It uses `data/sample_metadata.json`, which follows the same normalized contract as live mode. This keeps local development, tests, and demos deterministic when an OpenMetadata server is not available.

## Features

- Fastify API with typed request validation
- React + Vite web UI
- Shared TypeScript contracts across API, UI, and engine
- Deterministic simulation results for identical inputs
- OpenMetadata live mode and mock fallback mode
- Explainable risk score and policy decision
- Impacted asset explorer with owners, domains, severity, and reasons
- Automated tests for scoring and API behavior

## Architecture

```text
apps/
  api/                       Fastify API service
  web/                       React web app
packages/
  shared/                    Shared TypeScript types and Zod schemas
  engine/                    Graph traversal, scoring, recommendations
  openmetadata-client/       OpenMetadata REST adapter and normalization
data/
  sample_metadata.json       Deterministic mock metadata
  demo_payloads/             Low-risk and high-risk simulation examples
tests/
  api.simulate.test.ts
  engine.scoring.test.ts
```

## Tech Stack

- Node.js 20+
- pnpm workspace
- TypeScript
- Fastify
- React + Vite
- TanStack Query
- Zod
- Vitest

## API

### `GET /health`

Returns API health.

```bash
curl "$API_BASE_URL/health"
```

### `GET /metadata/assets`

Returns normalized metadata assets loaded from OpenMetadata live mode or mock fallback mode.

```bash
curl "$API_BASE_URL/metadata/assets"
```

### `POST /simulate`

Runs a change simulation.

```bash
curl -X POST "$API_BASE_URL/simulate" \
  -H "Content-Type: application/json" \
  -d @data/demo_payloads/high_risk.json
```

Example request:

```json
{
  "entityId": "table_sales_orders",
  "changeType": "drop_column",
  "columns": ["customer_email"],
  "releaseWindow": "business_hours"
}
```

Example response:

```json
{
  "riskScore": 100,
  "riskLevel": "high",
  "policyDecision": "block",
  "impactedAssets": [
    {
      "id": "dashboard_exec_revenue",
      "name": "dashboard.exec_revenue",
      "type": "dashboard",
      "domain": "Executive",
      "owner": "team-bi",
      "impactSeverity": "critical",
      "reasons": ["depends_on_changed_entity", "schema_breaking_change", "high_business_criticality"]
    }
  ],
  "explanations": [
    "Change affects 3 downstream assets.",
    "2 impacted assets are business-critical.",
    "Operation drop_column during business_hours increases rollout risk."
  ],
  "recommendedActions": [
    "Create compatibility view for at least one release window.",
    "Notify impacted owners with migration ETA and fallback details.",
    "Run quality checks in canary before full rollout."
  ]
}
```

## Risk Model

Base score by change type:

- `add_column`: +8
- `rename_column`: +25
- `drop_column`: +40
- `type_change`: +35

Modifiers:

- +5 per impacted asset, capped at +20
- +8 per impacted critical asset, capped at +24
- +10 if the source has sensitive tags
- +8 if any impacted asset has a failing quality status
- +6 if impacted critical assets are stale, defined as freshness greater than 180 minutes
- +6 if the release window is `business_hours`

Decision bands:

- `0-34`: `allow`
- `35-69`: `guarded`
- `70-100`: `block`

## Local Setup

Prerequisites:

- Node.js 20+
- pnpm 9+

Install dependencies:

```bash
pnpm install
```

Run the API in mock mode:

```bash
OPENMETADATA_MODE=mock pnpm --filter @crashtest/api dev
```

Run the web app:

```bash
pnpm --filter @crashtest/web dev
```

Use `PORT` to override the API port and `VITE_API_BASE_URL` to point the web app at a specific API deployment.

```bash
PORT=<api-port> pnpm --filter @crashtest/api dev
VITE_API_BASE_URL=<api-base-url> pnpm --filter @crashtest/web dev
```

## OpenMetadata Live Mode

To connect to a live OpenMetadata instance:

```bash
OPENMETADATA_MODE=live \
OPENMETADATA_BASE_URL=<openmetadata-api-base-url> \
OPENMETADATA_JWT_TOKEN=<token> \
pnpm --filter @crashtest/api dev
```

Required API environment variables:

- `OPENMETADATA_MODE`: `mock` or `live`
- `OPENMETADATA_BASE_URL`: OpenMetadata API base URL
- `OPENMETADATA_JWT_TOKEN`: bearer token for OpenMetadata live mode
- `PORT`: optional API port

Required web environment variable:

- `VITE_API_BASE_URL`: API base URL used by the web app

## Testing

Run all tests:

```bash
pnpm test
```

Build all packages and apps:

```bash
pnpm build
```

## Deployment

The app can be deployed as two services:

- API service: Render, Railway, or any Node.js host
- Web app: Vercel, Netlify, or any static hosting provider

### API Service

Deploy from the repository root so pnpm workspace packages resolve correctly.

Build command:

```bash
corepack enable && corepack prepare pnpm@9.1.0 --activate && pnpm install --frozen-lockfile && pnpm --filter @crashtest/api build
```

Start command:

```bash
pnpm --filter @crashtest/api start
```

Recommended API environment variables for a stable demo:

```text
NODE_ENV=production
OPENMETADATA_MODE=mock
```

Recommended API environment variables for live OpenMetadata:

```text
NODE_ENV=production
OPENMETADATA_MODE=live
OPENMETADATA_BASE_URL=<openmetadata-api-base-url>
OPENMETADATA_JWT_TOKEN=<token>
```

### Web App

Deploy from the repository root.

Build command:

```bash
corepack enable && corepack prepare pnpm@9.1.0 --activate && pnpm install --frozen-lockfile && pnpm --filter @crashtest/web build
```

Output directory:

```text
apps/web/dist
```

Required web environment variable:

```text
VITE_API_BASE_URL=<api-base-url>
```

After changing `VITE_API_BASE_URL`, rebuild and redeploy the web app because Vite embeds environment variables at build time.

## Demo Flow

Recommended recording length: 2.5 to 3.5 minutes.

1. Open with the problem: schema changes can break downstream data products after deployment.
2. Show Metadata Change Guard as a pre-deploy simulation layer.
3. Show the OpenMetadata Signals panel in the web app.
4. Run a low-risk simulation and show an `allow` or `guarded` decision.
5. Run the high-risk demo payload and show a `block` decision.
6. Highlight impacted assets, owners, reasons, and recommended actions.
7. Close with the deployment use case: teams can notify owners, create compatibility views, delay risky releases, or wire this into CI.

API-only fallback demo:

```bash
curl "$API_BASE_URL/health"
curl "$API_BASE_URL/metadata/assets"
curl -X POST "$API_BASE_URL/simulate" \
  -H "Content-Type: application/json" \
  -d @data/demo_payloads/low_risk.json
curl -X POST "$API_BASE_URL/simulate" \
  -H "Content-Type: application/json" \
  -d @data/demo_payloads/high_risk.json
```
