---
description: >
  UI/UX design system + reference implementation for the Elite Credit AI consumer
  dashboard. Activates when designing or generating credit-report visualizations,
  score displays, anomaly cards, action timelines, or any consumer-facing audit
  artifact. Backed by a complete React 18 reference implementation in
  `dashboard/` plus a print-ready PDF artboard. Brand: Plus Jakarta Sans, dark
  navy / gold / green / red palette. Bilingual ES/EN.

  Use when user mentions: "dashboard", "consumer report", "audit visualization",
  "credit UI", "score gauge", "factor chart", "anomaly card", "PDF report",
  "design", "frontend", "diseño", "tablero", "reporte visual".
---

# UI/UX Credit — Design System + Reference Implementation

This skill is two things at once:

1. **Documentation** — the canonical brand system (colors, typography, spacing) and component patterns for everything Elite Credit AI shows the consumer.
2. **Reference implementation** — a complete React 18 dashboard living in `dashboard/` that the audit pipeline copies into the user's `output/` folder after every `/analyze`. The consumer opens `runtime.html` and gets a personalized, interactive view of their audit. They can save as PDF via the browser print dialog.

If you are an agent generating consumer-facing visuals, **always defer to this skill** rather than improvising layouts or colors.

## Where the implementation lives

```
skills/ui-ux-credit/dashboard/
├── runtime.html       — consumer entry point (mounts only DirectionA, no design canvas)
├── pdf.html           — direct PDF artboard view (?autoprint=1 triggers browser print on load)
├── index.html         — DESIGN-MODE entry (canvas + tweaks panel — for iterating, not for consumers)
├── data.js            — window.AUDIT_DATA shape + i18n helpers (sample data ships; agent overwrites with real data)
├── direction-a.jsx    — DirectionA component (the dashboard the consumer sees)
├── pdf-artboard.jsx   — PDFArtboard component (light, monochrome, gold rules, letter-sized)
├── design-canvas.jsx  — pan/zoom canvas (DESIGN-TIME ONLY)
├── tweaks-panel.jsx   — language / animation toggles (DESIGN-TIME ONLY)
├── styles.css         — all dashboard styles, includes :root with full CSS-variable system
├── styles-extras.css  — small additions
├── print.css          — @media print rules + @page letter sizing
└── logos/             — equifax.svg, experian.svg, transunion.svg
```

## Brand system

### CSS variables (canonical — defined in `dashboard/styles.css :root`)

| Token | Hex | Usage |
|-------|-----|-------|
| `--navy` | `#0A1628` | Score-card backgrounds, primary panels |
| `--navy-2` | `#16223a` | Slightly lighter navy for layered cards |
| `--navy-3` | `#1a2438` | Borders on dark cards, inactive chips |
| `--gold` | `#C4A052` | Primary accent, CTAs, flow labels, highlights |
| `--gold-2` | `#CDA52C` | Secondary accent, hover states |
| `--gold-soft` | `#f0e5cc` | Hero greeting text, large numbers, highlight strong |
| `--green` | `#206540` | Success states, "good standing" indicators |
| `--green-soft` | `#5fa87a` | Positive copy, "al día" status, healthy utilization |
| `--red` | `#B03642` | Critical anomaly borders, severity HIGH |
| `--red-soft` | `#d97082` | Charge-off / collection status indicators |
| `--bg` | `#06090f` | Page background |
| `--bg-2` | `#0c1220` | Inset / well backgrounds |
| `--text` | `#e6dfce` | Body text on dark surfaces |
| `--text-dim` | `#98a0b3` | Secondary copy, captions |
| `--text-faint` | `#5d6680` | Hint copy, separators |

When generating new components or pages, reference variables (`var(--gold)`) — never hardcode the hex values.

### Typography

- **Font family:** Plus Jakarta Sans (300 / 400 / 500 / 600 / 700 / 800), via Google Fonts in `styles.css` `@import`.
- **Headings:** weight 600-700, letter-spacing -0.4 to -1.5 on large display, balanced text-wrap.
- **Body:** weight 400-500, line-height 1.5-1.6.
- **Tabular numbers:** `font-variant-numeric: tabular-nums` on score values, dollar amounts, week counts.
- **Display sizes:** Greeting H1 = 56px / 700; Section H2 = 22px / 600; H4 cards = 14-16px / 600.

### Spacing scale

Section gaps in the dashboard use multiples of 8px: `8 / 16 / 24 / 32 / 48 / 56 / 64`. Padding inside cards is 24-28px. Page padding is `48px 56px 64px`.

### Border radius

