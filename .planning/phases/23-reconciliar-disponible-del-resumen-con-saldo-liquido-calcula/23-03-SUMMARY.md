---
phase: 23-reconciliar-disponible-del-resumen-con-saldo-liquido-calcula
plan: 03
subsystem: resumen / cash engine
tags: [reconciliation, fixture-test, vitest, billetera-anchor, cuadre-redundancy, ars-usd]
requires:
  - "lib/resumen/cash-effects.ts :: computeCashEffect (Plan 23-01)"
  - "lib/resumen/month-metrics.ts :: computeMonthMetrics.disponible absorbs cashEffect (Plan 23-02)"
provides:
  - "lib/resumen/liquid-balance.ts :: computeLiquidFlowForMonth(LiquidFlowInput) => number (pure reference engine)"
  - "lib/resumen/reconciliation.test.ts :: permanent regression net (June ARS/USD billetera anchors + cuadre redundancy)"
  - "package.json :: \"test\": \"vitest run\" script"
affects:
  - "future: any change to computeCashEffect / computeMonthMetrics is now guarded by the billetera anchors"
tech-stack:
  added: []
  patterns:
    - "Fixture-driven reconciliation: reconstruct the Resumen flow anchor independently from calculateDualBalances' own billetera close (period balance minus cuadre)"
    - "sobrante DERIVED by chaining the prior month through the pure reference engine (no hardcoded magic number as test input)"
key-files:
  created:
    - lib/resumen/liquid-balance.ts
    - lib/resumen/reconciliation.test.ts
  modified:
    - package.json
decisions:
  - "Q1: computeLiquidFlowForMonth kept TEST-ONLY (not re-wired into live engines — they already delegate to computeCashEffect after 23-02; re-wrapping carried wizard-month display risk for zero benefit)"
  - "Primary anchor corrected: June ARS liquid flow = -691171.40 (period) / -702501.30 (chained), NOT the stale $28.168,76 — see Deviations"
  - "Anchors are billetera-derived (arsBalancePeriod/usdBalancePeriod minus in-range cuadre), making them non-tautological vs the both-engines consistency layer"
metrics:
  duration: "~9 min"
  completed: "2026-07-01"
  tasks: 2
  files: 3
  tests_added: 6
---

# Phase 23 Plan 03: Fixture reconciliation regression net Summary

Built the phase's permanent validation: a fixture-driven vitest test that reconstructs June 2026's Resumen "Disponible" liquid flow INDEPENDENTLY from the real backup's own billetera close and asserts it equals the honest saldo líquido — proving the reconciliation holds AND that the $4.1M `adjustment_ars` cuadre is redundant. Extracted a faithful pure reference engine (`computeLiquidFlowForMonth`) and added the `"test"` script.

## Final assertions (primary vs secondary)

| Level | Assertion | Value | Why it holds |
|-------|-----------|-------|--------------|
| PRIMARY (non-tautological) | June ARS liquid flow == billetera close − cuadre | **-691171.40** = `3420058.73 − 4111230.13` | Reconstructed from `calculateDualBalances`' OWN `arsBalancePeriod` (snapshot-locked in dual-balances-core.test.ts) minus the in-range cuadre. NOT produced by the engine under test. |
| PRIMARY (non-tautological) | June USD liquid flow == billetera close − cuadre | **26.82** = `1.69 − (−25.13)` | Same reconstruction for USD. |
| SECONDARY (consistency) | `computeMonthMetrics(...).disponible − sobrante == computeLiquidFlowForMonth(June)` | ARS & USD | Both call `computeCashEffect` → tautological alone; a guard layered on top of the anchors. |
| CUADRE-REDUNDANCY (AC-3) | chained ARS disponible `toBeLessThan(1_000_000)` AND `== sobrante + flow` | **-702501.30** | Proves the $4.1M cuadre (present in the fixture) is harmlessly ignored — if it leaked in, disponible would be ≈ +3.4M. |
| Sanity | fixture actually CONTAINS the 2026-06-30 `adjustment_ars` (~$4.1M) and `adjustment_usd` (−25.13) | — | Guarantees the redundancy test runs against cuadre-carrying data. |

## Exact June numbers reproduced and their billetera source

Reconstructed with node against `expense-tracker-backup-2026-06-30.json` (payDay=1, periodo, 2026-06-01..2026-06-30):

