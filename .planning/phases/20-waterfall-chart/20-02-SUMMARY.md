---
phase: 20-waterfall-chart
plan: 02
subsystem: ui
tags: [recharts, waterfall, barchart, react, useMemo, tooltip]

# Dependency graph
requires:
  - phase: 20-waterfall-chart/20-01
    provides: computeWaterfallData pure function and WaterfallBar/SubcategoryItem types
provides:
  - WaterfallChart component with range-value [start,end] floating bars
  - WaterfallTooltipContent with ARS-formatted subcategory breakdown
  - useMonthlyFlowData hook wrapping computeWaterfallData in useMemo
affects: [21-monthly-flow-panel]

# Tech tracking
tech-stack:
  added: []
  patterns: [range-value bar rendering with Cell coloring, custom tooltip content component]

key-files:
  created:
    - components/charts/waterfall-chart.tsx
    - components/charts/waterfall-tooltip.tsx
    - hooks/useMonthlyFlowData.ts
  modified:
    - lib/projection/waterfall.ts

key-decisions:
  - "Used custom interface for tooltip props instead of recharts TooltipProps (type compatibility with content={<Element />} pattern)"
  - "Fixed pre-existing Map iteration TS error in waterfall.ts using forEach instead of for..of (downlevelIteration not enabled)"

patterns-established:
  - "Range-value bar rendering: dataKey accepts (d) => [d.barBottom, d.barTop] for floating waterfall bars"
  - "Per-bar coloring: Cell children inside Bar with fill from data entry"
  - "Custom tooltip as separate file: non-trivial tooltip rendering in its own component file"

requirements-completed: [FLOW-01, FLOW-03, FLOW-04]

# Metrics
duration: 3min
completed: 2026-04-11
---

# Phase 20 Plan 02: Waterfall Chart UI Summary

**WaterfallChart component with range-value floating bars, custom ARS-formatted tooltip with subcategory breakdown, and useMonthlyFlowData useMemo hook**

## Performance

- **Duration:** 3 min
- **Started:** 2026-04-11T16:08:10Z
- **Completed:** 2026-04-11T16:11:32Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- WaterfallChart renders Recharts BarChart with range-value [start, end] pattern for floating waterfall bars
- Each bar gets distinct semantic color via Cell components (green ingresos, red fijos, orange variables, blue inversiones, emerald libre)
- Custom tooltip shows segment name, ARS-formatted total, and top-5 subcategory breakdown
- useMonthlyFlowData hook wraps computeWaterfallData in useMemo with 7-parameter dependency array for reactive updates
- All components follow INFRA-02 pattern: "use client" + useHydration + ChartContainer
- WaterfallChart is props-only (receives WaterfallBar[] data), ready for Phase 21 MonthlyFlowPanel consumption

## Task Commits

Each task was committed atomically:

1. **Task 1: Create WaterfallTooltipContent and WaterfallChart component** - `c60e024` (feat)
2. **Task 2: Create useMonthlyFlowData hook** - `846686e` (feat)

## Files Created/Modified
- `components/charts/waterfall-tooltip.tsx` - Custom tooltip with ARS formatting and subcategory breakdown
- `components/charts/waterfall-chart.tsx` - WaterfallChart with range-value bars, per-bar Cell coloring, hydration guard
- `hooks/useMonthlyFlowData.ts` - Thin useMemo hook wrapping computeWaterfallData
- `lib/projection/waterfall.ts` - Fixed pre-existing Map iteration TS error (forEach instead of for..of)

## Decisions Made
- Used custom interface `WaterfallTooltipProps` instead of recharts `TooltipProps` generic -- the `TooltipProps` type omits `payload` from its direct properties (it's in `PropertiesReadFromContext`), causing TS errors. Custom interface with `payload?: Array<{ payload: WaterfallBar }>` provides correct typing.
- Fixed pre-existing TS2802 error in `waterfall.ts` by replacing `for (const [name, amount] of extraMap)` with `extraMap.forEach()` -- necessary because project tsconfig doesn't enable `downlevelIteration`.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixed Map iteration TS error in waterfall.ts**
- **Found during:** Task 1 verification (npx tsc --noEmit)
- **Issue:** Pre-existing TS2802 error on line 273 of waterfall.ts -- Map can only be iterated with downlevelIteration flag
- **Fix:** Changed `for (const [name, amount] of extraMap)` to `extraMap.forEach((amount, name) => ...)`
- **Files modified:** lib/projection/waterfall.ts
- **Verification:** npx tsc --noEmit exits 0, all 18 waterfall tests pass
- **Committed in:** c60e024 (Task 1 commit)

**2. [Rule 3 - Blocking] Used custom tooltip props interface instead of recharts TooltipProps**
- **Found during:** Task 1 verification (npx tsc --noEmit)
- **Issue:** recharts TooltipProps<number, string> does not expose `payload` as a direct property (it's in PropertiesReadFromContext omitted set)
- **Fix:** Defined local `WaterfallTooltipProps` interface with correctly typed payload
- **Files modified:** components/charts/waterfall-tooltip.tsx
- **Verification:** npx tsc --noEmit exits 0
- **Committed in:** c60e024 (Task 1 commit)

---

**Total deviations:** 2 auto-fixed (2 blocking)
**Impact on plan:** Both fixes necessary for TypeScript compilation. No scope creep.

## Issues Encountered
None beyond the auto-fixed deviations above.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- WaterfallChart, WaterfallTooltipContent, and useMonthlyFlowData are all exported and ready for Phase 21 MonthlyFlowPanel integration
- WaterfallChart accepts WaterfallBar[] as `data` prop (props-only pattern for tab mobility)
- useMonthlyFlowData returns WaterfallBar[] matching the WaterfallChart data prop type

## Self-Check: PASSED

All files verified present. All commit hashes verified in git log.

---
*Phase: 20-waterfall-chart*
*Completed: 2026-04-11*
