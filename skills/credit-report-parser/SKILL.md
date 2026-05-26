---
description: >
  Extract structured data from US tri-bureau credit report PDFs. Supports Equifax-powered
  (MyFreeScoreNow), TransUnion, and Experian formats. Outputs ~75 fields per account
  including the temporal and dispute-history fields needed by the v3 audit engine.
  Activates when user says "parse my credit report", "extract credit data", "read this PDF",
  "analiza mi reporte", or uploads a credit report file.
---

# Credit Report Parser

Extract ALL data from a US tri-bureau credit report PDF into a structured `CreditReportData` JSON aligned with the Elite Credit API v3.1 contract.

## Steps

### 1. Read PDF
- Use Claude Vision to read the PDF natively via document blocks.
- NEVER use OCR or PNG conversion — Claude reads PDFs directly.

### 2. Identify Report Format
- **Equifax-powered** (MyFreeScoreNow): Sections numbered 1-12, "powered by Equifax" header, separate Collections section.
- **TransUnion direct**: Accounts grouped differently.
- **Experian direct**: Unique field names.

### 3. Detect Scoring Model
- Look near each score for model name.
- Common: VantageScore 3.0, VantageScore 4.0, FICO Score 8, FICO Score 9.
- Each bureau may use a DIFFERENT model — extract per bureau.
- If not found, set to null (never guess).

### 4. Extract All Sections
1. Report Summary: dates, average account age, oldest account per bureau
2. Accounts by type: Revolving, Mortgage, Installment, Other
3. Collections (SEPARATE): agency, original creditor, dates, amounts, designator
4. Consumer Statements: text, bureau, date
5. Personal Information: names, addresses (with status/date), SSN, DOB, **client_state** (US two-letter code derived from current mailing address — REQUIRED for SOL and state-medical-ban rules)
6. Employment History: company, occupation, dates, status per bureau
7. Inquiries: Hard and Soft separated
8. Public Records: Bankruptcies, Judgments, Liens

### 5. Per-Account Fields (~75 per bureau)

#### Core fields (20)
`creditor_name`, `account_number`, `account_status`, `account_type`, `loan_type`, `creditor_classification`, `activity_designator`, `account_designator_code`, `date_opened`, `date_closed`, `balance`, `credit_limit`, `high_credit`, `monthly_payment`, `past_due`, `payment_status`, `date_last_activity`, `date_last_payment`, `date_reported`, `ecoa_code`

#### Date fields
`date_opened`, `date_closed`, `date_reported`, `date_last_activity`, `date_last_payment`, `dofd` (Date of First Delinquency), `deferred_payment_start_date`

#### Amount fields
`balance`, `credit_limit`, `high_credit`, `monthly_payment`, `past_due`, `original_amount`, `charge_off_amount`, `original_chargeoff_amount`, `scheduled_monthly_payment`, `actual_payment_amount`

#### Payment history (up to 84 months)
`payment_history`: array of `{ date, rating }` entries. Ratings: OK, 30, 60, 90, 120, CO, C, B, R, TN, null

#### Metro2 expanded (11)
`portfolio_type`, `payment_rating`, `special_comment`, `compliance_condition`, `consumer_info_indicator`, `terms_duration`, `terms_frequency`, `date_of_account_info`, `account_type_detail`, `closure_type`, `remarks` (array of consumer-facing remark codes)

#### Audit fields (10)
`dispute_status`, `estimated_removal_date`, `reinvestigation_info`, `balance_history` (array of monthly snapshots), `creditor_type`, `company_sold_to`, `months_reviewed`, `creditor_contact` (address + phone — for dispute letters), `transferred_balance`, `original_creditor` (when collection)

#### Public records (when applicable)
`public_records`: object with `chapter`, `date_of_order`, `record_type`, `subtype`, `court`, `amount`

#### Equifax-powered fields (12)
`account_designator_code`, `reported_on_bureau`, `deferred_payment_start_date`, `balloon_payment_date`, `balloon_payment_amount`, `actual_payment_amount`, `original_creditor_classification`, `date_assigned`, `purge_date`

#### Temporal v5.0 fields (5) — NEW IN V3 OUTPUT
`previous_dofd`, `previous_balance`, `previous_payment_status`, `previously_deleted` (heuristically true when account reappears after a gap), `previous_payment_history`

