---
phase: 20-waterfall-chart
plan: 01
subsystem: projection
tags: [waterfall, recharts, tdd, vitest, pure-function]

# Dependency graph
requires:
  - phase: 14-recharts-upgrade
    provides: Recharts 3.x infrastructure and ChartContainer pattern
  - phase: 19-projection-engine-refactor
    provides: Projection engine patterns (pure function + hook + component)
provides:
  - computeWaterfallData pure function with types (WaterfallBar, WaterfallInput, SubcategoryItem)
  - WATERFALL_COLORS constant for consistent chart coloring
  - Comprehensive test suite for waterfall computation
affects: [20-02-waterfall-chart-ui, 21-monthly-flow-panel]

# Tech tracking
tech-stack:
  added: []
  patterns: [TDD pure function with vitest, expense classification by recurringId, subcategory top-5+Otros grouping]

key-files:
  created:
    - lib/projection/waterfall.ts
    - lib/projection/waterfall.test.ts
  modified: []

key-decisions:
  - "Investment movements use raw amount (no USD conversion) since movements lack per-movement usdRate"
  - "Subcategories group same-name items before applying top-5 cutoff"
  - "Libre bar uses min(0,amount)/max(0,amount) for barBottom/barTop to handle negative libre correctly"
  - "Salary excluded from subcategory top-5 logic -- always shown as 'Sueldo' in Ingresos subcategories"

patterns-established:
  - "Waterfall running total: start at Ingresos, subtract each category, remaining is Libre"
  - "Expense classification: recurringId present = Gastos Fijos, absent = Gastos Variables"
  - "SubcategoryItem grouping: aggregate by name, sort descending, top 5 + Otros"

requirements-completed: [FLOW-01, FLOW-02, FLOW-03, FLOW-05]

# Metrics
duration: 3min
completed: 2026-04-11
---

# Phase 20 Plan 01: Waterfall Data Engine Summary

**TDD-built computeWaterfallData() pure function producing 5-bar waterfall structure with expense classification, USD conversion, investment filtering, and subcategory breakdown**

## Performance

- **Duration:** 3 min
- **Started:** 2026-04-11T16:01:12Z
- **Completed:** 2026-04-11T16:04:32Z
- **Tasks:** 2 (TDD RED + GREEN/REFACTOR)
- **Files modified:** 2

## Accomplishments
- Pure function computing 5 waterfall bars (Ingresos, Gastos Fijos, Gastos Variables, Inversiones, Libre) with correct running total arithmetic
- Expense classification by recurringId presence (fixed vs variable) per FLOW-02
- Top 5 subcategory breakdown with "Otros" grouping per FLOW-03
- Per-transaction USD conversion using expense.usdRate per FLOW-05
- Investment movement filtering excluding isInitial wizard entries
- 18 comprehensive unit tests covering all behaviors and edge cases

## Task Commits

Each task was committed atomically:

1. **RED: Failing tests** - `b064424` (test)
2. **GREEN+REFACTOR: Implementation** - `0c00eeb` (feat)

_TDD: tests written first, then implementation to pass all 18 tests, then dead code cleanup._

## Files Created/Modified
- `lib/projection/waterfall.ts` - Pure function with types: computeWaterfallData, WaterfallBar, WaterfallInput, SubcategoryItem, WATERFALL_COLORS
- `lib/projection/waterfall.test.ts` - 18 vitest tests covering: 5-bar structure, running totals, recurringId classification, subcategory top-5+Otros, same-name grouping, USD conversion, investment filtering, isInitial exclusion, empty month, negative libre, date range filtering, extra incomes

## Decisions Made
- Investment movements stored in investment's base currency without per-movement usdRate, so raw amounts are used in waterfall (no conversion applied to investment movements)
- Same-name expenses are aggregated before subcategory ranking (e.g., two "Uber" expenses merge into one subcategory)
- Ingresos subcategories always include "Sueldo" when salary > 0, plus extra incomes grouped by name
- Negative libre (expenses exceed income) renders with barBottom at negative value and barTop at 0

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- computeWaterfallData ready for consumption by useMonthlyFlowData hook (Plan 20-02)
- All types exported for UI component integration
- WATERFALL_COLORS available for chart rendering

## Self-Check: PASSED

- [x] lib/projection/waterfall.ts exists
- [x] lib/projection/waterfall.test.ts exists
- [x] 20-01-SUMMARY.md exists
- [x] Commit b064424 exists (RED)
- [x] Commit 0c00eeb exists (GREEN+REFACTOR)

---
*Phase: 20-waterfall-chart*
*Completed: 2026-04-11*
