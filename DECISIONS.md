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
- **Rationale:** Dual-mode lets the plugin work immediately for demos or general use, while the API adds proprietary depth (now 557 RAG chunks and 97 programmatic rules in v3) for production. Both modes always have Claude's general FCRA/FDCPA knowledge as baseline.
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

### ADR-008: Plugin v3.1.0 — adopt audit-report dashboard + dual-output deliverables
- **Date:** 2026-05-02
- **Decision:** Plugin bumped 3.0.4 → 3.1.0. The `credit-forensic-analyst` agent now produces THREE deliverables per audit: (1) `forensic_report.md` (technical, pro-facing, FCRA/FDCPA citations + jurisprudence), (2) `consumer_dashboard.md` (plain-language, 8th-grade reading level, no jargon — for end consumer), (3) `dashboard/runtime.html` (interactive HTML with 3 score gauges + factor donut + master/detail account view + filterable anomalies + timeline + bilingual ES/EN toggle + PDF export via Cmd+P). Marketplace + plugin.json version updated together.
- **Alternatives considered:**
  1. Single technical report (status quo through 3.0.4) — REJECTED: alienates consumer end-users who don't read 20-page legal docs
  2. Single consumer-friendly report — REJECTED: alienates pros who need depth
  3. Optional toggle (config-driven) — REJECTED: complexity not justified vs always-produce-3
- **Rationale:** The plugin's market is split between consumers (need plain language + visual) and credit-repair pros (need technical depth + citations). Producing all 3 every time + letting the user pick which to share with their client = no compromise. The HTML dashboard is the "wow" deliverable that demonstrates value to consumers before they read anything.
- **Status:** Accepted

### ADR-009: OAuth 2.0 client_credentials grant — Cowork connector compatibility
- **Date:** 2026-05-08
- **Decision:** Coordinated with API repo ADR-010: plugin's `.mcp.json` reads from Cowork's OAuth flow (Client ID + Client Secret form), forwards to API's `POST /oauth/token` endpoint, receives back the same string as `ELITE_CREDIT_API_KEY` env var (no token rotation in v1). All plugin agents perform the Step 0 environment check via `health_check` MCP tool to verify connectivity before doing any work.
- **Alternatives considered:**
  1. Stay Bearer-only — REJECTED: Cowork connector form is OAuth-only, no "paste API key" mode
  2. Custom auth flow outside RFC standards — REJECTED: Cowork enforces RFC 8414 / 9728 discovery
- **Rationale:** The plugin must use Cowork's OAuth UX. API repo's OAuth implementation (ADR-010) provides the server side; plugin's `.mcp.json` references the OAuth metadata endpoint. End result: user pastes API key into Cowork's "Client Secret" field, plugin works.
- **Status:** Accepted (the /mcp endpoint specifically went open-no-auth per API ADR-011 — but the OAuth machinery stays operational for REST endpoints)

### ADR-010: Plugin v3.2.0 → v3.2.1 — rollback hotfix versioning pattern
- **Date:** 2026-05-12
- **Decision:** When the 2026-05-12 attempt to re-enable /mcp auth failed against the user's actual Cowork install, bumped plugin 3.2.0 → 3.2.1 as a rollback hotfix release. v3.2.0 release notes had announced "Bearer auth re-enabled" — v3.2.1 explicitly retracts that claim and signals the rollback. No plugin CODE change (the plugin is metadata-only: marketplace.json + plugin.json version bumps + release notes in commit message). The API repo did the actual revert (commit `0c704cd`).
- **Alternatives considered:**
  1. Stay at v3.2.0 + just revert API — REJECTED: consumers who already updated to v3.2.0 would think auth is enabled but encounter the broken connector; mismatch erodes trust
  2. Bump to v3.3.0 (major change vibe) — REJECTED: 3.2.1 patch semver communicates "hotfix, not new feature" correctly
  3. Yank v3.2.0 from marketplace — REJECTED: Cowork marketplace doesn't support yanks; bumping forward is the canonical path
- **Rationale:** Patch semver (X.Y.PATCH) communicates "fix to existing version, no new feature." v3.2.1 release notes explicitly document the rollback so anyone who pulled v3.2.0 knows what changed. The pattern is now established for future rollbacks: metadata bump + explicit release notes describing the retraction.
- **Status:** Accepted

