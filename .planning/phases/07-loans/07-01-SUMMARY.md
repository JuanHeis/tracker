---
phase: 07-loans
plan: 01
subsystem: data-model
tags: [loans, hooks, react, localStorage, migration, balance-calculation]

# Dependency graph
requires:
  - phase: 05-monthly-card-redesign
    provides: calculateDualBalances foundation, MonthlyData interface, domain hook pattern
provides:
  - Loan, LoanPayment, LoanType, LoanStatus type definitions
  - useLoans hook with CRUD, payments, forgiveness, period filtering
  - calculateDualBalances loan liquid + patrimonio processing
  - Migration v7 for backward compatibility
affects: [07-loans]

# Tech tracking
tech-stack:
  added: []
  patterns: [domain-hook-pattern-for-loans, auto-status-transition-on-payment, computed-remaining-balance]

key-files:
  created: [hooks/useLoans.ts]
  modified: [hooks/useMoneyTracker.ts]

key-decisions:
  - "Remaining balance always computed (amount - sum(payments)), never stored as field"
  - "Auto-status transition: Cobrado when preste fully collected, Pagado when debo fully paid"
  - "Only persona, note, date editable after creation -- amount, currency, type are immutable"
  - "Forgiven loans (Perdonado) excluded from patrimonio assets but past payments preserved"
  - "ARS loan impacts scoped by isInArsRange, USD loan impacts cumulative (all time)"

patterns-established:
  - "Loan domain hook: same pattern as useTransfers (period filtering, CRUD via updateMonthlyData)"
  - "Computed remaining: loan.amount - loan.payments.reduce(sum) -- never stored"

requirements-completed: [PREST-01, PREST-02, PREST-03, PREST-04]

# Metrics
duration: 2min
completed: 2026-04-02
---

# Phase 7 Plan 1: Loan Data Layer Summary

**Loan/LoanPayment types with useLoans CRUD hook, calculateDualBalances loan processing (preste/debo liquid + patrimonio), and migration v7**

## Performance

- **Duration:** 2 min
- **Started:** 2026-04-02T16:41:29Z
- **Completed:** 2026-04-02T16:43:46Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Defined Loan, LoanPayment, LoanType, LoanStatus types with discriminated preste/debo model
- Created useLoans hook with full CRUD: add, payment, edit, delete, forgive, and period filtering
- Wired loan liquid impacts into calculateDualBalances with correct ARS scoping and USD cumulative rules
- Added arsLoansGiven, usdLoansGiven, arsDebts, usdDebts patrimonio values to balance return
- Migration v7 initializes loans array for backward compatibility

## Task Commits

Each task was committed atomically:

1. **Task 1: Define Loan types, update MonthlyData, add migration v7, wire loans into calculateDualBalances** - `e90410e` (feat)
2. **Task 2: Create useLoans domain hook with CRUD, payments, forgiveness, and period filtering** - `e925bd1` (feat)

## Files Created/Modified
- `hooks/useLoans.ts` - Domain hook with loan CRUD, payment management, forgiveness, period filtering
- `hooks/useMoneyTracker.ts` - Loan types, MonthlyData.loans field, migration v7, calculateDualBalances loan processing, useLoans wiring

## Decisions Made
- Remaining balance always computed (amount - sum(payments)), never stored as a field
- Auto-status transition: Cobrado when preste fully collected, Pagado when debo fully paid
- Only persona, note, date editable after creation -- amount, currency, type are immutable
- Forgiven loans (Perdonado) excluded from patrimonio assets but past payments preserved in history
- ARS loan impacts scoped by isInArsRange, USD loan impacts cumulative (all time)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Loan type system and data layer complete, ready for UI implementation in 07-02 and 07-03
- All 6 useLoans functions exposed from useMoneyTracker return object
- calculateDualBalances returns patrimonio values for loan assets and debts

---
*Phase: 07-loans*
*Completed: 2026-04-02*

## Self-Check: PASSED
