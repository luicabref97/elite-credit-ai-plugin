---
description: >
  Run 106 forensic FCRA/FDCPA/Reg F/Reg V/Metro2 compliance rules against credit report data.
  Detects single-account violations, cross-bureau discrepancies, and temporal anomalies (re-aging,
  reinsertion, repollution) with legal citations. Activates when user mentions "audit", "compliance
  check", "find violations", "what's wrong with my report", "FCRA violations", "cross-bureau check",
  "re-aging", "reinsertion", or after a credit report is parsed.
---

# FCRA Compliance Auditor

Run 106 programmatic rules against extracted credit report data to detect FCRA / FDCPA / Reg F / Reg V / Metro2 violations.

## How to Run

If the Elite Credit API is connected (MCP server `elite-credit-api`), call `POST /api/audit/run`:

```
POST /api/audit/run
Authorization: Bearer <ELITE_CREDIT_API_KEY>
Content-Type: application/json

{
  "report_data": { ... extracted CreditReportData JSON ... },

  "previous_report_data": { ... CreditReportData from a previous date (optional) ... },
  "dispute_history":      [ { date, bureau, account_number, creditor_name, dispute_type, status, response, response_date } ],
  "other_bureau_reports": [ { ... CreditReportData from other bureaus (optional) ... } ]
}
```

Rate limit: **60 requests / minute** per IP.

If no API is connected, perform a manual audit using Claude's knowledge of FCRA / FDCPA / Reg F / Reg V (see rule categories below).

## When to send each optional field

| Field | When to include | Activates |
|-------|-----------------|-----------|
| `previous_report_data` | The user uploaded a credit report from a previous date (1-12 months back) | Temporal rules: DOFD_CHANGED, RETROACTIVE_PAYMENT_CHANGE, REPOLLUTION_DETECTION, REINSERTION_DETECTION, BALANCE_INCREASED_ON_CLOSED_ACCOUNT, VOLUNTARY_CLOSURE_NOT_INDICATED, PRIVATE_LOAN_REHAB_STILL_DEFAULT, SOFT_INQUIRY_OVER_1_YEAR |
| `other_bureau_reports` | The user uploaded reports from 2 or 3 bureaus | Cross-bureau rules: DOFD_DISCREPANCY_CROSS_BUREAU, BALANCE_DISCREPANCY_CROSS_BUREAU, STATUS_CONFLICT_CROSS_BUREAU, DATE_OPENED_DISCREPANCY, PAST_DUE_DISCREPANCY_CROSS_BUREAU, HIGH_CREDIT_DISCREPANCY_CROSS_BUREAU, CORRECTION_NOT_PROPAGATED_CROSS_BUREAU. Also improves Phase 1.7 collection enrichment (cross-bureau refs resolve abbreviated agency names) |
| `dispute_history` | The user reports having sent prior disputes, validation requests, or cease-and-desist letters | Compliance rules: DISPUTE_NOT_INDICATED, REINSERTION_DETECTION (consented vs unconsented) |

Each optional field is independent. Send any combination.

## Response Shape (v3.2)

```json
{
  "total_anomalies": 14,
  "anomalies_by_severity": { "HIGH": 6, "MEDIUM": 5, "LOW": 3, "INFO": 0 },
  "anomalies_by_category": { "date": 8, "balance": 4, "status": 2, "temporal": 1 },
  "anomalies": [ { rule_name, severity, category, account_info, data_points, legal_citations, description, suggested_action } ],
  "execution_time_ms": 145.32,
  "total_rules_executed": 106,
  "total_evaluations": 106,
  "unique_rules_fired": 14,
  "total_registered_rules": 106,
  "engine_version": "3.2.0",
  "legal_disclaimer": "Este API devuelve analisis automatizado ... NO constituye asesoria legal. ..."
}
```

**Important — the API now prefixes every `suggested_action` with a Spanish disclaimer:**

> "Esto es educativo, no asesoria legal. Consulta un abogado FCRA/FDCPA antes de actuar. "

When presenting anomalies to the user, do NOT add another disclaimer on top — the API already included it. Always relay the top-level `legal_disclaimer` once at the end of the audit summary.

## Rule Inventory (106 total)

The 106 rules are partitioned into 6 execution buckets:

### A. Single-account rules (89 — run on every account)

