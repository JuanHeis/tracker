---
phase: 21-monthly-flow-panel-assembly
plan: 02
subsystem: expense-tracker-orchestrator
tags: [integration, wiring, panel, sidebar, projection]
dependency_graph:
  requires:
    - components/monthly-flow-panel.tsx
    - hooks/useMonthlyFlowData.ts
    - hooks/useProjectionEngine.ts
    - hooks/useSavingsRate.ts
  provides:
    - components/expense-tracker.tsx (MonthlyFlowPanel wired in, ResumenCard removed)
  affects:
    - components/resumen-card.tsx (no longer imported, can be cleaned up)
    - components/savings-rate-selector.tsx (no longer rendered in sidebar)
tech_stack:
  added: []
  patterns:
    - Orchestrator calls hooks then passes data as props to MonthlyFlowPanel
    - useMemo to transform ProjectionDataPoint[] into simplified chart format
    - Two useProjectionEngine calls (one for Charts via ChartsContainer, one for mini-projection in sidebar)
key_files:
  created: []
  modified:
    - components/expense-tracker.tsx
decisions:
  - "MonthlyFlowPanel replaces ResumenCard as first child in sidebar flex column"
  - "useProjectionEngine called with horizonMonths:12 and no contributions for mini-projection"
  - "miniProjectionChartData derived via useMemo filtering null proyeccionBase entries"
  - "useSavingsRate hook call kept at orchestrator level for both MonthlyFlowPanel and SimulatorDialog"
metrics:
  duration: "1m 43s"
  completed: "2026-04-11T22:20:31Z"
  tasks_completed: 1
  tasks_total: 2
  files_created: 0
  files_modified: 1
---

# Phase 21 Plan 02: Wire MonthlyFlowPanel into Expense Tracker Summary

MonthlyFlowPanel wired into expense-tracker.tsx sidebar replacing ResumenCard, with useMonthlyFlowData for waterfall and useProjectionEngine (12-month horizon) for mini-projection data

## Task Results

### Task 1: Wire MonthlyFlowPanel into expense-tracker.tsx
- **Commit:** ec81c82
- **Files modified:** components/expense-tracker.tsx
- **Details:** Replaced ResumenCard import and JSX with MonthlyFlowPanel. Removed SavingsRateSelector from sidebar (now composed inside MonthlyFlowPanel). Added useMonthlyFlowData hook call passing expenses, investments, salary, extraIncomes, selectedMonth, viewMode, payDay. Added useProjectionEngine hook call with 12-month fixed horizon. Added useMemo to derive miniProjectionChartData from patrimonyData (filtering nulls, mapping to simplified format). All existing hooks (useSavingsRate, useMoneyTracker, useDataPersistence) and components (PatrimonioCard, ExchangeSummary, SimulatorDialog) remain intact.

### Task 2: Verify MonthlyFlowPanel integration (checkpoint:human-verify)
- **Status:** Checkpoint pending -- awaiting human verification
- **Details:** Visual and functional verification of MonthlyFlowPanel in sidebar. Requires running dev server and checking: waterfall chart, savings rate selector inside panel, mini-projection chart, inline simulation input, real-time updates on savings rate change, ephemeral simulation reset on refresh.

## Deviations from Plan

None -- plan executed exactly as written.

## Verification Results

1. `npx tsc --noEmit` -- PASS (no errors, zero output)
2. No `import.*ResumenCard` in expense-tracker.tsx -- PASS
3. No `<ResumenCard` JSX in expense-tracker.tsx -- PASS
4. No `<SavingsRateSelector` JSX in sidebar -- PASS
5. `import { MonthlyFlowPanel }` present -- PASS
6. `import { useMonthlyFlowData }` present -- PASS
7. `import { useProjectionEngine }` present -- PASS
8. `<MonthlyFlowPanel` with all required props present -- PASS
9. `useMonthlyFlowData(` hook call present -- PASS
10. `useProjectionEngine(` with `horizonMonths: 12` present -- PASS
11. `useSavingsRate(` still present -- PASS
12. `<PatrimonioCard` and `<ExchangeSummary` in sidebar -- PASS
13. `<SimulatorDialog` with `monthlyNetFlow={savingsRate.estimate}` -- PASS

## Self-Check: PASSED

- [x] components/expense-tracker.tsx modified with MonthlyFlowPanel
- [x] Commit ec81c82 exists
- [x] No ResumenCard references remain
- [x] No SavingsRateSelector in sidebar
- [x] All acceptance criteria verified