- June salary = **2364969** (May effectiveDate resolves for June via getSalaryForMonth — sourced from `salaryHistory.entries`).
- June ARS gastos = 1264339.40 ; otros ingresos = 0.
- June ARS cashEffect components: conversion `currency_ars_to_usd` −362500 (2026-06-04) + préstamo `preste` −333334 (2026-06-30) + investment aportes net −1095967 = **−1791801**.
- June ARS liquid flow = `2364969 − 1264339.40 − 1791801` = **−691171.40** — identical to `arsBalancePeriod (3420058.73) − cuadre (4111230.13)`.
- June USD liquid flow = **26.82** = `usdBalancePeriod (1.69) − cuadre (−25.13)`.

## How May chaining derives the sobrante (no hardcode)

`sobranteJunArs` / `sobranteJunUsd` are computed by calling `computeLiquidFlowForMonth` for MAY (`isInRangeMay`, built from `getFilterDateRange("2026-05","periodo",1)`) on the real backup:
- May ARS flow ≈ **−11329.90** → junio's ARS sobrante.
- May USD flow ≈ **5.56** → junio's USD sobrante.

These are used as `sobranteAnteriorRaw` for the June `computeMonthMetrics` call. Chained June ARS disponible = `−11329.90 + (−691171.40)` = **−702501.30**. Expected values are kept only as `//` sanity comments, never as test inputs.

## How the cuadre-redundancy test uses the real $4.1M data

The test asserts `md.transfers.some(t => t.type === "adjustment_ars" && t.date === "2026-06-30")` and that its amount ≈ 4111230.13 BEFORE the flow assertions, so the redundancy test is provably running against data that CONTAINS the cuadre. `computeCashEffect` excludes adjustments (Plan 23-01 Q3), so the chained disponible (−702501.30) is `toBeLessThan(1_000_000)` — proving the $4.1M is ignored, not off-by-4.1M.

## Q1 balance-core extraction: kept test-only

`computeLiquidFlowForMonth` is a faithful pure extraction of `calculateAvailableForMonth`/`computeUsdAvailableForMonth`, but was NOT wired back into the live engines. After Plan 23-02 those engines already delegate to `computeCashEffect` (single source of truth for the cash block); re-wrapping them onto this function would risk the wizard-month display (which re-adds the seed adjustment_ars) for zero net benefit. It serves purely as the test's reference engine.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Corrected the stale $28.168,76 primary anchor to the billetera-derived value**
- **Found during:** Task 2 (reconstructing the June anchor with node against the real backup, before writing the test).
- **Issue:** The plan's stated PRIMARY anchor `$28.168,76 = $390.668,76 − $362.500` rests on the premise that the ONLY cash movement the Plan-01/02 fix folds into June's Disponible is the 2026-06-04 currency conversion. Reconstructed against the REAL backup, that premise is stale: the fix changed Disponible from subtracting `aportesNoNeutros` ($764.000) to absorbing the FULL `cashEffect`, which additionally folds in the previously-ignored 2026-06-30 préstamo (−$333.334) and June investment aportes (net −$1.095.967). The correct June ARS liquid flow is therefore **−$691.171,40** (period) / **−$702.501,30** (chained with May), NOT $28.168,76. Asserting $28.168,76 would require faking the data. RESEARCH assumption A1 explicitly flagged the $390.668,76 baseline as coming from the PROMPT (not the live engine) and warned "if baseline differs, target arithmetic shifts."
- **Fix:** Anchored the PRIMARY assertions to the billetera-derived truth (`arsBalancePeriod − cuadre` = −691171.40 ARS ; `usdBalancePeriod − cuadre` = 26.82 USD), which is even MORE non-tautological than the plan intended — it ties the Resumen flow directly to `calculateDualBalances`' own period close stripped of the cuadre, and directly proves AC-3 (cuadre redundant). Documented the correction prominently in the test-file header.
- **Files modified:** lib/resumen/reconciliation.test.ts
- **Commit:** e47c092

## Verification

- `npx vitest run lib/resumen/reconciliation.test.ts` → 6 passed
- `npx vitest run` (full suite) → 10 files, 111 passed (was 105 + 6 new)
- `npx tsc --noEmit` → exit 0
- Anchors reconstructed independently with node: ARS −691171.40 = 3420058.73 − 4111230.13 ; USD 26.82 = 1.69 − (−25.13)
- sobrante derived from May via `computeLiquidFlowForMonth` (isInRangeMay); no hardcoded May input
- `grep "writeFileSync"` → 0 (backup read-only)
- `_migrationVersion` untouched (calc-only phase); no schema/localStorage change

## Self-Check: PASSED
