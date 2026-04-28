---
description: >
  Activates when working with Metro2 format data, credit-report field mappings, remark-code
  interpretation, special-comment codes, compliance conditions, or state-specific rules
  (statute of limitations, medical-debt bans). Provides programmatic access to 11 Metro2
  configuration files via the API. Use when user mentions "Metro2", "remark codes",
  "special comments", "compliance conditions", "portfolio type", "payment rating",
  "SOL", "estatuto de limitaciones", "ban medico estatal".
---

# Metro2 Transformer

Map consumer-facing credit report data to Metro2 internal format fields, and provide programmatic access to 11 Metro2 configuration files served by the API.

## API endpoint (NEW in v3)

```
GET /api/config/{filename}
Authorization: Bearer <ELITE_CREDIT_API_KEY>
```

The plugin v1 documented these mappings as "available server-side" but never described an explicit invocation path. v3 closes that gap: this is the public, authenticated endpoint.

Rate limit: **200 requests / minute** per IP (default).

Response:

```json
{
  "name": "<filename>",
  "data": { ... config JSON ... }
}
```

## 11 Valid Configuration Files

| filename | Purpose | When to fetch |
|----------|---------|---------------|
| `remarks_to_metro2` | ~156 mappings: consumer remark text → Metro2 fields (special_comment, compliance_condition, consumer_info_indicator, closure_type, dispute_status, public_records.chapter) | During parsing of an account's `remarks[]` array, OR when interpreting cryptic remark codes the user asks about |
| `medical_keywords` | List of medical-provider keywords used to detect medical debt | Before evaluating any rule that depends on `is_medical` (MEDICAL_PAID_STILL_REPORTING, MEDICAL_UNDER_500, MEDICAL_DEBT_STATE_BAN, etc.) |
| `medical_provider_keywords` | List of patterns flagging exposed medical-provider names (HIPAA-adjacent) | When checking `MEDICAL_PROVIDER_NAME_EXPOSED` |
| `va_creditor_names` | VA-specific creditor identifiers | When checking `VETERAN_MEDICAL_PAID_STILL_REPORTING` |
| `metro2_codes` | Metro2 standard code definitions (account status, condition codes) | Educational reference; when the user asks "what does payment_rating G mean" |
| `special_comments` | Special-comment 2-char codes with descriptions (AC=Account Closed, AU=Authorized User, etc.) | When parsing or explaining a `special_comment` value |
| `compliance_conditions` | Compliance-condition codes (XA=In Dispute, XB=Deceased, etc.) | When explaining a `compliance_condition` |
| `consumer_indicators` | Consumer-info indicator codes (A-K bankruptcy chapter codes, etc.) | When explaining a `consumer_info_indicator` |
| `portfolio_types` | Portfolio classification (R=Revolving, I=Installment, M=Mortgage, C=Collection, O=Open) | When validating `portfolio_type` |
| `sol_by_state` | Statute of limitations per US state (e.g., TX=4yr written, CA=4yr written, NY=3yr consumer credit per CCFA 2022, FL=3yr medical per SB 918) | When evaluating `SOL_EXPIRED_STILL_REPORTING_NEGATIVE`, or answering "is this debt time-barred in my state?" |
| `state_medical_bans` | State medical-debt protections (CA, CO, NY, NV, CT, IL, MD, MN, OR, WA — each with `ban_type`, `threshold`, `effective` date, `law` reference) | When evaluating `MEDICAL_DEBT_STATE_BAN` |

## Example Invocation

To fetch the remarks-to-Metro2 mapping table:

```
GET /api/config/remarks_to_metro2
Authorization: Bearer <ELITE_CREDIT_API_KEY>
```

Response:

```json
{
  "name": "remarks_to_metro2",
  "data": {
    "_description": "Maps consumer-facing remarks to Metro2 internal fields",
    "remarks": {
      "CHARGED OFF": {
        "metro2_mappings": [
          { "field": "special_comment", "value": "AC" },
          { "field": "compliance_condition", "value": "XA" }
        ]
      },
      "ACCOUNT INCLUDED IN BANKRUPTCY": {
        "metro2_mappings": [
          { "field": "consumer_info_indicator", "value": "A" }
        ]
      },
      ...
    }
  }
}
```

## Caching

Configuration files are stable — they change only when the API team releases a new version. Recommended cache strategy in the plugin: fetch once per Cowork session, then keep the result in working memory. If the user uploads a fresh credit report after a long session, optionally re-fetch.

## Server-side automatic use

The audit engine (`/api/audit/run`) already loads all 11 configs internally during its `__init__`, so rules that depend on these files (medical detection, state SOL, state medical ban, etc.) work without any plugin action. **The plugin only needs to fetch a config explicitly when:**

1. The agent wants to **explain** a Metro2 code to the consumer ("what does AC mean")
2. The agent wants to **validate** a value the parser extracted before sending to `/api/audit/run`
3. The agent wants to **enrich** a dispute letter with a state-specific citation (e.g., "in California, medical debt is banned per SB 1061")

For pure auditing, you can rely on the audit engine doing this work server-side.

## Transformation Flow

```
Raw Consumer Remark → Look up in remarks_to_metro2.json → Derive:
  → special_comment (Metro2 field)
  → compliance_condition (Metro2 field)
  → consumer_info_indicator (Metro2 field)
  → closure_type (voluntary/involuntary)
  → dispute_status (disputed/not_disputed/resolved)
  → public_records.chapter (7, 11, 13)
```

The audit engine performs this mapping automatically through `apply_remarks_mapper(account)` before running rules. The plugin's responsibility is simply to ensure the parser captures the consumer's remarks accurately and includes them in the `account.remarks[]` array.

## Key Metro2 Fields (reference)

- `portfolio_type`: R (Revolving), I (Installment), M (Mortgage), C (Collection), O (Open)
- `payment_rating`: 0 (Current) through 6 (Collection), G (Govt claim), L (Litigation)
- `special_comment`: 2-char Metro2 standard code (AC = Account Closed, AU = Authorized User, etc.)
- `compliance_condition`: dispute, deceased, bankruptcy flags (XA, XB, XC, etc.)
- `consumer_info_indicator`: A-K bankruptcy chapter codes (A = Ch7, B = Ch11, etc.)

## Error handling

The endpoint returns 404 if the filename is not in the list of 11 valid names. Always check the response status. If 404, fall back to Claude's general knowledge of Metro2 codes — the audit will still work because the engine uses its own server-side copies.
