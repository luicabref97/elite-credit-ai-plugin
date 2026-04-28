---
description: >
  Run 97 forensic FCRA/FDCPA/Reg F/Reg V/Metro2 compliance rules against credit report data.
  Detects single-account violations, cross-bureau discrepancies, and temporal anomalies (re-aging,
  reinsertion, repollution) with legal citations. Activates when user mentions "audit", "compliance
  check", "find violations", "what's wrong with my report", "FCRA violations", "cross-bureau check",
  "re-aging", "reinsertion", or after a credit report is parsed.
---

# FCRA Compliance Auditor

Run 97 programmatic rules against extracted credit report data to detect FCRA / FDCPA / Reg F / Reg V / Metro2 violations.

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
| `other_bureau_reports` | The user uploaded reports from 2 or 3 bureaus | Cross-bureau rules: DOFD_DISCREPANCY_CROSS_BUREAU, BALANCE_DISCREPANCY_CROSS_BUREAU, STATUS_CONFLICT_CROSS_BUREAU, DATE_OPENED_DISCREPANCY, CORRECTION_NOT_PROPAGATED_CROSS_BUREAU |
| `dispute_history` | The user reports having sent prior disputes, validation requests, or cease-and-desist letters | Compliance rules: DISPUTE_NOT_INDICATED, REINSERTION_DETECTION (consented vs unconsented) |

Each optional field is independent. Send any combination.

## Response Shape (v3.0)

```json
{
  "total_anomalies": 14,
  "anomalies_by_severity": { "HIGH": 6, "MEDIUM": 5, "LOW": 3, "INFO": 0 },
  "anomalies_by_category": { "date": 8, "balance": 4, "status": 2, "temporal": 1 },
  "anomalies": [ { rule_name, severity, category, account_info, data_points, legal_citations, description, suggested_action } ],
  "execution_time_ms": 145.32,
  "total_rules_executed": 97,
  "total_evaluations": 97,
  "unique_rules_fired": 14,
  "total_registered_rules": 97,
  "engine_version": "3.0.0",
  "legal_disclaimer": "Este API devuelve analisis automatizado ... NO constituye asesoria legal. ..."
}
```

**Important — the API now prefixes every `suggested_action` with a Spanish disclaimer:**

> "Esto es educativo, no asesoria legal. Consulta un abogado FCRA/FDCPA antes de actuar. "

When presenting anomalies to the user, do NOT add another disclaimer on top — the API already included it. Always relay the top-level `legal_disclaimer` once at the end of the audit summary.

## Rule Inventory (97 total)

The 97 rules are partitioned into 7 execution buckets:

### A. Single-account rules (82 — run on every account)

#### Date rules (10)
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

#### Balance rules (13)
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

#### Status rules (11)
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

#### Portfolio-type rules (4)
- `PORTFOLIO_TYPE_MISMATCH`
- `REVOLVING_WITH_INSTALLMENT_TERMS`
- `MORTGAGE_PORTFOLIO_NOT_MORTGAGE`
- `COLLECTION_PORTFOLIO_WITH_CREDIT_LIMIT`

#### ECOA-advanced rules (3)
- `ECOA_CODE_MISMATCH_DESIGNATOR`
- `JOINT_ACCOUNT_ONLY_ONE_SPOUSE`
- `AUTHORIZED_USER_COLLECTION_LIABILITY`

### B. Collection-specific rules (6 — run on each `collections[]` entry)

- `COLLECTION_AMOUNT_EXCEEDS_ORIGINAL`
- `COLLECTION_MISSING_ORIGINAL_CREDITOR_V2`
- `COLLECTION_PURGE_DATE_EXCEEDED`
- `COLLECTION_JOINT_ACCOUNT_DISPUTE`
- `COLLECTION_STALE_BALANCE_DATE`
- `COLLECTION_DUPLICATE_ACROSS_AGENCIES`

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

### E. Cross-bureau inline rules (5 — only when `other_bureau_reports` is provided)

These run inside `_run_cross_bureau()` on matched account pairs:

- `DOFD_DISCREPANCY_CROSS_BUREAU` — DOFD differs > 30 days
- `BALANCE_DISCREPANCY_CROSS_BUREAU` — Balance differs > $100 or > 20%
- `STATUS_CONFLICT_CROSS_BUREAU`
- `DATE_OPENED_DISCREPANCY` — Date opened differs > 60 days
- `CORRECTION_NOT_PROPAGATED_CROSS_BUREAU` — One bureau resolved, another stuck

**Total:** 82 single-account + 6 collection + 8 temporal + 1 soft inquiry = **97 registered rules**, plus the 5 cross-bureau rules executed inline.

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
- `unique_rules_fired` — Distinct rule names that produced ≥1 anomaly. Useful for "X of 97 rules detected issues".
- `total_registered_rules` — Always 97 in v3.0. Use as the denominator.
- `total_rules_executed` — Deprecated alias of `total_evaluations`. Kept for backward compatibility.

When summarizing for the user: "Detectamos {unique_rules_fired} tipos de violaciones en {total_anomalies} cuentas, de un total de {total_registered_rules} reglas examinadas."

## Configuration files used by the engine

The engine loads 11 config files server-side. The `metro2-transformer` skill provides programmatic read access to them via `GET /api/config/{filename}`. Most rules consume them transparently — the auditor does NOT need to fetch them itself; just be aware they exist:

- `remarks_to_metro2.json` (~156 mappings)
- `medical_keywords.json` / `medical_provider_keywords.json`
- `va_creditor_names.json`
- `metro2_codes.json` / `special_comments.json` / `compliance_conditions.json` / `consumer_indicators.json` / `portfolio_types.json`
- `sol_by_state.json` (statute of limitations per US state)
- `state_medical_bans.json` (10 states with explicit bans: CA, CO, NY, NV, CT, IL, MD, MN, OR, WA)

## Rules of operation

- NEVER add a duplicate disclaimer — every `suggested_action` already begins with the educational prefix.
- ALWAYS show the top-level `legal_disclaimer` once at the end of the audit summary.
- ALWAYS report `unique_rules_fired` / `total_registered_rules` so the user understands the scope of the analysis.
- When the user uploads multiple bureau reports, send `other_bureau_reports` to unlock cross-bureau detection.
- When the user uploads a previous report, send `previous_report_data` to unlock temporal detection.
- When the user mentions prior disputes / cease-and-desist letters, send `dispute_history`.