#### Date rules (12)
- `ACCOUNT_EXCEEDS_7_YEARS` (HIGH) — FCRA 605(a)(4)-(5) obsolescence
- `IMPOSSIBLE_DATE_PATTERNS` (HIGH) — Future dates, opened > closed, DOFD > closed
- `CHARGEOFF_MISSING_DOFD` (MEDIUM) — Charge-offs must have Date of First Delinquency
- `BANKRUPTCY_EXCEEDS_10_YEARS` (HIGH) — FCRA 605(a)(1) limit
- `REMOVAL_DATE_MISCALCULATED` (HIGH) — DOFD + 7 years removal date error
- `DOFD_DISCREPANCY_CROSS_BUREAU` — single-account fallback (also runs cross-bureau)
- `DATE_OPENED_DISCREPANCY` — single-account fallback (also runs cross-bureau)
- `DATE_REPORTED_STALE` — Last reported > 90 days
- `LAST_ACTIVITY_CONTRADICTS_STATUS` — Active status with old activity
- `COLLECTION_DATE_BEFORE_DOFD` — Collection assigned before delinquency
- `NEGATIVE_ACCOUNT_MISSING_DOFD` (HIGH) — NEW v3.2 — Derogatory/collection account (non charge-off) missing its DOFD; guarded against double-firing with CHARGEOFF_MISSING_DOFD and DELINQUENT_BUT_NO_DOFD
- `RE_AGING_SIGNATURE` (HIGH) — NEW v3.2 — First delinquency reported >180 days AFTER last activity (intra-report re-aging signature)

#### Balance rules (15)
- `BALANCE_EXCEEDS_ORIGINAL` (HIGH) — FDCPA 808(1) prohibition
- `PAST_DUE_EXCEEDS_BALANCE` (HIGH) — Mathematically impossible
- `CREDIT_LIMIT_ZERO_WITH_BALANCE` (MEDIUM) — Revolving with balance but $0 limit
- `PAID_ACCOUNT_NONZERO_BALANCE` (MEDIUM) — Paid/settled showing balance
- `BALANCE_GROWTH_CLOSED_NEGATIVE` (MEDIUM) — Closed account balance increasing
- `CHARGEOFF_MISSING_AMOUNT` (MEDIUM) — Charge-offs must have amount
- `BALANCE_DISCREPANCY_CROSS_BUREAU` — single-account fallback
- `HIGH_CREDIT_LESS_THAN_BALANCE` — Logical impossibility
- `PAYMENT_AMOUNT_EXCEEDS_BALANCE` — Reporting error
- `SCHEDULED_PAYMENT_MISMATCH` — Scheduled vs actual diverges
- `BALLOON_PAYMENT_NOT_REPORTED` — Balloon loan missing flag
- `NEGATIVE_BALANCE` — Balance < 0
- `ORIGINAL_AMOUNT_ZERO_WITH_BALANCE` — Missing original amount
- `BALANCE_EXCEEDS_CREDIT_LIMIT` (HIGH) — NEW v3.2 — Revolving balance above the credit limit (review-flag framing, never "illegal")
- `CLOSED_ACCOUNT_WITH_MONTHLY_PAYMENT` (MEDIUM) — NEW v3.2 — Charged-off/closed account still demanding a scheduled monthly payment

#### Status rules (12)
- `PAYMENT_GRID_CONTRADICTS_STATUS` (HIGH)
- `STATUS_CONFLICT_CROSS_BUREAU` — single-account fallback
- `PAID_STATUS_WITH_PAST_DUE` (MEDIUM)
- `CLOSED_ACCOUNT_STILL_REPORTING_PAYMENTS`
- `OPEN_ACCOUNT_WITH_CHARGEOFF_STATUS`
- `PAYMENT_RATING_CONTRADICTS_PAYMENT_STATUS`
- `COLLECTION_STATUS_NOT_COLLECTION`
- `DELINQUENT_BUT_NO_DOFD`
- `ACCOUNT_STATUS_BLANK`
- `SOL_EXPIRED_STILL_REPORTING_NEGATIVE` (uses `client_state` and `sol_by_state` config)
- `TRANSFERRED_BUT_NO_COMPANY_SOLD_TO`
- `PAYMENT_HISTORY_CODE_CONTRADICTS_PUBLIC_RECORDS` (HIGH) — NEW v3.2 — Bankruptcy "B" codes in the monthly grid with no bankruptcy in public records

