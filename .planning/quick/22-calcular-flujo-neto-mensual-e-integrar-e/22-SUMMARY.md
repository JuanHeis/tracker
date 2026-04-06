---
phase: quick-22
plan: 1
subsystem: projection-engine
tags: [simulator, net-flow, projection, historical-data]
dependency_graph:
  requires: [patrimony-history, scenario-engine, simulator]
  provides: [net-flow-calculation, realistic-simulator-projections]
  affects: [simulator-dialog, expense-tracker]
tech_stack:
  added: []
  patterns: [pure-function-module, historical-delta-analysis]
key_files:
  created:
    - lib/projection/net-flow.ts
    - lib/projection/net-flow.test.ts
  modified:
    - components/simulator-dialog.tsx
    - components/expense-tracker.tsx
decisions:
  - "6-month rolling average for net flow smoothing (balances seasonality vs recency)"
  - "Net flow computed externally in expense-tracker, passed as prop to SimulatorDialog (separation of concerns)"
metrics:
  duration: "3min"
  completed: "2026-04-06"
  tasks: 2
  files: 4
---

# Quick Task 22: Calculate Monthly Net Flow and Integrate into Simulator

Pure net-flow functions computing patrimony deltas with 6-month rolling average replacing flat salary-minus-expenses estimate in simulator projections.

## Task Summary

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Net flow calculation functions (TDD) | cc8704b | net-flow.ts, net-flow.test.ts |
| 2 | Integrate into simulator projection | 58b97c8 | simulator-dialog.tsx, expense-tracker.tsx |

## What Changed

### Task 1: Net Flow Calculation Functions
- Created `calculateMonthlyNetFlow`: computes per-month patrimony deltas from historical points
- Created `averageMonthlyNetFlow`: arithmetic mean of last N months, rounded to integer
- 11 unit tests covering empty input, single point, negative flows, lastN slicing, rounding

### Task 2: Simulator Integration
- Replaced `estimateMonthlyNetSavings(salary, recurringExpenses, usdRate)` with real historical average
- Added `reconstructHistoricalPatrimony` + `calculateMonthlyNetFlow` + `averageMonthlyNetFlow(flows, 6)` computation in expense-tracker.tsx
- Removed `currentSalary` and `recurringExpenses` props from SimulatorDialog (no longer needed)
- Added monthly net flow display in dialog header with green/red color coding
- Removed unused `estimateMonthlyNetSavings` import from simulator-dialog.tsx

## Deviations from Plan

None - plan executed exactly as written.

## Verification

- All 21 tests pass (11 net-flow + 10 simulator)
- Build succeeds with no type errors
- Simulator dialog displays "Flujo neto mensual promedio" with correct formatting and color
