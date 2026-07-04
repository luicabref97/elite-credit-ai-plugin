---
description: >
  Generate prioritized dispute strategies for the 106-rule v3 audit findings. Uses the
  756-chunk legal RAG with FCRA / FDCPA / Reg F / Reg V / Reg X / state-law citations
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
- `LETTER_WRITING_TACTICS` — opening / facts / closing techniques + heavy metal + plain english (NEW 2026-05)
- `DISPUTE_TIMING` — law sequencing per round + recycling
- `LETTER_REFRESH` — 2-3 month refresh policy + recycle laws
- `DISTRIBUTION` — synchronized distribution (mail + CFPB 7-14d gap) + addresses + multi-channel
- `PER_ACCOUNT_FLOWS` — 3 main flows (Accuracy 12 / Consent 4 / Collection 10) + per-account-type sequences
- `DIRECT_DISPUTES` — direct creditor (1681s-2(b) + IRS 3949a), repo UCC, Big 3 collectors, affidavit format

If no API is connected, use Claude's general FCRA / FDCPA knowledge.

## Operational Policy: Synchronized Distribution (Raiyan timing — UPDATED 2026-05)

⚠️ **POLICY UPDATED 2026-05-25.** Previous "CFPB-from-Round-1 simultaneous" policy was REPLACED with Raiyan's Synchronized Distribution (Master Plan Ch 12). See `vault/metodologia/cfpb-timing-policy.md` for full playbook.

**Every BUREAU_DISPUTE pairs with a CFPB filing, but with a 7-14d gap after the mailing — NOT simultaneous.** The mailing uses a backdated header (30-60 days prior to actual mail date). The CFPB case is filed 7-14 days after the certified mail postmark.

The rationale (why gap timing beats simultaneous):
- ACDV processes incoming letter+CFPB-simultaneous as "duplicate channel" — no emergency response triggered
- ACDV processes backdated-letter (looking late) + CFPB-7-14d-later as "we are past 30-day window" → emergency response triggered
- Net result: higher deletion rate at lower round counts vs. the previous simultaneous policy

See `cfpb-timing-policy.md` for the full Day 0 → Day 30 workflow.

**This policy applies to:** charge-offs, collections, late payments, mixed file, cross-bureau, temporal (re-aging, reinsertion, repollution), repos, foreclosure, ECOA discrimination disputes.

**Exceptions (no CFPB pairing OR delayed):**
- Pure identity-theft block — use FCRA 605B path first; CFPB only if block fails in R2
- Goodwill requests — destroys goodwill relationship; mail-only no CFPB
- Pure inquiry where furnisher unknown — investigate identity first; CFPB R2+
- PII corrections — only bureau dispute with ID copies, no CFPB needed
- Pure cease-and-desist — operational not dispute; CFPB only if collector continues contact

**Direct disputes to debt collectors are the exception to the gap timing:** CFPB is the PRIMARY channel filed Day 1 (no mail). Collectors evade certified mail. See `big-3-debt-collector-strategy.md`.

## Priority Framework

| Priority | Deadline | Criteria | CFPB filed? |
|----------|----------|----------|-------------|
| **P0** | IMMEDIATE | Statutory violations with documented evidence: obsolete items past 7 years, **cross-bureau discrepancies** (high-evidence — same account, different data), **temporal anomalies** (re-aging, reinsertion without 5-day notice), purge date passed, time-barred debts being collected (FDCPA §1692e per se violation) | YES — 7-14d after mail receipt (synchronized) |
| **P1** | THIS_WEEK | High-impact: balance exceeds original (FDCPA §1692f), duplicate tradelines, mixed-file detection, identity theft reported but not blocked within 4 business days | YES — 7-14d after mail (except pure identity theft: 605B block first) |
| **P2** | WITHIN_2_WEEKS | Medium-evidence cross-bureau differences, status conflicts, missing original creditor on collections, debt-buyer documentation gaps | YES — 7-14d after mail (synchronized) |
| **P3** | WITHIN_30_DAYS | Medical-debt protections (NCRA voluntary policy + state bans), late-payment goodwill, accurate-but-removable items | Mixed: state-medical-ban anomalies = YES 7-14d after; pure goodwill = NO |
| **P4** | ONGOING | Credit building, monitoring, authorized-user strategies, business-credit separation | N/A (no dispute) |

