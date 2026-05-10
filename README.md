# Elite Credit AI Plugin

> Credit-journey suite for Claude Cowork — built for US consumers (with a Latino focus).
> Covers the full arc: forensic **repair** when there are FCRA/FDCPA anomalies, score **optimization** when the report is clean, and **maintenance + financial education** for ongoing use.
> Powered by the Elite Credit API v3.0 (97-rule audit + 557-chunk legal RAG over MCP HTTP).

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Version](https://img.shields.io/badge/version-3.1.0-blue.svg)](./.claude-plugin/plugin.json)

## Where to use this plugin

The plugin's agents, skills, and commands only load when Claude has access to the plugin's files **and** the `elite-credit-api` MCP connector is reachable. That happens in exactly two contexts:

| Context | Works? | Notes |
|---------|--------|-------|
| **Cowork project** with this plugin installed and the `elite-credit-api` connector in "Conectado" state | ✅ Recommended | Full pipeline: agents, skills, commands, MCP-backed audit + RAG, Cowork Memoria + Programado for journey continuity. |
| **Claude Code CLI** with `.mcp.json` configured locally | ✅ Developer / fallback | Useful for plugin development, batch work, or when Cowork is not the right surface. |
| **Raw Claude.ai chat** (no project) | ❌ No plugin loading | Claude will answer from general training knowledge and may unintentionally fabricate plugin specifics. Switch to your Cowork project. |
| **Cowork project without this plugin installed** | ❌ Not connected | Install the plugin from the marketplace first (see [Install](#install)). |
| **Cowork project with the plugin but the MCP connector offline** | ⚠️ Degraded | Each agent runs an `Step 0: Verify environment` check that catches this and prints a redirect message instead of fabricating an audit. Reconnect via Conectores → `elite-credit-api` → Instalar. |

**If you find yourself in raw Claude.ai chat and want to use this plugin's capabilities,** open the Cowork project where you installed it. Project Instructions in that project should follow [`PROJECT_INSTRUCTIONS_TEMPLATE.md`](./PROJECT_INSTRUCTIONS_TEMPLATE.md), which sets the project up to default to plugin agents/commands instead of improvising.

For an extra layer of protection, consider adding a [Memory entry](./PROJECT_INSTRUCTIONS_TEMPLATE.md#user-side-setup--also-recommended) on your Claude.ai account that redirects credit-related questions away from raw chat and into your Cowork project.

## What it does

Upload a credit report PDF and get:

- Full extraction of ~75 fields per account across **Equifax, Experian, TransUnion** (multi-bureau supported in one pass)
- **97 compliance rules** detecting FCRA / FDCPA / Reg F / Reg V / Metro2 violations — including **cross-bureau** (DOFD/balance/status mismatches) and **temporal** (re-aging, reinsertion, repollution)
- Prioritized dispute strategies (P0-P4) with legal citations from a **557-chunk** knowledge base covering **17 federal laws and 5 state laws**
- Personalized dispute letters across **17 templates** (round 1/2/3, debt validation, cease-and-desist, foreclosure, bankruptcy trustee/clerk, summons response, identity theft, etc.)
- Credit-score education at an 8th-grade reading level — VantageScore 3.0/4.0 + FICO 8/9 aware
- A `legal_disclaimer` plus a per-action prefix from the API — the agent always presents the audit as educational material, never as legal advice
- **Three deliverables per audit:**
  - `output/forensic_report.md` — technical report for credit-repair professionals
  - `output/consumer_dashboard.md` — plain-language summary as text
  - `output/dashboard/runtime.html` — **interactive bilingual HTML dashboard** the consumer opens in their browser. Score gauges, factor donut, account cards, anomaly explanations, action timeline, and a "Download PDF" button that produces a print-ready letter-sized PDF via the browser print dialog. Implementation lives in `skills/ui-ux-credit/dashboard/` and is described in `skills/ui-ux-credit/SKILL.md`.

## Install

### Option 1 — Cowork marketplace (recommended)

In Claude Cowork, open `Plugins → Add marketplace` and paste:

```
luicabref97/elite-credit-ai-plugin
```

Cowork pulls the latest version from GitHub. Updates land by re-syncing.

### Option 2 — Local clone (development)

```bash
git clone https://github.com/luicabref97/elite-credit-ai-plugin.git
```

Point Claude Code or another MCP-aware client at the cloned folder.

## Setup

### Basic mode (no API)

The plugin works out of the box with Claude's general FCRA/FDCPA knowledge. No API required, no environment variables to set. You get solid analysis without the deep forensic engine.

### Enhanced mode (with the Elite Credit API)

Connect the API to unlock 97 programmatic rules, the 557-chunk legal RAG, cross-bureau and temporal audits, and the 11 Metro2 config files.

1. Deploy the API: see [luicabref97/elite-credit-api](https://github.com/luicabref97/elite-credit-api) (one-click Railway deploy).
2. In your Cowork project, set:

   ```
   ELITE_CREDIT_API_URL=https://your-api-on-railway.up.railway.app
   ELITE_CREDIT_API_KEY=your-secret-key
   ```

3. The plugin connects via **MCP HTTP transport** (`POST /mcp`) with Bearer-token authentication. Configuration lives in [`.mcp.json`](./.mcp.json).

## API tools exposed via MCP

The API is wrapped as an MCP server. Each tool is callable from any agent or skill in this plugin:

| MCP tool | Wraps | Used by | Rate limit |
|----------|-------|---------|------------|
| `audit_run` | `POST /api/audit/run` | `fcra-compliance-auditor`, `full-pipeline`, `/audit`, `credit-forensic-analyst` | 60/min |
| `rag_search` | `POST /api/rag/search` | `credit-law-rag`, `dispute-strategist`, `/search-law`, `/credit-qa`, all routing agents | 120/min |
| `get_config` | `GET /api/config/{name}` | `metro2-transformer` | 200/min |
| `rag_stats` | `GET /api/rag/stats` | optional diagnostic | 200/min |
| `health_check` | `GET /health` | optional connectivity check | unlimited |

## Commands

| Command | Description |
|---------|-------------|
| `/start-journey` | Strategic routing on first interaction. Consults the Master Agent Flow Guide, decides Flow A (Repair) / B (Optimization) / C (Maintenance) + phase, saves to Cowork Memoria. |
| `/next-step` | Journey continuity for returning users. Reads Cowork Memoria, computes overdue actions, recommends a specific next action. |
| `/analyze` | Full forensic pipeline (extract → audit → strategize → report). Supports 1-3 bureau reports plus optional previous report. |
| `/audit` | Run the 97 compliance rules on previously extracted data. Accepts cross-bureau and temporal payloads. |
| `/dispute-letters` | Generate personalized dispute letters from the 17-template catalog. |
| `/credit-qa` | Interactive credit-health Q&A using the 557-chunk legal RAG and Cowork Project memory. |
| `/search-law` | Search the legal RAG by query and category (13 categories available). |

## Agents

| Agent | Model | Purpose |
|-------|-------|---------|
| `flow-router` | Sonnet | Strategic routing on first interaction. Consults the Master Agent Flow Guide, runs Layer 2 audit via MCP, decides Flow A/B/C + phase, persists to Cowork Memoria. |
| `phase-tracker` | Sonnet | Journey continuity across sessions. Recovers state from Memoria, computes overdue actions and time elapsed, schedules check-ins via Cowork Programado. |
| `credit-forensic-analyst` | Opus | End-to-end forensic analysis. Orchestrates extract → audit → strategize → report. |
| `credit-health-advisor` | Sonnet | Interactive credit-health Q&A backed by the 557-chunk RAG. |
| `dispute-letter-generator` | Sonnet | Professional dispute-letter drafting across 17 templates. |

## Skills

| Skill | Purpose |
|-------|---------|
| `full-pipeline` | End-to-end orchestration with multi-bureau and temporal support. |
| `credit-report-parser` | PDF extraction (~75 fields/account). Outputs single, multi-bureau, or temporal `CreditReportData`. |
| `fcra-compliance-auditor` | 97-rule compliance engine with cross-bureau, temporal, and dispute-history awareness. |
| `dispute-strategist` | P0-P4 dispute strategy generation with the 97-rule catalog and 2024-2026 jurisprudence (Spokeo, TransUnion v. Ramirez, Henson, Cushman, Sessa, Hunstein, Heintz, Jerman). |
| `credit-law-rag` | 557-chunk legal RAG search across 13 categories. |
| `credit-score-educator` | Score explanation with FICO 8/9 + VantageScore 3.0/4.0 nuances. |
| `metro2-transformer` | Programmatic access to 11 Metro2 config files via `/api/config/{filename}`. |
| `ui-ux-credit` | Brand design system for dashboards. |

## What makes this a strategic system, not just a tool kit

The plugin pairs an *execution* layer (skills + agents that perform individual tasks) with a *strategic* layer (the Master Agent Flow Guide consumed by `flow-router` and `phase-tracker`).

- The flow guide is **27 H2 sections** in the API's vault describing three multi-week journeys (Repair / Optimization / Maintenance), each broken into phases, transitions, success metrics, and Latino overlays.
- The strategic agents read it via `rag_search`, decide where the consumer is in the journey, and orchestrate the right execution agents accordingly.
- Continuity is achieved through Cowork's native **Memoria** (persistent state) and **Programado** (scheduled tasks). No separate backend required.

This is why a returning user does not need to re-explain anything — `phase-tracker` already knows where they were.

## Operational policy: dispute-paired filings (context-dependent)

For most bureau-dispute Round-1 letters that target reporting accuracy (charge-offs, collections, late payments, mixed file, cross-bureau, temporal anomalies), the plugin pairs the certified-mail letter with a simultaneous CFPB complaint. The reasoning is documented in `vault/metodologia/secuencias-disputa.md` (server-side in the API), and the `dispute-strategist` and `dispute-letter-generator` apply it automatically when appropriate.

**Important:** this is NOT a blanket policy. The agents skip the CFPB pairing for:

- **Personal-information corrections** (name, address, employer) — these are clerical fixes, not regulatory pressure points.
- **Goodwill letters** — opening a CFPB case destroys the goodwill relationship, so they are mutually exclusive paths.
- **FCRA 605B identity-theft blocks** — the 4-business-day block runs first; CFPB only fires if the block fails.
- **Pure cease-and-desist letters** — operational FDCPA action, not a dispute.

The decision logic lives inside the agents and the strategist skill, not in user-facing project instructions. Use the plugin's outputs as-is rather than imposing a uniform "always file CFPB" rule from outside.

## Architectural decisions

See [`DECISIONS.md`](./DECISIONS.md) for the full ADR log:

- ADR-001 — Dual-mode plugin architecture
- ADR-002 — MCP HTTP transport with Bearer auth
- ADR-003 — Independent repo, separate from the API
- ADR-004 — Spanish translation as separate reference folder
- ADR-005 — API v3.0 contract upgrade across the plugin
- ADR-006 — Parallel adaptation strategy
- ADR-007 — Phase B+ strategic agents (flow-router, phase-tracker)

## Migration notes

If you are migrating from an older v1/v2 install, see [`MIGRATION_NOTES.md`](./MIGRATION_NOTES.md) for the complete v1 → v3 diff.

## Contributing

This is a single-author project for now. PRs welcome but please open an issue first to discuss the change.

## Author

Luis Cabrera — [@luicabref97](https://github.com/luicabref97)

## License

MIT — see [LICENSE](./LICENSE) if present.
