# Migration Notes — Plugin v1 → v3

This document is the authoritative reference for the changes between the **original Cowork plugin (v1)** in `elite-credit-ai-plugin (no modificar - solo para contexto)/` and this **adapted plugin (v3)** in `elite-credit-ai-plugin-v3/`.

The adapted plugin aligns the skills, agents, and commands with the **Elite Credit API v3.0.0** (current production state of `main.py`, `layer2/`, and `vault/` in this same repository).

The original plugin is **NOT modified** — it stays intact for reference. To apply v3 changes to the live Cowork plugin, open each file here and copy its contents into the equivalent file in your installed Cowork plugin.

---

## Executive Summary

The original plugin assumed a smaller and older version of the API. While the dual-mode pattern (works with API or with Claude's general knowledge) is preserved, the v3 plugin upgrades:

- The number of compliance rules from **32 → 97**
- The size of the legal RAG from **161 chunks → 527 chunks**
- The number of RAG category prefixes from **5 → 13**
- The number of API endpoints from **2 → 5** (adds `/api/config/{filename}`, `/api/rag/stats`, `/health`)
- The shape of `/api/audit/run` request — adds `previous_report_data`, `dispute_history`, `other_bureau_reports`
- The shape of `/api/audit/run` response — adds `total_evaluations`, `unique_rules_fired`, `total_registered_rules`, `legal_disclaimer`, and a per-action disclaimer prefix
- New capabilities: cross-bureau comparison, temporal audit, dispute history awareness, programmatic Metro2 config access
- Latino-specific content: 17 federal laws + 5 state laws (California Rosenthal, Texas Finance Code, NY GBL Article 25, Florida CCPA, otros estados)

---

## Diff Table — Numbers and Capabilities

| Aspect | v1 (original) | v3 (adapted) | Source of truth |
|--------|---------------|--------------|-----------------|
| Compliance rules | 32 | **97** | `layer2/engine.py` |
| RAG chunks | 161 | **527** | `data/elite_credit_ai_rag_v2.json` |
| RAG categories | 5 (EDU, JUR, RPT, LET, STR) | **13** (those + LEGAL_INTERPRETATION, DAMAGES, DUAL_STATUTE, EXECUTION, JURISPRUDENCE, LEGAL, LETTER_FRAMEWORK, LETTER_TEMPLATE, METHODOLOGY, SEQUENCE, STRATEGY, TECHNICAL, EDUCATION) | `data/elite_credit_ai_rag_v2.json` metadata.category |
| API endpoints | 2 (`/api/audit/run`, `/api/rag/search`) | **5** (those + `/api/config/{filename}`, `/api/rag/stats`, `/health`) | `main.py` |
| Audit request shape | `{ report_data }` | `{ report_data, previous_report_data?, dispute_history?, other_bureau_reports? }` | `main.py` `AuditRequest` |
| Audit response — counter fields | `total_rules_executed`, `engine_version` | + `total_evaluations`, `unique_rules_fired`, `total_registered_rules`, `legal_disclaimer` | `main.py` `AuditResponse` + `layer2/models/anomaly.py` |
| Per-anomaly `suggested_action` | plain text | text **prefixed with disclaimer**: "Esto es educativo, no asesoria legal. Consulta un abogado FCRA/FDCPA antes de actuar. " | `main.py` run_audit handler |
| Cross-bureau audit | Not supported by API | **Supported** — pass `other_bureau_reports`. Triggers DOFD_DISCREPANCY_CROSS_BUREAU, BALANCE_DISCREPANCY_CROSS_BUREAU, STATUS_CONFLICT_CROSS_BUREAU, DATE_OPENED_DISCREPANCY, CORRECTION_NOT_PROPAGATED_CROSS_BUREAU | `layer2/engine.py` `_run_cross_bureau` |
| Temporal audit | Not supported | **Supported** — pass `previous_report_data`. Triggers DOFD_CHANGED, RETROACTIVE_PAYMENT_CHANGE, REPOLLUTION_DETECTION, REINSERTION_DETECTION, BALANCE_INCREASED_ON_CLOSED_ACCOUNT, CORRECTION_NOT_PROPAGATED_CROSS_BUREAU, VOLUNTARY_CLOSURE_NOT_INDICATED, PRIVATE_LOAN_REHAB_STILL_DEFAULT, SOFT_INQUIRY_OVER_1_YEAR | `layer2/engine.py` `_merge_temporal_data` + `temporal_rules` |
| Dispute history awareness | Not used | Used by `DISPUTE_NOT_INDICATED` and `REINSERTION_DETECTION` rules | `layer2/rules/compliance_code_rules.py`, `layer2/rules/temporal_rules.py` |
| Metro2 config access | Documented but no explicit endpoint call | **Programmatic via `GET /api/config/{filename}`** for 11 files | `main.py` config endpoint |
| Rate limits | Not documented | **60/min** on `/api/audit/run`, **120/min** on `/api/rag/search`, **200/min** default | `main.py` `_maybe_rate_limit` |
| Engine version | v1 (implicit) | `3.0.0` | `main.py` `AnomalyEngine` |
| Latin American legal coverage | Federal laws partial | 17 federal laws (FCRA, FDCPA, FACTA, ECOA, TILA, CARD Act, EFTA, UDAAP, SCRA, Reg F, Reg V, Reg X, Reg BB, HEA, Bankruptcy, UCC9, CROA) + **5 state laws** (CA Rosenthal, TX Finance Code, NY GBL Art. 25, FL CCPA, otros estados) | `vault/leyes/` |

---

## Per-File Change Log

Each file in `elite-credit-ai-plugin-v3/` mirrors the original; mismo path, mismo nombre. Below is the diff summary per file.

### `README.md` (root)

- Updated counts: 32 → 97 rules, 161 → 527 chunks
- Added mention of new endpoints, cross-bureau, temporal, Metro2 config access
- Added rate limit notes

### `DECISIONS.md` (root)

- Added ADR-005: API v3.0 contract upgrade (cross-bureau, temporal, config endpoint, disclaimer)
- Added ADR-006: Plugin v3 as parallel adaptation (no modifying original)
- Existing ADRs (001–004) kept intact for historical reference

### `agents/credit-forensic-analyst.md`

- Step 3 (Audit): now sends `previous_report_data` (if available), `dispute_history` (if available), `other_bureau_reports` (if 2+ bureaus uploaded). Was: `report_data` only.
- Step 3 (Response handling): now reads `legal_disclaimer`, `unique_rules_fired`, `total_registered_rules`, `total_evaluations` from response.
- Step 4 (RAG): top_k raised to 8–10 (was 5); categories expanded to include `LEGAL_INTERPRETATION`, `JURISPRUDENCE`, `STRATEGY`, `LETTER_TEMPLATE`.
- Output JSON `audit_report.json`: now includes the new counter fields and disclaimer.
- Explicit note: each `suggested_action` already carries a disclaimer prefix from the API — do NOT duplicate.

### `agents/credit-health-advisor.md`

- "527 chunks" replaces "161"
- RAG category list updated; preferred categories for educational Q&A: `EDUCATION`, `LEGAL_INTERPRETATION`, `STRATEGY`
- Explicit handling of `legal_disclaimer` returned by the API

### `agents/dispute-letter-generator.md`

- Template catalog expanded — references the 17 letter templates currently in `vault/templates-cartas/` (validate-debt-1, validate-debt-2, validacion-deuda-colector, cuenta-reinsertada, nuevo-metodo-reinsertadas, reinsertion-dispute, dispute-lexisnexis, congelamiento-bureaus-secundarios, clerk-of-court, bankruptcy-trustee, summons-corte, medical-collection, correcting-personal-info, foreclosure-disputa, round1-initial-dispute-bureaus, round2-followup-dispute-bureaus, round3-bankruptcy-final)
- Sub-flows by negative type: charge-off, collection (debt validation), late payment (goodwill), bankruptcy (trustee+clerk dual letter), repo (UCC-9), mixed-file (FCRA §1681e(b))
- Fixed pack chunk IDs (9) referenced explicitly

### `commands/analyze.md`

- "97 rules" replaces "32"
- Pipeline output now mentions cross-bureau and temporal sections in `forensic_report.md`
- Note about `legal_disclaimer`

### `commands/audit.md`

- Request body schema updated for the 4 fields (`report_data`, `previous_report_data`, `dispute_history`, `other_bureau_reports`)
- Response shape updated for the 11 fields
- Two new examples: cross-bureau (3 reports) and temporal (current + last month)

### `commands/credit-qa.md`

- "527 chunks" replaces "161"
- New categories visible in RAG search

### `commands/dispute-letters.md`

- Expanded template catalog
- Sub-flow guidance per negative type

### `commands/search-law.md`

- "527 chunks" replaces "161"
- 13 valid category values listed
- Examples in Spanish typical of Latino consumer queries

### `skills/credit-law-rag/SKILL.md`

- "527-chunk knowledge base" replaces "161-chunk"
- 13 categories table replaces 5-category table
- Topics expanded to enumerate the 17 federal laws + 5 state laws + jurisprudence + methodology
- Fixed pack: 9 chunk IDs (EDU-001, EDU-002, EDU-003, EDU-015, EDU-016, RPT-002, RPT-003, RPT-005, RPT-007)
- TF-IDF mention: pre-computed vectors with L2-normalized cosine similarity
- Rate limit: 120/min

### `skills/credit-report-parser/SKILL.md`

- Output JSON: now includes `dispute_history` (DisputeRecord[]), `previous_report_date`, `client_state` (US two-letter code, used by SOL and medical-ban rules), `bureau` (consistent across CreditReportData)
- Sub-output: when 2 or 3 bureau reports are uploaded together, the parser produces an `other_bureau_reports` array of CreditReportData (not concatenating accounts)
- Sub-output: when a previous report is uploaded, the parser produces a `previous_report_data` CreditReportData
- Critical fields for temporal rules flagged: `dofd`, `payment_history`, `balance`, `dispute_status`, `previously_deleted` (set heuristically when account reappears after gap)

### `skills/credit-score-educator/SKILL.md`

- New 2025-2026 references: VantageScore 4.0 trended data, FICO 9 medical/rent rules, FICO 8 small-collection ($100) threshold, the medical-debt-rule-vacated-2025 caveat
- Anchored to vault guides: `educacion-crediticia-myfico.md`, `us-credit-scoring-systems.md`, `construccion-credito-2025.md`

### `skills/dispute-strategist/SKILL.md`

- Anomaly catalog expanded with the 97-rule inventory, especially the new categories: cross-bureau (5 inline rules), temporal (8 rules), special-comment (6), compliance-code (4), consumer-indicator (5), portfolio-type (4), ECOA-advanced (3)
- Priority adjustments: cross-bureau anomalies escalate to P0 (high evidence, easy proof), temporal re-aging escalates to P0 (statutory damages eligible)
- Jurisprudence integrated: Spokeo v. Robins, TransUnion v. Ramirez, Henson v. Santander, Cushman v. TransUnion, Sessa v. TransUnion, Hunstein v. Preferred Collection, Heintz v. Jenkins, Jerman v. Carlisle

### `skills/fcra-compliance-auditor/SKILL.md` (CRITICAL — core skill)

- "97 programmatic rules" replaces "32"
- Full distribution (date 10, balance 13, status 11, category 13, identity 5, inquiry 5, designator 3, special_comment 6, compliance_code 4, consumer_indicator 5, portfolio_type 4, ecoa_advanced 3 = 82 single-account + 6 collection + 8 temporal + 1 soft inquiry = 97; plus 5 cross-bureau rules executed inline when `other_bureau_reports` is provided)
- Request body documented for the 4 fields
- Response shape documented for the 11 fields
- Disclaimer awareness — `legal_disclaimer` and per-action prefix
- Rate limit 60/min documented
- "When to use which optional field" section: previous_report_data (temporal), other_bureau_reports (cross-bureau), dispute_history (compliance/reinsertion)

### `skills/full-pipeline/SKILL.md`

- Phase 1 extends to detect 1, 2, or 3 bureau reports; previous report; dispute history
- Phase 2 (Audit) sends the 4 fields when applicable
- Output `forensic_report.md` includes:
  - "Cross-bureau findings" section
  - "Temporal findings (re-aging, reinsertion, repollution)" section
  - "Legal disclaimer" footer

### `skills/metro2-transformer/SKILL.md` (CRITICAL update — gap closed)

Added explicit `GET /api/config/{filename}` endpoint usage:

- 11 valid filenames documented:
  - `remarks_to_metro2`
  - `medical_keywords`
  - `medical_provider_keywords`
  - `va_creditor_names`
  - `metro2_codes`
  - `special_comments`
  - `compliance_conditions`
  - `consumer_indicators`
  - `portfolio_types`
  - `sol_by_state`
  - `state_medical_bans`
- When to call each (during parsing, during medical detection, during state-specific rule evaluation)
- Auth: Bearer token same as other endpoints
- Cache hint: configs are stable; recommended to fetch once per session

### `skills/ui-ux-credit/SKILL.md`

- **No changes.** This skill is design-only and does not depend on the API. The v3 file is a verbatim copy of the v1 file.

---

## How to Apply These Changes to Your Cowork Plugin

The folder `elite-credit-ai-plugin-v3/` is a parallel reference. The Cowork plugin you have installed is fed from a different location (the original folder you marked "no modificar" or wherever Cowork syncs from).

To apply v3 to your live plugin:

1. **For each file in `elite-credit-ai-plugin-v3/`**:
   - Open the v3 file
   - Open the equivalent v1 file in your installed Cowork plugin
   - Replace the contents (or apply the diff manually if you want to preserve other local edits)

2. **Validate** before re-installing:
   - Skill frontmatter must contain ONLY `description`, `disable-model-invocation`, or `user-invocable`. NEVER `name` or `version` (Cowork rejects these — see `LEARNINGS.md` in the original folder).
   - Agent `tools` must be a comma-separated string, NOT a JSON array.
   - Agent `color` must be one of: `blue`, `cyan`, `green`, `yellow`, `magenta`, `red` (no `gold`).
   - Command frontmatter must contain ONLY `description` (no `allowed-tools`, no `model`).
   - These rules are preserved in all v3 files.

3. **Re-install** the plugin in Cowork (or commit/push if your Cowork plugin syncs from git).

4. **Verify with a smoke test**:
   - Run `/health` (no auth) and confirm `total_rules: 97`, `rag_chunks: 557`, `version: "3.0.0"`.
   - Run `/search-law "ley FCRA reglas de validacion"` and confirm chunks come back from `LEGAL_INTERPRETATION` and `JURISPRUDENCE` categories.
   - Upload a credit report and run `/analyze`. Confirm the audit report contains `unique_rules_fired`, `total_registered_rules: 97`, and `legal_disclaimer`.
   - If you uploaded 2+ bureau reports, confirm the report has cross-bureau anomalies (DOFD_DISCREPANCY_CROSS_BUREAU, etc.).

---

## Phase B+ Additions (April 2026 — Master Agent Flow Guide consumers)

The Master Agent Flow Guide was added to the vault as `vault/metodologia/master-agent-flow-guide.md` (27 H2 sections, ~10,500 words, served via `/api/rag/search` with `source: MET-FLOW-GUIDE`). The plugin v3 was then extended with **2 new agents and 2 new commands** that consume the flow guide to deliver strategic routing and journey continuity.

### New agents

- `agents/flow-router.md` — Strategic routing agent. Activates on the user's FIRST interaction. Reads Cowork Memoria (if any), runs the Entry Decision Tree from the flow guide, calls `POST /api/audit/run` for Layer 2 analysis, decides Flow A/B/C + phase, saves the routing to Memoria, and hands off to executing agents. Color: blue. Tools: Read, Write, Glob, Grep, Bash, Agent.

- `agents/phase-tracker.md` — Journey continuity agent. Activates when a user RETURNS or asks "what's next?" Reads state from Cowork Memoria, computes time elapsed, checks transition triggers, queries the flow guide for the current phase chunk, recommends a specific next action, and updates Memoria. Color: green. Tools: Read, Write, Glob, Grep, Bash.

### New commands

- `commands/start-journey.md` — Entry point that spawns `flow-router`. For new users.
- `commands/next-step.md` — Entry point that spawns `phase-tracker`. For returning users.

### Why these were added

- **Without `flow-router`**: a new user dumps their situation on Claude and hopes the agent improvises a good plan. With `flow-router`: the agent consults the Master Agent Flow Guide and routes deterministically.
- **Without `phase-tracker`**: a returning user re-explains their situation every session. With `phase-tracker`: Cowork Memoria persists state and the agent picks up exactly where it left off — across devices and weeks.
- **Without these**: the flow guide is dormant content in the RAG. With these: the flow guide is actively orchestrating the consumer's journey.

### Cowork Project features leveraged

- **Memoria** — server-side persistent storage of user state (`active_flow`, `current_phase`, `dispute_history`, `transitions`, etc.).
- **Programado** — scheduled tasks. `phase-tracker` schedules itself to re-activate when a response is due (e.g., 30 days after Round 1 sent).
- **Chat history** — conversation persistence across sessions.

These features are native to Cowork Projects and require no new infrastructure on the API side.

### How to apply Phase B+ to your installed Cowork plugin

Same process as the rest of v3: copy the new files into the Cowork plugin you have installed:

- `agents/flow-router.md`
- `agents/phase-tracker.md`
- `commands/start-journey.md`
- `commands/next-step.md`

After copying, validate frontmatter (same Cowork rules as before — `name`, `description`, `model`, `color` from the valid list, `tools` as CSV string for agents; only `description` for commands). All v3 files have been pre-validated.

Re-install the plugin in Cowork. The new commands `/start-journey` and `/next-step` will appear in the command palette.

## Future-only Items (NOT in v3 — for Phase B++ and beyond)

These are ideas captured during the v3 design but intentionally OUT OF SCOPE for this migration:

### Endpoints to consider for the API (post-v3)

- `POST /api/outcomes/log` — capture per-user outcomes (anonymously) for cross-user analytics
- `GET /api/stats/success_rate?template=...&state=...` — return aggregated success stats to inform agents
- `GET /api/settlements/check?creditor=...` — query the settlement database
- `GET /api/referrals/attorneys?state=...&city=...` — query the consumer-attorney directory
- A scheduled job to auto-update the regulatory portion of the vault (CFPB, FTC, state AG enforcement actions)

These are documented in `STRATEGIC_ROADMAP.md` (project root) and are the next logical evolution after v3 and the Master Agent Flow Guide.

---

## File Inventory

```
elite-credit-ai-plugin-v3/
├── MIGRATION_NOTES.md                              ← THIS FILE
├── README.md                                       ← updated v3 (with Phase B+ section)
├── DECISIONS.md                                    ← ADR-001..ADR-006 + ADR-007 (Phase B+)
├── agents/
│   ├── credit-forensic-analyst.md                  ← updated
│   ├── credit-health-advisor.md                    ← updated
│   ├── dispute-letter-generator.md                 ← updated
│   ├── flow-router.md                              ← NEW (Phase B+) — strategic routing
│   └── phase-tracker.md                            ← NEW (Phase B+) — journey continuity
├── commands/
│   ├── analyze.md                                  ← updated
│   ├── audit.md                                    ← updated (request/response shape)
│   ├── credit-qa.md                                ← updated
│   ├── dispute-letters.md                          ← updated
│   ├── search-law.md                               ← updated (13 categories)
│   ├── start-journey.md                            ← NEW (Phase B+) — spawns flow-router
│   └── next-step.md                                ← NEW (Phase B+) — spawns phase-tracker
└── skills/
    ├── credit-law-rag/SKILL.md                     ← updated
    ├── credit-report-parser/SKILL.md               ← updated (multi-bureau / temporal output)
    ├── credit-score-educator/SKILL.md              ← updated
    ├── dispute-strategist/SKILL.md                 ← updated (97-rule catalog)
    ├── fcra-compliance-auditor/SKILL.md            ← updated (CRITICAL)
    ├── full-pipeline/SKILL.md                      ← updated
    ├── metro2-transformer/SKILL.md                 ← updated (CRITICAL — config endpoint)
    └── ui-ux-credit/SKILL.md                       ← unchanged (verbatim copy)
```

**Total v3 files:** 23 (3 root docs + 5 agents + 7 commands + 8 skills/*/SKILL.md)
**Phase B+ adds:** 2 agents + 2 commands

The original folder `elite-credit-ai-plugin (no modificar - solo para contexto)/` is preserved verbatim and is NOT modified by this migration.

## Vault changes accompanying this migration

While the plugin lives in `elite-credit-ai-plugin-v3/`, two vault files were added/created to support Phase B and Phase B+:

- `vault/metodologia/master-agent-flow-guide.md` — 27 H2 sections (~10,500 words). The strategic playbook consumed by `flow-router` and `phase-tracker` agents via `/api/rag/search` (`source: MET-FLOW-GUIDE`).
- RAG corpus grew from 527 to 557 chunks after sync (Phase B+ flow guide + minor expansions). Categories: STRATEGY now 144 (+27 from flow guide).

These vault changes do NOT need to be manually applied to your Cowork plugin — they are server-side, served through the API endpoints. As soon as the API is deployed with the updated `data/elite_credit_ai_rag_v2.json`, the plugin (any version that calls `/api/rag/search`) automatically benefits.