## Dispute Approaches

| Approach | When to Use | Legal Basis | CFPB paired? |
|----------|-------------|-------------|--------------|
| **BUREAU_DISPUTE** | Standard bureau dispute, P0/P1/P2 | FCRA 611(a) / §1681i — 30-day investigation | **YES — 7-14d after mail (synchronized)** |
| **DIRECT_TO_FURNISHER** | Creditor reporting errors, paired with bureau dispute or post-verification | FCRA 623(a)(8) / §1681s-2(b) | YES — same CFPB case as the bureau dispute, 7-14d after mail |
| **METHOD_OF_VERIFICATION** | After bureau replies "verified" — demand named verifier, date, documents reviewed | FCRA 611 + Cushman v. TransUnion | UPDATE to existing CFPB case (Round 2), 7-14d after R2 mail, not new case |
| **DEBT_VALIDATION** | Collection accounts under 30 days from first contact | FDCPA 809(b) / §1692g(b) | YES — CFPB PRIMARY channel (Day 1, no mail) for direct collector disputes |
| **CEASE_AND_DESIST** | Stop collector contact (does NOT remove debt or stop reporting) | FDCPA 805(c) / §1692c(c) | NO — C&D is operational, not a dispute |
| **IDENTITY_THEFT_BLOCK** | Items resulting from identity theft | FCRA 605B (4 business-day removal) | NO at Round 1 — block first; CFPB only if block fails |
| **GOODWILL** | Accurate but removable items | Creditor discretion | NO — CFPB destroys goodwill relationship |
| **CFPB_SUPERVISOR_REVIEW** | Existing case with boilerplate "verified" responses | CFPB internal escalation | YES — it IS the CFPB action (Round 3 escalation step) |
| **STATE_AG_COMPLAINT** | After Round 3 with state law applicable (CA Rosenthal, TX TDCA, FL CCPA, NY GBL Article 25) | State consumer-protection law | TRUE escalation, after CFPB record is established |
| **LEGAL_ACTION** | Willful noncompliance, documented damages | FCRA 616 / 617 (statutory damages); FDCPA §1692k | TRUE escalation — the CFPB record is the abogado's primary evidence |

## Anomaly-to-Strategy Map (from 106-rule audit)

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

