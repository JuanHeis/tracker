---
phase: 02-investment-model-refactor
plan: 01
subsystem: data-model
tags: [typescript, localStorage, migration, investments, hooks]

# Dependency graph
requires:
  - phase: 01-critical-bug-fixes
    provides: Stable investment types (Plazo Fijo, FCI, Crypto, Acciones) and working useInvestmentsTracker hook
provides:
  - Account-based Investment interface with movements[], currentValue, lastUpdated, PF fields
  - InvestmentMovement interface (aporte/retiro)
  - CURRENCY_ENFORCEMENT map (Crypto=USD, PF=ARS, FCI/Acciones=user choice)
  - Migration function converting flat investments to movement-based model
  - Movement CRUD operations (add, delete)
  - Value update, finalization, and PF field update operations
affects: [02-02, 02-03, 02-04, 02-05, investment-dialog, investments-table]

# Tech tracking
tech-stack:
  added: []
  patterns: [account-based investment model, movement-based liquidity tracking, currency enforcement by type]

key-files:
  created: []
  modified:
    - hooks/useMoneyTracker.ts
    - hooks/useInvestmentsTracker.ts
    - constants/investments.ts
    - components/investment-dialog.tsx
    - components/investments-table.tsx
    - components/expense-tracker.tsx

key-decisions:
  - "CurrencyType enum moved to constants/investments.ts to avoid circular imports, re-exported from useMoneyTracker for backward compatibility"
  - "handleUpdateInvestment changed from form-based to data-based API (investmentId + partial updates)"
  - "Investment dialog refactored to extract form data internally and call new typed handlers"

patterns-established:
  - "Account-based investment model: investments are persistent entities with movement history, not flat transactions"
  - "Movement-based liquidity: monthly investment impact calculated from movements in that month, not flat amounts"
  - "Currency enforcement: CURRENCY_ENFORCEMENT map dictates forced currency per investment type"

requirements-completed: [INV-01, INV-09]

# Metrics
duration: 3min
completed: 2026-04-01
---

# Phase 2 Plan 1: Investment Data Model Redesign Summary

**Account-based Investment model with movements array, value tracking, PF-specific fields, currency enforcement map, and localStorage migration from flat schema**

## Performance

- **Duration:** 3 min
- **Started:** 2026-04-01T17:13:42Z
- **Completed:** 2026-04-01T17:17:02Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments
- Redesigned Investment from flat transaction to account-based entity with movements[], currentValue, lastUpdated, and optional PF fields (tna, plazoDias, startDate)
- Added CURRENCY_ENFORCEMENT map enforcing Crypto=USD, Plazo Fijo=ARS, FCI/Acciones=user choice
- Migration function converts old flat investments (amount, date) into new model with initial aporte movement
- useInvestmentsTracker exposes addMovement, deleteMovement, updateValue, finalizeInvestment, updatePFFields
- Investments now returned without month filtering, sorted active-first then finalized

## Task Commits

Each task was committed atomically:

1. **Task 1: Redesign Investment types, add currency enforcement, update migration** - `4bc9d22` (feat)
2. **Task 2: Refactor useInvestmentsTracker for new model operations** - `8836e86` (feat)

## Files Created/Modified
- `constants/investments.ts` - Added CurrencyType enum and CURRENCY_ENFORCEMENT map
- `hooks/useMoneyTracker.ts` - New Investment/InvestmentMovement interfaces, movement-based migration, movement-based available money calculation
- `hooks/useInvestmentsTracker.ts` - Refactored hook with account creation, movement CRUD, value update, finalization, PF field updates
- `components/investment-dialog.tsx` - Updated to use new typed handlers (onAdd/onUpdate) instead of form-based onSubmit
- `components/investments-table.tsx` - Updated to use createdAt and currentValue instead of removed date/amount fields
- `components/expense-tracker.tsx` - Updated InvestmentDialog props to match new API

## Decisions Made
- Moved CurrencyType enum to constants/investments.ts to avoid circular imports (useMoneyTracker imports from constants, constants needed CurrencyType). Re-exported from useMoneyTracker for backward compatibility.
- Changed handleUpdateInvestment from form-based (React.FormEvent) to data-based API (investmentId + partial updates) for cleaner separation of concerns.
- Refactored InvestmentDialog to handle form data extraction internally, calling typed add/update handlers.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Updated component files referencing removed Investment fields**
- **Found during:** Task 1 verification (tsc --noEmit)
- **Issue:** investments-table.tsx referenced investment.date and investment.amount; investment-dialog.tsx referenced date, amount, usdRate, expectedEndDate; expense-tracker.tsx passed form-based handlers to dialog
- **Fix:** Updated investments-table to use createdAt/currentValue, refactored investment-dialog to use new typed onAdd/onUpdate props, updated expense-tracker dialog usage
- **Files modified:** components/investments-table.tsx, components/investment-dialog.tsx, components/expense-tracker.tsx
- **Verification:** npx tsc --noEmit passes cleanly
- **Committed in:** 4bc9d22 (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Component updates were necessary to maintain compilation. Minimal changes preserving existing behavior while adapting to new type signatures.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Investment data model foundation complete, ready for Plan 02 (investment UI card)
- All TypeScript types compile cleanly
- Migration function handles backward compatibility with existing localStorage data

---
*Phase: 02-investment-model-refactor*
*Completed: 2026-04-01*
