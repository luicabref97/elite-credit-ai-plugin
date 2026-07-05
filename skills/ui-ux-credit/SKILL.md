---
description: >
  Consumer-facing presentation layer for the Elite Credit AI audit. The consumer
  deliverable is a STRUCTURED RESPONSE IN THE COWORK CHAT (executive summary →
  consolidated findings by type → prioritized action plan → dispute-letter offer).
  This skill defines that chat response format, the four presentation golden rules,
  the friendly creditor-name cascade, and the anomaly rule_name → friendly-title
  translation table. The visual dashboard is EXCLUSIVE to the elitecredit.ai webapp
  (ADR-022) — the plugin NEVER emits HTML dashboards or inline artifacts.

  Use when: presenting audit results to the consumer, "dashboard", "consumer report",
  "audit results", "findings", "action plan", "resultados", "hallazgos",
  "plan de acción", "reporte visual" (redirect to webapp), or any consumer-facing
  presentation of the analysis.
---

# UI/UX Credit — Consumer Presentation in Chat

This skill defines HOW the plugin presents the audit to the consumer. Since v3.6.0 (ADR-022) the plugin's consumer deliverable is a **structured response in the Cowork chat** — not an HTML artifact. The visual "wow" dashboard (score gauges, factor donut, print-PDF) is exclusive to the **elitecredit.ai webapp**; if the user asks for the visual dashboard, point them there.

If you are an agent presenting consumer-facing analysis, **always follow this skill** rather than improvising a format.

## Where things live

```
skills/ui-ux-credit/
├── SKILL.md          ← this file: the chat response format + presentation rules.
├── _archive/
│   └── dashboard-artifact.html   ← RETIRED single-file dashboard template (v3.4.x–v3.5.x).
│                                    Historical reference only — NEVER populate or emit it.
└── dashboard/        ← design-time React reference from the dashboard era (NOT shipped).
```

## Chat response format (THE consumer deliverable)

At the end of every audit, the ORCHESTRATOR delivers the analysis directly in the chat, in the user's language (`memoria.language`), with these four blocks IN ORDER. Plain language throughout — 8th-grade reading level, second person, no rule names, no API metadata (see copy hygiene rules in `full-pipeline`).

### Block A — Resumen ejecutivo (2-3 lines)

Score(s) per bureau with friendly grade, total findings count, and the single most urgent issue. No tables, no jargon — a person should read it in 10 seconds and know where they stand.

### Block B — Hallazgos consolidados POR TIPO

One entry per finding TYPE (never per instance), ordered by severity (Crítico → Medio → Menor). Each entry:

- **Título amigable** (from the translation table below) + severity label in bold: **Crítico** / **Medio** / **Menor** (EN: **Critical** / **Medium** / **Minor**).
- **Cuentas afectadas** with FRIENDLY NAMES (cascade below), e.g. "Tarjeta de tienda Victoria's Secret", "Colección Midland Credit Management".
- **Evidencia breve** — one line of concrete evidence in plain language ("Equifax dice $1,240 pero TransUnion dice $890").
- **Lo que vamos a hacer** — one-line action.

The four presentation golden rules below APPLY IN FULL to this block — they are format-independent (they governed the dashboard cards; they govern chat entries identically).

### Block C — Plan de acción priorizado (P0 → P4)

Timeline buckets with concrete steps, from `dispute_strategies.json`:

- **Esta semana (P0)** — the urgent moves.
- **Semanas 2-3 (P1)** …
- **Semanas 4-8 (P2-P3)** …
- **Semanas 8-18 (P4 / seguimiento)** …

Each step: action + one-line reason + effort estimate. Present priorities as timing ("esta semana"), never as internal codes — "P0" is for your orchestration, not for the consumer.

### Block D — Cierre con oferta de cartas

Close by (1) stating the expected score impact as a realistic range, (2) reminding that the next step in Flow A is Phase 1 setup BEFORE letters (per the Step 8 handoff), and (3) offering the dispute letters. Include the short educational disclaimer (exact copy below).

### Concrete example (Spanish, abbreviated)

