---
phase: 23-reconciliar-disponible-del-resumen-con-saldo-liquido-calcula
plan: 02
subsystem: resumen / cash engine
tags: [cash-effects, disponible, dual-balances, zero-regression, single-source-of-truth, ars-usd]
requires:
  - "lib/resumen/cash-effects.ts :: computeCashEffect (Plan 23-01)"
provides:
  - "lib/resumen/month-metrics.ts :: computeMonthMetrics.disponible now absorbs full cash effect; MonthMetrics.cashEffect field"
  - "lib/resumen/dual-balances-core.ts :: computeDualBalancesCore(DualBalancesCoreInput) => { arsPeriodCash, usdPeriodCash }"
  - "hooks/useMoneyTracker.ts :: calculateDualBalances + calculateAvailableForMonth consume computeCashEffect"
  - "components/expense-tracker.tsx :: computeUsdAvailableForMonth consumes computeCashEffect; 4 disponible sites wired"
affects:
  - "future: Plan 03 reconciliation fixture test (June anchor $28.168,76) asserts disponible == liquid balance"
tech-stack:
  added: []
  patterns:
    - "PERIOD cash block extracted to a pure lib/ core (computeDualBalancesCore) consuming computeCashEffect"
    - "OPTIONAL cash inputs (default []) so history loops compile untouched while disponible sites pass real data"
    - "Numeric pre-refactor snapshot constants (toBeCloseTo, 2 decimals) prove byte-identical saldo"
key-files:
  created:
    - lib/resumen/dual-balances-core.ts
    - lib/resumen/dual-balances-core.test.ts
  modified:
    - lib/resumen/month-metrics.ts
    - lib/resumen/month-metrics.test.ts
    - hooks/useMoneyTracker.ts
    - components/expense-tracker.tsx
decisions:
  - "disponible = sobranteAnteriorRaw + ingresosMes - totalGastos + cashEffect (aportes not subtracted twice)"
  - "resultadoDelMes UNCHANGED (D2): ingresosMes - (totalGastos + aportesNoNeutros); retiros never count"
  - "computeDualBalancesCore scoped to PERIOD cash block only; accumulated numbers + patrimonio stay inline (minimal-risk locked scope)"
  - "in-range adjustments added SEPARATELY inside the core (computeCashEffect excludes them) to stay byte-identical"
  - "wizard-month guard: calculateAvailableForMonth re-adds the seed adjustment_ars locally (only for the first-adjustment month) so the wizard display is preserved"
metrics:
  duration: "~11 min"
  completed: "2026-07-01"
  tasks: 2
  files: 6
  tests_added: 6
---

# Phase 23 Plan 02: Wire shared cash function into all three engines Summary

Folded the shared `computeCashEffect` (Plan 23-01) into every cash-computing engine so the Resumen "Disponible" and the displayed liquid saldo consume ONE implementation and can never diverge again. `computeMonthMetrics.disponible` now absorbs the full period cash effect (transfers + loans + usdPurchases + all investment aporte/retiro), the three already-correct engines (`calculateDualBalances`, `calculateAvailableForMonth`, `computeUsdAvailableForMonth`) were refactored onto the same function, and a numeric snapshot test locks the displayed ARS/USD period saldo byte-identical against pre-refactor constants.

## Final Disponible formula

```typescript
// resultadoDelMes keeps D2 semantics — UNCHANGED
const egresosMes = totalGastos + aportesNoNeutros;
const resultadoDelMes = ingresosMes - egresosMes;

// disponible reconciles with the liquid balance: absorbs the FULL signed cash effect.
// cashEffect already contains -aportes for investments, so subtract only gastos here.
const cashEffect = computeCashEffect({ currency, isInRange, investments,
  transfers: transfers ?? [], loans: loans ?? [], usdPurchases: usdPurchases ?? [] });
const disponible = sobranteAnteriorRaw + ingresosMes - totalGastos + cashEffect;
```

For June 2026 ARS, `cashEffect` includes `-362500` (the `currency_ars_to_usd` conversion of 2026-06-04) → the chained Disponible drops by exactly $362.500 (the AC-1 anchor from $390.668,76 to $28.168,76). Plan 03's fixture test will assert that anchor end-to-end.

## All three engines refactored onto computeCashEffect

| Engine | File | Change |
|--------|------|--------|
| `computeMonthMetrics` | lib/resumen/month-metrics.ts | disponible folds cashEffect; OPTIONAL cash inputs; new `cashEffect` field |
| `calculateDualBalances` | hooks/useMoneyTracker.ts | PERIOD arsBalance/usdBalancePeriod come from `computeDualBalancesCore`; ACCUMULATED + patrimonio stay inline |
| `calculateAvailableForMonth` | hooks/useMoneyTracker.ts | inline transfers/loans/usdPurchases/investment blocks replaced by one `computeCashEffect` call |
| `computeUsdAvailableForMonth` | components/expense-tracker.tsx | inline blocks replaced by one `computeCashEffect` call |

