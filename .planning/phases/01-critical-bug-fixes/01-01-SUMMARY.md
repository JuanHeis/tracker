---
phase: 01-critical-bug-fixes
plan: 01
subsystem: ui
tags: [typescript, react, investments, currency, constants]

# Dependency graph
requires: []
provides:
  - Shared INVESTMENT_TYPES constant and InvestmentType derived type
  - Currency selector in investment dialog (ARS/USD)
  - Form-based currencyType reading in add/update handlers
affects: [02-investment-model, investments-table, monthly-card]

# Tech tracking
tech-stack:
  added: []
  patterns: ["const as const array with derived type for shared enums"]

key-files:
  created: [constants/investments.ts]
  modified: [hooks/useMoneyTracker.ts, hooks/useInvestmentsTracker.ts, components/investment-dialog.tsx]

key-decisions:
  - "Canonical investment types: Plazo Fijo, FCI, Crypto, Acciones (dropped Bonos, Otros)"
  - "Used editingInvestment prop directly for edit defaults instead of separate defaultValues prop"
  - "Currency selector defaults to ARS with fallback in handler"

patterns-established:
  - "Shared constant pattern: export const X = [...] as const; export type X = (typeof X)[number];"

requirements-completed: [BUG-01, BUG-02]

# Metrics
duration: 2min
completed: 2026-04-01
---

# Phase 1 Plan 1: Investment Type & Currency Bug Fixes Summary

**Shared INVESTMENT_TYPES constant replacing mismatched dialog values, plus currency selector fixing hardcoded ARS**

## Performance

- **Duration:** 2 min
- **Started:** 2026-04-01T15:20:06Z
- **Completed:** 2026-04-01T15:22:33Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- Created shared constants/investments.ts with INVESTMENT_TYPES array and InvestmentType derived type
- Investment dialog now renders type options from the shared constant, ensuring values match the type system
- Added currency selector (ARS/USD) to investment dialog with proper defaults
- Both handleAddInvestment and handleUpdateInvestment now read currencyType from form data

## Task Commits

Each task was committed atomically:

1. **Task 1: Create shared investment types constant and update Investment interface** - `65ec931` (feat)
2. **Task 2: Fix investment dialog types and currency, fix handler to read currency from form** - `7b2a570` (fix)

## Files Created/Modified
- `constants/investments.ts` - Shared INVESTMENT_TYPES constant and InvestmentType derived type
- `hooks/useMoneyTracker.ts` - Investment interface updated to use InvestmentType
- `hooks/useInvestmentsTracker.ts` - Both add/update handlers read currencyType from form data
- `components/investment-dialog.tsx` - Type options from INVESTMENT_TYPES.map(), currency selector added

## Decisions Made
- Canonical investment types set to Plazo Fijo, FCI, Crypto, Acciones (Bonos and Otros dropped per plan)
- Removed unused defaultValues prop from InvestmentDialog, using editingInvestment directly for edit mode defaults
- Currency selector defaults to ARS with fallback in handler for safety

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed dialog not using editingInvestment for edit defaults**
- **Found during:** Task 2 (Fix investment dialog)
- **Issue:** Dialog had a defaultValues prop that was never passed by the parent component. Edit mode fields (name, amount, type, etc.) would show empty instead of current values.
- **Fix:** Changed all defaultValue references from defaultValues?.X to editingInvestment?.X, removed unused defaultValues prop from interface
- **Files modified:** components/investment-dialog.tsx
- **Verification:** TypeScript compiles clean, dialog now correctly references editingInvestment
- **Committed in:** 7b2a570 (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Essential for edit mode to work correctly. No scope creep.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Investment types are now consistent between UI and type system
- Currency selection works for both new and edited investments
- Ready for subsequent plans in Phase 1

---
*Phase: 01-critical-bug-fixes*
*Completed: 2026-04-01*

## Self-Check: PASSED
