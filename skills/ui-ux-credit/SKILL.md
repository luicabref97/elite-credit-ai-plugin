---
description: >
  UI/UX design system + the runtime dashboard template for the Elite Credit AI consumer
  audit. Activates when generating or designing credit-report visualizations, score
  displays, anomaly cards, action timelines, or any consumer-facing audit artifact.
  The consumer deliverable is ONE self-contained HTML file (`dashboard-artifact.html`
  template: vanilla JS, bilingual ES/EN, animations, dedicated print-PDF layout) that the
  ORCHESTRATOR populates with the consumer's audit data and emits as an inline artifact.
  Brand: Plus Jakarta Sans, dark navy / gold / green / red palette.

  Use when user mentions: "dashboard", "consumer report", "audit visualization",
  "credit UI", "score gauge", "factor chart", "anomaly card", "PDF report",
  "design", "frontend", "diseño", "tablero", "reporte visual".
---

# UI/UX Credit — Design System + Runtime Dashboard Template

This skill is three things:

1. **Documentation** — the canonical brand system (colors, typography, spacing) and component patterns for everything Elite Credit AI shows the consumer.
2. **Runtime template** — `dashboard-artifact.html`: a single self-contained HTML file (vanilla JS, no React/Babel/build step, zero external deps beyond Google Fonts) that IS the consumer deliverable. The pipeline populates its data block and emits it. Hardened by a full /design-review pass (21 findings fixed: a11y, AA contrast, responsive 375px, reduced-motion, print correctness).
3. **Design-time reference** — `dashboard/` (React 18 + Babel, multi-file): where the design is iterated visually. It is NEVER shipped to consumers.

If you are an agent generating consumer-facing visuals, **always defer to this skill** rather than improvising layouts or colors.

## Where things live

```
skills/ui-ux-credit/
├── dashboard-artifact.html   ← THE consumer deliverable template (single file).
│                                Agents read it, swap the AUDIT_DATA block, emit.
└── dashboard/                ← design-time React reference (NOT shipped):
    ├── index.html / design-canvas.jsx / tweaks-panel.jsx  (design canvas)
    ├── direction-a.jsx / pdf-artboard.jsx                 (component source of truth)
    ├── styles.css / styles-extras.css / print.css
    ├── data.js               (sample data + i18n helpers for the canvas)
    └── logos/                (equifax/experian/transunion SVGs)
```

## Runtime playbook — generating the consumer dashboard (FOR AGENTS)

This replaces the old copy-the-folder flow. It is executed by the ORCHESTRATOR inline at the end of the audit (`credit-forensic-analyst` Step 6.5 / `full-pipeline` Step 6.5). Subagents that lack file access must NOT silently skip it — see fallback.

1. **Read the template** `skills/ui-ux-credit/dashboard-artifact.html`.
2. **Build the consumer's `AUDIT_DATA` object** per the data contract below (mapping table + anomaly translation table). Plain-language only — no raw rule_names, no API metadata.
3. **Swap the data block**: replace everything between the markers
   `// ===== AUDIT_DATA START` … `// ===== AUDIT_DATA END =====`
   with `const AUDIT_DATA = { …consumer data… };` (keep the marker lines). Touch NOTHING else — helpers, rendering and print code below the END marker are constants.
4. **Write** the result to `output/dashboard.html` (durable copy; in Claude Code this auto-opens the preview panel).
5. **Emit it as an inline artifact**: include the complete populated HTML document in your response so the host (Cowork / claude.ai) renders it as an interactive artifact immediately — this is the moment the consumer actually sees their dashboard, with no file-hunting. This is token-heavy (~25-30K) and worth it; it is the product moment. In Claude Code CLI the written file + preview panel suffice; mention the path instead.
6. **Tell the user** (in their `language`): the dashboard is live; the "Descargar PDF / Imprimir" button inside prints a dedicated report layout (not a screenshot of the page); add `?lang=en` / `?lang=es` to the file URL to switch language (the in-page ES/EN toggle also works).

