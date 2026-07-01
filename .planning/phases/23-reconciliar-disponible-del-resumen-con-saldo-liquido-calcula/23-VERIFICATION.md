---
phase: 23-reconciliar-disponible-del-resumen-con-saldo-liquido-calcula
verified: 2026-07-01T13:10:00Z
status: passed
score: 7/7 must-haves verified
overrides_applied: 0
re_verification: false
---

# Phase 23: Reconciliar Disponible del Resumen con saldo líquido — Verification Report

**Phase Goal:** El "Disponible" del Resumen reconcilia con el saldo líquido de `calculateDualBalances` vía una función pura compartida (`computeCashEffect`) consumida por los tres motores; cambio de cálculo, sin migración.
**Verified:** 2026-07-01T13:10:00Z
**Status:** PASSED
**Re-verification:** No — initial verification

Note on revised acceptance criteria: The original AC-1 anchor ($28.168,76) and AC-3 (adjustment_ars becomes redundant post-reconciliation) were superseded by the data owner's Option-A decision documented in `23-DECISION-AND-AUDIT.md`. The revised anchors (−$691.171,40 / −$702.501,30 for ARS, 26.82 for USD) are what the reconciliation test actually asserts. This report evaluates against the REVISED criteria.

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | `computeCashEffect` exists as a pure function in `lib/resumen/cash-effects.ts` with no React/localStorage/Date.now | VERIFIED | File exists, 82 lines, zero React/storage imports; imports only `CurrencyType` and type aliases from `@/hooks/useMoneyTracker` |
| 2 | `computeCashEffect` is consumed by `computeMonthMetrics` | VERIFIED | `lib/resumen/month-metrics.ts` L34 imports and calls it at L135; `transfers`/`loans`/`usdPurchases`/`investments` all passed from `expense-tracker.tsx` L350-363 and L381-394 |
| 3 | `computeCashEffect` is consumed by `calculateDualBalances` (via `computeDualBalancesCore`) | VERIFIED | `hooks/useMoneyTracker.ts` L17 imports `computeDualBalancesCore`; L538-546 calls it; `computeDualBalancesCore` calls `computeCashEffect` for both ARS and USD at `lib/resumen/dual-balances-core.ts` L54-72 |
| 4 | `computeCashEffect` is consumed by `calculateAvailableForMonth` and `computeUsdAvailableForMonth` | VERIFIED | `hooks/useMoneyTracker.ts` L606-613 (calculateAvailableForMonth); `components/expense-tracker.tsx` L290-297 (computeUsdAvailableForMonth) — both import and call it directly |
| 5 | Zero-regression snapshot test locks `arsBalancePeriod=3420058.73` / `usdBalancePeriod=1.69` and passes | VERIFIED | `lib/resumen/dual-balances-core.test.ts` defines `SNAPSHOT_ARS_PERIOD=3420058.73` and `SNAPSHOT_USD_PERIOD=1.69`; 2 tests pass (confirmed by `npx vitest run` — 111/111 passed) |
| 6 | Reconciliation test asserts revised anchors (ARS −691171.40 / chained −702501.30, USD 26.82) and passes | VERIFIED | `lib/resumen/reconciliation.test.ts` computes `JUNE_ARS_LIQUID_FLOW = 3420058.73 − 4111230.13 = -691171.40`; 6 tests in the suite all pass including PRIMARY ARS/USD anchors and CUADRE IS REDUNDANT (AC-3) |
| 7 | `_migrationVersion` untouched; `isInitial`/`pendingIngreso` not reused as new exclusion flags | VERIFIED | `_migrationVersion` remains at 8 (unchanged from pre-phase); `computeCashEffect` reads `isInitial`/`pendingIngreso` only to SKIP movements (same as before, not as new flags); no new boolean fields introduced in schema |

**Score:** 7/7 truths verified