### New in v3.2 (engine 97 → 106 rules)
| Rule | Priority | Approach | Statutory anchor |
|------|----------|----------|------------------|
| `DEBT_BUYER_DOCUMENTATION_GAP` | **P0** | DEBT_VALIDATION first (Reg F letter demanding itemized amount as of the itemization date, chain of title, verifiable purge date) — validation-first, BEFORE any bureau round or payment | FDCPA §1692g(a) + Reg F 12 CFR 1006.34(c) |
| `RE_AGING_SIGNATURE` | **P1** | BUREAU_DISPUTE + DIRECT_TO_FURNISHER — demand the verifiable DOFD backed by the original creditor's records; documented willful re-aging is FCRA 616 (willful noncompliance) statutory-damages eligible | FCRA 623(a)(5) + 605(c) + FCRA 616 |
| `DUPLICATE_DEBT_ORIGINAL_PLUS_COLLECTOR` | **P1** | BUREAU_DISPUTE (double reporting) + DIRECT_TO_FURNISHER to the ORIGINAL creditor — once the debt is sold, the original entry must show $0 with a transferred/sold indicator; only the current owner may report it active | FCRA §1681e(b) + FDCPA §1692e(2) |
| `PAST_DUE_DISCREPANCY_CROSS_BUREAU` | **P1** | BUREAU_DISPUTE (all bureaus simultaneously — you cannot owe two different amounts at once) | FCRA §1681e(b) |
| `HIGH_CREDIT_DISCREPANCY_CROSS_BUREAU` | **P1** | BUREAU_DISPUTE (all bureaus simultaneously) | FCRA §1681e(b) |
| `BALANCE_EXCEEDS_CREDIT_LIMIT` | **P1** | BUREAU_DISPUTE + DIRECT_TO_FURNISHER — demand itemized breakdown (principal vs interest/fees) + credit-limit verification. Review-flag framing: NEVER argue "impossible/illegal" (balances legitimately exceed limits post charge-off) | FCRA §1681e(b) + Metro2 CRRG |
| `CLOSED_ACCOUNT_WITH_MONTHLY_PAYMENT` | **P1** | BUREAU_DISPUTE — Metro2 requires $0 scheduled payment on charged-off accounts; an active obligation on a dead account misstates the debt load | Metro2 CRRG + FCRA 623(a)(1)(A) |
| `PAYMENT_HISTORY_CODE_CONTRADICTS_PUBLIC_RECORDS` | **P1** | BUREAU_DISPUTE — purge the "B" grid codes or document the bankruptcy they reference (no verified public record exists) | FCRA §1681e(b) + Metro2 CRRG |
| `NEGATIVE_ACCOUNT_MISSING_DOFD` | **P2** | BUREAU_DISPUTE + DIRECT_TO_FURNISHER — demand the verifiable DOFD or removal (the 7-year clock cannot be verified without it) | FCRA §623(a)(5) + 605(c) |
| `COLLECTION_TRADELINE_MISCLASSIFIED` | **P2** | BUREAU_DISPUTE — demand correction to the proper collection Account Type code (0C/48); the wrong type distorts credit mix | Metro2 CRRG + FCRA §1681e(b) |
| `NO_OPEN_POSITIVE_TRADELINES` | **P4** | NO dispute — this is credit building, not a violation: establish 1-2 positive active tradelines (secured card / credit-builder loan) alongside the disputes | N/A (INFO finding) |

> **⚠️ Provenance rule for `original_creditor` (legal — non-negotiable):** the audit payload may carry `original_creditor_source` per collection. Dispute letters may ONLY cite an original creditor that was **reported** (`source = None` — printed in the report itself). Values with source `"self"` (the entry IS the original creditor's own) or `"inferred"` (resolved by the engine's Phase 1.7 matching) are for presentation and strategy ("identificado por el análisis") — NEVER cite them in a letter as if they were printed on the report.

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

- **ALWAYS use Synchronized Distribution timing for CFPB pairing** — mail backdated 30-60d FIRST, CFPB filed 7-14d AFTER mailing. NOT simultaneous. See `vault/metodologia/cfpb-timing-policy.md`.
- ALWAYS pair cross-bureau anomalies with simultaneous disputes to all 3 bureaus AND a single CFPB case (not 3 separate CFPB cases — one umbrella case for the cross-bureau anomaly, filed 7-14d after the latest of the 3 mail postmarks).
- ALWAYS attach the previous report when disputing a temporal anomaly. Reference it inside the CFPB case as evidence.
- ALWAYS use DEBT_VALIDATION when the rule fired against a collection without original-creditor documentation. For DIRECT collector disputes, CFPB is the PRIMARY channel (Day 1, no mail).
- ALWAYS update the existing CFPB case in Round 2 / Round 3 — do NOT open new cases per round. One case per anomaly, updated through the journey.
- ALWAYS check per-account-flows.md for the recommended law sequence per account type. Don't fire arbitrary laws — use the proven sequences.
- ALWAYS apply Letter Refresh Policy: alert at Day 60 (early warning), hard cap at Day 90. Each new round MUST use a fresh letter (different opening tech, different closing tech, different damage chain center). See `letter-refresh.md`.
- ALWAYS apply heavy-metal-writing patterns: LOL signals (because/therefore/for this reason), qualifier sandwich (If X then Y), echoing key facts, P-ISM bridges, personalization (CRA name + dates + amounts). See `heavy-metal-writing.md`.
- ALWAYS apply plain-english-writing: only period and comma, no semicolons, no jargon legal, write like you talk. See `plain-english-writing.md`.
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

