---
description: >
  Generate prioritized dispute strategies for the 97-rule v3 audit findings. Uses the
  527-chunk legal RAG with FCRA / FDCPA / Reg F / Reg V / Reg X / state-law citations
  and 2024-2026 case law. Activates when user says "dispute strategy", "how to dispute",
  "what should I dispute first", "create dispute plan", "prioritize my disputes",
  "estrategia de disputa", or after an audit completes.
---

# Dispute Strategist

Generate prioritized FCRA / FDCPA / Reg F / state-law dispute strategies from audit findings.

## Knowledge Base Access

If the Elite Credit API is connected, call `POST /api/rag/search` with relevant keywords to retrieve legal citations, case law, and dispute frameworks. Useful category filters:

- `LEGAL_INTERPRETATION` — the exact statute text interpreted in Spanish for the consumer
- `JURISPRUDENCE` — federal court rulings supporting the dispute
- `STRATEGY` — operational playbooks per negative type
- `DUAL_STATUTE` — combined FCRA + FDCPA claim approach
- `LETTER_FRAMEWORK` — Raiyan / DAMAGES-FACTS-PENALTY / SoyDA structures
- `DAMAGES` — damages-calculation tables

If no API is connected, use Claude's general FCRA / FDCPA knowledge.

## Operational Policy: CFPB-from-Round-1 (NOT escalation)

**Every BUREAU_DISPUTE in P0/P1/P2 is paired with a simultaneous CFPB filing from Round 1.** CFPB is NOT classified as escalation — it is part of the standard send. The dispute-letter-generator and the agents must produce both the certified-mail letter to the bureau AND open the CFPB case in the same action.

The rationale is full-leverage from Day 1: the CFPB obliges the furnisher to respond within 15 days regardless of how the bureau handles the dispute, the case ID becomes part of the audit trail, and any subsequent stall letter or "verified" response converts into evidence inside the existing CFPB case (no need to open new cases per round). See `vault/metodologia/secuencias-disputa.md#Por Que CFPB desde Round 1` for full strategic rationale.

This policy applies to: charge-offs, collections, late payments, mixed file, cross-bureau, temporal (re-aging, reinsertion, repollution), repos, foreclosure, ECOA discrimination disputes.

CFPB is NOT paired (or is delayed) for: pure identity-theft block (use FCRA 605B path first; CFPB only if block fails), goodwill requests (would destroy the goodwill relationship), pure inquiry where the furnisher is unknown (investigate identity first).

## Priority Framework

| Priority | Deadline | Criteria | CFPB filed? |
|----------|----------|----------|-------------|
| **P0** | IMMEDIATE | Statutory violations with documented evidence: obsolete items past 7 years, **cross-bureau discrepancies** (high-evidence — same account, different data), **temporal anomalies** (re-aging, reinsertion without 5-day notice), purge date passed, time-barred debts being collected (FDCPA §1692e per se violation) | YES — Round 1 simultaneous |
| **P1** | THIS_WEEK | High-impact: balance exceeds original (FDCPA §1692f), duplicate tradelines, mixed-file detection, identity theft reported but not blocked within 4 business days | YES — Round 1 simultaneous (except pure identity theft: 605B block first) |
| **P2** | WITHIN_2_WEEKS | Medium-evidence cross-bureau differences, status conflicts, missing original creditor on collections, debt-buyer documentation gaps | YES — Round 1 simultaneous |
| **P3** | WITHIN_30_DAYS | Medical-debt protections (NCRA voluntary policy + state bans), late-payment goodwill, accurate-but-removable items | Mixed: state-medical-ban anomalies = YES; pure goodwill = NO |
| **P4** | ONGOING | Credit building, monitoring, authorized-user strategies, business-credit separation | N/A (no dispute) |

## Dispute Approaches

