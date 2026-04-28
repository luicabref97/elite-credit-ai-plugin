---
description: Start your credit-repair journey with intelligent routing into Flow A/B/C
---

Start a fresh credit-repair journey. The agent will analyze your situation (score, negatives, goals) and route you into the correct flow at the correct phase, with realistic timing and concrete next actions.

## Prerequisites

- You have at least 1 credit report uploaded (you can get all 3 free at annualcreditreport.com — weekly per FACTA).
- You have an idea of your goal (improve credit for mortgage / auto / business / general / just maintain). If you don't, the agent will help clarify.

## Execution

Spawn the `flow-router` agent. It will:

1. **Recover any existing journey** from Cowork Project Memoria. If you've been here before, it will hand off to `phase-tracker` instead — your progress is preserved across sessions.
2. **Run the Entry Decision Tree** from the Master Agent Flow Guide (questions about reports, score, negatives, goal).
3. **Run a Layer 2 audit** of your reports (97 FCRA / FDCPA / Reg F / Metro2 rules — the deterministic engine that detects anomalies).
4. **Decide your routing**: Flow A (Repair) / Flow B (Optimization) / Flow C (Maintenance), with a specific phase number.
5. **Search the legal RAG** (557 chunks) for the relevant phase guidance.
6. **Save your routing to Memoria** so subsequent sessions know where you are.
7. **Communicate the plan**: phase name, realistic duration (weeks), specific first actions, expected score impact ranges.

## After Completion

You'll receive:

- Your initial diagnosis (score, anomalies detected, state, goal)
- Your assigned flow + phase with realistic timeline
- A concrete list of first actions (3-5 items) with vault template references
- An offer to start the first action immediately

## Continuation

To check in on your journey later (or from a new device — Cowork Project Memoria is server-side and persistent), use `/next-step` instead. It will pick up exactly where you left off.

If your situation changes mid-journey (new identity theft, score drop, completed a goal), the system will detect it and recommend re-routing.

## Notes

- This command is the entry point for new users. If you're returning, `/next-step` is faster.
- Cowork Project's `Programado` (scheduled tasks) feature can automate check-ins so you don't have to remember to come back.
- Educational only — never legal advice. Consult NACA (consumeradvocates.org) for consumer-attorney referrals.
