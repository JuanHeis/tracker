---
phase: quick-20
plan: 01
subsystem: balance-calculation, patrimonio-card
tags: [dual-currency, balance-view, toggle-ui]
dependency_graph:
  requires: []
  provides: [symmetric-balance-views, periodo-acumulado-toggle]
  affects: [patrimonio-card, expense-tracker, useMoneyTracker]
tech_stack:
  added: []
  patterns: [dual-mode-balance-calculation, view-mode-toggle]
key_files:
  created: []
  modified:
    - hooks/useMoneyTracker.ts
    - components/patrimonio-card.tsx
    - components/total-amounts.tsx
    - components/expense-tracker.tsx
decisions:
  - Accumulated ARS means full month without pay-period date filtering, not multi-month
  - Period USD means applying the same isInArsRange date filter used for ARS
  - Backward-compatible aliases arsBalance/usdBalance preserved for all existing consumers
  - TotalAmounts updated with optional dual-mode props for future use
metrics:
  duration: ~4min
  completed: "2026-04-03"
---

# Quick Task 20: Symmetric ARS/USD Balance Views with Periodo/Acumulado Toggle

**Symmetric balance calculation for both currencies + PatrimonioCard toggle between Periodo and Acumulado views**

## Tasks Completed

| # | Task | Commit | Key Changes |
|---|------|--------|-------------|
| 1 | Extend calculateDualBalances with period+accumulated for both currencies | 846d905 | hooks/useMoneyTracker.ts |
| 2 | Add balance view toggle to PatrimonioCard and wire through expense-tracker | 04c9251 | patrimonio-card.tsx, total-amounts.tsx, expense-tracker.tsx |

## What Changed

### Task 1: Dual Balance Calculation
Extended `calculateDualBalances()` to compute four liquid balance values instead of two:
- **arsBalancePeriod**: ARS filtered by pay-period date range (existing behavior, renamed)
- **arsBalanceAccumulated**: ARS with all items in the month, no date filter (NEW)
- **usdBalancePeriod**: USD filtered by pay-period date range (NEW)
- **usdBalanceAccumulated**: USD cumulative across all time (existing behavior, renamed)

All transaction types (salary, incomes, expenses, USD purchases, investments, transfers, loans) now track both period and accumulated totals for both currencies. Backward-compatible aliases (`arsBalance` = period, `usdBalance` = accumulated) ensure zero breaking changes for existing consumers like ResumenCard and AdjustmentDialog.

### Task 2: PatrimonioCard Toggle UI
Replaced the static "Historico" Badge with a Periodo/Acumulado toggle using two small buttons. The toggle controls which liquid balance values are displayed:
- **Periodo**: Both ARS and USD show only items within the current pay period
- **Acumulado**: ARS shows full month (no date filter), USD shows cumulative all-time

Tooltips update dynamically based on the selected view mode. The patrimonio total recalculates based on the active view. Default is "Periodo" to preserve existing UX.

## Deviations from Plan

### Out-of-Scope Pre-existing Issue
- **Build fails** due to `rateSource` property missing from `InvestmentProjection` type in `components/charts/investment-basis-info.tsx` (lines 61-65). This is a pre-existing issue from the projection engine work, unrelated to this task. Logged but not fixed per scope boundary rules.

## Verification

- TypeScript compiles with zero errors in modified files (pre-existing error in investment-basis-info.tsx is unrelated)
- No localStorage schema changes - zero migration risk
- Backward-compatible aliases ensure ResumenCard, AdjustmentDialog, and all other consumers work unchanged
- Default view mode is "periodo" preserving existing user experience

## Self-Check: PASSED
- [x] hooks/useMoneyTracker.ts modified with dual balances
- [x] components/patrimonio-card.tsx modified with toggle UI
- [x] components/total-amounts.tsx modified with dual-mode support
- [x] components/expense-tracker.tsx modified with balanceViewMode state
- [x] Commit 846d905 exists
- [x] Commit 04c9251 exists