| Approach | When to Use | Legal Basis | CFPB paired? |
|----------|-------------|-------------|--------------|
| **BUREAU_DISPUTE** | Standard bureau dispute, P0/P1/P2 | FCRA 611(a) / §1681i — 30-day investigation | **YES — simultaneous from Round 1** |
| **DIRECT_TO_FURNISHER** | Creditor reporting errors, paired with bureau dispute or post-verification | FCRA 623(a)(8) / §1681s-2(b) | YES — same CFPB case as the bureau dispute |
| **METHOD_OF_VERIFICATION** | After bureau replies "verified" — demand named verifier, date, documents reviewed | FCRA 611 + Cushman v. TransUnion | UPDATE to existing CFPB case (Round 2), not new case |
| **DEBT_VALIDATION** | Collection accounts under 30 days from first contact | FDCPA 809(b) / §1692g(b) | YES — open separate CFPB case targeting the collector if it ignores validation |
| **CEASE_AND_DESIST** | Stop collector contact (does NOT remove debt or stop reporting) | FDCPA 805(c) / §1692c(c) | NO — C&D is operational, not a dispute |
| **IDENTITY_THEFT_BLOCK** | Items resulting from identity theft | FCRA 605B (4 business-day removal) | NO at Round 1 — block first; CFPB only if block fails |
| **GOODWILL** | Accurate but removable items | Creditor discretion | NO — CFPB destroys goodwill relationship |
| **CFPB_SUPERVISOR_REVIEW** | Existing case with boilerplate "verified" responses | CFPB internal escalation | YES — it IS the CFPB action (Round 3 escalation step) |
| **STATE_AG_COMPLAINT** | After Round 3 with state law applicable (CA Rosenthal, TX TDCA, FL CCPA, NY GBL Article 25) | State consumer-protection law | TRUE escalation, after CFPB record is established |
| **LEGAL_ACTION** | Willful noncompliance, documented damages | FCRA 616 / 617 (statutory damages); FDCPA §1692k | TRUE escalation — the CFPB record is the abogado's primary evidence |

## Anomaly-to-Strategy Map (from 97-rule audit)

### High-evidence rules → P0/P1
| Rule | Approach | Statutory anchor |
|------|----------|------------------|
| `ACCOUNT_EXCEEDS_7_YEARS` | BUREAU_DISPUTE | FCRA 605(a)(4)-(5) |
| `BANKRUPTCY_EXCEEDS_10_YEARS` | BUREAU_DISPUTE | FCRA 605(a)(1) |
| `DOFD_DISCREPANCY_CROSS_BUREAU` | BUREAU_DISPUTE (all 3 bureaus simultaneously) | FCRA §1681e(b) + §1681i |
| `BALANCE_DISCREPANCY_CROSS_BUREAU` | BUREAU_DISPUTE | FCRA §1681e(b) |
| `STATUS_CONFLICT_CROSS_BUREAU` | BUREAU_DISPUTE | FCRA §1681e(b) |
| `DOFD_CHANGED` | BUREAU_DISPUTE + DIRECT_TO_FURNISHER (re-aging is statutory damages eligible) | FCRA 605(c) |
| `REINSERTION_DETECTION` | BUREAU_DISPUTE citing FCRA 611(a)(5)(B)(ii) — demand 5-day notice proof | FCRA 611(a)(5)(B)(ii) |
| `REPOLLUTION_DETECTION` | BUREAU_DISPUTE + CFPB_COMPLAINT | FCRA §1681i |
| `MEDICAL_PROVIDER_NAME_EXPOSED` | DIRECT_TO_FURNISHER + CFPB_COMPLAINT | HIPAA-adjacent + FCRA |
| `BALANCE_EXCEEDS_ORIGINAL` | DEBT_VALIDATION + FDCPA claim | FDCPA §1692f(1) |
| `DUPLICATE_TRADELINE` | BUREAU_DISPUTE | FCRA §1681e(b) |
| `MIXED_FILE_DETECTION` | BUREAU_DISPUTE + LEGAL_ACTION (Cortez territory) | FCRA §1681e(b) |
| `MEDICAL_DEBT_STATE_BAN` | STATE_AG_COMPLAINT + BUREAU_DISPUTE | State law (CA SB 1061, NY S2522A, etc.) |
| `IMPOSSIBLE_DATE_PATTERNS` | BUREAU_DISPUTE | FCRA §1681e(b) |

