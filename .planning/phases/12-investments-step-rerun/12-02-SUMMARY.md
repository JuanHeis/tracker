---
phase: 12-investments-step-rerun
plan: 02
subsystem: ui
tags: [react, localStorage, wizard, reset]

# Dependency graph
requires:
  - phase: 12-01
    provides: "Investments wizard step with STORAGE_KEYS in useDataPersistence"
  - phase: 11-02
    provides: "Setup wizard UI with ConfigCard Herramientas section"
provides:
  - "Re-ejecutar wizard button in ConfigCard for factory reset"
  - "Exported STORAGE_KEYS constant for reuse across components"
affects: [13-manual]

# Tech tracking
tech-stack:
  added: []
  patterns: ["Factory reset via localStorage clear + reload pattern"]

key-files:
  created: []
  modified:
    - components/config-card.tsx
    - hooks/useDataPersistence.ts
    - components/setup-wizard/wizard-step-investments.tsx
    - components/setup-wizard/wizard-step-summary.tsx

key-decisions:
  - "STORAGE_KEYS exported as named const for cross-component reuse"
  - "Reset uses window.confirm for confirmation (consistent with import pattern)"
  - "Destructive styling (text-destructive) signals danger to user"

patterns-established:
  - "Factory reset pattern: clear STORAGE_KEYS + window.location.reload()"

requirements-completed: [WIZ-10]

# Metrics
duration: 3min
completed: 2026-04-02
---

# Phase 12 Plan 02: Re-ejecutar Wizard Summary

**Factory reset button in ConfigCard clears all 7 localStorage keys and relaunches setup wizard**

## Performance

- **Duration:** 3 min
- **Started:** 2026-04-02T23:14:00Z
- **Completed:** 2026-04-02T23:17:00Z
- **Tasks:** 2 (1 auto + 1 checkpoint)
- **Files modified:** 4

## Accomplishments
- Exported STORAGE_KEYS from useDataPersistence for cross-component reuse
- Added "Re-ejecutar wizard" button with RotateCcw icon and destructive styling to ConfigCard Herramientas section
- Confirmation dialog warns about irreversible data loss before clearing
- After clear + reload, wizard first-time detection triggers automatically

## Task Commits

Each task was committed atomically:

1. **Task 1: Export STORAGE_KEYS and add reset button to ConfigCard** - `42b2e1d` (feat)
2. **Task 2: Human verification checkpoint** - approved by user

**Bugfix (outside plan):** `8343a74` - Guard against undefined investments in wizard steps

## Files Created/Modified
- `hooks/useDataPersistence.ts` - Exported STORAGE_KEYS constant
- `components/config-card.tsx` - Added Re-ejecutar wizard button with confirmation dialog
- `components/setup-wizard/wizard-step-investments.tsx` - Guard against undefined investments (bugfix)
- `components/setup-wizard/wizard-step-summary.tsx` - Guard against undefined investments (bugfix)

## Decisions Made
- Used `window.confirm()` for reset confirmation, consistent with import data confirmation pattern already in ConfigCard
- Applied `text-destructive` class for visual danger signal matching app conventions
- STORAGE_KEYS exported as named constant (not default) for tree-shaking and explicit imports

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Guard against undefined investments in wizard steps**
- **Found during:** Checkpoint verification
- **Issue:** Wizard steps crashed when investments array was undefined (e.g., navigating back before adding any)
- **Fix:** Added defensive checks for undefined investments in wizard-step-investments and wizard-step-summary
- **Files modified:** components/setup-wizard/wizard-step-investments.tsx, components/setup-wizard/wizard-step-summary.tsx
- **Verification:** Wizard no longer crashes when investments is undefined
- **Committed in:** 8343a74

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Essential bugfix for wizard stability. No scope creep.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Complete wizard lifecycle operational: first-time -> setup -> use -> reset -> first-time
- Phase 12 fully complete, ready for Phase 13 (manual/documentation)
- All investments and re-run functionality verified by user

---
*Phase: 12-investments-step-rerun*
*Completed: 2026-04-02*