`6px` on chips, `10-14px` on cards, `16px` on hero cards, `20px+` only for special pills (impact pill in the hero).

### Score gauge color bands

The 5-band palette maps grades to fixed colors. Used by `getGradeColor()` in `data.js`:

| Grade | Hex | Score range (FICO 8 / VS 3.0) |
|-------|-----|-------------------------------|
| `EXCELLENT` / `A` | `#5FB97D` | 800-850 |
| `VERY_GOOD` / `B` | `#A8C957` | 740-799 |
| `GOOD` / `C` | `#E8C547` | 670-739 |
| `FAIR` / `D` | `#E08A3C` | 580-669 |
| `POOR` / `F` | `#D24F66` | 300-579 |

Severity colors for anomalies (independent of the gauge palette):

| Severity | Hex | When |
|----------|-----|------|
| `HIGH` | `#B03642` | Statutory violations with documented evidence |
| `MEDIUM` | `#C4A052` | Disputable items with moderate evidence |
| `LOW` | `#5fa87a` | Minor issues / informational |

## Component inventory

All components live in `dashboard/direction-a.jsx` (interactive runtime) or `dashboard/pdf-artboard.jsx` (print). When the audit pipeline emits the consumer dashboard, these are the components in play:

### `ScoreGaugeA(score, grade, model, delta, animate, lang)` — `direction-a.jsx:7`

A semicircular gauge with 5 color bands. Score number centered, grade label below, model label above (`VANTAGE SCORE 3.0`, `FICO 8`, etc.), and a delta indicator (▲ green / ▼ pink) showing change since prior baseline. When `delta === 0`, shows "0" in green with no arrow (first-time analysis).

Animates from 300 to the actual score over 1.5s when `animate=true`. Position dot on the arc indicates the score's location in the band.

### `FactorScoreDonut(factors, lang, animate, model)` — `direction-a.jsx:137`

A 5-segment donut chart sized by factor weight. Each segment carries the grade letter (A-F) and a short factor name (PAGOS, DEUDA, ANTIGÜEDAD, NUEVO, MEZCLA in ES). Click a segment → side panel shows the explanation, weight %, and a list of all 5 factors as clickable buttons.

The factor weights differ between FICO and VantageScore — pass `model` to pick the right `weight_fico` / `weight_vs` field.

### `BureauDotsA(statuses)` — `direction-a.jsx:349`

Three colored dots (EQ / EX / TU) showing whether all 3 bureaus agree on an account's status. Color by status: green (Pays as Agreed), pink (ChargeOff/Collection), gold (30 Days Late), gray (Closed/Deferred), faint (Removed).

### `AccountChipA(acct, lang, active, onClick)` — `direction-a.jsx:372`

The left-rail chip in the master/detail accounts shelf. Shows creditor + friendly status. Active state colors the border by `acct.group` (good / attention / collections).

### `AnomalyCardA(a, lang)` — `direction-a.jsx:435`

The card for a single anomaly. Severity-colored left border (Red / Gold / Green). Title + plain-language explanation + affected accounts as chips + "Lo que vamos a hacer" action footer + statute citation in the top-right.

### `TimelineStepA(step, lang)` — `direction-a.jsx:460`

A row in the action-plan timeline. Dot + action title + reason + effort (e.g., "30 min", "1 h").

### `DirectionA(lang, animate)` — `direction-a.jsx:474`

The main dashboard composition. Section order:

1. **Hero** — flow label / audit date, greeting H1, narrative summary, expected impact pill, three score cards.
2. **Factor donut** — 5-segment chart + side panel.
3. **Accounts shelf** — left chips list, right detail card.
4. **Anomalies** — severity filter chips + grid of anomaly cards.
5. **Action plan** — timeline with 4 phase blocks (this week / 2-3 / 4-8 / 8-18).
6. **Context** — what the user shared in the post-audit interview.
7. **Footer** — Resume / Download PDF / Print buttons + legal disclaimer.

### `PDFArtboard(lang)` — `pdf-artboard.jsx:5`

The print-friendly version. White background, near-black text, gold horizontal rules. Same data, tabular layout. Sections: header (brand + meta), Scores, Factor table, Accounts table, Issues found (numbered), Action plan blocks, Footer with disclaimer + page number.

Uses the same `data.js` source. Renders to letter (8.5×11) via `print.css` `@page` rules.

## Data contract — `window.AUDIT_DATA`

The dashboard reads a single global object. The audit pipeline must produce a `data.js` that defines this shape exactly. Field reference (sample values from `dashboard/data.js`):

