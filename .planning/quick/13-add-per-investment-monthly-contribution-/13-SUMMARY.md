---
phase: quick-13
plan: 01
subsystem: investments-projection
tags: [projection, investments, contributions, ui]
dependency_graph:
  requires: [useProjectionEngine, projectInvestment, InvestmentChart]
  provides: [per-investment-contribution-overrides]
  affects: [projection-curves, investment-basis-info]
tech_stack:
  added: []
  patterns: [contribution-override-record, inline-editable-input]
key_files:
  created: []
  modified:
    - lib/projection/compound-interest.ts
    - hooks/useProjectionEngine.ts
    - components/charts-container.tsx
    - components/charts/investment-chart.tsx
    - components/charts/investment-basis-info.tsx
decisions:
  - contributionOverride as optional param (undefined = auto-detect fallback)
  - Record<string, number> keyed by investmentId for overrides state
  - Clear overrides when toggling contributions OFF
metrics:
  duration: ~3min
  completed: "2026-04-03"
---

# Quick Task 13: Per-Investment Monthly Contribution Override

Per-investment editable contribution inputs in basis info section, reactive projection recalculation via override Record threaded through the engine.

## Task Completion

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Thread contribution overrides through projection engine | f6f64f8 | compound-interest.ts, useProjectionEngine.ts, charts-container.tsx |
| 2 | Add editable contribution inputs in investment basis info | b471b6f | investment-chart.tsx, investment-basis-info.tsx |

## Changes Made

### Task 1: Thread contribution overrides through projection engine

- Added optional `contributionOverride?: number` parameter to `projectInvestment()` -- when provided and `includeContributions` is true, uses override instead of auto-detecting from movements
- Added `contributionOverrides?: Record<string, number>` to `useProjectionEngine` options, threaded through all 3 scenario calls to `computeInvestmentGrowth`
- Added `contributionOverrides` state in `ChartsContainer` with setter callback, passed to engine options
- Overrides reset to `{}` when toggling contributions OFF

### Task 2: Add editable contribution inputs in investment basis info

- Extended `InvestmentChartProps` with `contributionOverrides` and `onContributionOverrideChange` callback
- Extended `InvestmentBasisInfoProps` with `includeContributions`, `contributionOverrides`, and callback
- Added inline number input per investment row showing "Aporte mensual: [symbol] [input]" when contributions enabled
- Input defaults to auto-detected `monthlyContribution` from projection, overridden when user edits
- Empty input treated as 0
- Inputs hidden when "Sin aportes" is active

## Deviations from Plan

None -- plan executed exactly as written.

## Verification

- TypeScript compiles with no errors (`npx tsc --noEmit`)
- Next.js build succeeds (`npx next build`)

## Self-Check: PASSED
