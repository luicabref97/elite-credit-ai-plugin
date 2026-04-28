---
description: Generate personalized FCRA/FDCPA dispute letters from the 17-template catalog using audit findings
---

Generate personalized dispute letters for all anomalies detected in the v3 forensic audit (97-rule output) by selecting from the **17 vault letter templates**.

## Prerequisites

- `output/audit_report.json` must exist
- `output/dispute_strategies.json` must exist
- `output/extracted_data.json` must exist

Optional (improves letter quality when available):

- `output/other_bureau_reports.json` — needed for cross-bureau letters
- `output/previous_report_data.json` — attach when disputing temporal anomalies (re-aging, reinsertion)
- `output/dispute_history.json` — used to avoid duplicate disputes within recent windows

If the required files are missing, run `/analyze` first.

## Execution

Spawn the `dispute-letter-generator` agent to:

1. Load audit results, dispute strategies, and personal info
2. Group anomalies by dispute type:
   - BUREAU_DISPUTE — paired with parallel CFPB filing from Round 1 (operational policy)
   - DIRECT_TO_FURNISHER — same CFPB case as the paired bureau dispute
   - DEBT_VALIDATION (FDCPA §1692g) — separate CFPB case targeting the collector if it ignores validation
   - METHOD_OF_VERIFICATION (after Round 1 "verified") — UPDATE to existing CFPB case, not new case
   - IDENTITY_THEFT_BLOCK (FCRA 605B — 4 BDays) — NO CFPB at this step (block first)
   - GOODWILL — NO CFPB pair (would destroy goodwill relationship)
   - CEASE_AND_DESIST (FDCPA §1692c(c))
   - CFPB_SUPERVISOR_REVIEW (Round 3 escalation within existing case)
   - STATE_AG_COMPLAINT (true escalation after CFPB record — CA / TX / NY / FL / etc.)
3. For each anomaly, select the best matching template from `vault/templates-cartas/`:
   - `round1-initial-dispute-bureaus.md` (most disputes)
   - `round2-followup-dispute-bureaus.md` (after a "verified" response)
   - `round3-bankruptcy-final.md` (escalation involving bankruptcy)
   - `validate-debt-1.md` / `validate-debt-2.md` / `validacion-deuda-colector.md` (collections)
   - `cuenta-reinsertada.md` / `nuevo-metodo-reinsertadas.md` / `reinsertion-dispute.md` (reinsertion)
   - `medical-collection.md` (medical debt with state ban / NCRA voluntary)
   - `correcting-personal-info.md` (mixed-file / Cortez territory)
   - `dispute-lexisnexis.md` (data-broker / public-record)
   - `congelamiento-bureaus-secundarios.md` (setup phase before primary disputes)
   - `clerk-of-court.md` / `bankruptcy-trustee.md` (bankruptcy / public-record verification)
   - `summons-corte.md` (when consumer was sued by collector)
   - `foreclosure-disputa.md` (foreclosure-related)
4. Generate separate letters for each bureau (never combine)
5. Include in each letter:
   - Consumer personal info (name, address, **SSN last 4 ONLY** — never full SSN)
   - Specific account details and violation
   - Legal citations (FCRA section + Reg F section + relevant case law)
   - Evidence from audit `data_points`
   - 30-day response demand (or 4-business-day for ID theft block)
6. Save letters to `output/letters/` with naming: `{priority}_{bureau}_{creditor}_{type}.md` PLUS `{priority}_cfpb_{creditor}_{anomaly}_complaint.md` for the parallel CFPB filing per BUREAU_DISPUTE
7. Generate `output/letters/README.md` with inventory and mailing instructions including CFPB filing steps
8. Generate `output/dispute_tracking.md` with tracking table (date sent, certified mail #, **CFPB case ID**, expected response 15d CFPB / 30d bureau, follow-up date)

The agent uses the Raiyan framework from the legal RAG's LETTER_FRAMEWORK chunks (DAMAGES → FACTS → PENALTY) to structure each letter.

## After Completion

- Present letter inventory table grouped by priority (P0 / P1 / P2 / P3) — note the CFPB pair for each BUREAU_DISPUTE row
- For cross-bureau anomalies — confirm 3 bureau letters were generated (one per bureau) + ONE umbrella CFPB case for the cross-bureau anomaly
- For temporal anomalies — confirm previous report was attached and CFPB case includes it as evidence
- Walk user through filing the CFPB complaint at consumerfinance.gov/complaint AS THE FIRST STEP, then sending the certified-mail bureau letter that references the CFPB Case ID
- Remind: send bureau letter via certified mail with return receipt — note BOTH the certified mail # AND the CFPB case ID in `dispute_tracking.md`
- Offer staggered mailing strategy for non-cross-bureau (strongest case first)
- Each `suggested_action` from the audit already carried the educational disclaimer prefix; the final letters do not need additional disclaimer wording (they're the consumer's legal communication, not advice).
