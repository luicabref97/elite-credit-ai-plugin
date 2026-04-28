# FCRA Compliance Auditor — Rule Details

## Severity Levels
- **HIGH**: Direct legal violation, immediate dispute recommended
- **MEDIUM**: Reporting inconsistency, strong dispute basis
- **LOW**: Minor issue, informational or monitoring

## Universal FCRA Citations
Applied to ALL anomalies as baseline:
- FCRA 607(b): CRAs must follow reasonable procedures to assure maximum possible accuracy
- FCRA 623(a)(1)(A): Furnishers must not report information known to be inaccurate
- FCRA 611(a): Consumer right to dispute and 30-day reinvestigation

## Date Rules — Detail

### ACCOUNT_EXCEEDS_7_YEARS (HIGH)
- **Legal basis**: FCRA 605(a)(4)-(5) — 7-year reporting limit
- **Calculation**: DOFD + 7 years + 180 days = removal date
- **Logic**: If today > removal_date AND account is negative → violation
- **Note**: DOFD is the Date of First Delinquency that led to the negative status

### IMPOSSIBLE_DATE_PATTERNS (HIGH)
Checks for logically impossible dates:
- Date opened is in the future
- Date opened > date closed
- DOFD > date closed
- Date reported > today + 30 days

### CHARGEOFF_MISSING_DOFD (MEDIUM)
- Charge-off accounts MUST have a Date of First Delinquency
- Without DOFD, removal date cannot be calculated → possible indefinite reporting

### BANKRUPTCY_EXCEEDS_10_YEARS (HIGH)
- **Legal basis**: FCRA 605(a)(1)
- Bankruptcies must be removed after 10 years from filing date

### REMOVAL_DATE_MISCALCULATED (HIGH)
- Compares reported removal/purge date vs calculated (DOFD + 7y180d)
- Difference > 60 days → violation (possible re-aging)

## Balance Rules — Detail

### BALANCE_EXCEEDS_ORIGINAL (HIGH)
- **Legal basis**: FDCPA 808(1) — cannot collect more than owed
- For collections/charge-offs: current balance > original amount → violation
- Collectors cannot add unauthorized fees

### PAST_DUE_EXCEEDS_BALANCE (HIGH)
- Mathematically impossible: past_due_amount > balance_owed
- Indicates data corruption or manipulation

### CREDIT_LIMIT_ZERO_WITH_BALANCE (MEDIUM)
- Revolving account with positive balance but $0 credit limit
- Inflates utilization ratio to infinity → damages score unfairly

### PAID_ACCOUNT_NONZERO_BALANCE (MEDIUM)
- Account status says "Paid" or "Settled" but balance > $0
- Contradictory reporting → dispute basis

## Collection Rules — Detail

### COLLECTION_AMOUNT_EXCEEDS_ORIGINAL (HIGH)
- Same as BALANCE_EXCEEDS_ORIGINAL but for dedicated collections section
- Compares `amount` vs `original_amount_owed`

### COLLECTION_PURGE_DATE_EXCEEDED (HIGH)
- Purge date (scheduled removal) has already passed
- Item should have been automatically removed → immediate dispute

### COLLECTION_DUPLICATE_ACROSS_AGENCIES (HIGH)
- Same debt reported by 2+ collection agencies
- Only ONE agency can legally report the same debt at a time
- Detects by matching original_creditor + similar amounts

### COLLECTION_STALE_BALANCE_DATE (MEDIUM)
- Balance date is old (>12 months) → possible re-aging
- Fresh balance dates on old debts suggest manipulation

## Medical Debt Rules — Detail

### MEDICAL_PAID_STILL_REPORTING (MEDIUM)
- 2022 policy: all 3 bureaus agreed to remove paid medical collections
- If medical AND paid/settled → should not be reporting

### MEDICAL_UNDER_1_YEAR (MEDIUM)
- 2022 policy: medical collections under 1 year old should not report
- Grace period for insurance processing

### MEDICAL_UNDER_500 (LOW)
- 2023 policy: medical collections under $500 should not report
- Lower severity as this is a newer policy

### MEDICAL_PROVIDER_NAME_EXPOSED (HIGH)
- Medical provider name visible in creditor/agency name
- Privacy violation — should be anonymized (e.g., "MEDICAL COLLECTION" not "DR. SMITH CARDIOLOGY")