### Medium-evidence → P2/P3
| Rule | Approach | Statutory anchor |
|------|----------|------------------|
| `MEDICAL_PAID_STILL_REPORTING` | BUREAU_DISPUTE (NCRA voluntary policy) | NCRA 2022 industry agreement (NOT FCRA — voluntary) |
| `MEDICAL_UNDER_500` | BUREAU_DISPUTE (NCRA voluntary policy — CFPB rule was VACATED July 2025) | NCRA voluntary |
| `COLLECTION_NO_ORIGINAL_CREDITOR` | DEBT_VALIDATION | FDCPA §1692g |
| `COLLECTION_MISSING_DATE_ASSIGNED` | DEBT_VALIDATION | FDCPA §1692g |
| `COLLECTION_DUPLICATE_ACROSS_AGENCIES` | BUREAU_DISPUTE + DEBT_VALIDATION | FDCPA §1692e(2) |
| `INQUIRY_OVER_24_MONTHS` | BUREAU_DISPUTE | FCRA 605(a)(6) |
| `INQUIRY_NO_PURPOSE` / `INQUIRY_FROM_UNKNOWN_CREDITOR` | BUREAU_DISPUTE + DIRECT_TO_FURNISHER | FCRA 604 (permissible purpose) |

### Late payment → P3
| Rule | Approach | Anchor |
|------|----------|--------|
| `PAYMENT_GRID_CONTRADICTS_STATUS` | BUREAU_DISPUTE | FCRA §1681e(b) |
| `PAID_STATUS_WITH_PAST_DUE` | DIRECT_TO_FURNISHER | FCRA §1681s-2 |
| Late payment present (no anomaly) | GOODWILL | Creditor discretion |

## Fraud Pattern Detection

| Pattern | Indicators | Approach |
|---------|-----------|----------|
| **DEALER_MASSACRE** | Multiple auto inquiries in short period | INQUIRY disputes — many at once tied to a single application can be consolidated |
| **ZOMBIE_DEBT** | Collection on time-barred or discharged debt | DEBT_VALIDATION + FDCPA 1692e claim if SOL passed |
| **RE_AGING** | DOFD_CHANGED rule fired | BUREAU_DISPUTE + LEGAL_ACTION (statutory damages eligible) |
| **PHANTOM_INQUIRY** | Hard inquiry with no matching application | BUREAU_DISPUTE under FCRA 604 |
| **BALANCE_MISMATCH** | BALANCE_DISCREPANCY_CROSS_BUREAU | BUREAU_DISPUTE simultaneously to all 3 bureaus |
| **DEBT_BUYER_GAP** | Missing chain of custody / contract | DEBT_VALIDATION — most debt buyers cannot produce |
| **HUNSTEIN_DISCLOSURE** | Letter sent via vendor (third-party processor) | LEGAL_ACTION (state courts in CA / NY / MA where Hunstein theory survives) |
| **REINSERTION_NO_NOTICE** | REINSERTION_DETECTION fired | BUREAU_DISPUTE + LEGAL_ACTION |

## Goal Analysis

| Goal | Score requirement | Key blockers |
|------|-------------------|--------------|
| HOUSE | 620+ score, no recent collections, DTI < 43% | Charge-offs, high utilization, recent late payments |
| CAR | 500+ score, recent payment history | Active collections, recent repos |
| RENT | 600+ score, no evictions, no recent collections | Collections (LexisNexis & SafeRent screens), low score |
| BUSINESS | 680+ score, no bankruptcies in 3yr, EIN/DUNS established | Recent negatives, mixed personal/business credit |
| CARDS | 650+ unsecured, low utilization | High utilization, too many recent inquiries |

## Jurisprudence Library (case law that strengthens disputes)

### Standing
- **Spokeo v. Robins (2016)** — concrete-injury required
- **TransUnion v. Ramirez (2021)** — dissemination required (every reported account is dissemination)

### Bureau procedures
- **Cushman v. TransUnion (3rd Cir. 1997)** — bureau cannot simply parrot the furnisher
- **Sessa v. TransUnion (2nd Cir. 2023)** — "objectively and readily verifiable" standard
- **Henson v. CSC Credit Services (7th Cir. 1994)** — Notice-Activation Theory (heightened duty after dispute)

### Furnisher duties
- **Johnson v. MBNA (4th Cir. 2004)** — meaningful investigation required
- **Hinkle v. Midland Credit (11th Cir. 2017)** — debt buyers must produce real documentation