```js
window.AUDIT_DATA = {
  user: {
    first_name: "Carly",            // string, required for greeting
    last_name: "Mendoza",           // string, used in PDF header only
    audit_date: "2026-04-28",       // ISO date, displayed in hero + PDF
    ssn_last4: "4821",              // string, displayed in PDF header only — NEVER full SSN
  },

  routing: {
    flow: "A",                                     // "A" | "B" | "C"
    flow_name_es: "Reparación",                    // string ES
    flow_name_en: "Repair",                        // string EN
    phase: 2,                                      // integer
    phase_name_es: "Disputas Específicas",         // string ES
    phase_name_en: "Targeted Disputes",            // string EN
    duration_weeks: "4–18",                        // string
    primary_goal_es: "...",                        // string ES
    primary_goal_en: "...",                        // string EN
  },

  scores: {
    equifax:    { score: 615, grade: "FAIR", model: "VS 3.0", delta: -8 },
    experian:   { score: 622, grade: "FAIR", model: "VS 3.0", delta: -3 },
    transunion: { score: 608, grade: "POOR", model: "VS 3.0", delta: -12 },
    // grade ∈ {EXCELLENT, VERY_GOOD, GOOD, FAIR, POOR}
    // model ∈ {"VS 3.0", "VS 4.0", "FICO 8", "FICO 9", ...}
    // delta: integer (positive = score increased since baseline; 0 if first-time analysis)
  },

  factor_grades: [
    {
      factor_es: "Historial de pagos",
      factor_en: "Payment History",
      weight_fico: 35,                     // FICO weight % (always include)
      weight_vs: 40,                       // VantageScore weight % (always include)
      grade: "D",                          // A | B | C | D | F
      explanation_es: "...",               // 1-2 sentences plain language
      explanation_en: "...",
    },
    // 5 factors total in this order:
    // Payment History / Amounts Owed / Length of Credit / New Credit / Credit Mix
  ],

  accounts: [
    {
      creditor: "Capital One Auto Finance",         // display name
      type_es: "Préstamo de auto",                  // localized type
      type_en: "Auto Loan",
      opened: "2022-03-01",                         // ISO date
      balance: { eq: 5800, ex: 0, tu: 5800 },       // per-bureau balance, null/0 OK
      limit: null,                                  // credit limit (null = N/A)
      status_per_bureau: {                          // bureau-reported status
        eq: "ChargeOff", ex: "Pays as Agreed", tu: "Closed"
      },
      friendly_status_es: "Necesita atención — los burós reportan diferente",
      friendly_status_en: "Needs attention — bureaus report differently",
      group: "attention",                           // "good" | "attention" | "collections"
      monthly: 0,                                   // monthly payment
      utilization: null,                            // % (cards only; null for non-cards)
      last_activity: "2024-09-15",
      original_creditor: "Synchrony Bank",          // optional, for debt-buyer collections
      flags: ["cross_bureau_mismatch", "charge_off"], // see getFlagLabel() for keys
    },
    // ...all accounts on the report
  ],

  anomalies: [
    {
      id: "an1",
      severity: "HIGH",                                       // HIGH | MEDIUM | LOW
      title_es: "Tu límite de crédito fue rebasado en el reporte",
      title_en: "Your reported balance is higher than your credit limit",
      explanation_es: "...",                                  // plain-language paragraph
      explanation_en: "...",
      affected: ["Capital One Bank USA"],                     // array of creditor names
      action_es: "Disputar a los 3 burós...",                 // what we'll do
      action_en: "Dispute with all 3 bureaus...",
      citation: "FCRA §623(a)(2)",                            // statute reference (top-right of card)
    },
    // ...all anomalies; 9 in the sample
  ],

  action_plan: {
    expected_impact_es: "+80 a +150 puntos en 12-18 semanas",
    expected_impact_en: "+80 to +150 points in 12-18 weeks",
    total_disputable_items: 13,
    this_week:    [ /* steps */ ],
    weeks_2_3:    [ /* steps */ ],
    weeks_4_8:    [ /* steps */ ],
    weeks_8_18:   [ /* steps */ ],
    // Each step:
    // {
    //   action_es: "...", action_en: "...",
    //   reason_es: "...", reason_en: "...",
    //   effort: "30 min" | { es: "Continuo", en: "Ongoing" }
    // }
  },

  account_context: {
    // Keyed by creditor name; only entries the user actually answered.
    // Empty / missing answers omit the field.
    "Capital One Auto Finance": {
      letters_received_es: "Carta de Midland, Sep 2024",
      letters_received_en: "Letter from Midland, Sep 2024",
      calls_es: "3-4 por semana",
      calls_en: "3-4 per week",
      hardship_es: "Perdí trabajo en junio 2024",
      hardship_en: "Lost job June 2024",
      docs_es: "Tengo carta original de charge-off",
      docs_en: "I have original charge-off letter",
    },
    // ...
  },
};
```

