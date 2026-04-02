---
phase: 03-dual-currency-engine
plan: 01
subsystem: data-model
tags: [currency, usd, migration, localStorage, hooks]

# Dependency graph
requires:
  - phase: 02-investment-model-refactor
    provides: Investment model with CurrencyType enum, MonthlyData structure
provides:
  - UsdPurchase interface and usdPurchases array in MonthlyData
  - useCurrencyEngine hook with globalUsdRate, USD purchase CRUD, exchange gain/loss
  - Migration v3 reversing USD-to-ARS conversion on stored data
  - Native currency storage pattern (USD amounts stay as USD)
affects: [03-02, 03-03, 03-04]

# Tech tracking
tech-stack:
  added: []
  patterns: [native-currency-storage, migration-versioning, localStorage-global-rate]

key-files:
  created: [hooks/useCurrencyEngine.ts]
  modified: [hooks/useMoneyTracker.ts, hooks/useExpensesTracker.ts, hooks/useIncomes.ts]

key-decisions:
  - "Migration uses _migrationVersion field to prevent double-reversal of USD amounts"
  - "globalUsdRate stored in separate localStorage key (not per-month) for global availability"
  - "Exchange gain/loss calculated only for tracked purchases (untracked have no purchase rate)"

patterns-established:
  - "Native currency storage: amounts stored in original currency, usdRate kept as historical reference"
  - "Migration versioning: _migrationVersion field guards idempotent data migrations"

requirements-completed: [MON-01, MON-02, MON-03, MON-08]

# Metrics
duration: 3min
completed: 2026-04-02
---

# Phase 3 Plan 01: Data Model & Currency Engine Summary

**UsdPurchase data model, useCurrencyEngine hook with globalUsdRate/purchase CRUD/gain-loss, and migration reversing stored USD-to-ARS conversion**

## Performance

- **Duration:** 3 min
- **Started:** 2026-04-02T10:39:49Z
- **Completed:** 2026-04-02T10:42:40Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- Added UsdPurchase interface and usdPurchases to MonthlyData with migration v3 to reverse existing USD amounts
- Created useCurrencyEngine hook providing globalUsdRate persistence, buy/register/delete USD purchases, and exchange gain/loss calculation
- Removed USD-to-ARS conversion from expense and income handlers so amounts store in native currency

## Task Commits

Each task was committed atomically:

1. **Task 1: Update data model, create useCurrencyEngine hook, add migration** - `97d57f8` (feat)
2. **Task 2: Stop USD-to-ARS conversion in expense and income handlers** - `de477a4` (fix)

## Files Created/Modified
- `hooks/useCurrencyEngine.ts` - New hook: globalUsdRate CRUD, USD purchase operations, exchange gain/loss
- `hooks/useMoneyTracker.ts` - UsdPurchase interface, usdPurchases in MonthlyData, migration v3, currency engine wiring
- `hooks/useExpensesTracker.ts` - Removed amount * usdRate conversion from add/update handlers
- `hooks/useIncomes.ts` - Removed amount * usdRate conversion from add/update handlers

## Decisions Made
- Migration uses _migrationVersion field (set to 3) to prevent double-reversal of USD amounts on subsequent loads
- globalUsdRate stored in separate localStorage key rather than per-month data for global availability
- Exchange gain/loss calculation only applies to "tracked" purchases (untracked have purchaseRate of 0)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Data model foundation complete for dual-currency UI work in plans 03-02 through 03-04
- useCurrencyEngine return values exposed through useMoneyTracker for component consumption
- Existing USD data will be migrated on next load (amounts divided by their usdRate to restore original USD values)

---
## Self-Check: PASSED

All 4 files verified present. Both task commits (97d57f8, de477a4) verified in git history.

---
*Phase: 03-dual-currency-engine*
*Completed: 2026-04-02*