---

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `lib/resumen/cash-effects.ts` | Pure `computeCashEffect` + `CashEffectInput` type | VERIFIED | 82 lines; exports `computeCashEffect` and `CashEffectInput`; handles transfers (ars_to_usd, usd_to_ars, cash_out, cash_in), loans (preste/debo), usdPurchases, and investment movements; excludes adjustment_ars/adjustment_usd |
| `lib/resumen/dual-balances-core.ts` | `computeDualBalancesCore` wrapping `computeCashEffect` + separate adjustment pass | VERIFIED | 75 lines; adds adjustment_ars/adjustment_usd separately after computeCashEffect to stay byte-identical with pre-refactor calculateDualBalances |
| `lib/resumen/liquid-balance.ts` | `computeLiquidFlowForMonth` — test-only pure reference engine | VERIFIED | 73 lines; computes salary+incomes−expenses+computeCashEffect; used only by reconciliation.test.ts (intentionally test-only per Q1 decision) |
| `lib/resumen/month-metrics.ts` | `computeMonthMetrics` absorbing cashEffect into `disponible` | VERIFIED | Updated formula at L152: `disponible = sobranteAnteriorRaw + ingresosMes − totalGastos + cashEffect`; `resultadoDelMes` unchanged (preserves D2 semantics); `transfers`/`loans`/`usdPurchases` optional fields with `[]` defaults |
| `lib/resumen/dual-balances-core.test.ts` | Zero-regression snapshot test | VERIFIED | 2 tests, reconstructs arsBalancePeriod and usdBalancePeriod from scratch against real backup fixture |
| `lib/resumen/reconciliation.test.ts` | Permanent reconciliation regression net | VERIFIED | 6 tests; uses real backup `expense-tracker-backup-2026-06-30.json`; PRIMARY anchors assert −691171.40 (ARS flow) and 26.82 (USD flow); SECONDARY consistency layer; AC-3 cuadre-redundancy proof |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `lib/resumen/cash-effects.ts` | `lib/resumen/month-metrics.ts` | import + call in `computeMonthMetrics` | WIRED | L33 import, L135 call with `transfers ?? []`, `loans ?? []`, `usdPurchases ?? []`, `investments` |
| `lib/resumen/cash-effects.ts` | `lib/resumen/dual-balances-core.ts` | import + call in `computeDualBalancesCore` | WIRED | L21 import, called twice (ARS at L54, USD at L65) |
| `lib/resumen/dual-balances-core.ts` | `hooks/useMoneyTracker.ts :: calculateDualBalances` | import + call | WIRED | L17 import, L538 `computeDualBalancesCore({...})`, result used at L545-546 |
| `lib/resumen/cash-effects.ts` | `hooks/useMoneyTracker.ts :: calculateAvailableForMonth` | import + call | WIRED | L16 import, L606 `computeCashEffect({currency: ARS, ...})` replaces old inline block |
| `lib/resumen/cash-effects.ts` | `components/expense-tracker.tsx :: computeUsdAvailableForMonth` | import + call | WIRED | L91 import, L290 `computeCashEffect({currency: USD, ...})` |
| `components/expense-tracker.tsx` | `computeMonthMetrics` in `computeChainedDisponible` | `transfers`/`loans`/`usdPurchases` passed | WIRED | L350-363 (ARS chained), L381-394 (USD chained) — all three data arrays passed to `computeMonthMetrics` |
| `lib/resumen/liquid-balance.ts` | `lib/resumen/reconciliation.test.ts` | import + call in test fixture | WIRED | Test imports and uses `computeLiquidFlowForMonth` for sobrante chaining and primary anchor assertions |

---

### Data-Flow Trace (Level 4)

`computeCashEffect` is a pure computation function (not a renderer), so Level 4 data-flow is verified through the reconciliation test rather than UI data-flow tracing. The test reads from the REAL backup file (`expense-tracker-backup-2026-06-30.json`) — a live fixture, not a mock — and produces concrete numeric results. The PRIMARY test assertions derive anchors independently from `calculateDualBalances`'s own `arsBalancePeriod`/`usdBalancePeriod` values (snapshot-locked in `dual-balances-core.test.ts`), making them non-tautological.

