# Elite Credit AI Plugin — Architectural Decisions (v3 adaptation)

This file mirrors `DECISIONS.md` from the original plugin and adds two new ADRs for the v3 adaptation.

The original 4 ADRs (001–004) are preserved verbatim because they remain valid: dual-mode pattern still applies, MCP HTTP still applies, independent project still applies, Spanish translation as separate folder still applies. The new ADRs (005–006) document the v3 contract upgrade and the parallel-adaptation strategy.

## Format

```
### ADR-NNN: Short title
- **Date:** YYYY-MM-DD
- **Decision:** What was decided
- **Alternatives considered:** Other options evaluated
- **Rationale:** Why this option was chosen
- **Status:** Accepted | Superseded by ADR-NNN
```

---

## Decisions

### ADR-001: Dual-mode plugin architecture (standalone + API)
- **Date:** 2026-03-27
- **Decision:** Plugin works in two additive modes: basic (Claude's general knowledge only) and complete (general knowledge + proprietary API). The API is never required.
- **Alternatives considered:**
  1. API-only plugin — rejected: unusable without server deployed
  2. Embed RAG data in plugin — rejected: exposes proprietary IP to anyone who installs the plugin
  3. GitHub private repo for data — rejected: data still enters Claude's context, doesn't protect IP
- **Rationale:** Dual-mode lets the plugin work immediately for demos or general use, while the API adds proprietary depth (now 527 RAG chunks and 97 programmatic rules in v3) for production. Both modes always have Claude's general FCRA/FDCPA knowledge as baseline.
- **Status:** Accepted (carried over from v1)

### ADR-002: MCP HTTP transport for API connection
- **Date:** 2026-03-27
- **Decision:** Plugin connects to the Elite Credit API via MCP HTTP transport with Bearer token authentication, configured by `ELITE_CREDIT_API_URL` and `ELITE_CREDIT_API_KEY` environment variables in Cowork.
- **Alternatives considered:**
  1. Direct fetch() calls in skill instructions — rejected: non-standard, harder to manage
  2. WebSocket connection — rejected: overkill for request/response pattern
- **Rationale:** MCP HTTP is the standard protocol for Claude plugins to connect to external services. Bearer token is simple and secure.
- **Status:** Accepted (carried over from v1)

### ADR-003: Independent project, separate from SaaS
- **Date:** 2026-03-29
- **Decision:** Plugin is its own project with its own repo, CLAUDE.md, LEARNINGS.md, and DECISIONS.md. Not nested inside the SaaS project.
- **Alternatives considered:**
  1. Subdirectory of SaaS — rejected: creates unnecessary coupling
  2. Monorepo with SaaS and API — rejected: different deployment cycles
- **Rationale:** Plugin has zero code dependencies on the SaaS. Its only external dependency is the micro-API via HTTP. Separate projects enable independent development, versioning, and deployment.
- **Status:** Accepted (carried over from v1)

### ADR-004: Spanish translation as separate reference folder
- **Date:** 2026-03-29
- **Decision:** Create a complete Spanish translation of the plugin in `elite-credit-ai-plugin-es/` as a separate folder, for owner reference only (not for installation).
- **Alternatives considered:**
  1. Bilingual plugin with both languages — rejected: doubles the content, confuses Claude
  2. No translation — rejected: owner wants to read the flow in Spanish for better understanding
- **Rationale:** The plugin must be in English for Claude to execute correctly. A separate Spanish copy lets the owner understand every skill and agent flow without affecting the functional plugin.
- **Status:** Accepted (carried over from v1; v3 in this folder includes Spanish examples in commands but the executable instructions remain in English)

### ADR-005: API v3.0 contract upgrade across the plugin
- **Date:** 2026-04-26
- **Decision:** All skills, agents, and commands are aligned to the Elite Credit API v3.0.0 contract: 97 rules, 557 chunks (including the Master Agent Flow Guide added in Phase B), 13 categories, 6 endpoints (5 REST + `/mcp`), new audit-request shape (4 fields), new audit-response shape (11 fields), legal_disclaimer per response, disclaimer prefix per `suggested_action`, programmatic Metro2 config access via `/api/config/{filename}`, rate limits documented (60/min audit, 120/min RAG, 120/min MCP).
- **Alternatives considered:**
  1. Wait for the API to stabilize further — rejected: API has been stable in v3.0 for 4+ weeks; gap with plugin grows daily
  2. Patch only the most critical skills (`fcra-compliance-auditor` and `credit-law-rag`) — rejected: would leave inconsistent counts ("32 rules" still in command files); confuses agents
  3. Remove Metro2 transformer because it lacked an explicit endpoint call — rejected: the 11 config files are real and useful; the missing piece was just the documented invocation path, which v3 now provides
- **Rationale:** The plugin is the user-facing layer; if it advertises 32 rules and the API actually runs 97, the consumer gets a worse experience than the API can provide. Aligning the entire plugin in one cohesive update maintains internal consistency. All v3 changes are backward-compatible: skills that ignore the new fields still work; skills that use them get richer output.
- **Status:** Accepted

### ADR-006: Parallel adaptation strategy (no modifying original)
- **Date:** 2026-04-26
- **Decision:** The v3 adaptation lives in a parallel folder `elite-credit-ai-plugin-v3/` next to the original `elite-credit-ai-plugin (no modificar - solo para contexto)/`. The original is never modified by this work. The user manually copies v3 files to the live Cowork plugin.
- **Alternatives considered:**
  1. Modify the original folder in place — rejected: original is synced to Cowork and changes might propagate at the wrong moment, breaking the running plugin
  2. Generate a single patch file (diff) — rejected: less readable than full files; harder to review
  3. Use git branches — rejected: project is not a single git repo for the plugin; the user does not have a continuous-deployment pipeline for plugin updates
- **Rationale:** A parallel folder gives the user full visibility (each v3 file vs each v1 file) without touching the running plugin. The user controls when to sync. `MIGRATION_NOTES.md` provides the diff summary so the user does not need to compare files line-by-line.
- **Status:** Accepted

### ADR-007: Phase B+ — flow-router and phase-tracker agents added to plugin
- **Date:** 2026-04-26
- **Decision:** With the Master Agent Flow Guide deployed to the vault (Phase B), the plugin v3 is extended with two new agents that consume the flow guide via `/api/rag/search`: `flow-router` (strategic routing on first interaction) and `phase-tracker` (journey continuity across sessions). Two new commands (`/start-journey` and `/next-step`) provide user-facing entry points. State is persisted in the Cowork Project's `Memoria` feature; recurring check-ins are scheduled via the Cowork `Programado` feature.
- **Alternatives considered:**
  1. Leave the flow guide as RAG content only, let existing agents consult it ad-hoc — rejected: the flow guide is most useful when an agent OWNS the routing decision and follows it deterministically. Without `flow-router`, agents would improvise routing despite having the playbook in the RAG.
  2. Build a single super-agent that does routing + execution + tracking — rejected: monolithic agents are hard to maintain. The plugin's existing architecture (agents do specific jobs, commands are entry points) is preserved.
  3. Build a separate SaaS layer for state persistence — rejected: Cowork's `Memoria` and `Programado` already provide what's needed for per-user persistence and scheduled triggers, with zero infrastructure additions.
- **Rationale:** The plugin v3 (without B+) had everything to execute a journey but no built-in mechanism to choose the journey strategically and resume it cross-session. `flow-router` closes the strategic-decision gap; `phase-tracker` closes the continuity gap. Together they convert the plugin from a tool-box to a strategic system. They use Cowork's native Memoria/Programado, so no SaaS or backend changes are required.
- **Status:** Accepted

---

## Future ADRs to record (when relevant)

The following decisions will be recorded as ADRs when the corresponding work begins:

- ADR-008 (planned): `outcomes-logger` skill in the plugin and `POST /api/outcomes/log` endpoint on the API — anonymous capture of dispute outcomes for cross-user analytics
- ADR-009 (planned): `GET /api/stats/success_rate` endpoint that returns aggregated stats to inform agent recommendations (requires ADR-008 to be in place first)
- ADR-010 (planned): Settlement database endpoint (`GET /api/settlements/check`) and attorney-directory endpoint (`GET /api/referrals/attorneys`)
- ADR-011 (planned): Auto-update regulatory pipeline — scheduled job on Railway that scrapes CFPB / FTC / state AG enforcement actions and updates the relevant vault chunks
