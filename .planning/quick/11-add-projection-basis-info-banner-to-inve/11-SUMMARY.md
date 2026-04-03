---
phase: quick-11
plan: 01
subsystem: charts
tags: [investment-chart, disclosure, projection-basis]
dependency_graph:
  requires: [InvestmentProjection, Investment]
  provides: [InvestmentBasisInfo component]
  affects: [investment-chart.tsx]
tech_stack:
  added: []
  patterns: [informational-disclosure, amber-warning-badge]
key_files:
  created:
    - components/charts/investment-basis-info.tsx
  modified:
    - components/charts/investment-chart.tsx
decisions:
  - "Date formatting uses es-AR locale with toLocaleDateString for consistency"
  - "Plazo Fijo shows TNA label; other types show 'anual' suffix"
metrics:
  duration: ~2min
  completed: "2026-04-03"
---

# Quick Task 11: Add Projection Basis Info Banner to Investment Chart

Transparent disclosure section below investment chart showing each projection's basis: current value, annual rate, and whether the value was ever updated.

## Task Summary

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Create InvestmentBasisInfo component | a1c5985 | components/charts/investment-basis-info.tsx |
| 2 | Wire InvestmentBasisInfo into InvestmentChart | 3e3c76a | components/charts/investment-chart.tsx |

## What Was Built

- **InvestmentBasisInfo** component displays a compact row per visible investment projection:
  - Investment name, current value (with ARS/USD currency), annual rate percentage
  - "Valor original - nunca actualizado" amber warning for investments with no non-initial movements and lastUpdated === createdAt
  - "Actualizado: {date}" for investments that have been updated
- Component renders below the chart area, respects type visibility toggles
- Returns null when projections array is empty; hidden alongside "Selecciona al menos un tipo" empty state

## Deviations from Plan

None - plan executed exactly as written.

## Verification

- TypeScript: clean (no errors)
- Build: passes successfully
