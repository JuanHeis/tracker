---
phase: quick-16
plan: 01
subsystem: resumen-card
tags: [ui, recurring-expenses, resumen]
dependency_graph:
  requires: [useRecurringExpenses, useExpensesTracker]
  provides: [porPagar-display]
  affects: [resumen-card, expense-tracker]
tech_stack:
  patterns: [conditional-render, amber-color-coding, tooltip-breakdown]
key_files:
  created: []
  modified:
    - hooks/useExpensesTracker.ts
    - hooks/useMoneyTracker.ts
    - components/expense-tracker.tsx
    - components/resumen-card.tsx
decisions:
  - "porPagar is a subset of totalGastos, not an additional deduction -- purely informational"
  - "Amber color chosen to distinguish from paid expenses (red) and investments (blue)"
metrics:
  duration: ~2min
  completed: 2026-04-03
---

# Quick Task 16: Add Por pagar category for unpaid recurring expenses

Amber-colored "Por pagar" line in ResumenCard EGRESOS section showing total of unpaid recurring expenses, with tooltip breakdown in Disponible.

## Tasks Completed

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | Compute porPagar and pipe through to ResumenCard | eba24bc | useExpensesTracker.ts, useMoneyTracker.ts, expense-tracker.tsx |
| 2 | Display Por pagar line in ResumenCard EGRESOS section | 9aa3ba1 | resumen-card.tsx |

## What Changed

### Task 1: Compute porPagar
- Added `porPagar` computation in `useExpensesTracker.ts`: filters `filteredExpenses` for items with `recurringId` and `!isPaid`, sums amounts
- Exposed `porPagar` through `useMoneyTracker.ts` return object
- Destructured and passed `porPagar` as prop to `ResumenCard` in `expense-tracker.tsx`

### Task 2: Display in ResumenCard
- Added `porPagar: number` to `ResumenCardProps` interface
- Added conditional "Por pagar" line (only when > 0) in EGRESOS section after "Aportes inversiones"
- Styled with amber-500/amber-400 (dark mode) to distinguish from Gastos (red) and Aportes (blue)
- Displays as negative value (`-porPagar`) matching Aportes convention
- Added "Por pagar" line in Disponible tooltip breakdown with amber-400 color
- Tooltip explains: "Total de gastos recurrentes aun no pagados este mes"

## Deviations from Plan

None -- plan executed exactly as written.

## Verification

- `npx tsc --noEmit` passes with zero errors
- porPagar correctly filters for `recurringId && !isPaid` expenses
- Disponible calculation unchanged (porPagar is informational subset of totalGastos)

## Self-Check: PASSED
