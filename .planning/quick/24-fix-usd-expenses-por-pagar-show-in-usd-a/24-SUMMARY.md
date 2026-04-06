---
phase: quick-24
plan: 01
subsystem: expenses-display
tags: [currency, por-pagar, usd, ars, resumen-card]
dependency_graph:
  requires: []
  provides: [dual-currency-por-pagar]
  affects: [resumen-card, expense-tracker, useExpensesTracker, useMoneyTracker]
tech_stack:
  added: []
  patterns: [currency-split-filtering]
key_files:
  created: []
  modified:
    - hooks/useExpensesTracker.ts
    - hooks/useMoneyTracker.ts
    - components/expense-tracker.tsx
    - components/resumen-card.tsx
decisions:
  - Filter unpaid expenses by CurrencyType.USD vs non-USD to split porPagar
metrics:
  duration: ~1.5min
  completed: 2026-04-06
---

# Quick Task 24: Fix USD Expenses Por Pagar Show in USD Summary

Split porPagar into porPagarArs and porPagarUsd so USD unpaid expenses display with USD formatting instead of being mixed into a single ARS value.

## Task Completion

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Split porPagar by currency in hooks | 7ed8e4f | hooks/useExpensesTracker.ts, hooks/useMoneyTracker.ts |
| 2 | Update expense-tracker and resumen-card for dual currency porPagar | 9fe76f3 | components/expense-tracker.tsx, components/resumen-card.tsx |

## Deviations from Plan

None - plan executed exactly as written.

## Verification

- TypeScript compiles cleanly with zero errors
- porPagarArs filters `e.currencyType !== CurrencyType.USD`
- porPagarUsd filters `e.currencyType === CurrencyType.USD`
- ResumenCard shows conditional "Por pagar ARS" and "Por pagar USD" lines
- Disponible tooltip shows split amounts with correct currency formatting