### Presentation golden rules (v3.5 — apply when building `anomalies[]` and `accounts[]`)

1. **Consolidate by TYPE.** One anomaly card per finding TYPE with every affected account listed in `affected[]` — never one card per instance. Twelve missing-DOFD hits are ONE card with twelve creditors, not twelve cards.
2. **Re-aging absorbs missing-DOFD.** NEVER show a missing-DOFD finding and a re-aging finding as separate cards for the SAME account — "no delinquency date" next to "the delinquency date is wrong" reads as a contradiction. The re-aging card absorbs the angle. The API assembler already applies this server-side (`apply_presentation_coherence`); mirror it whenever assembling cards from raw `audit_report.json`. Same for accounts whose first-delinquency date lives in a remark (`first_delinquency_in_remarks`): "sin fecha de mora" would read as false — drop them from the missing-DOFD card (letters keep the finding).
3. **Original vs collector = ONE linked story.** When the same debt appears as the original creditor's charge-off AND a collector/debt-buyer entry, present them LINKED: the finding is the DOUBLE REPORTING, and the fix is the original showing $0/closed with its sold/transferred indicator. NEVER accuse the original creditor's own entry (`original_creditor_source = "self"`) of being a "duplicate" of itself. Use the linkage display fields (`linked_collector` / `linked_origin`) when present.
4. **Consumer names in dashboards, RAW names in letters.** The dashboard shows understandable creditor names (e.g., "Comenity Bank / Victoria's Secret"); dispute letters ALWAYS use the raw furnisher name exactly as printed on the report (e.g., "CB/VICSCRT") — and only cite `original_creditor` values that were printed on the report (`source = None`), never `self`/`inferred` ones.

### Composing friendly creditor names (v3.5.1 — for `accounts[].creditor`, anomaly `affected[]`, `account_context` keys)

Resolve each display name through this cascade — first hit wins:

