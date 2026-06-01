# Quick Task 260601-eo4 — Summary

**Date:** 2026-06-01
**Status:** Complete
**Commits:** 3661e94, f2a2243, 1bcda19

## What was done

### Task 1 — Aguinaldo month offset (3661e94)
- `hooks/useSalaryHistory.ts`: Rewrote `calculateAguinaldo` — now targets months 7 (July) and 1 (January). January correctly looks at Jul-Dec of the **previous** year (semYear = year - 1). Preview (`getAguinaldoPreview`) now triggers in months 6 and 12, pointing to July/January payment.
- `hooks/useMoneyTracker.ts`: Updated `getAguinaldoForMonth` guard from `month !== 6 && month !== 12` to `month !== 7 && month !== 1`.

### Task 2 — Fix investment contributions date filter + sobrante anterior (f2a2243)
- `hooks/useMoneyTracker.ts`: Added `isInArsRange(mov.date)` guard to `arsInvestmentContributions` accumulator — was summing all-time aportes, now only sums the current period.
- `hooks/useMoneyTracker.ts`: Added `calculateAvailableForMonth(monthKey)` pure function exposed from hook return — computes ARS disponible for any arbitrary month using existing `monthlyData`.
- `components/expense-tracker.tsx`: Added `prevMonthKey` memo and `sobrante` computed from `calculateAvailableForMonth`. Passed to `ResumenCard`.
- `components/resumen-card.tsx`: Added `sobrante` prop. Shows "Sobrante anterior" row in Ingresos section when > 0. Works retroactively for all historical months.

### Task 3 — Inversiones merged into Ahorro waterfall bar (1bcda19)
- `lib/projection/waterfall.ts`: Removed standalone "Inversiones" bar. `ahorroAmount = investmentNet + max(0, savingsEstimate)`. Tooltip subcategories show each investment by name + "Meta de ahorro".
- `lib/projection/waterfall.test.ts`: Updated all 25 tests — removed Inversiones bar assertions, updated Ahorro amount expectations.
- Waterfall now: Ingresos → Gastos Fijos → Gastos Variables → Ahorro → Libre.

## Files changed
- `hooks/useSalaryHistory.ts`
- `hooks/useMoneyTracker.ts`
- `components/expense-tracker.tsx`
- `components/resumen-card.tsx`
- `lib/projection/waterfall.ts`
- `lib/projection/waterfall.test.ts`
