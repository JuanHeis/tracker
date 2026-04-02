---
phase: 03-dual-currency-engine
plan: 02
subsystem: ui, hooks
tags: [dual-currency, balance-calculation, patrimonio, sidebar, react]

# Dependency graph
requires:
  - phase: 03-01
    provides: "Native currency storage, CurrencyType on all transactions, useCurrencyEngine hook with globalUsdRate"
provides:
  - "calculateDualBalances returning arsBalance, usdBalance, arsInvestments, usdInvestments"
  - "TotalAmounts component with dual balance display and patrimonio"
  - "SalaryCard with inline globalUsdRate editor"
  - "Expense and income tables showing amounts in native currency"
affects: [03-03, 03-04]

# Tech tracking
tech-stack:
  added: []
  patterns: ["USD balance cumulative across all time (running wallet)", "ARS balance month-scoped (resets with salary)"]

key-files:
  created: []
  modified:
    - hooks/useMoneyTracker.ts
    - components/total-amounts.tsx
    - components/salary-card.tsx
    - components/expense-tracker.tsx
    - components/expenses-table.tsx
    - components/income-table.tsx

key-decisions:
  - "USD balance is cumulative across all time — not month-filtered — because USD is a wallet/running total"
  - "Removed separate Monto/USD columns in tables — amounts now shown with native currency symbol in single column"
  - "Patrimonio formula: arsLiquid + (usdLiquid * globalRate) + arsInvestments + (usdInvestments * globalRate)"

patterns-established:
  - "Dual balance pattern: ARS month-scoped, USD cumulative across all time"
  - "Inline edit pattern: pencil icon to toggle input for globalUsdRate in SalaryCard"

requirements-completed: [MON-01, MON-03]

# Metrics
duration: 3min
completed: 2026-04-02
---

# Phase 3 Plan 02: Dual Balance Calculation & Sidebar UI Summary

**Dual-currency balance engine with ARS/USD liquid balances, patrimonio total, and native currency display in all tables**

## Performance

- **Duration:** 3 min
- **Started:** 2026-04-02T10:45:17Z
- **Completed:** 2026-04-02T10:48:30Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments
- Replaced calculateTotalAvailable with calculateDualBalances returning separate ARS and USD balances plus investment values
- Rewrote TotalAmounts sidebar to show ARS liquid, USD liquid, ARS investments, USD investments, and patrimonio total
- Added inline globalUsdRate editor to SalaryCard with pencil icon toggle
- Updated expense and income tables to show amounts with native currency symbol ($ for ARS, US$ for USD) instead of dual Monto/USD columns

## Task Commits

Each task was committed atomically:

1. **Task 1: Refactor calculateTotalAvailable to dual-currency balances** - `25ce3fc` (feat)
2. **Task 2: Update sidebar UI for dual balances, global rate, and table currency display** - `0c46730` (feat)

## Files Created/Modified
- `hooks/useMoneyTracker.ts` - calculateDualBalances with ARS month-scoped and USD cumulative logic
- `components/total-amounts.tsx` - Dual balance display with patrimonio total
- `components/salary-card.tsx` - GlobalUsdRate inline editor, removed old salary-in-USD tooltip
- `components/expense-tracker.tsx` - Wired new props (calculateDualBalances, globalUsdRate, setGlobalUsdRate)
- `components/expenses-table.tsx` - Native currency symbol display, removed USD column
- `components/income-table.tsx` - Native currency symbol display, removed USD column

## Decisions Made
- USD balance is cumulative across all time (not month-filtered) because USD holdings are a running wallet total
- Removed dual Monto/USD columns from tables in favor of single column with native currency symbol
- Patrimonio shows warning when globalUsdRate is 0 instead of showing incorrect total

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Dual balance calculation ready for USD purchase UI (03-03)
- GlobalUsdRate editor in sidebar ready for exchange gain/loss panel (03-04)
- Tables correctly display native currency for all transaction types

## Self-Check: PASSED

All 6 modified files verified present. Both task commits (25ce3fc, 0c46730) verified in git log.

---
*Phase: 03-dual-currency-engine*
*Completed: 2026-04-02*