#### Collection cross-section rule (1)

- `DUPLICATE_DEBT_ORIGINAL_PLUS_COLLECTOR` (HIGH) — NEW v3.2 — Same debt reported by the original creditor's charge-off AND a collector/debt-buyer entry (uses `debt_buyer_names` config; runs per account so it fires even when `collections[]` is empty)

#### Category rules (13)
- `MEDICAL_PAID_STILL_REPORTING` (MEDIUM) — NCRA 2022 voluntary policy
- `MEDICAL_UNDER_1_YEAR` — 1-year grace period (NCRA voluntary)
- `MEDICAL_UNDER_500` — Under $500 NCRA voluntary policy (NOTE: CFPB rule was VACATED July 2025)
- `COLLECTION_NO_ORIGINAL_CREDITOR` (HIGH)
- `MEDICAL_PROVIDER_NAME_EXPOSED` (HIGH) — HIPAA-adjacent privacy violation
- `STUDENT_LOAN_DEFAULT_STALE`
- `AUTO_LOAN_DEFICIENCY_NOT_SEPARATED`
- `MEDICAL_DEBT_STATE_BAN` (HIGH) — uses `state_medical_bans` config; matches by `client_state` and ban_type/threshold
- `VETERAN_MEDICAL_PAID_STILL_REPORTING` — uses `va_creditor_names` config
- `COLLECTION_MISSING_DATE_ASSIGNED`
- `CLOSED_COLLECTION_STILL_GROWING`
- `FORECLOSURE_WITHOUT_PUBLIC_RECORD`
- `RENT_COLLECTION_REPORTED`

#### Identity rules (5)
- `DUPLICATE_TRADELINE` (HIGH)
- `MIXED_FILE_DETECTION` (HIGH) — Cortez v. TransUnion territory
- `ADDRESS_VARIATION_EXCESSIVE`
- `NAME_VARIATION_SUSPICIOUS`
- `EMPLOYER_VARIATION_EXCESSIVE`

#### Inquiry rules (5)
- `INQUIRY_OVER_24_MONTHS` (LOW)
- `INQUIRY_NO_PURPOSE`
- `INQUIRY_DUPLICATE_CREDITOR`
- `PROMOTIONAL_INQUIRY_MISCLASSIFIED`
- `INQUIRY_FROM_UNKNOWN_CREDITOR`

#### Designator rules (3)
- `AUTHORIZED_USER_NEGATIVE_ACCOUNT`
- `CHARGEOFF_AMOUNT_MISMATCH`
- `LOAN_TYPE_STATUS_CONFLICT`

#### Special-comment rules (6)
- `SPECIAL_COMMENT_CONTRADICTS_STATUS`
- `BANKRUPTCY_COMMENT_WITHOUT_CHAPTER`
- `DISPUTE_COMMENT_STALE`
- `TRANSFERRED_ACCOUNT_BALANCE`
- `CLOSED_BY_CONSUMER_NOT_MARKED`
- `DECEASED_INDICATOR_ACTIVE`

#### Compliance-code rules (4)
- `DISPUTE_NOT_INDICATED` — uses `dispute_history` to detect missing flags
- `COMPLIANCE_CONDITION_CONTRADICTS_DATA`
- `DISPUTE_FLAG_STALE`
- `REGULATORY_COMPLIANCE_CODE_MISSING`

#### Consumer-indicator rules (5)
- `BANKRUPTCY_CHAPTER_MISSING`
- `CONSUMER_INDICATOR_CONTRADICTS_BANKRUPTCY`
- `PUBLIC_RECORD_AMOUNT_MISSING`
- `CONSUMER_INDICATOR_STALE_AFTER_DISCHARGE`
- `VETERAN_MEDICAL_DEBT_UNDER_1_YEAR`

#### Portfolio-type rules (5)
- `PORTFOLIO_TYPE_MISMATCH`
- `REVOLVING_WITH_INSTALLMENT_TERMS`
- `MORTGAGE_PORTFOLIO_NOT_MORTGAGE`
- `COLLECTION_PORTFOLIO_WITH_CREDIT_LIMIT`
- `COLLECTION_TRADELINE_MISCLASSIFIED` (MEDIUM) — NEW v3.2 — Collection/debt-buyer tradeline typed Installment or Factoring (uses `debt_buyer_names` config)