### Mixed-file
- **Cortez v. TransUnion (3rd Cir. 2010)** — $750K verdict for OFAC mixed-file

### Attorney debt collection
- **Heintz v. Jenkins (1995)** — attorneys ARE debt collectors
- **Jerman v. Carlisle (2010)** — no bona-fide-error defense for legal mistakes

### Letter-vendor / Hunstein
- **Hunstein v. Preferred Collection (11th Cir. 2022 en banc)** — viable in state courts only

### Identity theft
- **FCRA §605B + FACTA** — 4 business days to block

### CROA
- **CFPB v. Progrexion / Lexington Law (2023)** — $2.7B judgment; voids contracts that violated CROA

## Output Per Strategy

```json
{
  "anomaly_rule": "DOFD_CHANGED",
  "priority": "P0",
  "approach": "BUREAU_DISPUTE_AND_LEGAL_ACTION",
  "target_bureaus": ["equifax", "experian", "transunion"],
  "legal_basis": [
    "FCRA 605(c) - DOFD must not change",
    "Cortez v. TransUnion - statutory damages for willful re-aging"
  ],
  "arguments": [
    "Account showed DOFD = 2018-04-12 in previous report, now showing 2019-08-30 (482-day shift)",
    "Re-aging extends the reporting period in violation of statute"
  ],
  "evidence_required": [
    "Previous credit report showing original DOFD",
    "Current credit report showing new DOFD",
    "Calendar showing the shift exceeds 7-day clerical tolerance"
  ],
  "success_probability": "HIGH",
  "estimated_score_impact": "+25 to +50 points (varies by account weight)",
  "timeline": "30 days bureau response; 60-90 days follow-through",
  "goals_affected": ["HOUSE", "CAR"],
  "recommended_template": "round1-initial-dispute-bureaus.md (refer to vault)",
  "raiyan_framework": "DAMAGES (statutory eligibility) → FACTS (482-day shift) → PENALTY (FCRA 616 + 617)"
}
```

## Reminders

- **ALWAYS pair every BUREAU_DISPUTE with a simultaneous CFPB filing from Round 1** — this is operational policy, not escalation. See `vault/metodologia/secuencias-disputa.md#Por Que CFPB desde Round 1`.
- ALWAYS pair cross-bureau anomalies with simultaneous disputes to all 3 bureaus AND a single CFPB case (not 3 separate CFPB cases — one umbrella case for the cross-bureau anomaly).
- ALWAYS attach the previous report when disputing a temporal anomaly. Reference it inside the CFPB case as evidence.
- ALWAYS use DEBT_VALIDATION when the rule fired against a collection without original-creditor documentation. For collections, open a separate CFPB case targeting the collector if it ignores validation.
- ALWAYS update the existing CFPB case in Round 2 / Round 3 — do NOT open new cases per round. One case per anomaly, updated through the journey.
- NEVER recommend pursuing a dispute that lacks documented evidence (the audit `data_points` field shows what evidence the engine matched).
- Each `suggested_action` from the audit already carries a disclaimer prefix — relay it intact.

## CFPB Case Documentation in Output

When generating a strategy, include the CFPB action explicitly so the dispute-letter-generator and phase-tracker know what to record in `dispute_history`:

```json
{
  "anomaly_rule": "DOFD_CHANGED",
  "priority": "P0",
  "approach": "BUREAU_DISPUTE_AND_CFPB_PAIRED",
  "round": 1,
  "target_bureaus": ["equifax", "experian", "transunion"],
  "cfpb_action": {
    "action": "OPEN_NEW_CASE",
    "portal": "consumerfinance.gov/complaint",
    "company_to_complain_against": "TransUnion (the bureau)",
    "subject": "Re-aging — DOFD changed by 482 days",
    "attach_evidence": ["previous_credit_report.pdf", "current_credit_report.pdf", "bureau_letter_round1.pdf"]
  },
  "legal_basis": [...],
  "evidence_required": [...],
  "recommended_template": "round1-initial-dispute-bureaus.md"
}
```

For Rounds 2 and 3, replace `cfpb_action.action` with `UPDATE_EXISTING_CASE` and reference the prior case ID stored in Cowork Memoria's `dispute_history`.
