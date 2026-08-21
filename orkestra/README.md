# Orkestra

**The AI Operating System for Modern Media Production**
*Direct the vision. Let AI orchestrate the execution.*

Orkestra is an autonomous production workforce: a Director Agent
coordinates six specialist AI agents (Script, Budget, Schedule, Risk,
Marketing, Analytics) to plan and execute media productions, with humans
approving critical decisions along the way. Built for the Google Cloud
Agentic AI Hackathon.

---

## Repo layout

```
apps/
  api/              Backend — NestJS. Auth, Workflow Engine, Agent Runtime,
                     Approvals, Assets, Search, Analytics. Start here.
  web/               Frontend — Next.js. Dashboard, productions, live
                     workflow timeline, approvals queue.

services/
  mcp-server/        Python — exposes production/workflow data as MCP tools.
  adk-agent/          Python — real Google ADK agents (Gemini + Agent
                      Builder), using the MCP server above as a toolset.

docs/
  logo.svg            Full lockup
  logo-mark.svg        Icon only

docker-compose.yml     Postgres, ClickHouse, mcp-server, adk-agent
```

**If you only run one thing:** `apps/api` (backend) + `apps/web` (frontend)
gets you the full product with a Mock AI provider — no API keys needed.
`services/` is the real-Gemini-via-Google-Cloud-Agent-Builder path, opt-in.

---

## Architecture

```
React/Next.js (apps/web)
        │  REST + WebSocket
        ▼
NestJS API Gateway (apps/api)
        │
Workflow Engine  ──────────────►  Event Bus (Pub/Sub-shaped)
        │                                │
Agent Runtime                     ClickHouse (analytics, opt-in)
        │
   ┌────┴─────────────────────────────────────┐
   │ AI_PROVIDER=mock    → deterministic offline (default)
   │ AI_PROVIDER=gemini  → raw Gemini SDK call
   │ AI_PROVIDER=adk     → services/adk-agent (real ADK + MCP)
   └────────────────────────────────────────────┘
                                                    │
                                          services/mcp-server
                                          (production/workflow data
                                           as MCP tools)

PostgreSQL — operational data (users, productions, workflows, approvals)
```

**Workflow execution graph** (`apps/api/src/workflow/workflow-definition.ts`):
Director plans → Script Agent analyzes the brief → Budget and Schedule run
in parallel off that → Risk Agent waits on both → **human approval gate** →
Marketing → Analytics. Dependencies decide the order, not document
sequence — this resolves an ambiguity in the original spec docs between a
linear worked example and a fan-out topology diagram.

---

## Quick start (Mock provider — no API keys needed)

```bash
# 1. Postgres (+ ClickHouse, unwired by default)
docker compose up -d postgres clickhouse

# 2. Backend
cd apps/api
cp .env.example .env
npm install
npx prisma generate
npx prisma migrate dev --name init
npm run prisma:seed          # demo org + login
npm run start:dev            # http://localhost:4000/api/v1

# 3. Frontend (new terminal)
cd apps/web
npm install
npm run dev                  # http://localhost:3000
```

Seeded login: `producer@demo.studio` / `OrkestraDemo123!`

### Going live with real Gemini + Google Cloud Agent Builder

```bash
export GEMINI_API_KEY="your-real-key"
docker compose up -d mcp-server adk-agent
```

Then in `apps/api/.env`: `AI_PROVIDER=adk`, `ADK_AGENT_URL=http://localhost:8081`.
Full detail on what's verified vs. what needs your credentials to prove
further: `services/adk-agent/README.md`.

---

## What's real vs. what's a documented gap

**Fully implemented and verified** (both apps `npm install` clean and pass
`tsc --noEmit`; the MCP server and ADK service were actually booted as
processes and their endpoints hit, not just written):

- Auth (JWT + RBAC + working refresh-token reissue)
- Workflow Engine — real dependency-graph execution, retries, approval gating
- Agent Runtime — 7 agents, 3 pluggable providers (Mock / Gemini / ADK)
- Approvals with expiry + escalation
- Assets (upload/download, pluggable Local/GCS storage)
- Global Search, Notifications, Tasks, Analytics
- Event Bus with optional ClickHouse mirroring
- Real MCP server (5 tools, verified via the official MCP SDK's `list_tools()`)
- Real Google ADK agents (Gemini-backed, `McpToolset`-equipped, Director
  using ADK's native `sub_agents` delegation)
- Live WebSocket-driven workflow timeline in the frontend

**Deliberately pluggable, inactive by default:**

- `AI_PROVIDER=mock` (default) — deterministic offline, no key needed
- `STORAGE_PROVIDER=local` (default) — GCS adapter ready via `STORAGE_PROVIDER=gcs`
- `CLICKHOUSE_URL` unset by default — analytics reads Postgres directly until set

**Left as stubs — matching what the source spec docs themselves marked "Future":**

- Redis caching, upload malware scanning, Slack notifications, Google
  OAuth/Enterprise SSO

**Not attempted — infrastructure, not application code:**

- No live GCP deployment (Cloud Run, Cloud SQL, Pub/Sub, Secret Manager,
  Vertex AI Agent Engine registration)
- No CI/CD pipeline
- No test suite (Jest is a dependency; zero test files written)
- No real Gemini call has completed end-to-end in development — the ADK
  integration is verified up to the model-call boundary (see
  `services/adk-agent/README.md` for exactly what that means); it needs a
  real `GEMINI_API_KEY` and network egress to go further
- No demo video / pitch deck produced

---

## Six fixes baked into the schema/architecture

The original 19-document spec set had internal inconsistencies; these were
resolved as actual design decisions, not just noted:

1. **Production ↔ Workflow is one-to-many** — a Production runs multiple
   Workflows over its life, not a single one spanning Draft→Archived.
2. **Approval has `expiresAt`/`expiredAt`** — the spec described expiry
   escalation but the original schema had no fields for it.
3. **Event naming: PascalCase is canonical internally**
   (`WorkflowStarted`); the WebSocket gateway transforms to camelCase on
   the wire as a deliberate, documented step — not accidental drift
   between docs.
4. **Director Agent is the single top-level coordinator** — no separate
   "Orchestrator Agent" layer (that only existed in the pitch deck).
5. **"Production" is canonical**, not "Project" (an earlier-doc holdover).
6. **Risk Agent and Analytics Agent** are in the same execution graph as
   the other five agents, not deferred to a later phase.

---

## Tech stack

| Layer | Stack |
|---|---|
| Frontend | Next.js 15, TypeScript, Tailwind CSS, Zustand, TanStack Query, Socket.IO client |
| Backend | NestJS, Prisma, PostgreSQL, class-validator, Socket.IO |
| AI (default) | Deterministic Mock provider |
| AI (live) | Gemini via Google ADK (Agent Builder) + MCP tools |
| Analytics | ClickHouse (opt-in) |
| Storage | Local disk (default) / Google Cloud Storage (opt-in) |
| Infra target | Google Cloud Run, Cloud SQL, Pub/Sub, Secret Manager |

---

## License

Internal hackathon project — add a license here before any public release.
