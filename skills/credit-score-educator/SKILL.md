---
description: >
  Automatically activates when working with credit scores or factor analysis. Transforms raw
  credit data into consumer-friendly educational explanations with grades, tips, and personalized
  guidance, including the FICO 8 / FICO 9 / VantageScore 3.0 / VantageScore 4.0 nuances and the
  2024-2026 medical-debt-rule landscape (CFPB rule VACATED July 2025; NCRA voluntary policies
  remain). Use when user asks "what does my score mean", "how to improve my score",
  "explain my credit factors", "credit tips", "que significa mi score", "como subo mi puntaje".
---

# Credit Score Educator (v3)

Transform raw credit report data into educational content at an 8th-grade reading level, anchored to current 2024-2026 scoring practice.

## Score Grading Scale

| Range | Grade | Label |
|-------|-------|-------|
| 800-850 | EXCELLENT | Exceptional credit |
| 740-799 | VERY_GOOD | Above average |
| 670-739 | GOOD | Near or slightly above average |
| 580-669 | FAIR | Below average |
| 300-579 | POOR | Well below average |

## Factor Weights by Scoring Model

### VantageScore 3.0 (still widely used by Credit Karma, Credit Sesame)

| Factor | Weight |
|--------|--------|
| Payment History | 40% |
| Credit Usage (utilization) | 20% |
| Credit Age | 21% |
| Credit Mix | 11% |
| Recent Credit | 5% |
| Available Credit | 3% |

### FICO Score 8 (still the most-used model by lenders, ~80% of mortgage decisions outside FICO 2/4/5)

| Factor | Weight |
|--------|--------|
| Payment History | 35% |
| Amounts Owed (utilization + balances) | 30% |
| Length of Credit History | 15% |
| Credit Mix | 10% |
| New Credit | 10% |

**FICO 8 small-collection threshold:** collections with original balance **under $100** are ignored. Collections **$100+** still hurt even when paid (FICO 9 is the model that ignores paid collections).

### FICO Score 9 (introduced 2014, slow adoption — still rare in mortgage)

Same weights as FICO 8, but:
- **Paid medical collections** are excluded entirely
- **All paid collections** ignored (not just medical)
- **Positive rent reporting** counts (when reported)

### FICO Score 10 / 10T (newest, 2020 release; very limited adoption — Fannie/Freddie still default to FICO 2/4/5)

- 10T uses **trended data** — 24 months of utilization patterns instead of a single snapshot
- Penalizes reborrowing on credit cards more aggressively

### VantageScore 4.0 (2017 release; fastest adoption among non-FICO models)

- **Trended data** (24-month patterns)
- More forgiving of medical debt — ignores paid medical, weighs unpaid medical less
- Ignores paid collections entirely
- Natural-disaster protections

## Model Comparison

| Feature | FICO 8 | FICO 9 | FICO 10T | VS 3.0 | VS 4.0 |
|---------|--------|--------|----------|--------|--------|
| Paid collections hurt | Yes (≥$100) | No | No | Partial | No |
| Medical debt special | No | Yes | Yes | No | Yes |
| Rent reporting | No | Yes | Yes | No | Yes |
| Trended data | No | No | **Yes** | No | **Yes** |
| Used by Credit Karma | No | No | No | **Yes** | (some) |
| Used by mortgage lenders | Some | Rare | Rare | No | No |

## 2024-2026 Medical Debt Status (CRITICAL — this changed recently)

Three layered protections, in decreasing order of strength:

1. **NCRA voluntary industry policy (March 2022, still in effect):**
   - Paid medical collections REMOVED from reports
   - 1-year grace period before medical debt can be reported (was 180 days)
   - Medical debt **under $500** voluntarily not reported (effective April 2023)
   - **Caveat:** Voluntary, not statutory. Bureaus could revert. Currently still active at all three bureaus.

2. **CFPB Medical Debt Rule (Jan 2025) — VACATED July 2025:**
   - Rule that would have BANNED all medical debt from credit reports
   - Vacated by U.S. District Court for the Eastern District of Texas on July 11, 2025
   - **Not in effect.** Do not promise to consumers that medical debt is "banned" — only NCRA voluntary policy applies federally.

3. **State medical-debt bans (10 states as of 2026):**
   - **Full ban:** California (SB 1061), Colorado (HB 23-1126), New York (S2522A — eff. Jan 2025), Connecticut (SB 1033), Maryland (HB 565), Oregon (SB 1580), Washington (SB 5513)
   - **Threshold ban:** Nevada (under $2,500 — SB 248), Illinois (under $500 — HB 2719), Minnesota (under $1,000 — HF 2125)
   - The audit engine evaluates this with the `MEDICAL_DEBT_STATE_BAN` rule (uses `state_medical_bans.json` config and the consumer's `client_state`).

When educating the consumer about medical debt, present these in order: (1) state ban if applicable, (2) NCRA voluntary policy, (3) note the CFPB rule was vacated.

## Factor Grading (A-F)

- **A**: Excellent — top-tier performance
- **B**: Good — above average, minor room for improvement
- **C**: Fair — average, actionable improvements available
- **D**: Needs Work — below average, significant improvement needed
- **F**: Very Poor — major negative impact on score

## Vault references for deeper content

The credit-law RAG (756 chunks) carries detailed reference material that this skill can augment its answers with:

- `vault/guias-maestras/educacion-crediticia-myfico.md` — model comparison detail (chunk category: `EDUCATION`)
- `vault/guias-maestras/us-credit-scoring-systems.md` — current scoring landscape
- `vault/guias-maestras/construccion-credito-2025.md` — credit-building strategies
- `vault/guias-maestras/hard-inquiries.md` — inquiry impact and dedup-window math (FICO 14 days vs VantageScore 45 days for shopping)
- `vault/leyes/ecoa-equal-credit-opportunity-act.md` — adverse action notice rights when score is used to deny

When the consumer asks a deep scoring question, search the RAG with category `EDUCATION` (and `LEGAL_INTERPRETATION` if they're asking about rights tied to a score).

## Explanation Guidelines

- Write at 8th-grade reading level.
- Be encouraging but honest — never sugarcoat severe issues.
- Use SPECIFIC numbers from the user's data.
- Explain WHY something matters, not just what it is.
- Keep each explanation to 1-2 sentences max.
- Always end with an actionable next step.

## Tip Generation

- Generate 3-7 tips, prioritize HIGH first.
- Categories: PAYMENT, UTILIZATION, AGE, MIX, INQUIRIES, COLLECTIONS, MEDICAL_DEBT, MIXED_FILE, IDENTITY_THEFT
- Always include at least 1 positive tip if there's anything good.
- For collections: check if medical (NCRA voluntary policy + state bans). For paid collections: explain that FICO 8 still penalizes ≥$100 even if paid, while FICO 9 / VS 4.0 do not.
- For inquiries: if multiple in 14-day window for mortgage / 45-day window for auto+student, FICO and VantageScore treat them as one. Educate before recommending dispute.

## Disclaimers

- This skill provides educational content. It does NOT provide legal or financial advice.
- For score guarantees: never promise specific point gains. Use ranges (+25 to +50 points) with conditions ("if all P0 disputes succeed").
