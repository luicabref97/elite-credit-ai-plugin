---
description: >
  UI/UX design intelligence specialized for credit analysis dashboards. Applies Elite Credit AI
  brand system (Navy #0A1628, Gold #C4A052, Green #206540, Red #B03642) with premium dark design.
  Activates when designing credit UI components, dashboards, score displays, or report pages.
  Use when user mentions "dashboard", "UI", "design", "component", "frontend", "credit page".
---

# UI/UX Credit Design System

Design guidelines for the Elite Credit AI frontend using the official brand system.

## Brand Colors

| Name | Hex | Usage |
|------|-----|-------|
| Navy | #0A1628 | Primary backgrounds, headers |
| Gold | #C4A052 | Primary accent, CTAs, highlights |
| Iso Gold | #CDA52C | Secondary accent, hover states |
| Green | #206540 | Success states, positive indicators |
| Red | #B03642 | Error states, critical alerts, negative items |
| BG Dark | #06090f | Page background |

## Typography
- Font: Plus Jakarta Sans
- Headings: 600-700 weight
- Body: 400-500 weight

## Component Patterns

### Score Gauge
- Circular gauge with gradient (Red → Gold → Green)
- Score number centered, large
- Grade label below (EXCELLENT, VERY_GOOD, etc.)
- Bureau name above

### Factor Donut
- Donut chart showing factor weight
- Grade letter (A-F) centered
- Factor name and weight % below
- Color coded by grade

### Account Card
- Dark card with subtle border
- Creditor name, account type, status badges
- Per-bureau data in columns
- Payment history grid (color-coded months)
- Expandable for full details

### Anomaly Alert
- Severity-coded border (Red=HIGH, Gold=MEDIUM, Green=LOW)
- Rule name, description, legal citation
- Affected account reference
- Suggested action button

## Tech Stack
- React 18, Vite, Tailwind CSS
- shadcn/ui components
- Plus Jakarta Sans via Google Fonts
- Premium dark mode design

## Logo Assets
- SVG isotipos should be placed in the project's `public/brand/` directory
