---
description: >
  End-to-end forensic credit report analysis pipeline. Activates when user says
  "analyze my credit report", "run full analysis", "forensic audit", "credit report pipeline",
  or uploads a credit report PDF. Orchestrates extraction, visualization, auditing
  (97 FCRA/FDCPA/Reg F/Metro2 rules with cross-bureau and temporal support), dispute
  strategy generation with 557-chunk legal RAG, and dispute-letter generation. Multi-bureau
  and previous-report uploads are detected automatically.
---

# Full Credit Report Analysis Pipeline (v3)

Orchestrate the complete forensic analysis of a US tri-bureau credit report PDF, with optional cross-bureau and temporal upgrades.

## Pipeline Phases

### Phase 1: Extract & Visualize (~30-60 seconds)

**Step 1 — Extract**
- Read the PDF(s) using Claude Vision natively (document blocks). NEVER use OCR or PNG conversion.
- Identify each report's format: Equifax-powered (MyFreeScoreNow), TransUnion, Experian.
- Detect scoring model per bureau (VantageScore 3.0, VantageScore 4.0, FICO 8, FICO 9).
- Extract ~75 fields per account across all bureaus.
- Extract Collections as a SEPARATE section (`collections[]`).
- **Detect multi-bureau upload**: if 2 or 3 reports were uploaded together, save the primary one to `output/extracted_data.json` and the others to `output/other_bureau_reports.json`.
- **Detect temporal upload**: if the user uploads a previous-period report (1-12 months back), save it to `output/previous_report_data.json`.
- **Capture dispute history**: if the user mentions or uploads evidence of prior disputes / cease-and-desist letters, save them to `output/dispute_history.json`.

**Step 1.5 — Validate**
- Verify `scores` has at least 1 bureau with a numeric score.
- Verify `accounts` array is not empty.
- Verify `client_state` is set on the primary report (required by SOL and state-medical-ban rules — ask the user if missing).
- Verify `bureau` is set on every CreditReportData object.
- If validation fails, STOP with a clear error.

**Step 2 — Visualize**
- Calculate score grades: EXCELLENT (800+), VERY_GOOD (740-799), GOOD (670-739), FAIR (580-669), POOR (<580).
- Calculate factor grades A-F with model-specific weights (delegated to `credit-score-educator`).
- Generate 3-7 prioritized tips at 8th-grade reading level.
- Save to `output/dashboard_data.json`.

### Phase 2: Forensic Analysis (~1-2 minutes)

**Step 3 — Audit (97 Rules)**

If the Elite Credit API is connected (MCP server `elite-credit-api`), call `POST /api/audit/run` with the assembled payload:

```json
{
  "report_data": <output/extracted_data.json contents>,
  "previous_report_data": <output/previous_report_data.json if exists>,
  "dispute_history":      <output/dispute_history.json if exists>,
  "other_bureau_reports": <output/other_bureau_reports.json if exists>
}
```

This executes:
- 82 single-account rules
- 6 collection-specific rules
- 8 temporal rules (only when `previous_report_data` is provided)
- 1 soft-inquiry temporal rule
- 5 cross-bureau inline rules (only when `other_bureau_reports` is provided)
- = up to 97 rules + 5 cross-bureau rules

Rate limit: 60 requests / minute. The pipeline rarely hits this — one audit call per session.

**Save** the response to `output/audit_report.json`. The response has these v3 fields:
- `total_anomalies`, `anomalies_by_severity`, `anomalies_by_category`, `anomalies[]`
- `total_evaluations`, `unique_rules_fired`, `total_registered_rules` (always 97), `engine_version` ("3.0.0")
- `legal_disclaimer` (Spanish-language educational notice)
- Each `anomaly.suggested_action` is already prefixed with the disclaimer

If no API is connected, perform a manual audit using Claude's knowledge of FCRA / FDCPA / Reg F:
- 7-year / 10-year obsolescence
- Balance vs original amount
- Cross-bureau discrepancies (manual: compare DOFD, balance, status across uploaded reports)
- Medical-debt protections
- Impossible date patterns
- Temporal anomalies (if previous report uploaded): DOFD changes, payment-history changes, account reappearance

**Step 4 — Strategize**