#### ECOA-advanced rules (3)
- `ECOA_CODE_MISMATCH_DESIGNATOR`
- `JOINT_ACCOUNT_ONLY_ONE_SPOUSE`
- `AUTHORIZED_USER_COLLECTION_LIABILITY`

### B. Collection-specific rules (7 — run on each `collections[]` entry)

- `COLLECTION_AMOUNT_EXCEEDS_ORIGINAL`
- `COLLECTION_MISSING_ORIGINAL_CREDITOR_V2`
- `COLLECTION_PURGE_DATE_EXCEEDED`
- `COLLECTION_JOINT_ACCOUNT_DISPUTE`
- `COLLECTION_STALE_BALANCE_DATE`
- `COLLECTION_DUPLICATE_ACROSS_AGENCIES`
- `DEBT_BUYER_DOCUMENTATION_GAP` (HIGH) — NEW v3.2 — Known debt buyer reporting without Original Amount Owed and/or Purge Date (uses `debt_buyer_names` config)

### C. Temporal rules (8 — only when `previous_report_data` is provided)

- `DOFD_CHANGED` (HIGH) — Re-aging detection (>7 day tolerance)
- `RETROACTIVE_PAYMENT_CHANGE`
- `REPOLLUTION_DETECTION` — Account previously verified-clean reappears
- `REINSERTION_DETECTION` (HIGH) — checks `dispute_history` for prior consent
- `BALANCE_INCREASED_ON_CLOSED_ACCOUNT`
- `VOLUNTARY_CLOSURE_NOT_INDICATED`
- `PRIVATE_LOAN_REHAB_STILL_DEFAULT`
- `CORRECTION_NOT_PROPAGATED_CROSS_BUREAU` — temporal+cross-bureau hybrid

### D. Soft inquiry temporal rule (1)

- `SOFT_INQUIRY_OVER_1_YEAR` — runs over `inquiries[]` with previous report

### E. File-level rules (1 — evaluated ONCE per report, engine Phase 2.7) — NEW v3.2

- `NO_OPEN_POSITIVE_TRADELINES` (INFO) — No open account in good standing anywhere on the file; educational finding (credit building), never a dispute item by itself

### F. Cross-bureau inline rules (7 — only when `other_bureau_reports` is provided)

These run inside `_run_cross_bureau()` on matched account pairs:

- `DOFD_DISCREPANCY_CROSS_BUREAU` — DOFD differs > 30 days
- `BALANCE_DISCREPANCY_CROSS_BUREAU` — Balance differs > $100 or > 20%
- `STATUS_CONFLICT_CROSS_BUREAU`
- `DATE_OPENED_DISCREPANCY` — Date opened differs > 60 days
- `PAST_DUE_DISCREPANCY_CROSS_BUREAU` — NEW v3.2 — Full past-due amount on one bureau vs $0 on another
- `HIGH_CREDIT_DISCREPANCY_CROSS_BUREAU` — NEW v3.2 — High credit / max balance differs across bureaus ($0 is a reported value)
- `CORRECTION_NOT_PROPAGATED_CROSS_BUREAU` — One bureau resolved, another stuck

**Total:** 89 single-account + 7 collection + 8 temporal + 1 file-level + 1 soft inquiry = **106 registered rules**, plus the 7 cross-bureau rules executed inline.

### New in v3.2 (the 9 rules that closed the expert-analyst gap)

The v3.2 rule pack takes the registered count from 97 → 106 (+9), each addition pinned by golden-case tests against a real tri-merge report:

