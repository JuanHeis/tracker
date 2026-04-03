---
phase: 14-recharts-upgrade-chart-infrastructure
plan: 01
subsystem: infra
tags: [recharts, charts, upgrade, shadcn, typescript]

# Dependency graph
requires: []
provides:
  - "Recharts 3.x dependency (^3.8.1) in package.json"
  - "Clean chart imports (no unused ResponsiveContainer/Tooltip)"
  - "Recharts 3.x compatible chart.tsx type definitions"
affects: [14-02, 15-projection-engine, 16-chart-ui]

# Tech tracking
tech-stack:
  added: ["recharts@3.8.1 (upgraded from 2.13.3)"]
  patterns: ["Partial<TooltipContentProps> for shadcn chart wrapper compatibility with Recharts 3.x"]

key-files:
  created: []
  modified:
    - package.json
    - package-lock.json
    - components/charts/salary-by-month.tsx
    - components/charts/expenses-by-month.tsx
    - components/ui/chart.tsx

key-decisions:
  - "Used Partial<TooltipContentProps> instead of ComponentProps<Tooltip> for chart.tsx — Recharts 3.x omits payload/active from Tooltip props"
  - "Inlined LegendPayload[] type instead of Pick<LegendProps> — Recharts 3.x removed payload/verticalAlign from Legend Props"

patterns-established:
  - "Recharts 3.x tooltip formatter value can be undefined — always use (value ?? 0) guard"
  - "chart.tsx uses TooltipContentProps from recharts for content component typing"

requirements-completed: [INFRA-01, INFRA-03]

# Metrics
duration: 5min
completed: 2026-04-03
---

# Phase 14 Plan 01: Recharts Upgrade Summary

**Recharts upgraded from 2.13.3 to 3.8.1 with Recharts 3.x type compatibility fixes for shadcn chart wrapper and tooltip formatters**

## Performance

- **Duration:** 5 min
- **Started:** 2026-04-03T13:48:27Z
- **Completed:** 2026-04-03T13:53:19Z
- **Tasks:** 1 (auto) + 1 (checkpoint:human-verify)
- **Files modified:** 5

## Accomplishments
- Upgraded recharts from 2.13.3 to 3.8.1 — major version jump
- Removed unused ResponsiveContainer and Tooltip imports from salary-by-month.tsx
- Fixed all Recharts 3.x type incompatibilities in chart.tsx and both chart components
- Build passes with zero errors, zero localStorage interfaces touched (INFRA-03 invariant)

## Task Commits

Each task was committed atomically:

1. **Task 1: Upgrade Recharts to 3.x and clean unused imports** - `31c364c` (feat)

**Plan metadata:** [pending final commit]

## Files Created/Modified
- `package.json` - Recharts dependency upgraded to ^3.8.1
- `package-lock.json` - Updated lockfile
- `components/charts/salary-by-month.tsx` - Removed unused recharts imports, added value null guard
- `components/charts/expenses-by-month.tsx` - Added value null guard for Recharts 3.x formatter
- `components/ui/chart.tsx` - Updated type definitions for Recharts 3.x compatibility

## Decisions Made
- Used `Partial<TooltipContentProps>` for ChartTooltipContent props — Recharts 3.x moved active/payload/coordinate to context-injected props, so they must be optional when used as JSX element
- Inlined `LegendPayload[]` and `verticalAlign` types instead of `Pick<LegendProps>` — Recharts 3.x explicitly omits these from Legend Props type
- Used `String(item.dataKey ?? index)` for React key — Recharts 3.x dataKey type now includes function

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixed Recharts 3.x type errors in chart.tsx**
- **Found during:** Task 1 (build verification)
- **Issue:** Recharts 3.x changed Tooltip and Legend type exports — payload/active/coordinate removed from Tooltip props, payload/verticalAlign removed from Legend Props, dataKey now includes function type
- **Fix:** Imported TooltipContentProps, used Partial wrapper, inlined Legend types, cast dataKey to string
- **Files modified:** components/ui/chart.tsx
- **Verification:** npm run build succeeds with zero errors
- **Committed in:** 31c364c (Task 1 commit)

**2. [Rule 3 - Blocking] Fixed tooltip formatter value undefined in expenses-by-month.tsx**
- **Found during:** Task 1 (build verification)
- **Issue:** Recharts 3.x formatter callback value parameter can be undefined — TypeScript error on .toLocaleString()
- **Fix:** Added `(value ?? 0)` null guard in both chart components
- **Files modified:** components/charts/expenses-by-month.tsx, components/charts/salary-by-month.tsx
- **Verification:** npm run build succeeds
- **Committed in:** 31c364c (Task 1 commit)

---

**Total deviations:** 2 auto-fixed (2 blocking — Rule 3)
**Impact on plan:** Both fixes were necessary consequences of the Recharts major version upgrade. No scope creep. Plan originally said "Do NOT touch chart.tsx" but Recharts 3.x type changes made it impossible to build without updating types.

## Issues Encountered
- ESLint config warning about "ignores" property in .eslintrc.json — pre-existing issue, not related to this plan, not fixed

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Recharts 3.x is installed and all existing charts compile
- chart.tsx shadcn wrapper confirmed compatible with Recharts 3.x
- Ready for Plan 14-02 (additional chart infrastructure if applicable)
- Ready for Phase 15 (projection engine) and Phase 16 (chart UI)

---
*Phase: 14-recharts-upgrade-chart-infrastructure*
*Completed: 2026-04-03*
