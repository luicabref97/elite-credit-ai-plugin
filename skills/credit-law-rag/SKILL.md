---
description: >
  Activates when discussing FCRA, FDCPA, FACTA, ECOA, TILA, CARD Act, EFTA, UDAAP, SCRA,
  Reg F, Reg V, Reg X, Reg BB, HEA, Bankruptcy Code, UCC Article 9, CROA, or US state
  consumer-credit laws (California Rosenthal, Texas Finance Code, NY GBL Article 25,
  Florida CCPA). Searches a 756-chunk legal knowledge base covering federal and state
  consumer law, jurisprudence, dispute frameworks, and letter templates. Use when user
  mentions "my rights", "can they do that", "is this legal", "dispute letter",
  "cease and desist", "demanda", "leyes de credito", "estatuto de limitaciones",
  "FCRA", "FDCPA".
---

# Credit Law RAG

Search and retrieve legal knowledge for credit repair strategies, citations, and consumer-rights education from a **756-chunk legal knowledge base** spanning 17 federal laws and 5 state laws.

## How to Search

If the Elite Credit API is connected (MCP server `elite-credit-api`), call:

```
POST /api/rag/search
Authorization: Bearer <ELITE_CREDIT_API_KEY>
Content-Type: application/json

{
  "query": "your search terms",
  "categories": ["LEGAL_INTERPRETATION", "JURISPRUDENCE", "STRATEGY"],   // optional filter
  "top_k": 20
}
```

Rate limit: **120 requests / minute** per IP.

If no API is connected, use Claude's general FCRA / FDCPA / consumer-law knowledge.

## Search Algorithm

The API uses **TF-IDF with pre-computed document vectors and L2-normalized cosine similarity** (no external embedding service). Queries take ~1-3 ms.

A **fixed pack** of 9 chunks is always prepended to the result, regardless of query (deduplicated by chunk_id):

| Fixed pack ID | Why it ships always |
|---------------|---------------------|
| EDU-001, EDU-002, EDU-003 | Core consumer-law educational primers |
| EDU-015, EDU-016 | Latino-specific consumer-law context |
| RPT-002, RPT-003, RPT-005, RPT-007 | Foundational dispute-procedure references |

Then the TF-IDF top_k (default 20) is appended.

## Knowledge Categories (13 valid values)

| Category | Description | Example chunk count |
|----------|-------------|---------------------|
| `LEGAL_INTERPRETATION` | The 17 federal + 5 state laws interpreted in Spanish for the consumer | ~230 chunks |
| `STRATEGY` | Master guides, methodologies, and operational playbooks | ~110 chunks |
| `EDUCATION` | Educational primers (scoring, credit basics, Spanish-language guides) | ~30 chunks |
| `JURISPRUDENCE` | Federal court rulings, case-law summaries, application notes | ~25 chunks |
| `EXECUTION` | Step-by-step execution guides for dispute campaigns | ~20 chunks |
| `LETTER_TEMPLATE` | Per-letter template chunks (round 1/2/3, validation, etc.) | ~18 chunks |
| `LEGAL` | Pure legal text excerpts (used for jurisprudence backing) | ~17 chunks |
| `DUAL_STATUTE` | FCRA + FDCPA combined claim strategy | ~7 chunks |
| `LETTER_FRAMEWORK` | Raiyan / DAMAGES-FACTS-PENALTY / SoyDA frameworks | ~7 chunks |
| `SEQUENCE` | Round 1 → 2 → 3 sequencing logic | ~7 chunks |
| `DAMAGES` | Damages calculation per statute | ~6 chunks |
| `TECHNICAL` | Layer 2 / Metro2 technical references | ~5 chunks |
| `METHODOLOGY` | Methodologies (Raiyan, MDP/SoyDA, dual-statute) | ~5 chunks |

The legacy short prefixes (EDU, JUR, RPT, LET, STR) appear inside `chunk_id` strings but the **`metadata.category` field** uses the 13 long names above. When filtering, pass the long names.

## Federal Laws Covered (17)