`computeDualBalancesCore` (new `lib/resumen/dual-balances-core.ts`) is the pure extraction of ONLY the period cash block, per the locked minimal-risk scope decision. It returns `{ arsPeriodCash, usdPeriodCash }` = `computeCashEffect(...)` + the in-range adjustment contribution (added separately, because `computeCashEffect` excludes adjustments — Q3). Salary, extraIncomes, expenses, liquid `currentValue`, the ACCUMULATED balances, patrimonio and loan-for-patrimonio reducers stay computed exactly as before in `calculateDualBalances`.

## Zero-regression proof (Part D — highest-risk operation)

Pre-refactor snapshot captured by running the original `calculateDualBalances` algorithm over the real backup (`expense-tracker-backup-2026-06-30.json`), June 2026, payDay=1, viewMode="periodo" (range 2026-06-01..2026-06-30):

```
SNAPSHOT_ARS_PERIOD = 3420058.73   // pre-refactor snapshot — must not change
SNAPSHOT_USD_PERIOD = 1.69         // pre-refactor snapshot — must not change
```

`lib/resumen/dual-balances-core.test.ts` reconstructs `arsBalancePeriod` as `salary(2364969) + ARS extraIncomes(in range) − ARS expenses(1264339.40) + liquid-ARS currentValue(0) + computeDualBalancesCore(...).arsPeriodCash` and asserts `toBeCloseTo(SNAPSHOT_ARS_PERIOD, 2)`; symmetric for USD. Both pass — the extraction is a faithful, byte-identical refactor.

Component decomposition (verified from the real backup):
- ARS period cash (computeCashEffect, no adj) = `-1791801.00`; in-range `adjustment_ars` = `+4111230.13`
- USD period cash (computeCashEffect, no adj) = `+50.00`; in-range `adjustment_usd` = `-25.13`

## Call-site wiring

The 4 disponible-producing `computeMonthMetrics` sites now pass `transfers`/`loans`/`usdPurchases` (and their granular useMemo deps updated): `computeChainedDisponible`, `computeChainedDisponibleUsd`, `arsMetrics`, `usdMetrics`. The 2 resultado-history loops (`resultadoHistoryArs`, `resultadoHistoryUsd`) were left untouched — they omit the cash arrays (relying on the `[]` default) because they read `resultadoDelMes` (D2), not `disponible`. The `arsMetrics` wizard-month branch (`disponible: calculateAvailableForMonth(selectedMonth)`) is preserved verbatim.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing critical functionality] Wizard-month seed adjustment_ars re-add guard**
- **Found during:** Task 2 (Part B — refactoring `calculateAvailableForMonth`).
- **Issue:** The old inline block added `adjustment_ars` (L625); `computeCashEffect` excludes it. For NON-wizard months this is the intended change (makes the cuadre redundant, AC-3). But the WIZARD month (2026-04) routes its disponible through `calculateAvailableForMonth`, and its `adjustment_ars` of $360.834,74 is the legitimate initial-patrimonio seed. Dropping it unguarded would break the wizard-month display (disponible would fall by $360.834,74).
- **Fix:** Added a guard inside `calculateAvailableForMonth` that re-adds the in-range `adjustment_ars` ONLY for the wizard month (detected as the FIRST `adjustment_ars`, matching `wizardMonth` detection in expense-tracker.tsx). Verified byte-identical: wizard-month disponible = $6.331,53 before and after. The re-add is guarded to the wizard month and is NOT reintroduced into the shared function. This is exactly the fallback the plan's Part B explicitly authorised ("keep a LOCAL adjustment_ars add ONLY inside calculateAvailableForMonth (guard it clearly)").
- **Files modified:** hooks/useMoneyTracker.ts
- **Commit:** f8fab02

## Verification

- `npx vitest run lib/resumen/` → 3 files, 34 passed (month-metrics + cash-effects + dual-balances-core snapshot)
- `npx vitest run` → 9 files, 105 passed (full suite gate)
- `npx tsc --noEmit` → exit 0 (clean)
- `npx next build` → succeeds (pre-existing ESLint warnings in unrelated `waterfall.test.ts` only, out of scope)
- Byte-identical proof: arsBalancePeriod 3420058.73 / usdBalancePeriod 1.69 locked
- Wizard-month disponible ($6.331,53) preserved after guard
- `grep computeCashEffect` matches in all three engines (no duplicated sign table)
- `_migrationVersion` untouched (only reads at L188/L240 in useMoneyTracker; no new writes); no localStorage key added/renamed; payDay default (payDay: 1) unchanged

## Notes for Plan 03

- `MonthMetrics` gained a `cashEffect` field — available for tooltips and the reconciliation test.
- The reconciliation invariant to assert (per RESEARCH Pitfall 1 / A2): compare the CHAINED flow disponible against the per-month cash-flow engine, NOT the raw `arsBalancePeriod` (which still carries the $4.1M June cuadre). The June anchor $28.168,76 is the chained-flow value.
- The two `adjustment_ars` in the backup: 2026-04-02 ($360.834,74 seed, wizard month) and 2026-06-30 ($4.111.230,13 cuadre). Removing the June cuadre is a separate, deferred, user-applied step.

## Self-Check: PASSED
