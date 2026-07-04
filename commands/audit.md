---
description: Run 106 FCRA/FDCPA/Reg F/Metro2 compliance rules against credit data (cross-bureau and temporal supported)
---

Run a v3 compliance audit on previously extracted credit report data.

## Prerequisites

- `output/extracted_data.json` must exist (run `/analyze` first if not).
- Optional: `output/other_bureau_reports.json` (for cross-bureau analysis), `output/previous_report_data.json` (for temporal analysis), `output/dispute_history.json` (for compliance and reinsertion checks).

## Execution

If the Elite Credit API is connected (MCP server `elite-credit-api`):

- Load the primary `CreditReportData` from `output/extracted_data.json`
- Load any optional files that exist (other_bureau_reports, previous_report_data, dispute_history)
- Call `POST /api/audit/run` with the assembled payload:

```
POST /api/audit/run
Authorization: Bearer <ELITE_CREDIT_API_KEY>
Content-Type: application/json

{
  "report_data":           { ... primary CreditReportData ... },
  "previous_report_data":  { ... previous CreditReportData (optional) ... },
  "dispute_history":       [ { ...DisputeRecord }, ... ],
  "other_bureau_reports":  [ { ...CreditReportData }, ... ]
}
```

Rate limit: 60/min.

This executes (depending on which optional fields are sent):

- 89 single-account rules (always)
- 7 collection-specific rules (always when `collections[]` non-empty)
- 1 file-level rule (once per report)
- 8 temporal rules + 1 soft-inquiry temporal rule (when `previous_report_data` is sent)
- 7 cross-bureau inline rules (when `other_bureau_reports` is sent)

Up to **106 registered rules + 7 cross-bureau rules executed inline**. Before the rules, Phase 1.7 resolves each collection's missing original creditor from the file itself (provenance in `original_creditor_source`).

If no API is connected:

- Perform manual audit using FCRA / FDCPA / Reg F knowledge
- Cover all rule categories: date, balance, status, category, identity, inquiry, collection, designator, special-comment, compliance-code, consumer-indicator, portfolio-type, ECOA-advanced, plus temporal and cross-bureau if extra reports are available

Save results to `output/audit_report.json`. The v3 response includes:

- `total_anomalies`, `anomalies_by_severity`, `anomalies_by_category`, `anomalies[]`
- `total_evaluations`, `unique_rules_fired`, `total_registered_rules` (106), `engine_version` ("3.2.0")
- `legal_disclaimer` (Spanish-language educational notice)
- Each anomaly's `suggested_action` is **prefixed** with the disclaimer — do NOT add another

## Output

Present summary:

- Total anomalies by severity (HIGH / MEDIUM / LOW / INFO)
- Grouped by category
- "**Detected {unique_rules_fired} types of issues from {total_registered_rules} rules examined**"
- Top 5 findings with descriptions
- If cross-bureau anomalies were found: spotlight them (highest evidence)
- If temporal anomalies were found: spotlight them (statutory-damages eligible)
- Recommend `/dispute-letters` as the next step
- Always relay the API's `legal_disclaimer` once at the end