These are populated only when a previous-period report is also being parsed (see Multi-Bureau & Temporal Output below).

### 6. Collections Section Fields (CollectionRecord)

`agency_client`, `original_creditor`, `original_creditor_classification`, `date_reported`, `date_assigned`, `original_amount_owed`, `amount`, `status_date`, `balance_date`, `purge_date`, `account_designator_code`, `account_number`, `bureau`

### 7. Inquiries (InquiryRecord)
`creditor`, `date`, `type` (hard / soft / promotional), `purpose`, `bureau`

### 8. Personal Info
`name`, `ssn_last4`, `dob`, `addresses[]`, `employers[]`, `formerly_known_as[]`

### 9. Top-level CreditReportData fields (NEW / EXPANDED in v3)
- `bureau` (equifax / experian / transunion) — mandatory per CreditReportData
- `report_date` — when the report was generated
- **`client_state`** — two-letter US state code (REQUIRED for SOL and state-medical-ban rules; derived from current mailing address)
- **`previous_report_date`** — date of an earlier report when one is available
- **`dispute_history`**: array of `DisputeRecord` objects: `{ date, bureau, account_number, creditor_name, dispute_type (bureau_dispute / validation / goodwill / cease_desist), status (sent / pending / responded / resolved), response (verified / deleted / updated / no_response), response_date }` — populate when the user mentions or uploads evidence of prior disputes; otherwise omit

## Multi-Bureau Output (NEW IN V3)

If the user uploads 2 or 3 bureau reports together (e.g., a tri-merge), produce:

1. **One primary `CreditReportData`** for the bureau the user is most concerned about (or the first one chronologically). Save to `output/extracted_data.json`.
2. **An `other_bureau_reports` array** containing the OTHER bureaus' `CreditReportData` objects, each with `bureau` set correctly. Save to `output/other_bureau_reports.json`.

Do NOT concatenate accounts across bureaus into a single `CreditReportData`. The audit engine matches accounts cross-bureau using its own fuzzy matcher; concatenation breaks that.

## Temporal Output (NEW IN V3)

If the user uploads a previous report (1-12 months ago) plus a current report, produce:

1. The current report as the primary `CreditReportData` → `output/extracted_data.json`
2. The previous report as a `CreditReportData` → `output/previous_report_data.json` (must include `report_date` set to its issue date)

Do NOT mark `previous_*` fields on the current accounts yourself — the audit engine populates those via `_merge_temporal_data()` once it receives both.

## Dispute History Output (NEW IN V3)

When the user mentions or shows evidence of prior disputes / cease-and-desist letters / debt-validation requests, capture them as a `DisputeRecord[]` array in `output/dispute_history.json`. Each record:

```json
{
  "date": "2026-02-14",
  "bureau": "equifax",                      // or null if direct-to-furnisher
  "account_number": "****1234",
  "creditor_name": "Midland Credit Management",
  "dispute_type": "validation",             // bureau_dispute / validation / goodwill / cease_desist
  "status": "responded",                     // sent / pending / responded / resolved
  "response": "verified",                    // verified / deleted / updated / no_response
  "response_date": "2026-03-14"
}
```

## Critical Rules

- NEVER fabricate data — if not visible, use null.
- NEVER skip accounts — extract every tradeline.
- NEVER confuse Balance with High Balance — different fields.
- `loan_type` ≠ `account_type`. `activity_designator` ≠ `account_status`.
- `client_state` is mandatory for the audit engine to evaluate state-specific rules. If the report does not show a current address, ask the user which state they live in.
- `previously_deleted` is a heuristic: only set it when the temporal merger detects a real gap. Do NOT set it manually during single-report parsing.

## Output File Layout

After parsing, the parser may produce up to 4 output files (depending on what was uploaded):

```
output/
├── extracted_data.json         (primary CreditReportData — always)
├── other_bureau_reports.json   (only when 2+ bureaus uploaded)
├── previous_report_data.json   (only when a previous report is uploaded)
└── dispute_history.json        (only when the user provides dispute evidence)
```

Downstream skills (`fcra-compliance-auditor`, `full-pipeline`) load all available files and pass them as the corresponding optional fields to `POST /api/audit/run`.