Delegate to the `dispute-strategist` skill, which calls `POST /api/rag/search` if the API is connected to retrieve legal citations from the 557-chunk knowledge base.

Generate prioritized dispute strategies P0-P4. Save to `output/dispute_strategies.json`.

**Step 5 — Report**

Compile all outputs into `output/forensic_report.md` with:

- **Executive Summary** (Consumer, Report Date, Bureaus, Scores, Anomalies count by severity, Top 3 issues, Priority actions, Estimated score impact)
- **Score Overview** (per-bureau scores and grades)
- **Factor Analysis** (factor grades A-F with explanations)
- **Account Inventory** (all tradelines, collections, public records, inquiries)
- **Anomaly Findings** (grouped by category — date, balance, status, etc.)
- **Cross-bureau Findings** — NEW IN V3 — list of cross-bureau anomalies that fired (only present when 2+ bureaus uploaded)
- **Temporal Findings** — NEW IN V3 — list of temporal anomalies (re-aging, reinsertion, repollution, etc., only present when previous report uploaded)
- **Dispute Strategies** (P0-P4 with legal basis, evidence, timeline)
- **Timeline** (week-by-week action plan)
- **Legal Citations** (referenced FCRA / FDCPA / Reg F / state-law sections)
- **Legal Disclaimer Footer** — relay the API's `legal_disclaimer` once at the bottom (do not duplicate at every action — the API already prefixed each action)

## Executive Summary Template

```markdown
## Executive Summary

- **Consumer**: [name]
- **Report Date**: [date]
- **Bureaus Analyzed**: [list — TU, EQ, EX as applicable]
- **Credit Scores**: TU: [score] | EQ: [score] | EX: [score]
- **Total Accounts**: [count]
- **Anomalies Found**: [total_anomalies] across [unique_rules_fired] of [total_registered_rules] rules
   - HIGH: [count] | MEDIUM: [count] | LOW: [count] | INFO: [count]
- **Cross-bureau anomalies**: [count] (only present when other_bureau_reports uploaded)
- **Temporal anomalies**: [count] (only present when previous_report_data uploaded)
- **Top 3 Issues**: [brief list]
- **Priority Actions** (P0/P1):
  1. [action 1]
  2. [action 2]
  3. [action 3]
- **Estimated Score Impact**: +[X-Y] points if all P0/P1 disputes resolve in consumer's favor
```

## Critical Rules

- NEVER fabricate data — if not in PDF, use null.
- NEVER skip accounts — extract every tradeline.
- ALWAYS extract per-bureau data separately. An account CAN be negative in one bureau and positive in another.
- ALWAYS check whether the user uploaded multiple reports — multi-bureau and temporal capabilities only fire when their data is provided.
- ALWAYS relay the API's `legal_disclaimer` once at the end of the report.
- NEVER add a duplicate disclaimer to each anomaly — the API already prefixed `suggested_action`.
- ALWAYS report `unique_rules_fired` / `total_registered_rules` so the user understands the scope.

## Output File Layout

```
output/
├── extracted_data.json              ← primary CreditReportData (always)
├── other_bureau_reports.json        ← only when 2+ bureaus uploaded
├── previous_report_data.json        ← only when a previous report uploaded
├── dispute_history.json             ← only when prior dispute evidence given
├── dashboard_data.json              ← score grades, factor grades, tips
├── audit_report.json                ← from /api/audit/run (97-rule output)
├── dispute_strategies.json          ← from dispute-strategist skill
└── forensic_report.md               ← compiled human-readable summary
```

## Latino-specific overlay

When the user is in California, Texas, New York, Florida, or otros estados with strong consumer-credit laws, the strategist will include state-specific citations alongside federal ones (CA Rosenthal Act, TX Finance Code Ch. 392, NY GBL Article 25, FL CCPA). The legal RAG returns these chunks automatically when the query matches; the pipeline simply needs to populate `client_state` correctly during Phase 1.

When the user is on ITIN (no SSN) or recently arrived, the parser captures this in `personal_info` and the strategist may suggest different paths (Regulation BB / community-reinvestment opportunities, ITIN-friendly lenders, etc.). Educational chunks under category `EDUCATION` cover this.
