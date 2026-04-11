---
phase: 21-monthly-flow-panel-assembly
plan: 01
subsystem: monthly-flow-panel
tags: [component, panel, projection, simulation, recharts]
dependency_graph:
  requires:
    - components/charts/waterfall-chart.tsx
    - components/savings-rate-selector.tsx
    - lib/projection/scenario-engine.ts
    - lib/projection/waterfall.ts
    - lib/projection/savings-rate.ts
    - lib/projection/types.ts
  provides:
    - components/charts/mini-projection-chart.tsx
    - components/monthly-flow-panel.tsx
  affects: []
tech_stack:
  added: []
  patterns:
    - ChartContainer + ComposedChart + Line for compact projection chart
    - Props-only panel composing multiple child components
    - Ephemeral useState for inline simulation
    - useMemo for derived adjusted data
key_files:
  created:
    - components/charts/mini-projection-chart.tsx
    - components/monthly-flow-panel.tsx
  modified: []
decisions:
  - "MiniProjectionChart uses no Card wrapper -- parent panel wraps in Card"
  - "Waterfall Libre adjustment uses barBottom=min(0,amount), barTop=max(0,amount) to handle negative values"
  - "Projection adjustment recomputes full scenarios via projectPatrimonyScenarios"
  - "formatArs uses same Intl.NumberFormat pattern as savings-rate-selector.tsx"
metrics:
  duration: "3m 26s"
  completed: "2026-04-11T22:13:09Z"
  tasks_completed: 2
  tasks_total: 2
  files_created: 2
  files_modified: 0
---

# Phase 21 Plan 01: Monthly Flow Panel Assembly Summary

MiniProjectionChart (compact 3-scenario patrimony line chart) and MonthlyFlowPanel (props-only vertical stack composing waterfall, savings rate, mini-projection, and inline simulation with ephemeral state)

## Task Results

### Task 1: Create MiniProjectionChart component
- **Commit:** cf9c5b1
- **Files created:** components/charts/mini-projection-chart.tsx
- **Details:** Compact 150px height LineChart rendering optimista/base/pesimista scenario lines using ChartContainer + ComposedChart. Hidden XAxis/YAxis for minimal display. Dashed lines for optimista and pesimista, solid for base. Projected patrimony values displayed as legend below chart. Hydration guard with skeleton placeholder.

### Task 2: Create MonthlyFlowPanel shell component
- **Commit:** 4ca854e
- **Files created:** components/monthly-flow-panel.tsx
- **Details:** Props-only panel composing 4 sections in vertical stack: WaterfallChart, SavingsRateSelector, MiniProjectionChart (in Card), and inline simulation input (in Card). Ephemeral simulatedAmount via useState. Two useMemo computations: adjustedWaterfallData subtracts simulated amount from Libre bar, adjustedProjectionData recomputes 12-month scenarios with reduced savings. Impact text shows "Libre baja de $X a $Y" when simulation is active.

## Deviations from Plan

None -- plan executed exactly as written.

## Verification Results

1. `npx tsc --noEmit` -- PASS (no errors)
2. Both files export their named components -- PASS
3. MonthlyFlowPanel does not import any data hooks -- PASS

## Self-Check: PASSED

- [x] components/charts/mini-projection-chart.tsx exists
- [x] components/monthly-flow-panel.tsx exists
- [x] Commit cf9c5b1 exists
- [x] Commit 4ca854e exists
