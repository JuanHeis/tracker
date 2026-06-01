---
phase: quick-260601-nuv
plan: 01
subsystem: recurring-expenses
tags: [bugfix, recurring, projection, date-window]
requires:
  - "hooks/useRecurringExpenses.ts (existing parseMonth/monthIsBeforeOrEqual/iterateMonths helpers)"
provides:
  - "computeProjectionWindow(createdAt, currentMonth) pure helper"
  - "RECURRING_PROJECTION_MONTHS constant (= 3)"
  - "Forward-only recurring expense generation in generateMissingInstances"
affects:
  - "hooks/useRecurringExpenses.ts"
tech-stack:
  added: []
  patterns:
    - "Pure, unit-tested date-window helper extracted from generation loop"
    - "max(currentMonth, createdAt) clamp to prevent past-month backfill"
key-files:
  created:
    - "hooks/useRecurringExpenses.window.test.ts"
  modified:
    - "hooks/useRecurringExpenses.ts"
decisions:
  - "Horizon set to current month + 3 (4 months inclusive) via RECURRING_PROJECTION_MONTHS"
  - "Reused existing monthIsBeforeOrEqual/parseMonth helpers; no lexical yyyy-MM comparison"
  - "Return null (skip) when createdAt is beyond the horizon"
  - "No localStorage schema change — in-memory generation only, no migration"
metrics:
  duration: "~6 min"
  completed: "2026-06-01"
  tasks: 2
  files: 2
---

# Quick Task 260601-nuv: Recurring Expenses Forward-Only Projection Summary

Fixed the bug where recurring expenses backfilled into past months; generation is now forward-only (current month through current + 3 months) via a pure, unit-tested `computeProjectionWindow` helper.

## What Changed

- **`hooks/useRecurringExpenses.ts`**
  - Added `export const RECURRING_PROJECTION_MONTHS = 3` (forward horizon).
  - Added `export function computeProjectionWindow(createdAt, currentMonth)` returning `{ startMonth, endMonth } | null`:
    - `startMonth = max(currentMonth, createdAt)` using the existing `monthIsBeforeOrEqual` helper — never projects before the current month, but honors a future `createdAt`.
    - `endMonth = currentMonth + RECURRING_PROJECTION_MONTHS` via `format(addMonths(parseMonth(currentMonth), 3), "yyyy-MM")`.
    - Returns `null` when `startMonth` is after `endMonth` (createdAt beyond the horizon → generate nothing).
  - Rewired `generateMissingInstances`: replaced `iterateMonths(rec.createdAt, currentMonth)` with `computeProjectionWindow(...)` + `iterateMonths(window.startMonth, window.endMonth)`, skipping when the window is `null`.
  - Updated the `generateMissingInstances` JSDoc to describe forward projection.
- **`hooks/useRecurringExpenses.window.test.ts`** (new)
  - 7 unit tests for the window logic: past/current/future `createdAt`, horizon edge, beyond-horizon `null`, exact 4-month inclusive span, and `RECURRING_PROJECTION_MONTHS === 3`.

## Verification

- `vitest run hooks/useRecurringExpenses.window.test.ts` → 7/7 passed.
- `tsc --noEmit -p tsconfig.json` → exit 0, no type errors.
- `grep` confirms `iterateMonths(rec.createdAt, currentMonth)` no longer exists.
- Call site in `hooks/useMoneyTracker.ts` (line ~680) untouched — signature unchanged.
- No changes to the `RecurringExpense` interface or any localStorage write path.

## Behavior Preserved

- `Cancelada` skip, `pausedAt` skip, and `exists`/`justCreated` dedupe logic unchanged.
- Pushed `Expense` shape unchanged (`date: ${month}-01`, `usdRate`, `recurringId`, `isPaid: false`).
- localStorage schema unchanged — no migration (per project JSON-safety rule).

## Deviations from Plan

None - plan executed exactly as written.

## TDD Notes

Followed the plan's `tdd="true"` for Task 1: wrote the test first (RED — all 7 failed with `computeProjectionWindow is not a function`), then implemented to GREEN (7/7 pass). No refactor needed (minimal implementation). Task 1's test + implementation were committed together as a single atomic deliverable after RED was verified.

## Commits

- `5f8947e` feat(quick-260601-nuv): add computeProjectionWindow helper + tests
- `ec7dd36` fix(quick-260601-nuv): project recurring expenses forward only

## Self-Check: PASSED

- FOUND: hooks/useRecurringExpenses.window.test.ts
- FOUND: hooks/useRecurringExpenses.ts
- FOUND: .planning/quick/260601-nuv-los-gastos-recurrentes-no-deberian-agreg/260601-nuv-SUMMARY.md
- FOUND commit: 5f8947e
- FOUND commit: ec7dd36