### ADR-011: Plugin updates for Raiyan books integration — pure markdown, no plugin.json bump
- **Date:** 2026-05-25
- **Decision:** When integrating the 2 Raiyan books into the vault (API repo: 21 new vault notes + 6 new RAG categories), the plugin received parallel updates: rewrote CFPB operational policy section in `skills/dispute-strategist/SKILL.md` + appended 6 new sections (Per-Account Flows / Letter Refresh / Dispute Timing / Distribution Sync / Combination Flows / Special Playbooks). Appended 5 new sections to `agents/dispute-letter-generator.md` (Composition Recipe / Style Guardrails / Round-Specific Opening Selection / Letter Tracking & Refresh / Snitch-Style). Enhanced Step 5 of `agents/credit-forensic-analyst.md` (per-account flow recommendation in strategy output). NO plugin.json version bump — these are agent guidance refresh, no tool surface or API contract change.
- **Alternatives considered:**
  1. Bump plugin to v3.3.0 to signal the major content update — REJECTED: confuses consumers (no new tools, no breaking changes; just better agent guidance from richer RAG)
  2. Defer plugin updates and only update the RAG — REJECTED: agents need the new section structure to leverage the new RAG categories effectively
  3. Single mega-update file (one new SKILL section instead of distributed) — REJECTED: violates the existing modular skill+agent structure
- **Rationale:** Plugin version semver reflects USER-FACING changes (new commands, breaking API contracts, removed features). The Raiyan integration is a quality improvement of existing agents using newly-available RAG content. Users don't see "v3.3.0" but their `/dispute-letters` output composes better letters. Pattern established: agent guidance refreshes do NOT bump plugin version unless they change the tool surface.
- **Status:** Accepted

### ADR-012: Skip refactor of 5 letter templates in Raiyan integration
- **Date:** 2026-05-25
- **Decision:** Plan originally included refactoring 5 letter templates (`round1-initial-dispute-bureaus.md`, `round2-followup-dispute-bureaus.md`, `round3-bankruptcy-final.md`, `validate-debt-1.md`, `reinsertion-dispute.md`) with Heavy Metal + Plain English patterns. Decision: DEFER. The dispute-letter-generator agent's new Letter Composition Recipe + Style Guardrails sections enable dynamic composition from RAG patterns — the static templates become a fallback/scaffold, not the primary mechanism.
- **Alternatives considered:**
  1. Refactor all 5 templates in same change — REJECTED: too large for single commit (each template is 2-7 KB, hand-applying patterns is error-prone); risk of inconsistencies
  2. Refactor only round1 + round2 as "exemplar templates" — REJECTED: half-done state worse than untouched
  3. Replace templates entirely with dynamic generation, no static fallback — REJECTED: fallback is useful when RAG is unavailable (Step 0 check failed)
- **Rationale:** The agent now composes dynamically with the patterns documented in `damage-chains.md`, `opening-techniques.md`, etc. Templates remain as scaffolds for cases where the agent needs a starting structure. A future ADR will refactor them when the agent's dynamic composition has been validated against multiple real dispute cases. Defer + dynamic composition is lower risk than batch refactor.
- **Status:** Accepted (refactor deferred to future ADR with usage data)

---

## Future ADRs to record (when relevant)

The following decisions will be recorded as ADRs when the corresponding work begins:

- ADR-013 (planned): `outcomes-logger` skill in the plugin and `POST /api/outcomes/log` endpoint on the API — anonymous capture of dispute outcomes for cross-user analytics
- ADR-014 (planned): `GET /api/stats/success_rate` endpoint that returns aggregated stats to inform agent recommendations (requires ADR-013 to be in place first)
- ADR-015 (planned): Settlement database endpoint (`GET /api/settlements/check`) and attorney-directory endpoint (`GET /api/referrals/attorneys`)
- ADR-016 (planned): Auto-update regulatory pipeline — scheduled job on Railway that scrapes CFPB / FTC / state AG enforcement actions and updates the relevant vault chunks
- ADR-017 (planned): Refactor 5 letter templates with Heavy Metal + Plain English patterns (deferred from ADR-012; trigger: after dispute-letter-generator has composed letters for ≥5 real cases and patterns prove stable)
- ADR-018 (planned): /mcp auth re-enable round 2 — when Anthropic ships #219 fix broadly (4 gates per API repo ADR-012 must all be met)
