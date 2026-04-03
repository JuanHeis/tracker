---
phase: 16-chart-components
plan: 02
subsystem: ui
tags: [recharts, area-chart, investments, projections, stacked-chart]

requires:
  - phase: 16-01
    provides: PatrimonyChart pattern, ChartControls, ChartDisclaimer, ChartsContainer structure
  - phase: 15-02
    provides: useProjectionEngine with investmentProjections output
provides:
  - InvestmentChart component with stacked areas by investment type
  - ChartsContainer rendering both patrimony and investment projection charts
affects: []

tech-stack:
  added: []
  patterns: [slugified-chart-keys for CSS variable compatibility with space-containing labels]

key-files:
  created: [components/charts/investment-chart.tsx]
  modified: [components/charts-container.tsx]

key-decisions:
  - "Slugified chart config keys (e.g., 'plazo-fijo') to avoid CSS variable issues with spaces, while preserving original names as labels"

patterns-established:
  - "Slug mapping pattern: investment type names with spaces get slugified for Recharts/shadcn CSS variables, label field preserves display name"

requirements-completed: [CHART-02, CHART-05]

duration: 2min
completed: 2026-04-03
---

# Phase 16 Plan 02: Investment Chart Summary

**Stacked area chart showing projected investment growth by type with USD-to-ARS conversion and empty state**

## Performance

- **Duration:** 2 min
- **Started:** 2026-04-03T16:28:51Z
- **Completed:** 2026-04-03T16:31:09Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- InvestmentChart component with stacked areas per investment type (Plazo Fijo, FCI, Crypto, Acciones, Cuenta remunerada)
- USD investments converted to ARS at globalUsdRate for consistent chart display
- Empty state message when no active investments exist
- Both PatrimonyChart and InvestmentChart rendered in ChartsContainer with individual disclaimers

## Task Commits

Each task was committed atomically:

1. **Task 1: Create InvestmentChart with stacked areas by type + empty state** - `2f84b60` (feat)
2. **Task 2: Add InvestmentChart to ChartsContainer** - `cf4ee52` (feat)

## Files Created/Modified
- `components/charts/investment-chart.tsx` - Stacked area chart with buildInvestmentChartData transform, empty state, hydration guard
- `components/charts-container.tsx` - Added InvestmentChart import, rendering with props, second ChartDisclaimer

## Decisions Made
- Used slugified keys (e.g., "plazo-fijo" instead of "Plazo Fijo") for chart config to ensure CSS custom property `--color-{key}` compatibility, since shadcn ChartContainer generates CSS variables from config keys directly

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed Set iteration for downlevelIteration target**
- **Found during:** Task 1
- **Issue:** `[...new Set()]` spread syntax not supported with current TS target config (requires --downlevelIteration)
- **Fix:** Changed to `Array.from(new Set())` which works without the flag
- **Files modified:** components/charts/investment-chart.tsx
- **Committed in:** 2f84b60

**2. [Rule 1 - Bug] Slugified chart config keys for CSS variable compatibility**
- **Found during:** Task 1
- **Issue:** Investment type names contain spaces (e.g., "Plazo Fijo") which produce invalid CSS custom property names `--color-Plazo Fijo`
- **Fix:** Added toSlug() helper to convert type names to lowercase-hyphenated keys, while preserving original names as display labels in chartConfig
- **Files modified:** components/charts/investment-chart.tsx
- **Committed in:** 2f84b60

---

**Total deviations:** 2 auto-fixed (2 bugs)
**Impact on plan:** Both fixes necessary for correct compilation and rendering. No scope creep.

## Issues Encountered
None beyond the auto-fixed items above.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Phase 16 is now complete with both PatrimonyChart and InvestmentChart
- Charts respond to horizon selector and scenario toggles
- Ready for any future chart additions following established patterns

---
*Phase: 16-chart-components*
*Completed: 2026-04-03*