### Mapping from API outputs to `AUDIT_DATA`

The audit pipeline produces several JSON files. The `credit-forensic-analyst` agent maps them into the dashboard shape:

| Source | Field in source | Maps to | Notes |
|--------|-----------------|---------|-------|
| `extracted_data.json` | `personal_info.first_name`, `last_name` | `user.first_name`, `user.last_name` | Always |
| `extracted_data.json` | `personal_info.ssn_last4` | `user.ssn_last4` | NEVER full SSN |
| Memoria (flow-router) | `active_flow`, `current_phase` | `routing.flow`, `routing.phase` | Phase name from flow guide |
| Memoria | `language` | runtime.html `?lang=` URL param | "es" or "en" |
| `dashboard_data.json` | `scores[bureau].score / grade / model` | `scores[bureau]` | Add `delta: 0` if no baseline |
| `dashboard_data.json` | `factor_grades[]` | `factor_grades[]` | Translate explanation per factor |
| `extracted_data.json` | `accounts[]` | `accounts[]` | Compute `friendly_status_es/en`, `group`, `flags[]` |
| `audit_report.json` | `anomalies[]` | `anomalies[]` | Translate `rule_name` → `title_es/en` (see translation table below) |
| `dispute_strategies.json` | priority buckets | `action_plan.this_week / weeks_2_3 / weeks_4_8 / weeks_8_18` | Group by P0/P1/P2/P3 → time bucket |
| `account_context.json` | per-creditor | `account_context[creditor]` | Only entries the user answered |

### Anomaly rule_name → friendly title translation table

Internal identifiers MUST be translated before they reach the dashboard. The 20 most common:

| `rule_name` | `title_es` | `title_en` |
|-------------|------------|------------|
| `BALANCE_EXCEEDS_CREDIT_LIMIT` | Tu límite de crédito fue rebasado en el reporte | Your reported balance is higher than your credit limit |
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

For any `rule_name` not in this table, fall back to:
- `title_es`: "Hay un problema en esta cuenta"
- `title_en`: "There's an issue on this account"
- And use the anomaly's existing `description` field as `explanation_es/en` (translated as needed).

## i18n helpers (defined in `dashboard/data.js`)

```js
window.t(es_text, en_text, lang)          // returns the right one; lang ∈ {"es","en"}
window.getStatusLabel(status, lang)        // "Pays as Agreed" → "Al día" / "Pays as Agreed"
window.getFlagLabel(flag_key, lang)        // "cross_bureau_mismatch" → "discrepancia entre burós" / ...
window.getStatusColor(group)               // "good"/"attention"/"collections" → {border, text, bg}
window.getGradeColor(grade)                // "A"/"FAIR"/etc → hex string from the 5-band palette
```

When generating new components, prefer these helpers over hardcoded translations or color lookups. They're the canonical bilingual + color sources.

## Status keys (for `account.status_per_bureau`)

The dashboard understands these statuses (passed through unchanged from the credit-report parser):

`Pays as Agreed`, `Closed`, `ChargeOff`, `Collection`, `30 Days Late`, `60 Days Late`, `90 Days Late`, `120 Days Late`, `Deferred`, `Removed`.

If the parser produces a status outside this list, `getStatusLabel()` returns the original string and `BureauDotsA` defaults to a neutral gray.

## Account flags (for `account.flags[]`)

Used in the account detail card to surface tags. Defined in `getFlagLabel()`:

`cross_bureau_mismatch`, `charge_off`, `unvalidated_debt`, `junk_debt_buyer`, `stale_dofd`, `near_obsolescence`, `balance_over_limit`, `high_utilization`, `disputed_late`.

The pipeline computes these heuristically from the audit findings + account data — they are display tags, not internal anomaly identifiers.

## How to instantiate the dashboard at runtime (for agents)

This is the playbook `credit-forensic-analyst` Step 6 follows after emitting `output/consumer_dashboard.md`:

1. **Copy** the runtime files from `skills/ui-ux-credit/dashboard/` to `output/dashboard/`. Specifically:
   - `runtime.html`
   - `pdf.html`
   - `direction-a.jsx`
   - `pdf-artboard.jsx`
   - `styles.css`
   - `styles-extras.css`
   - `print.css`
   - `logos/` (entire folder)
