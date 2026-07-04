---
description: Run full v3 forensic credit report analysis pipeline (106 rules, multi-bureau, temporal)
---

Run the full Elite Credit AI v3 forensic analysis pipeline on the uploaded credit report PDF(s).

If a PDF path was provided as argument, use it. Otherwise ask the user to provide one.

If the user uploads 2 or 3 bureau reports together, the pipeline auto-detects this and runs cross-bureau analysis. If the user uploads a previous-period report along with the current one, the pipeline auto-detects this and runs temporal analysis.

## Execution

Spawn the `credit-forensic-analyst` agent to handle the full pipeline autonomously:

1. **Extract**: Read PDF(s) natively with Claude Vision → `output/extracted_data.json` (primary), `output/other_bureau_reports.json` (when 2+ bureaus uploaded), `output/previous_report_data.json` (when previous report uploaded), `output/dispute_history.json` (when dispute evidence provided)
2. **Validate**: Verify scores, accounts, personal info, `bureau`, and `client_state` exist (ask user if `client_state` is missing)
3. **Visualize**: Generate dashboard data → `output/dashboard_data.json`
4. **Audit**: If Elite Credit API is connected, call `POST /api/audit/run` with the assembled payload (sends `previous_report_data`, `dispute_history`, `other_bureau_reports` only when those files exist). This executes up to 106 server-side rules + 7 cross-bureau inline rules. Otherwise audit manually using FCRA / FDCPA knowledge → `output/audit_report.json`
5. **Strategize**: If API connected, call `POST /api/rag/search` against the 756-chunk legal RAG for citations and frameworks. Otherwise use general knowledge → `output/dispute_strategies.json`
6. **Report**: Compile forensic report → `output/forensic_report.md` with cross-bureau and temporal sections (when applicable) and the API's `legal_disclaimer` footer

## After Completion

- Present the Executive Summary including: total anomalies, severity counts, **`unique_rules_fired` of `total_registered_rules`** scope statement
- List top 3 priority actions (P0 / P1)
- If cross-bureau anomalies fired: highlight them — they are the highest-evidence disputes
- If temporal anomalies fired: highlight them — they may be statutory-damages eligible
- Offer to generate dispute letters (`/dispute-letters`)
- Offer credit Q&A (`/credit-qa`)
- Always relay the API's `legal_disclaimer` once at the end (in Spanish)