1. **`consumer_label` from the plugin's own extraction** (`CreditAccount` / `CollectionRecord`) — the brand alone ("Victoria's Secret", "Midland Credit Management"); the extractor leaves it null when unsure, so never invent one at this stage either.
2. **Seed config `GET /api/config/furnisher_brands`** — match the RAW furnisher (lowercased) against its three maps in order: `abbreviations` (whole-name bank decodes: "bk of amer" → Bank of America), `brands` (brand tokens inside the string: "victori" → Victoria's Secret), `issuers` (private-label banks: "comenity" → Comenity (Bread Financial)). Keys ≤4 chars need word-boundary matching ("att" must never hit "attorney"). Served whitelisted alongside `debt_buyer_names`.
3. **Honest generic** — "{Tipo} — {crudo}" / "{Type} — {raw}". Never a guessed brand.

Compose with a type phrase per language derived from `loan_type` (first) then `account_type` — first substring hit wins, in this exact order (mirrors the API's `_TYPE_PHRASES`; note `unsecured` MUST match before `secured`): creditcard → "Tarjeta de crédito"/"credit card", chargeaccount / charge account → "Tarjeta de tienda"/"store card", automobile/auto → "Préstamo de auto"/"auto loan", lease → "Arrendamiento"/"lease", educational/student → "Préstamo estudiantil"/"student loan", unsecured → "Préstamo personal"/"personal loan", secured → "Tarjeta asegurada"/"secured card", mortgage → "Hipoteca"/"mortgage", collection → "Colección"/"collection", revolving → "Tarjeta de crédito"/"credit card", installment → "Préstamo"/"loan"; fallback "Cuenta"/"account". Then: ES = "{Tipo} {Marca}", EN = "{Brand} {type}".

Notes: the webapp adds a curated `creditor_master` tier (Supabase) ABOVE all of these — the plugin has no access to it, so its cascade starts at `consumer_label`. And golden rule 4 always applies: friendly names in dashboards; the RAW furnisher string is always preserved ("como aparece en tu reporte") and dispute letters ALWAYS use the RAW.

**Verification (matches `credit-forensic-analyst` Step 8 gate):** `output/dashboard.html` exists, AUDIT_DATA contains the consumer's real data (not the Carly sample), and the artifact was emitted (or path communicated in Claude Code).

**Fallback** if the template file cannot be read (sandbox restriction): do NOT fail silently. Deliver `consumer_dashboard.md` as the text fallback, paste the populated `AUDIT_DATA` block in chat, and tell the user the visual dashboard needs an environment with plugin-file access.

## Brand system

### CSS variables (canonical — defined in the template `:root`)

| Token | Hex | Usage |
|-------|-----|-------|
| `--navy` | `#0A1628` | Score-card backgrounds, primary panels |
| `--navy-2` | `#16223a` | Slightly lighter navy for layered cards |
| `--navy-3` | `#1a2438` | Borders on dark cards, inactive chips |
| `--gold` | `#C4A052` | Primary accent, CTAs, flow labels, highlights |
| `--gold-2` | `#CDA52C` | Secondary accent, hover states |
| `--gold-soft` | `#f0e5cc` | Hero greeting text, large numbers |
| `--green` | `#206540` | Success states |
| `--green-soft` | `#5fa87a` | Positive copy, "al día" status |
| `--red` | `#B03642` | Critical anomaly borders, severity HIGH |
| `--red-soft` | `#d97082` | Charge-off / collection indicators |
| `--bg` | `#06090f` | Page background |
| `--bg-2` | `#0c1220` | Inset / well backgrounds |
| `--text` | `#e6dfce` | Body text on dark surfaces |
| `--text-dim` | `#98a0b3` | Secondary copy, captions |
| `--text-faint` | `#7e87a1` | Hint copy (AA-compliant on navy; was #5d6680 pre-review) |

Reference variables (`var(--gold)`) — never hardcode the hex values in new work.

### Typography

- **Font:** Plus Jakarta Sans (300-800), Google Fonts; `svg text` inherits it explicitly.
- **Greeting H1:** `clamp(34px, 4.5vw, 56px)` / 700, tracking −1.5. Section H2 = 22px/600. Card H3 = 14-16px/600.
- **Body:** 13-15px / 400-500, line-height 1.5-1.6. Never letterspace mixed-case text.
- **Numbers:** `font-variant-numeric: tabular-nums` on scores, money, weeks (incl. SVG text).

### Spacing & radius

8px scale (`8/16/24/32/48/56/64`); card padding 24-28px; sections 48px apart. Radius hierarchy: 6px chips · 10-14px cards · 16px hero cards · 20px pills — never one uniform radius.

### Score gauge bands & severity

| Grade | Hex | Range | | Severity | Hex |
|---|---|---|---|---|---|
| EXCELLENT/A | `#5FB97D` | 800-850 | | HIGH | `#B03642` |
| VERY_GOOD/B | `#A8C957` | 740-799 | | MEDIUM | `#C4A052` |
| GOOD/C | `#E8C547` | 670-739 | | LOW | `#5fa87a` |
| FAIR/D | `#E08A3C` | 580-669 | | | |
| POOR/F | `#D24F66` | 300-579 | | | |

## Component inventory (rendered by the template; React source in `dashboard/`)

1. **Hero** — flow chip + date, greeting H1, narrative summary, expected-impact card, three score gauges (semicircle, 5 bands, position dot, count-up animation 1.5s ease-out, delta badge: green "0" first-time, ▲/▼ otherwise).
2. **Factor donut** — 5 annular segments sized by weight (grow-in 1.3s), grade letter + short name per segment (PAGOS/DEUDA/ANTIGÜEDAD/NUEVO/MEZCLA · PAYMENT/OWED/LENGTH/NEW/MIX), click → side panel; the side list is the keyboard path (donut is `aria-hidden`).
3. **Accounts shelf** — master list (scroll-preserved across re-renders) + detail card: per-bureau balances/status, flags, status pill.
4. **Anomalies** — filter chips (Todos/Críticos/Medianos/Menores, `aria-pressed`) + severity-bordered cards: title, plain explanation, affected chips, "Lo que vamos a hacer", citation.
5. **Action plan** — 4 phase columns (this week / 2-3 / 4-8 / 8-18) with action/reason/effort.
6. **Context** — per-creditor interview cards (Cartas/Llamadas/Dificultad/Documentos; "Pendiente" until answered) + "Agregar más contexto".
7. **Footer** — "Reanudar mi journey" (toast tells the consumer exactly what to type back in the conversation — plugin-emitted HTML has no MCP/chat bridge; see Future direction) + ONE "Descargar PDF / Imprimir" + disclaimer.
8. **PDF artboard** (hidden, print-only) — white/monochrome/gold letter layout: brand header, score cards, factor table, accounts table (EQ/EX/TU), numbered issues with colored severity pills, action plan, disclaimer footer.

## Data contract — `AUDIT_DATA`

The template reads one `const AUDIT_DATA = {…}` between the START/END markers. Shape (sample values in the template = real Carly audit):

```js
{
  user: { first_name, last_name, audit_date /*ISO*/, ssn_last4 /*NEVER full SSN*/ },
  routing: { flow /*"A"|"B"|"C"*/, phase_name_es, phase_name_en },
  scores: {
    equifax:    { score, grade /*EXCELLENT|VERY_GOOD|GOOD|FAIR|POOR*/, model /*"VS 3.0"...*/, delta /*int; 0 = first analysis*/ },
    experian:   { … }, transunion: { … }
  },
  factor_grades: [ /* 5, in order: Payment History / Amounts Owed / Length of Credit / New Credit / Credit Mix */
    { factor_es, factor_en, weight_vs, weight_fico, grade /*A-F*/, explanation_es, explanation_en }
  ],
  accounts: [
    { creditor, type_es, type_en, opened, last_activity, limit, monthly, utilization,
      original_creditor /*debt buyers*/, group /*"good"|"attention"|"collections"*/,
      balance: { eq, ex, tu /*null = not reported*/ },
      status_per_bureau: { eq, ex, tu /*see status keys*/ },
      friendly_status_es, friendly_status_en, flags: [ /*see flag keys*/ ] }
  ],
  anomalies: [
    { id, severity /*HIGH|MEDIUM|LOW*/, citation /*statute*/,
      title_es, title_en, explanation_es, explanation_en,
      affected: [creditor…], action_es, action_en }
  ],
  action_plan: {
    total_disputable_items, expected_impact_es, expected_impact_en,
    this_week|weeks_2_3|weeks_4_8|weeks_8_18: [
      { action_es, action_en, reason_es, reason_en, effort /*"30 min" | {es,en}*/ }
    ]
  },
  account_context: { /* keyed by creditor display name; null = interview pending */
    "Creditor ····1234": { letters_received_es/en, calls_es/en, hardship_es/en, docs_es/en } | null
  }
}
```

### Mapping from pipeline outputs

| Source | Maps to | Notes |
|--------|---------|-------|
| `extracted_data.json` → personal_info | `user.*` | ssn_last4 only |
| Memoria → active_flow / phase / language | `routing.*` + emission language | |
| `dashboard_data.json` → scores / factor_grades | `scores.*`, `factor_grades[]` | `delta: 0` without baseline |
| `extracted_data.json` → accounts | `accounts[]` | compute friendly_status, group, flags |
| `audit_report.json` → anomalies | `anomalies[]` | translate rule_name via table below |
| `dispute_strategies.json` → P0-P4 | `action_plan.*` buckets | by priority + timing |
| `account_context.json` | `account_context` | null entries render "Pendiente" |

### Anomaly rule_name → friendly title translation table

Internal identifiers MUST be translated before they reach the dashboard. The 30 most common (ES titles match the API assembler's `_RULE_ES` copy exactly — keep them in sync):

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

### Status keys (`status_per_bureau`)

`Pays as Agreed`, `Closed`, `ChargeOff`, `Collection`, `30 Days Late`, `60 Days Late`, `90 Days Late`, `120 Days Late`, `Deferred`, `Removed`. Unknown statuses pass through with neutral gray.

### Account flags (`flags[]`)

`cross_bureau_mismatch`, `charge_off`, `unvalidated_debt`, `junk_debt_buyer`, `stale_dofd`, `near_obsolescence`, `balance_over_limit`, `high_utilization`, `disputed_late`. Display tags computed heuristically from findings — never raw anomaly identifiers.

## i18n

- Language source: Memoria `language`; the template honors `?lang=en|es` URL param and has an in-page ES/EN toggle (no entrance replay on toggle).
- All helpers (`t()`, `gradeColor()`, `statusLabel()`, `flagLabel()`, …) live inside the template below the END marker — agents never modify them; populate bilingual `*_es`/`*_en` fields in AUDIT_DATA instead.

## Print / PDF behavior (single-file swap pattern)

- The template contains BOTH the dark interactive dashboard AND a hidden `.pdf-render-host` (light/monochrome/gold letter artboard) in one document.
- `@media print` hides the screen sections and reveals ONLY the artboard; `@page { size: letter; margin: .5in }`; `print-color-adjust: exact` keeps severity pills and table bands; `break-inside: avoid` on card-sized blocks only (never page-tall sections); no fake page counters.
- "Descargar PDF / Imprimir" → `window.print()` → the user prints THE DESIGNED REPORT, not a screenshot of the page. Verified end-to-end via Chromium print pipeline (4-page letter PDF).

## Accessibility & quality bar (locked in by /design-review — preserve when editing the template)

`prefers-reduced-motion` skips animations; global gold `:focus-visible` ring; `aria-pressed` on toggles/chips/list items; gauges `role="img"` with score+grade labels, donut `aria-hidden` (keyboard path = side list); 44px touch targets under `(pointer:coarse)`; AA contrast for all text tokens; list scroll + focus preserved across re-renders (`data-fid`); no horizontal scroll at 375px; named handlers + toast (never `alert()`, never translated strings inside inline `onclick`).

## Design-mode workflow (for the human designer)

Iterate visually in `dashboard/index.html` (React canvas + tweaks panel; Babel re-transpiles on refresh — no build step). When a design change is approved: **port it to `dashboard-artifact.html`** (the shipped template), then re-run `/design-review` on the template. The React folder is the drawing board; the template is the product.

## Disclaimer copy (exact wording)

- ES: "Este análisis es educativo, no asesoría legal. Para acción legal formal, consulta NACA (consumeradvocates.org) o un abogado de ley del consumidor."
- EN: "This analysis is educational, not legal advice. For formal legal action, consult NACA (consumeradvocates.org) or a consumer-law attorney."

## Future direction

- **Live artifact Nivel 2 — researched 2026-06-12 (see ADR-021 addendum):** Live artifacts DO exist in Cowork and can call remote MCP connectors (`elite-credit-api` on Railway qualifies), BUT there is no API for a plugin/orchestrator to emit one — HTML written to outputs or emitted inline renders in a sandboxed preview with NO MCP/chat bridge. Two distinct upgrades when the platform allows:
  - *Data actions* (what callMcpTool actually enables): refresh scores / re-query RAG on open — still requires the API to persist per-user audits (backend work).
  - *Conversation actions* ("Reanudar journey", "Agregar contexto") are NOT MCP calls — no artifact mechanism delivers them; the type-this toast is the permanent pattern for those unless Anthropic ships a chat bridge.
  - *Cheap experiment per prueba:* in Cowork, ask Claude directly to "crear un live artifact desde outputs/dashboard.html con el conector elite-credit-api" — user-initiated artifact creation may get the bridge even though plugin emission can't.
- **Server-side PDF** (API repo) to attach the report to audit responses without the browser print step.
- **Tailwind/shadcn migration** of the template without changing the data contract.