2. **Skip** the design-mode files: `index.html`, `design-canvas.jsx`, `tweaks-panel.jsx`, the original `data.js`. Those are not for consumers.
3. **Generate** `output/dashboard/data.js` with the user's actual audit data, populated per the data contract above. The agent writes the `window.AUDIT_DATA = { ... }` literal, plus the helper functions verbatim from the source `data.js` (`window.t`, `window.getStatusLabel`, `window.getFlagLabel`, `window.getStatusColor`, `window.getGradeColor`).
4. **Tell the user** how to open it (in their `language`):
   - ES: "Tu dashboard interactivo está listo. Abre `output/dashboard/runtime.html` en tu navegador. Para guardar como PDF: usa el botón 'Descargar PDF' o presiona Cmd+P (Mac) / Ctrl+P (Windows)."
   - EN: "Your interactive dashboard is ready. Open `output/dashboard/runtime.html` in your browser. To save as PDF: use the 'Download PDF' button or press Cmd+P (Mac) / Ctrl+P (Windows)."

The user can also append `?lang=en` to the URL to view the English version, or `?lang=es` for Spanish.

## Design-mode workflow (for the human designer)

When iterating on the dashboard design itself, open `dashboard/index.html` in a browser. That mounts the design canvas with both ES/EN artboards and PDF previews, plus a tweaks panel for language and animation toggles. This is where you tune the design with the sample data in `dashboard/data.js`.

When you push a change to `direction-a.jsx`, `pdf-artboard.jsx`, or `styles.css`, simply refresh the browser — Babel-standalone re-transpiles on every load, so there's no build step.

Do **not** edit `data.js` here unless you're updating the sample data for everyone (or fixing a helper). The agent overwrites `data.js` per audit when copying to `output/dashboard/`.

## Print / PDF behavior

- The runtime dashboard renders both the dark `<DirectionA>` (visible on screen) and a hidden `<PDFArtboard>` (in the DOM but display:none on screen).
- When the user prints (Cmd+P / Ctrl+P) or clicks "Descargar PDF", `print.css` `@media print` rules:
  - Hide `.dir-a` (the dark dashboard).
  - Reveal `.pdf-render-host` (the artboard).
  - Hide all interactive buttons.
  - Apply `@page { size: letter; margin: 0.5in; }` for US-letter sizing.
- The user gets a clean monochrome printable layout via the browser's "Save as PDF" option.
- For a direct standalone PDF view, open `pdf.html?lang=es` (or `pdf.html?autoprint=1` to trigger print on load).

## Future direction (NOT in v3.1.0)

- **Tailwind CSS + shadcn/ui migration.** The current implementation is hand-written CSS variables. A future refactor (likely v3.2.0+) will move to Tailwind tokens + shadcn primitives without changing the data contract.
- **Server-side PDF rendering.** Browser print covers v3.1.0. A future Playwright/Puppeteer or weasyprint pipeline would generate the PDF on the API server, attach it to the audit response, and skip the browser print step. That belongs in the API repo.
- **Print-quality charts.** The current PDF artboard is tabular. A future iteration could embed compact SVG versions of the gauge and donut for a richer printed view.
- **Download buttons.** The current "Resume my journey" button is a placeholder; future versions wire it to a `/next-step` invocation back in Cowork.

## Tech stack (current)

- **React 18.3.1** via unpkg CDN — vanilla, no build step.
- **Babel-standalone 7.29** for in-browser JSX transpilation.
- **Plus Jakarta Sans** via Google Fonts (300-800 weights).
- **Pure CSS** with CSS variables and `@media print`. No CSS framework yet.
- **SVG inline** for gauges, donuts, dots; SVG files for the 3 bureau logos.

The first paint cost (~500ms for Babel transpilation) is acceptable because the consumer opens the dashboard once per audit, not as a high-traffic application.

## Logo usage

Three SVG files in `dashboard/logos/`: `equifax.svg`, `experian.svg`, `transunion.svg`. Used in the score cards in DirectionA. Heights tuned per bureau (`.bureau-logo-experian` is 30px tall, others are 20-26px) — see `styles.css` `.dir-a .bureau-logo` rules.

If you add new bureau or vendor logos, follow the same convention (single-color SVG sized for height: 20-32px range, opacity 0.95) and update the score-card `<img>` src list.

## Disclaimer copy

The dashboard ships with the canonical educational disclaimer in both languages, in the footer. When generating any new consumer-facing artifact:

- ES: "Este análisis es educativo, no asesoría legal. Para acción legal formal, consulta NACA (consumeradvocates.org) o un abogado de ley del consumidor."
- EN: "This analysis is educational, not legal advice. For formal legal action, consult NACA (consumeradvocates.org) or a consumer-law attorney."

Use this exact wording (or a tightened version) — do not invent variants.
