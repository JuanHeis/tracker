---
phase: 15-projection-engine
plan: 02
subsystem: projection
tags: [typescript, react-hook, useMemo, projection-engine, compound-interest, recharts]

requires:
  - phase: 15-projection-engine
    provides: Pure projection functions (compound-interest, income-projection, patrimony-history, scenario-engine, types)
provides:
  - useProjectionEngine hook returning chart-ready ProjectionDataPoint[] for Recharts
  - Per-investment InvestmentProjection[] with compound interest projections
  - Three-scenario patrimony projections (optimista/base/pesimista) with investment growth layered
  - Flat-line income projection array (PROJ-03)
affects: [16-chart-ui]

tech-stack:
  added: []
  patterns: [orchestrator-hook-pattern, data-as-parameters-not-hooks]

key-files:
  created:
    - hooks/useProjectionEngine.ts
  modified: []

key-decisions:
  - "Hook accepts data as parameters (not calling other hooks internally) for decoupling and testability"
  - "Investment growth computed per-scenario with different rateMultipliers (1.5/1.0/0.5)"
  - "Current month serves as overlap point with both historicalPatrimony and projection values set"

patterns-established:
  - "Orchestrator hook pattern: useMemo-only hook receives data parameters, returns chart-ready arrays"
  - "Scenario investment growth: separate computeInvestmentGrowth calls per scenario with rate multipliers"

requirements-completed: [PROJ-01, PROJ-02, PROJ-03, PROJ-04, PROJ-05]

duration: 3min
completed: 2026-04-03
---

# Phase 15 Plan 02: Projection Engine Hook Summary

**useProjectionEngine orchestrator hook combining historical patrimony, 3-scenario projections with layered investment growth, and income projection into Recharts-ready output**

## Performance

- **Duration:** 3 min
- **Started:** 2026-04-03T15:51:19Z
- **Completed:** 2026-04-03T15:54:30Z
- **Tasks:** 1
- **Files created:** 1

## Accomplishments
- Created useProjectionEngine hook as single entry point for all projection data
- Hook combines historical patrimony reconstruction + 3 future scenarios with per-scenario investment growth
- Returns chart-ready ProjectionDataPoint[] directly consumable by Recharts ComposedChart
- Pure useMemo computation with no useState or localStorage writes (INFRA-03 maintained)

## Task Commits

Each task was committed atomically:

1. **Task 1: Create useProjectionEngine hook** - `0228cd8` (feat)

## Files Created/Modified
- `hooks/useProjectionEngine.ts` - Orchestrator hook: accepts monthlyData, salaryEntries, recurringExpenses, globalUsdRate as params; returns patrimonyData, investmentProjections, incomeProjection, projectedPatrimony, currentMonthIndex, horizonMonths

## Decisions Made
- Hook receives data as parameters rather than calling useMoneyTracker/useSalaryHistory internally -- keeps hook testable and decoupled from data layer
- Investment growth is computed separately for each scenario (optimista uses 1.5x rates, pesimista 0.5x) and layered on top of savings-based scenario projections
- Current month acts as overlap point where both historicalPatrimony and all three projection values are set, enabling smooth line continuity in Recharts
- Month labels formatted in Spanish using date-fns es locale with capitalized first letter

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- useProjectionEngine hook ready for Phase 16 chart UI integration
- Hook output directly consumable by Recharts ComposedChart (array of objects with named keys)
- All projection types exported from lib/projection/types.ts for chart component typing

## Self-Check: PASSED

- [x] hooks/useProjectionEngine.ts exists
- [x] Commit 0228cd8 exists
- [x] 15-02-SUMMARY.md exists

---
*Phase: 15-projection-engine*
*Completed: 2026-04-03*
