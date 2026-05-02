# Elite Credit AI Plugin

> Forensic credit-report analysis suite for Claude Cowork — built for US Latino consumers.
> Powered by the Elite Credit API v3.0 (97-rule audit + 557-chunk legal RAG over MCP HTTP).

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Version](https://img.shields.io/badge/version-3.0.2-blue.svg)](./.claude-plugin/plugin.json)

## What it does

Upload a credit report PDF and get:

- Full extraction of ~75 fields per account across **Equifax, Experian, TransUnion** (multi-bureau supported in one pass)
- **97 compliance rules** detecting FCRA / FDCPA / Reg F / Reg V / Metro2 violations — including **cross-bureau** (DOFD/balance/status mismatches) and **temporal** (re-aging, reinsertion, repollution)
- Prioritized dispute strategies (P0-P4) with legal citations from a **557-chunk** knowledge base covering **17 federal laws and 5 state laws**
- Personalized dispute letters across **17 templates** (round 1/2/3, debt validation, cease-and-desist, foreclosure, bankruptcy trustee/clerk, summons response, identity theft, etc.)
- Credit-score education at an 8th-grade reading level — VantageScore 3.0/4.0 + FICO 8/9 aware
- A `legal_disclaimer` plus a per-action prefix from the API — the agent always presents the audit as educational material, never as legal advice

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

## Operational policy: CFPB-from-Round-1

Every bureau dispute (Round 1) is paired with a simultaneous CFPB complaint. The vault, agents, and dispute-letter templates encode this consistently. The reasoning is documented in `vault/metodologia/secuencias-disputa.md` (server-side in the API). Personal-information corrections and goodwill letters are exempt — the agents handle these exceptions automatically.

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