```markdown
## Tu análisis está listo, María

**Tus scores:** Equifax 512 · Experian 498 · TransUnion 505 — hoy en "Necesita trabajo",
con 9 problemas corregibles encontrados. Lo más urgente: una deuda que aparece DOS veces
en tu reporte, inflando lo que "debes" ante los bancos.

### Lo que encontramos

**1. La misma deuda aparece dos veces — Crítico**
Cuentas: Tarjeta de crédito Capital One + Colección Midland Credit Management.
Capital One vendió esta deuda a Midland, pero su cuenta sigue mostrando un balance de
$2,140 en vez de $0 con indicador de "vendida". Los dos registros juntos duplican la
deuda visible. → Vamos a disputar para que Capital One muestre $0/cerrada.

**2. Tu fecha de mora cambió — posible re-aging — Crítico**
Cuenta: Colección Midland Credit Management.
La fecha de tu primer atraso aparece como marzo 2022, pero tu reporte anterior decía
octubre 2020. Esa fecha no puede cambiar: define cuándo la cuenta se cae de tu reporte.
→ Vamos a exigir la fecha original con evidencia de tu reporte anterior.

**3. Tu balance se reporta diferente entre los burós — Medio**
Cuentas: Préstamo de auto Santander · Tarjeta de tienda Victoria's Secret.
Santander: Equifax dice $8,450 pero TransUnion dice $7,980. Victoria's Secret: solo
Experian reporta balance. → Disputa cruzada con los tres burós.

[…resto de hallazgos, siempre de Crítico a Menor…]

### Tu plan de acción

**Esta semana** — Preparar el terreno: cuentas en los 3 burós, cuenta CFPB, USPS
Informed Delivery (te guío paso a paso; ~45 min total).
**Semanas 2-3** — Ronda 1 de disputas: la deuda duplicada y el re-aging (correo
certificado; yo redacto las cartas).
**Semanas 4-8** — Seguimiento de respuestas (los burós tienen 30 días) y disputa de
los balances inconsistentes.
**Semanas 8-18** — Ronda 2 si algo no se corrige, y estrategia de reconstrucción.

### Qué esperar

Si estas disputas se resuelven a tu favor, un rango realista es **+40 a +75 puntos**
en 3-6 meses. El siguiente paso NO es mandar cartas todavía: primero hacemos la
preparación de esta semana para que las disputas tengan fuerza. ¿Empezamos? Y cuando
la preparación esté lista, te genero las cartas de disputa personalizadas.

*Este análisis es educativo, no asesoría legal. Para acción legal formal, consulta
NACA (consumeradvocates.org) o un abogado de ley del consumidor.*
```

**Format notes:** markdown headings + bold only (renders natively in Cowork chat); no emojis as severity markers; numbers stay exact (never round balances); every finding names its accounts with friendly names; the RAW furnisher string may be shown once as "(aparece en tu reporte como 'CB/VICSCRT')" when it helps the user recognize the account.

### Verification (matches `credit-forensic-analyst` Step 8 gate)

The chat response contains all four blocks (A-D), findings are consolidated by type with friendly names, and the response is in `memoria.language`. `output/consumer_dashboard.md` holds the durable saved copy of the same content.

## Presentation golden rules (v3.5 — apply when composing Block B findings and account lists)

1. **Consolidate by TYPE.** One finding entry per TYPE with every affected account listed — never one entry per instance. Twelve missing-DOFD hits are ONE entry with twelve creditors, not twelve entries.
2. **Re-aging absorbs missing-DOFD.** NEVER show a missing-DOFD finding and a re-aging finding as separate entries for the SAME account — "no delinquency date" next to "the delinquency date is wrong" reads as a contradiction. The re-aging entry absorbs the angle. The API assembler already applies this server-side (`apply_presentation_coherence`); mirror it whenever assembling findings from raw `audit_report.json`. Same for accounts whose first-delinquency date lives in a remark (`first_delinquency_in_remarks`): "sin fecha de mora" would read as false — drop them from the missing-DOFD entry (letters keep the finding).
3. **Original vs collector = ONE linked story.** When the same debt appears as the original creditor's charge-off AND a collector/debt-buyer entry, present them LINKED: the finding is the DOUBLE REPORTING, and the fix is the original showing $0/closed with its sold/transferred indicator. NEVER accuse the original creditor's own entry (`original_creditor_source = "self"`) of being a "duplicate" of itself. Use the linkage display fields (`linked_collector` / `linked_origin`) when present.
4. **Consumer names in the chat presentation, RAW names in letters.** The chat shows understandable creditor names (e.g., "Comenity Bank / Victoria's Secret"); dispute letters ALWAYS use the raw furnisher name exactly as printed on the report (e.g., "CB/VICSCRT") — and only cite `original_creditor` values that were printed on the report (`source = None`), never `self`/`inferred` ones.

## Composing friendly creditor names (v3.5.1 — for account mentions in Blocks A-C and `account_context` keys)