1. `NEGATIVE_ACCOUNT_MISSING_DOFD` (HIGH, date) — Collections and derogatories whose status reads "Collection Account" never match the charge-off matcher, so their missing DOFD went undetected. Guards prevent double-firing with `CHARGEOFF_MISSING_DOFD` and `DELINQUENT_BUT_NO_DOFD`. When the DOFD field is blank but a remark carries a first-delinquency date, the anomaly adds `first_delinquency_in_remarks` to `data_points` (additive signal for presentation — never changes firing).
2. `RE_AGING_SIGNATURE` (HIGH, date) — Intra-report re-aging check (no previous report needed): the reported first delinquency is **>180 days AFTER** the account's last activity. Uses the structured `dofd` when present, else parses the "DATE FIRST MAJOR DELINQUENCY REPORTED" remark locally (the parse is never written into `dofd`, so missing-DOFD findings survive). Framed as *possible* re-aging demanding a verifiable DOFD — the remark field is not always the legal DOFD.
3. `BALANCE_EXCEEDS_CREDIT_LIMIT` (HIGH, balance) — Revolving balance above the credit limit. Review-flag framing, never "illegal": a balance CAN legitimately exceed the limit after charge-off (accrued interest/fees), so the dispute demands an itemized breakdown (principal vs interest/fees), not removal on impossibility grounds.
4. `CLOSED_ACCOUNT_WITH_MONTHLY_PAYMENT` (MEDIUM, balance) — Charged-off / collection / closed-$0 account still reporting a scheduled monthly payment. Metro2 requires $0 scheduled payment on charged-off accounts; a closed account legitimately paying down a balance is excluded.
5. `PAYMENT_HISTORY_CODE_CONTRADICTS_PUBLIC_RECORDS` (HIGH, status) — Bankruptcy "B" codes inside the monthly payment grid while the file shows NO bankruptcy in public records and no bankruptcy consumer indicator: the grid asserts a bankruptcy that officially does not exist, penalizing the score for it.
6. `DUPLICATE_DEBT_ORIGINAL_PLUS_COLLECTOR` (HIGH, collection) — The same debt reported twice: the ORIGINAL creditor's charge-off tradeline AND a collector/debt-buyer entry. Anchors on the original creditor's tradeline and links via `link_debts` (matched by original-creditor name or identical amount). Skips collections whose `original_creditor_source == "self"` — the original creditor's own entry is never its own duplicate (see Phase 1.7 below; on the real benchmark report this removed 2 false positives, 4 → 2).
7. `DEBT_BUYER_DOCUMENTATION_GAP` (HIGH, collection) — A KNOWN debt buyer reporting without Original Amount Owed and/or Purge Date. The original creditor name usually IS present on these records — the real documented gap is the validation fields that block verifying the amount and the removal timeline. Validation-first play (FDCPA §1692g(a) + Reg F 12 CFR 1006.34(c)).
8. `COLLECTION_TRADELINE_MISCLASSIFIED` (MEDIUM, metro2) — Collection/debt-buyer tradeline typed "Installment" or "Factoring Company Account". A third-party collection is not an installment loan and consumer debt is not commercial factoring — the wrong Metro2 Account Type distorts credit mix and utilization.
9. `NO_OPEN_POSITIVE_TRADELINES` (INFO, file) — File-level rule (engine Phase 2.7): the file has no open account in good standing, so nothing builds score even if every dispute wins. Educational finding that routes to credit building (secured card / credit-builder loan) — never a dispute item.

Also new in v3.2, outside the registered count: the inline cross-bureau rules `PAST_DUE_DISCREPANCY_CROSS_BUREAU` and `HIGH_CREDIT_DISCREPANCY_CROSS_BUREAU`, and the `debt_buyer_names.json` config (29 known debt buyers, word-boundary matching so "erc" never hits "commerce").

#### Phase 1.7 collection enrichment (v3.5)

Before any rule runs, the engine resolves each collection's missing `original_creditor` **from the file itself** (`layer2/matching/debt_matcher.py`, engine Phase 1.7):

- Matching runs over **canonical accounts** (per-bureau tradeline rows grouped by creditor + last4 — a tri-merge carries the same debt once per bureau) and is **precision-first**: cascade name → unique last4 → unique amount (±$1); 2+ candidates at any tier = no link. A false positive (wrong original creditor → contaminated dispute letter) costs far more than a false negative (the field stays empty and the "missing original creditor" finding fires — the safe behavior).
- Same-bureau tradelines are tried FIRST, cross-bureau refs second (an abbreviated TU collection can resolve against the EQ tradeline).
- Provenance is recorded in `CollectionRecord.original_creditor_source`:
  - `None` = **reported** — the value was printed in the credit report itself.
  - `"self"` = the collection IS the original creditor's own entry. Requires a match **by name** with a non-debt-buyer tradeline (never amount/last4 alone). A second pass propagates an already-established "self" to the SAME debt on other bureaus — abbreviated agency strings (TU's "CB/VICSCRT" for Comenitybank/victori) fail the name test, but the full-name bureau's sibling entry passed it; propagation is unique-last4/amount-or-nothing.
  - `"inferred"` = copied from the debt buyer's tradeline that names the original creditor.
- The field is **system-computed**: extraction forces it to `None`; only the engine writes it.

