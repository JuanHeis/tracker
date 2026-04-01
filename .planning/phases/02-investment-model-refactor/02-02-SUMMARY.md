---
phase: 02-investment-model-refactor
plan: 02
subsystem: ui
tags: [react, typescript, investments, dialog, currency-enforcement, plazo-fijo]

# Dependency graph
requires:
  - phase: 02-investment-model-refactor
    plan: 01
    provides: Account-based Investment model, CURRENCY_ENFORCEMENT map, handleAddInvestment API with tna/plazoDias
provides:
  - Investment dialog with conditional PF fields (TNA, plazo) and currency enforcement per type
  - Structured data callback (onAdd/onUpdate) instead of form-event submission
  - expense-tracker wiring of new movement/value operations to InvestmentsTable
affects: [02-04, investments-table, expense-tracker]

# Tech tracking
tech-stack:
  added: []
  patterns: [controlled type selection with currency enforcement, conditional form fields by investment type]

key-files:
  created: []
  modified:
    - components/investment-dialog.tsx
    - components/expense-tracker.tsx
    - components/investments-table.tsx
    - hooks/useInvestmentsTracker.ts

key-decisions:
  - "Edit mode locks type and currency (immutable after creation); only name and PF-specific fields editable"
  - "onUpdate signature changed to accept name/tna/plazoDias instead of type/currencyType (type+currency locked after creation)"
  - "New investment operations passed as optional props to InvestmentsTable for forward-compatibility with 02-04"

patterns-established:
  - "Currency enforcement: controlled Select disabled when CURRENCY_ENFORCEMENT returns non-null for selected type"
  - "Conditional form fields: PF-specific inputs rendered only when selectedType === Plazo Fijo"

requirements-completed: [INV-01, INV-08, INV-09]

# Metrics
duration: 3min
completed: 2026-04-01
---

# Phase 2 Plan 2: Investment Dialog & Wiring Summary

**Investment dialog with conditional Plazo Fijo fields (TNA/plazo), currency enforcement per type, and expense-tracker wiring of new movement/value operations**

## Performance

- **Duration:** 3 min
- **Started:** 2026-04-01T17:19:34Z
- **Completed:** 2026-04-01T17:22:16Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- Investment dialog shows TNA and Plazo (dias) fields only when Plazo Fijo is selected
- Currency select auto-enforced and disabled for Crypto (USD) and Plazo Fijo (ARS), enabled for FCI and Acciones
- Edit mode locks type and currency, allows editing name and PF-specific fields only
- expense-tracker passes all new investment operations (addMovement, deleteMovement, updateValue, finalizeInvestment, updatePFFields) to InvestmentsTable

## Task Commits

Each task was committed atomically:

1. **Task 1: Update InvestmentDialog with PF fields and currency enforcement** - `b1f226f` (feat)
2. **Task 2: Wire expense-tracker.tsx to new investment hook API** - `0c68755` (feat)

## Files Created/Modified
- `components/investment-dialog.tsx` - Controlled type selection, conditional PF fields, currency enforcement, structured onAdd/onUpdate callbacks
- `components/expense-tracker.tsx` - Destructures new movement/value operations from useMoneyTracker, passes to InvestmentsTable and InvestmentDialog
- `components/investments-table.tsx` - Added optional props interface for new operations (consumed in 02-04)
- `hooks/useInvestmentsTracker.ts` - Updated handleUpdateInvestment to accept name/tna/plazoDias instead of type/currencyType

## Decisions Made
- Edit mode locks type and currency (immutable after creation) -- changing investment type would invalidate movement history and currency enforcement
- onUpdate signature changed from {name, type, currencyType} to {name, tna, plazoDias} since type and currency cannot change after creation
- New operations passed as optional props to InvestmentsTable to avoid TypeScript errors while maintaining forward compatibility with 02-04

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Removed stale onEdit prop from InvestmentDialog usage**
- **Found during:** Task 1 verification (tsc --noEmit)
- **Issue:** expense-tracker.tsx passed `onEdit` prop to InvestmentDialog, but the updated interface no longer includes it (edit is handled by parent calling handleEditInvestment which opens dialog with editingInvestment set)
- **Fix:** Removed `onEdit={handleEditInvestment}` from InvestmentDialog JSX in expense-tracker.tsx
- **Files modified:** components/expense-tracker.tsx
- **Verification:** npx tsc --noEmit passes cleanly
- **Committed in:** b1f226f (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Minimal -- removed unused prop reference to match updated interface.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Dialog and wiring complete, ready for Plan 02-03 (investment value cell) and Plan 02-04 (InvestmentsTable rewrite)
- All new operations are wired through and available as optional props on InvestmentsTable
- TypeScript compiles cleanly

---
*Phase: 02-investment-model-refactor*
*Completed: 2026-04-01*