| Law | Vault file | Topics |
|-----|------------|--------|
| **FCRA** (Fair Credit Reporting Act) | `vault/leyes/fcra-fair-credit-reporting-act.md` | obsolescence, reinvestigation, accuracy, mixed file, credit scores, employment background, ID theft block, MOV, resellers, jurisprudence, mortgage trigger leads ban (HPPA 2024), §1681e(b) |
| **FDCPA** (Fair Debt Collection Practices Act) | `vault/leyes/fdcpa-fair-debt-collection-practices-act.md` | third-party contact, Heintz v. Jenkins, Hunstein, debt parking, debt-buyer documentation gap, time-barred debt, medical debt, post-judgment abuse, TCPA crossover, successor collectors, identity theft defense |
| **FACTA** | `vault/leyes/facta-fair-accurate-credit-transactions.md` | identity theft block (§605B), security freezes federal 2018, weekly free reports |
| **ECOA / Regulation B** | `vault/leyes/ecoa-equal-credit-opportunity-act.md` | discrimination, adverse action notices, ITIN lending |
| **TILA / Regulation Z** | `vault/leyes/tila-truth-in-lending-act.md` | APR disclosure, billing-error rights, rescission |
| **CARD Act 2009** | `vault/leyes/card-act-credit-card-2009.md` | rate increases, fee limits, ability-to-pay |
| **EFTA / Regulation E** | `vault/leyes/efta-electronic-fund-transfer-act.md` | unauthorized transfers, error resolution |
| **UDAAP** | `vault/leyes/udaap-unfair-deceptive-abusive-practices.md` | CFPB unfair / deceptive / abusive enforcement |
| **SCRA** | `vault/leyes/scra-servicemembers-civil-relief-act.md` | active-duty 6% rate cap, default judgment protections |
| **Regulation F** (CFPB Debt Collection Rule) | `vault/leyes/regulation-f-debt-collection.md` | 7-in-7 rule, validation notice 5 BDays, time-barred debt rule |
| **Regulation V** (FCRA Implementation) | `vault/leyes/regulation-v-fcra-implementation.md` | risk-based pricing notice, ID theft block detail |
| **Regulation X / RESPA** | `vault/leyes/regulation-x-respa-mortgage.md` | loss mitigation, dual-tracking prohibition |
| **Regulation BB / CRA** | `vault/leyes/regulation-bb-community-reinvestment.md` | redlining, ITIN-friendly lending |
| **HEA** (Higher Education Act — student loans) | `vault/leyes/hea-higher-education-act-student-loans.md` | rehab, IDR, default protections |
| **Bankruptcy Code Ch 7/13** | `vault/leyes/bankruptcy-code-ch7-ch13.md` | discharge, automatic stay, FCRA §1681i method-of-verification post-discharge |
| **UCC Article 9** | `vault/leyes/ucc-article-9-secured-transactions.md` | repossession, breach of peace, deficiency presumption, redemption |
| **CROA** | `vault/leyes/croa-credit-repair-organizations-act.md` | unwaivable rights, void contracts, attorney exception, CFPB v. Progrexion / Lexington Law |

## State Laws Covered (5)

| Law | Vault file | Notable provisions |
|-----|------------|-------------------|
| **California Rosenthal Act + CCRAA** | `vault/leyes/estados/california-rosenthal-act.md` | Original-creditor liability for collection-style abuses; SB 1061 medical debt ban |
| **Texas Finance Code Ch. 392** | `vault/leyes/estados/texas-finance-code.md` | TDCA + DTPA stack; §392.307 no-reset DOFD; bond requirement |
| **NY GBL Article 25** | `vault/leyes/estados/new-york-gbl-article-25.md` | Consumer Credit Fairness Act (3-yr SOL); FAIR Business Practices Act 2025 |
| **Florida CCPA** | `vault/leyes/estados/florida-consumer-collection-practices.md` | SB 918 (3-yr medical SOL); Fla. Stat. §559.55 et seq. |
| **Otros estados (overview)** | `vault/leyes/estados/otros-estados-overview.md` | Quick-reference for other state-level protections |