**Provenance golden rule (legal):** dispute letters may ONLY cite an `original_creditor` whose source is *reported* (`None`). `self`/`inferred` values are presentation/strategy aids ("identificado por el análisis") — never cite them in a letter as if they were printed on the report.

**Presentation coherence (dashboard only):** the engine output keeps EVERY finding — a missing DOFD is §623(a)(5) ammunition for letters — but the consumer dashboard (assembler `apply_presentation_coherence`) excludes from the missing-DOFD card (`CHARGEOFF_MISSING_DOFD` / `NEGATIVE_ACCOUNT_MISSING_DOFD` / `DELINQUENT_BUT_NO_DOFD`) any account that (a) also fired `RE_AGING_SIGNATURE` (that card absorbs the angle — "no delinquency date" next to "the delinquency date is wrong" reads as a contradiction) or (b) carries the first-delinquency date in a remark (`first_delinquency_in_remarks`). Verified on the real benchmark report: missing-DOFD card 11 → 2, re-aging 8 (disjoint accounts), "collection without original creditor" 9 → 0 (thanks to Phase 1.7), duplicate-debt 4 → 2.

Config note: `debt_buyer_names.json` lives in `layer2/config/` of the API and is served via `GET /api/config/debt_buyer_names` like the other reference configs.

## Output Format

Each anomaly:

```json
{
  "rule_name": "MEDICAL_PAID_STILL_REPORTING",
  "severity": "HIGH",
  "category": "category",
  "account_info": { "creditor_name": "...", "account_number": "****1234" },
  "data_points": { ... rule-specific evidence ... },
  "legal_citations": [
    "FCRA 607(b) - Maximum possible accuracy",
    "FCRA 623(a)(1)(A) - Duty to report accurate information",
    "<rule-specific citation>"
  ],
  "description": "<rule-specific finding>",
  "suggested_action": "Esto es educativo, no asesoria legal. Consulta un abogado FCRA/FDCPA antes de actuar. <rule-specific recommendation>"
}
```

## Counter Fields Explained

- `total_evaluations` — Total work performed (account × rule combinations executed). Useful for compute metrics.
- `unique_rules_fired` — Distinct rule names that produced ≥1 anomaly. Useful for "X of 106 rules detected issues".
- `total_registered_rules` — Always 106 in v3.2. Use as the denominator.
- `total_rules_executed` — Deprecated alias of `total_evaluations`. Kept for backward compatibility.

When summarizing for the user: "Detectamos {unique_rules_fired} tipos de violaciones en {total_anomalies} cuentas, de un total de {total_registered_rules} reglas examinadas."

## Configuration files used by the engine

The engine loads 12 config files server-side. The `metro2-transformer` skill provides programmatic read access to them via `GET /api/config/{filename}` (all 12 are whitelisted on the endpoint). Most rules consume them transparently — the auditor does NOT need to fetch them itself; just be aware they exist:

- `remarks_to_metro2.json` (~156 mappings)
- `medical_keywords.json` / `medical_provider_keywords.json`
- `va_creditor_names.json`
- `metro2_codes.json` / `special_comments.json` / `compliance_conditions.json` / `consumer_indicators.json` / `portfolio_types.json`
- `sol_by_state.json` (statute of limitations per US state)
- `state_medical_bans.json` (10 states with explicit bans: CA, CO, NY, NV, CT, IL, MD, MN, OR, WA)
- `debt_buyer_names.json` (NEW v3.2 — 29 known debt buyers, word-boundary matched; powers `DUPLICATE_DEBT_ORIGINAL_PLUS_COLLECTOR`, `DEBT_BUYER_DOCUMENTATION_GAP`, `COLLECTION_TRADELINE_MISCLASSIFIED` and Phase 1.7 enrichment)

## Rules of operation

- NEVER add a duplicate disclaimer — every `suggested_action` already begins with the educational prefix.
- ALWAYS show the top-level `legal_disclaimer` once at the end of the audit summary.
- ALWAYS report `unique_rules_fired` / `total_registered_rules` so the user understands the scope of the analysis.
- When the user uploads multiple bureau reports, send `other_bureau_reports` to unlock cross-bureau detection.
- When the user uploads a previous report, send `previous_report_data` to unlock temporal detection.
- When the user mentions prior disputes / cease-and-desist letters, send `dispute_history`.
