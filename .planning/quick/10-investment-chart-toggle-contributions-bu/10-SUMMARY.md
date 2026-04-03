---
phase: quick-10
plan: 10
subsystem: charts
tags: [investment-chart, projections, contributions, ui-controls]
key-files:
  created: []
  modified:
    - components/charts-container.tsx
    - components/charts/investment-chart.tsx
decisions:
  - Color mapping uses allTypeEntries (not filtered) so colors stay consistent when toggling types
metrics:
  duration: ~2min
  completed: "2026-04-03"
  tasks_completed: 2
  tasks_total: 2
---

# Quick Task 10: Investment Chart Toggle Contributions Summary

Three interactive controls added to InvestmentChart: contributions toggle, no-contributions warning, and per-type visibility toggles.

## Completed Tasks

| # | Task | Commit | Key Changes |
|---|------|--------|-------------|
| 1 | Add includeContributions state to ChartsContainer | 865c1fb | State + toggle handler + props passed to InvestmentChart |
| 2 | Contributions toggle, warning, type visibility in InvestmentChart | 9e7236a | Button toggle, AlertTriangle warning, per-type filter buttons |

## Changes Made

### components/charts-container.tsx
- Added `includeContributions` state (default false)
- Passed `includeContributions` to `useProjectionEngine` options
- Passed `includeContributions`, `onToggleContributions`, and filtered active non-liquid `investments` to InvestmentChart

### components/charts/investment-chart.tsx
- Extended `InvestmentChartProps` with `includeContributions`, `onToggleContributions`, `investments`
- **Contributions toggle**: Button in header shows "Con aportes" (variant=default) or "Sin aportes" (variant=outline)
- **No-contributions warning**: Amber banner with AlertTriangle icon when contributions enabled but no investments have non-initial aporte movements
- **Type visibility toggles**: Per-type buttons with chart color dots; clicking hides/shows that type's area in the chart
- **Empty filter state**: Shows "Selecciona al menos un tipo de inversion" when all types hidden
- Color mapping built from all types (not just filtered) to keep colors consistent

## Deviations from Plan

None - plan executed exactly as written.

## Verification

- TypeScript: `npx tsc --noEmit` passes with zero errors
- Build: `npx next build` succeeds
- All three features implemented per spec

## Self-Check: PASSED
