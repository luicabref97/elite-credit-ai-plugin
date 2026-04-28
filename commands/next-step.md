---
description: Get your next recommended action based on current journey phase and pending disputes
---

Find out what to do next in your credit-repair journey. Picks up wherever you left off in your last Cowork session.

## Prerequisites

- You've already run `/start-journey` at least once (this populates Cowork Project Memoria with your routing).
- If you have pending disputes (Round 1, Round 2, Round 3, validation letters, etc.), the agent will know based on `dispute_history` in Memoria.

## Execution

Spawn the `phase-tracker` agent. It will:

1. **Recover state** from Cowork Project Memoria — your active flow, current phase, baseline scores, dispute history, transitions.
2. **Compute time elapsed** since your last action. If you sent Round 1 letters 32 days ago, Round 2 may be due.
3. **Check for transition triggers**:
   - Score sustained > 670 → consider transitioning to Flow B
   - HIGH anomalies eliminated > 70% → consider Flow A Phase 4 (rebuild)
   - New HIGH anomaly detected → regression to Flow A Phase 2 sub-flow
   - Identity theft signals → URGENT path (FCRA 605B 4 BDays)
4. **Search the Master Agent Flow Guide** for the chunk specific to your current phase and situation.
5. **Recommend a single concrete action** with template / vault reference and estimated impact.
6. **Update Memoria** after you confirm and execute the action.
7. **Schedule follow-up** via Cowork Programado for the relevant date (e.g., 30 days after Round 2 sent).

## After Completion

You'll receive:

```
📍 Donde estamos: Flow A — Phase 2 (Targeted Disputing)
⏰ Lo que vence hoy: Round 2 a Equifax (Round 1 enviado hace 32 dias)
🎯 Recomendacion: Generar Round 2 con Method-of-Verification challenge
📊 Progreso: Score baseline 615 → estimado actual 632 (+17 puntos)
```

Plus a concrete next-action prompt.

## Continuation Across Sessions

Cowork Project Memoria persists everything. You can:

- Close the chat and return weeks later → `/next-step` knows exactly where you are.
- Use a different device (mobile, desktop) → state is server-side, no sync issue.
- Have multiple journeys running (e.g., your credit + your spouse's) → use separate Cowork Projects per consumer.

The Cowork `Programado` feature can auto-trigger `phase-tracker` on scheduled dates (e.g., "alert me when 30 days pass since Round 1") so you don't have to remember.

## When `/next-step` does NOT apply

- You haven't run `/start-journey` yet → run it first.
- Your situation has fundamentally changed (job loss, bankruptcy, identity theft) → run `/start-journey` again to re-route.
- You want to learn about credit (not action-oriented) → use `/credit-qa` instead.

## Notes

- Educational only — never legal advice. Consult NACA (consumeradvocates.org) for legal action.
- The agent will NEVER push you to send Round 2 before the 30-day waiting period — that would get rejected as duplicative.