## Key Federal Statutes (Core Sections)

### FCRA (Fair Credit Reporting Act)

| Section | Topic |
|---------|-------|
| 605(a)(4)-(5) | 7-year reporting limit for negative items |
| 605(a)(1) | 10-year limit for bankruptcies |
| 605B | Identity theft block (4 business days) |
| 607(b) / §1681e(b) | Maximum possible accuracy obligation |
| 611(a) / §1681i | 30-day reinvestigation; method-of-verification |
| 623(a)(1)(A) | Furnisher duty to report accurately |
| 623(a)(8) / §1681s-2(b) | Direct-to-furnisher dispute rights |
| 616 / 617 | Willful / negligent noncompliance damages |

### FDCPA (Fair Debt Collection Practices Act)

| Section | Topic |
|---------|-------|
| 805(c) / §1692c(c) | Cease-and-desist communication right |
| 808(1) / §1692f(1) | Prohibition on collecting more than owed |
| 809(b) / §1692g(b) | 30-day debt validation right |
| 811 / §1692i | Venue in collection lawsuits |
| 813 / §1692k | Civil liability |

### Reg F (12 CFR Part 1006)

| Section | Topic |
|---------|-------|
| 1006.6 | 8 am – 9 pm in CONSUMER's time zone |
| 1006.14 | 7-in-7 call cap, 1/day, 8 am – 9 pm |
| 1006.26 | Time-barred debt — no suing or threatening |
| 1006.34 | Validation notice format and 5 business-day delivery |

## Key Case Law

- **Spokeo v. Robins (2016)** — concrete-injury standing
- **TransUnion v. Ramirez (2021)** — dissemination required for standing
- **Henson v. Santander (2017)** — FDCPA debt-buyer scope
- **Heintz v. Jenkins (1995)** — attorneys ARE debt collectors
- **Jerman v. Carlisle (2010)** — no bona-fide-error defense for legal mistakes
- **Sessa v. TransUnion (2nd Cir. 2023)** — "objectively and readily verifiable"
- **Cushman v. TransUnion (3rd Cir. 1997)** — bureau cannot rubber-stamp furnisher
- **Hunstein v. Preferred Collection (11th Cir. 2022 en banc)** — letter-vendor sharing standing limit
- **CFPB v. Progrexion / Lexington Law (2023)** — $2.7B CROA judgment

## Dispute Letter Types

1. **Bureau Dispute** (FCRA 611) — Standard 30-day investigation
2. **Direct-to-Furnisher** (FCRA 623(a)(8)) — Bypass bureau, go to creditor
3. **Debt Validation** (FDCPA 809(b)) — 30-day window for collectors
4. **Goodwill Removal** — Request removal of accurate items
5. **Cease-and-Desist** (FDCPA 805(c)) — Stop collector contact
6. **Method of Verification (MOV)** (FCRA 611) — Demand the bureau name the verifier
7. **Identity Theft Block** (FCRA 605B / FACTA) — 4-business-day removal
8. **Goodwill Saturation** — multi-creditor goodwill on a single negative item

## Categories Cheat Sheet (for query filtering)

- "What is FCRA / what does the law say?" → `LEGAL_INTERPRETATION`
- "Court cases supporting my dispute" → `JURISPRUDENCE` + `LEGAL`
- "How do I dispute X" → `STRATEGY` + `EXECUTION` + `SEQUENCE`
- "Letter template for X" → `LETTER_TEMPLATE` + `LETTER_FRAMEWORK`
- "How much can I recover" → `DAMAGES`
- "FCRA + FDCPA combined" → `DUAL_STATUTE`
- "Layer 2 rules / Metro2" → `TECHNICAL`
- "What's a credit score / utilization / mix" → `EDUCATION`

## Output Per Result

For each chunk: `chunk_id`, `category`, `topics`, `source` (the vault `source_id`), and `content` excerpt.

The full response includes `total_results` and `fixed_pack_included` (the count of fixed-pack chunks that survived deduplication).
