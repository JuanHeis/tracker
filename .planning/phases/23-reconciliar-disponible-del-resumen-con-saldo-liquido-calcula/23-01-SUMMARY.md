---
phase: 23-reconciliar-disponible-del-resumen-con-saldo-liquido-calcula
plan: 01
subsystem: resumen / cash engine
tags: [pure-function, cash-effects, tdd, single-source-of-truth, ars-usd]
requires: []
provides:
  - "lib/resumen/cash-effects.ts :: computeCashEffect(CashEffectInput) => number"
  - "lib/resumen/cash-effects.ts :: CashEffectInput type"
affects:
  - "future: computeMonthMetrics (Plan 02 wires this into disponible)"
  - "future: calculateDualBalances / calculateAvailableForMonth (Plan 03 converges on this fn)"
tech-stack:
  added: []
  patterns:
    - "Currency-parametric pure engine in lib/ (caller injects isInRange) — mirrors month-metrics.ts"
    - "TDD RED-first: sign table authored as failing spec before implementation"
key-files:
  created:
    - lib/resumen/cash-effects.ts
    - lib/resumen/cash-effects.test.ts
  modified: []
decisions:
  - "Q3: computeCashEffect EXCLUDES adjustment_ars/adjustment_usd (cuadre/seed artifacts)"
  - "Q2: computeCashEffect INCLUDES investment aporte(-)/retiro(+) as cash, skipping isInitial/pendingIngreso"
  - "Q1: balance-core extraction deferred to Plan 03 (this fn is already pure/testable in isolation)"
metrics:
  duration: "~3 min"
  completed: "2026-07-01"
  tasks: 2
  files: 2
  tests_added: 22
---

# Phase 23 Plan 01: Shared cash-effects function Summary

Built `computeCashEffect`, a single pure function that returns the net signed liquid-cash delta for a currency over an in-range set of transfers/loans/usdPurchases/investments — the one implementation both engines will consume so the Resumen "Disponible" and `calculateDualBalances` can never diverge again.

## What Was Built

`lib/resumen/cash-effects.ts` exports:

```typescript
export interface CashEffectInput {
  currency: CurrencyType;
  isInRange: (dateStr: string) => boolean;
  transfers: ReadonlyArray<Transfer>;
  loans: ReadonlyArray<Loan>;
  usdPurchases: ReadonlyArray<UsdPurchase>;
  investments: ReadonlyArray<Investment>;
}
export function computeCashEffect(input: CashEffectInput): number;
```

Pure: no React, no localStorage, no `Date.now` — the caller injects `isInRange` (the same `getFilterDateRange` window both engines already use). The sign table is transcribed verbatim from `calculateDualBalances` (hooks/useMoneyTracker.ts L471-547) and the investment-as-cash block of `calculateAvailableForMonth` (L607-616).

## Scope: what moves cash (and what does NOT)

| Movement | Condition | ARS delta | USD delta |
|----------|-----------|-----------|-----------|
| `currency_ars_to_usd` | in range | `-arsAmount` | `+usdAmount` |
| `currency_usd_to_ars` | in range | `+arsAmount` | `-usdAmount` |
| `cash_out` (matching currency) | in range | `-amount` | `-amount` |
| `cash_in` (matching currency) | in range | `+amount` | `+amount` |
| `usdPurchase` origin=`tracked` | in range | `-arsAmount` | `+usdAmount` |
| `usdPurchase` origin=`untracked` | in range | 0 (no ARS deduction) | `+usdAmount` |
| loan `preste` (same currency) | loan.date in range | `-amount`; payments `+p.amount` | (same, its currency) |
| loan `debo` (same currency) | payments in range | `-p.amount`; principal → 0 | (same) |
| investment `aporte` (same currency) | !isInitial, !pendingIngreso, in range | `-amount` | (same) |
| investment `retiro` (same currency) | !isInitial, !pendingIngreso, in range | `+(receivedAmount ?? amount)` | (same) |
| **`adjustment_ars` / `adjustment_usd`** | — | **EXCLUDED (0)** | **EXCLUDED (0)** |
| out-of-range movements | — | 0 | 0 |

## Open questions resolved (as implemented)

- **Q3 (adjustments): EXCLUDED.** `adjustment_ars`/`adjustment_usd` are cuadre/seed artifacts, not real cash flow. Including them would double-count the wizard seed for every non-wizard month (RESEARCH Pitfall 3). The wizard month keeps its own special branch (untouched). There is no `case "adjustment_*"` in the switch — only a comment marking the intentional exclusion.
- **Q2 (investment retiros/aportes as cash): INCLUDED.** Every `aporte` = `-amount`, every `retiro` = `+(receivedAmount ?? amount)`, filtered by `isInRange`, skipping `isInitial`/`pendingIngreso` — exactly as `calculateAvailableForMonth` L607-616 does. This is the cash term `computeMonthMetrics` is currently missing. NOTE for Plan 02: `computeMonthMetrics` keeps subtracting only `aportesNoNeutros` in `resultadoDelMes` (D2 semantics untouched); the FULL investment cash term routes into `disponible` only.
- **Q1 (balance-core extraction): DEFERRED to Plan 03.** `computeCashEffect` is already pure and unit-testable in isolation, so no balance-core extraction was needed for this plan.

## TDD flow

- **RED (Task 1, `051e7e5`):** authored `cash-effects.test.ts` (22 `it()` cases) importing `@/lib/resumen/cash-effects` before the module existed. Suite failed with module-not-found, as expected.
- **GREEN (Task 2, `c2bb04b`):** implemented the minimal pure function; all 22 sign-table tests pass; full suite 99/99.
- **REFACTOR:** none needed — implementation matches the plan skeleton exactly.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Typed LoanPayment test fixtures with `id`/`createdAt`**
- **Found during:** Task 2 (typecheck after GREEN)
- **Issue:** Inline `{ date, amount }` payment literals in the test satisfied runtime but failed `tsc --noEmit` (real `LoanPayment` requires `id` and `createdAt`), which would break `next build`.
- **Fix:** Added a `makePayment()` helper producing full `LoanPayment` objects; replaced the three inline literals.
- **Files modified:** lib/resumen/cash-effects.test.ts
- **Commit:** c2bb04b

## Verification

- `npx vitest run lib/resumen/cash-effects.test.ts` → 22 passed (GREEN)
- `npx vitest run lib/resumen/month-metrics.test.ts` → 6 passed (regression, untouched)
- `npx vitest run` → 8 files, 99 passed (full suite gate)
- `npx tsc --noEmit` → no cash-effects type errors
- Purity grep (`React|localStorage|Date.now|useMemo|useState`) → matches only documentation prose, no code usage
- `adjustment` grep → comment lines only, no switch cases
- Anchor: June `currency_ars_to_usd` {arsAmount:362500, usdAmount:250} → ARS `-362500`, USD `+250`

## Notes for downstream plans

- No schema touched; `_migrationVersion` intact (calc-only phase, personal-finance app in production).
- `isInitial`/`pendingIngreso` are honored only as the existing engines already do — NOT reused as new exclusion flags.
- The `t.usdAmount!`/`t.amount!` non-null assertions were kept identical to the source engine (Transfer variants guarantee them by shape).

## Self-Check: PASSED
- FOUND: lib/resumen/cash-effects.ts
- FOUND: lib/resumen/cash-effects.test.ts
- FOUND commit: 051e7e5 (test RED)
- FOUND commit: c2bb04b (feat GREEN)