For Rounds 2 and 3, replace `cfpb_action.action` with `UPDATE_EXISTING_CASE` and reference the prior case ID stored in Cowork Memoria's `dispute_history`. The `cfpb_action.timing_gap_days` field should always be 7-14 (7 minimum, 14 maximum) — measured from `letter_sent_date` to `cfpb_filed_date`.

---

## Per-Account-Type Dispute Flows (NEW 2026-05)

Per Master Plan Ch 11, each account type has a proven law-by-law sequence. The strategist MUST recommend the flow that matches the account type BEFORE selecting individual laws. Pull complete sequences from RAG category `PER_ACCOUNT_FLOWS` (file: per-account-flows.md).

Quick reference cheat sheet:

| Account Type | R1 Law | R2 Law | R3 Law | After R3 |
|---|---|---|---|---|
| Late Payment | 1681a(d)(2)(a)(i) | 1681a(4) | Switch Accuracy | Accuracy flow continues |
| Charge-Off (creditor) | 1681e(b) | 1681i(a)(1)(A) | 1681i(a)(5) | Accuracy continues; R5+ direct creditor (1681s-2(b) + IRS 3949a) |
| Charge-Off (collector) | 1692g | 1692g(b) | 1692j | Collection continues; snitch-style writing |
| Collection | 1692g | 1692g(b) | 1692j | Collection continues |
| Medical Collection | 1692g | 1692g(b) | 1681a(3) | Collection + state medical ban + HHS OCR HIPAA |
| Repo | 1692g | 1692g(b) | 1692e(10) | Accuracy flow + UCC 9-610/616 direct |
| Bankruptcy | 1681b(a)(2) | 1681(a)(4) | 1681i(a)(7) | Accuracy; money shot R5-6 (MOV) |
| Student Loan | 1681b(a)(2) | 1681(a)(4) | 1681i(a)(7) | Consent then Accuracy |
| Identity Theft | 605B + FTC | 1681c(c)(2) | Affidavit | Other flows depending on type if ID theft block didn't take |
| Inquiry | 1681b | Direct furnisher | 1681q | Accuracy flow |

The 3 main flows (complete sequences):
- **Accuracy Flow (12 laws):** 1681e(b) → 1681i(a)(1)(A) → 1681i(a)(5) → 1681i(a)(4) → 1681i(a)(7) MOV → 1681i(a)(6)(B) → 1681i(c) → 1681c(f) → 1681s-2(a)(B)(3) → 1692e(8) → 1681s-2(b) → recycle
- **Consent Flow (4-7 laws, works for ALL):** 1681b(a)(2) → 1681(a)(4) → 1681i(a)(7) → 1681i(a)(6)(B) → 1681i(c) → 1681q → 1681c
- **Collection Flow (10 laws):** 1692g → 1692g(b) → 1692j → 1681a(m) → 1681(b) → 1681q → 1692e(10) → 1681b(a)(3)(a) → 1692c(c) → 1692k

## Letter Refresh Policy (NEW 2026-05)

Per `letter-refresh.md`, each letter has 2-3 month lifespan. The ACDV detects duplicates after that. Refresh = same law, different letter (different opening / closing / damages center).

- **Day 60:** early warning — start drafting refresh letter for next round
- **Day 90:** hard cap — next round MUST use fresh letter

The Big Secret (Master Plan Ch 11): **laws are ongoing.** Same law cited in R4 and R13 works if letters are fresh. NO law abandonment — refresh the LETTER, not the law.

## Dispute Timing & Sequencing (NEW 2026-05)

Per `dispute-timing.md`, the principle is: "The law APPLIED ≠ the law LITERAL." Each law has an optimal round in the sequence. Firing the wrong law in the wrong round = wasted bullet.