| Artifact | Data Source | Real Data | Status |
|----------|-------------|-----------|--------|
| `computeCashEffect` | Caller-injected arrays (transfers, loans, usdPurchases, investments) from live backup | Yes — reconciliation test uses real backup fixture with $4.1M cuadre present | FLOWING |
| `computeMonthMetrics.disponible` | `computeCashEffect` + salary + expenses from `monthlyData` passed by `expense-tracker.tsx` | Yes — arrays passed from component state, not empty at call sites | FLOWING |

---

### Behavioral Spot-Checks

| Behavior | Method | Result | Status |
|----------|--------|--------|--------|
| All 111 tests pass including reconciliation anchors | `npx vitest run` | 10 test files, 111 tests, 0 failures, 3.04s | PASS |
| `computeCashEffect` exports verified | File read + grep | `export function computeCashEffect` and `export interface CashEffectInput` present | PASS |
| `_migrationVersion` unchanged | grep `useMoneyTracker.ts` | `_migrationVersion: 8` — unchanged | PASS |
| No new schema fields (no new exclusion flags) | grep for new boolean fields in schema-touching files | No new flags added; existing `isInitial`/`pendingIngreso` only read, not repurposed | PASS |

---

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| AC-1 (revised) | Plans 01, 02, 03 | June 2026 ARS Disponible = −691171.40 (flow) / −702501.30 (chained) | SATISFIED | `reconciliation.test.ts` PRIMARY tests assert these values and pass |
| AC-2 | Plans 02, 03 | Both engines reconcile (ARS + USD) | SATISFIED | SECONDARY consistency tests in `reconciliation.test.ts` pass; both engines share `computeCashEffect` |
| AC-3 (revised) | Plan 03 | adjustment_ars cuadre correctly excluded (not made redundant per original) | SATISFIED | `computeCashEffect` excludes adjustment types; AC-3 CUADRE IS REDUNDANT test proves flow is correct DESPITE $4.1M present in fixture |
| AC-4 | Plans 01, 02, 03 | No schema change, `_migrationVersion` untouched | SATISFIED | `_migrationVersion` remains 8; no new fields in `MonthlyData`; `transfers`/`loans`/`usdPurchases` were already in schema |
| AC-5 | Plan 02 | Zero regression on `arsBalancePeriod`/`usdBalancePeriod` | SATISFIED | Snapshot test `dual-balances-core.test.ts` asserts byte-identical values 3420058.73 / 1.69 |
| AC-6 | Plans 01, 03 | Permanent regression test net | SATISFIED | 4 test files cover the new code: `cash-effects.test.ts` (sign table), `month-metrics.test.ts` (D2 preservation), `dual-balances-core.test.ts` (snapshot), `reconciliation.test.ts` (fixture anchors) |

---

### Anti-Patterns Found

None blocking. Specific notes:

- `computeLiquidFlowForMonth` in `liquid-balance.ts` is intentionally test-only and not wired into live engines (Q1 decision, documented in Plan 23-03 SUMMARY). This is by design — re-wiring carried wizard-month display risk for zero net benefit. No anti-pattern.
- `isInitial`/`pendingIngreso` are read inside `computeCashEffect` to SKIP movements (same semantics as original engines). Not reused as new exclusion flags. Constraint met.

---

### Human Verification Required

None. The reconciliation is fully verifiable programmatically via the fixture test suite. The test runs against real backup data and produces concrete numeric assertions.

---

### Gaps Summary

No gaps. All 7 must-haves verified. The revised acceptance criteria (Option A semantics, −$691.171,40 / −$702.501,30 anchors) are correctly implemented and locked by passing tests. The full vitest suite (111 tests, 10 files) passes without flaking.

---

_Verified: 2026-07-01T13:10:00Z_
_Verifier: Claude (gsd-verifier)_