Resolve each display name through this cascade — first hit wins:

1. **`consumer_label` from the plugin's own extraction** (`CreditAccount` / `CollectionRecord`) — the brand alone ("Victoria's Secret", "Midland Credit Management"); the extractor leaves it null when unsure, so never invent one at this stage either.
2. **Seed config `GET /api/config/furnisher_brands`** — match the RAW furnisher (lowercased) against its three maps in order: `abbreviations` (whole-name bank decodes: "bk of amer" → Bank of America), `brands` (brand tokens inside the string: "victori" → Victoria's Secret), `issuers` (private-label banks: "comenity" → Comenity (Bread Financial)). Keys ≤4 chars need word-boundary matching ("att" must never hit "attorney"). Served whitelisted alongside `debt_buyer_names`.
3. **Honest generic** — "{Tipo} — {crudo}" / "{Type} — {raw}". Never a guessed brand.

Compose with a type phrase per language derived from `loan_type` (first) then `account_type` — first substring hit wins, in this exact order (mirrors the API's `_TYPE_PHRASES`; note `unsecured` MUST match before `secured`): creditcard → "Tarjeta de crédito"/"credit card", chargeaccount / charge account → "Tarjeta de tienda"/"store card", automobile/auto → "Préstamo de auto"/"auto loan", lease → "Arrendamiento"/"lease", educational/student → "Préstamo estudiantil"/"student loan", unsecured → "Préstamo personal"/"personal loan", secured → "Tarjeta asegurada"/"secured card", mortgage → "Hipoteca"/"mortgage", collection → "Colección"/"collection", revolving → "Tarjeta de crédito"/"credit card", installment → "Préstamo"/"loan"; fallback "Cuenta"/"account". Then: ES = "{Tipo} {Marca}", EN = "{Brand} {type}".

Notes: the webapp adds a curated `creditor_master` tier (Supabase) ABOVE all of these — the plugin has no access to it, so its cascade starts at `consumer_label`. And golden rule 4 always applies: friendly names in the chat presentation; the RAW furnisher string is always preserved ("como aparece en tu reporte") and dispute letters ALWAYS use the RAW.

## Anomaly rule_name → friendly title translation table

Internal identifiers MUST be translated before they reach the consumer. The 30 most common (ES titles match the API assembler's `_RULE_ES` copy exactly — keep them in sync):

| `rule_name` | `title_es` | `title_en` |
|-------------|------------|------------|
| `BALANCE_EXCEEDS_CREDIT_LIMIT` | Saldo por encima del límite de crédito | Balance reported above your credit limit |
| `DOFD_DISCREPANCY_CROSS_BUREAU` | Tu fecha de mora aparece diferente en cada buró | Your delinquency date differs across bureaus |
| `BALANCE_DISCREPANCY_CROSS_BUREAU` | Tu balance se reporta diferente entre los burós | Your balance is reported differently across bureaus |
| `STATUS_CONFLICT_CROSS_BUREAU` | Una cuenta aparece con estados distintos en cada buró | One account shows different statuses across bureaus |
| `DATE_OPENED_DISCREPANCY` | La fecha de apertura no coincide entre los burós | Account-opened date doesn't match across bureaus |
| `CHARGEOFF_MISSING_DOFD` | Charge-off sin fecha de mora original | Charge-off missing the original delinquency date |
| `ACCOUNT_EXCEEDS_7_YEARS` | Cuenta más vieja de 7 años, debería haberse caído | Account older than 7 years; should have aged off |
| `BANKRUPTCY_EXCEEDS_10_YEARS` | Bancarrota más vieja de 10 años, debería haberse caído | Bankruptcy older than 10 years; should have aged off |
| `DOFD_CHANGED` | La fecha de mora cambió — posible re-aging | Delinquency date changed — possible re-aging |
| `REINSERTION_DETECTION` | Una cuenta que se había quitado volvió a aparecer | An account that was removed reappeared |
| `REPOLLUTION_DETECTION` | Una cuenta resuelta volvió a aparecer con datos viejos | A resolved account came back with stale data |
| `BALANCE_INCREASED_ON_CLOSED_ACCOUNT` | El balance subió en una cuenta cerrada | Balance increased on a closed account |
| `MEDICAL_PROVIDER_NAME_EXPOSED` | Nombre de proveedor médico expuesto en el reporte | Medical provider name exposed in the report |
| `MEDICAL_PAID_STILL_REPORTING` | Cuenta médica pagada sigue reportándose | Paid medical account still reporting |
| `MEDICAL_DEBT_STATE_BAN` | Tu estado prohíbe reportar este tipo de deuda médica | Your state bans reporting this type of medical debt |
| `DUPLICATE_TRADELINE` | La misma cuenta aparece duplicada | Same account is duplicated |
| `MIXED_FILE_DETECTION` | Tu archivo está mezclado con otra persona | Your file is mixed with another person's |
| `INQUIRY_OVER_24_MONTHS` | Consulta más vieja de 24 meses | Inquiry older than 24 months |
| `INQUIRY_NO_PURPOSE` | Consulta sin propósito autorizado | Inquiry without authorized purpose |
| `COLLECTION_NO_ORIGINAL_CREDITOR` | Cobranza sin acreedor original identificado | Collection without identified original creditor |
| `NEGATIVE_ACCOUNT_MISSING_DOFD` | Cuenta negativa sin fecha de mora | Negative account missing its delinquency date |
| `RE_AGING_SIGNATURE` | Posible re-envejecimiento de la deuda | Possible re-aging of the debt |
| `DUPLICATE_DEBT_ORIGINAL_PLUS_COLLECTOR` | La misma deuda aparece dos veces | The same debt appears twice |
| `PAYMENT_HISTORY_CODE_CONTRADICTS_PUBLIC_RECORDS` | Código de bancarrota sin bancarrota en tu archivo | Bankruptcy code with no bankruptcy on file |
| `CLOSED_ACCOUNT_WITH_MONTHLY_PAYMENT` | Pago mensual exigido en cuenta cerrada | Monthly payment demanded on a closed account |
| `DEBT_BUYER_DOCUMENTATION_GAP` | Comprador de deuda sin datos de validación | Debt buyer missing validation data |
| `COLLECTION_TRADELINE_MISCLASSIFIED` | Colección clasificada como préstamo | Collection classified as a loan |
| `PAST_DUE_DISCREPANCY_CROSS_BUREAU` | Monto vencido distinto entre burós | Past-due amount differs across bureaus |
| `HIGH_CREDIT_DISCREPANCY_CROSS_BUREAU` | Saldo máximo distinto entre burós | Highest balance differs across bureaus |
| `NO_OPEN_POSITIVE_TRADELINES` | No tienes ninguna cuenta abierta y positiva | No open account in good standing on your file |

Fallback for unknown rule_names: `title_es` "Hay un problema en esta cuenta" / `title_en` "There's an issue on this account", using the anomaly's `description` as the explanation (translated as needed).

## Score grades & severity vocabulary

| Grade | Range | ES label | | Severity | ES / EN label |
|---|---|---|---|---|---|
| EXCELLENT | 800-850 | Excelente | | HIGH | Crítico / Critical |
| VERY_GOOD | 740-799 | Muy bueno | | MEDIUM | Medio / Medium |
| GOOD | 670-739 | Bueno | | LOW | Menor / Minor |
| FAIR | 580-669 | Aceptable | | | |
| POOR | 300-579 | Necesita trabajo | | | |

Severity is always a bold text label in chat — never an internal enum (`HIGH`), never a color-only signal.

## i18n

- Language source: Memoria `language` ("es" default). The ENTIRE chat response ships in that language — no mixed-language blocks.
- If the user switches language mid-conversation, honor the switch for subsequent responses and update Memoria.

## Disclaimer copy (exact wording)

- ES: "Este análisis es educativo, no asesoría legal. Para acción legal formal, consulta NACA (consumeradvocates.org) o un abogado de ley del consumidor."
- EN: "This analysis is educational, not legal advice. For formal legal action, consult NACA (consumeradvocates.org) or a consumer-law attorney."

## Visual dashboard → webapp (what to say)

When the user asks for the visual dashboard, graphs, gauges, or a PDF report: explain that the interactive visual dashboard lives in the **elitecredit.ai webapp** (score gauges, factor breakdown, account explorer, print-ready PDF) and that this chat gives them the same analysis in conversational form. Do NOT attempt to rebuild the visual dashboard as HTML, an inline artifact, or an SVG — that emission path was retired in v3.6.0 (ADR-022).

## Archived material (historical reference — do not use at runtime)

- `_archive/dashboard-artifact.html` — the retired single-file dashboard template (v3.4.0–v3.5.x, ADR-021). Kept for design/history reference; its AUDIT_DATA contract, print artboard, and a11y hardening are documented in git history and ADR-021.
- `dashboard/` — the design-time React canvas from the dashboard era. Never shipped, never copied to `output/`.