Use twist technique (from facts-techniques.md) to connect laws that aren't literally connected. E.g., 1681b permissible purpose → 1681a(d)(2)(B) exclusions in subsequent rounds.

## Distribution Synchronization (NEW 2026-05)

Per `distribution-strategy.md`, multi-channel distribution stack:

| Round | Mail | CFPB | BBB | State AG | HHS OCR |
|---|---|---|---|---|---|
| R1-2 | ✓ backdated | ✓ 7-14d after | - | - | (if medical+records) |
| R3 | ✓ backdated | ✓ update | + (collector R3) | (excepcion state-law) | - |
| R4 | ✓ + registered agent | ✓ update | + | - | - |
| R5+ | ✓ multiple addresses | ✓ refresh | + | + | (if applicable) |

State AG complaint is SAVED for R5+ (Master Plan: leverage waste in earlier rounds). Exceptions: state-specific medical bans (CA SB 1061), CA Rosenthal Act repos, NY GBL Art 25 deceptive collections.

## Combination Flows (NEW 2026-05)

Per `combination-flows.md`, when an account has BOTH accuracy AND collection issues (or mixed), you can combine in one letter. 4 keys:
1. Write each letter separately first
2. Copy-paste facts of collection AFTER accuracy facts in combined letter (or vice versa)
3. Make it clear "2 BREACHES OF LAW" in headline + body
4. Adjust the close to attack 2 violations instead of one

Use COUNT 2 subhead to separate sections. Demand sentence uses combined variant. Limit: 2-3 violations max per letter; in R4+ separate into individual letters.

**Do NOT mix Consent flow with anything** — Master Plan explicit: consent works alone or fails for whatever you combined it with.

## Special Playbooks (NEW 2026-05)

For escalation past R5 or specific account types:

- **Direct Creditor (charge-offs after R5):** 1681s-2(b) furnisher duty + IRS Form 3949a tax fraud strategy. See `direct-disputes-creditors.md`.
- **Repo Strategy:** UCC 9-610/9-613/9-614/9-616/9-625 presale + postsale notice attack. See `repo-ucc-strategy.md`.
- **Big 3 Direct Collector:** 1692g dunning + 1692j deceptive form + Mini-Miranda 1692e(11) hunt. Big 4 collectors (LVNV/Midland/Calvary/NCB) prefer indirect via CRA. See `big-3-debt-collector-strategy.md`.
- **Identity Theft Escalation:** Notice of Fault Affidavit of Truth with state/county header, numbered facts, tacit agreement doctrine. See `affidavit-format.md`.
- **HHS OCR HIPAA:** When debt collector exposes medical records in validation response. 42 USC 1320 criminal penalty leverage. See `distribution-strategy.md#hhs-ocr-hipaa-complaint-portal`.

## Letter Composition Patterns (NEW 2026-05)

When recommending a strategy, ALSO recommend the letter composition pattern. Pull from RAG category `LETTER_WRITING_TACTICS` (files: opening-techniques.md, facts-techniques.md, closing-techniques.md, damage-chains.md, heavy-metal-writing.md, plain-english-writing.md, snitch-style-writing.md).

Patterns per round:

| Round | Opening Tech | Closing Tech |
|---|---|---|
| R1 | Clearly state OR Breaking news | Firm deadline |
| R2 | Q&A | Damage jabs OR Recall past dates |
| R3 | Lead with violation | # consecutive violations |
| R4 | Quote | Recall past dates |
| R5 | Twist | Escalate to willful |
| R6+ | Twist OR Quote | Question close |

In each letter, inject: 4-element damage chain (max 3), LOL signals 2x per facts paragraph, qualifier sandwich 1x, echoing of key proof element, personalization (CRA name + dates + amounts), inaccurate intro statement + screenshot reference (accuracy disputes), consumer statement at end, demand sentence before account list.

Style guardrails: Plain English (write like you talk), only period+comma, no semicolons, no legal jargon, verbs over adjectives. Damages capped at 1.5 paragraphs.
