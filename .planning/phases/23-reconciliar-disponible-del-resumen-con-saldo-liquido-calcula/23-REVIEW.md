---
phase: 23-reconciliar-disponible-del-resumen-con-saldo-liquido-calcula
reviewed: 2026-07-01T00:00:00Z
depth: standard
files_reviewed: 6
files_reviewed_list:
  - lib/resumen/cash-effects.ts
  - lib/resumen/dual-balances-core.ts
  - lib/resumen/liquid-balance.ts
  - lib/resumen/month-metrics.ts
  - hooks/useMoneyTracker.ts
  - components/expense-tracker.tsx
findings:
  critical: 1
  warning: 3
  info: 2
  total: 6
status: issues_found
---

# Phase 23: Code Review Report

**Reviewed:** 2026-07-01
**Depth:** standard
**Files Reviewed:** 6
**Status:** issues_found

## Summary

Phase 23 introduces `computeCashEffect` as the single source of truth for liquid-cash sign logic, consumes it in `computeDualBalancesCore` (period ARS/USD balances for `calculateDualBalances`), `calculateAvailableForMonth`, `computeUsdAvailableForMonth`, and wires it into `computeMonthMetrics` for the Resumen card reconciliation.

The sign table in `computeCashEffect` is correct across all movement types: currency conversions are symmetric (ARS↔USD at both sides), usdPurchases credit USD and debit tracked ARS, cash_in/out match currency-tagged amounts, loan preste/debo semantics are faithful, and investment aporte(-)/retiro(+) with `receivedAmount` priority are all correct. The `adjustment_ars/usd` exclusion (Q3) is correctly implemented and consistently applied. No double-counting was found between the accumulated loops in `calculateDualBalances` and the period contribution from `computeDualBalancesCore`.

One critical finding concerns an internal inconsistency in the `MonthMetrics` object returned for the wizard month: the `cashEffect` field and the `disponible` field are computed from different sources. Three warnings cover: (1) a silent TypeScript exhaustiveness gap in the switch statement when new `TransferType` values are added; (2) an asymmetric boundary condition between `computeChainedDisponible` (ARS, uses `<`) and `computeChainedDisponibleUsd` (USD, uses `<=`) that creates a maintenance trap; (3) a non-null assertion on `t.amount!` in adjustments that silently produces `NaN` if the field is absent.

---

## Critical Issues

### CR-01: Wizard-month `MonthMetrics` has inconsistent `cashEffect` vs `disponible`

**File:** `components/expense-tracker.tsx:447-450`

**Issue:** When `selectedMonth === wizardMonth`, the `arsMetrics` memo overrides `disponible` with `calculateAvailableForMonth(selectedMonth)` — a value that includes the wizard's `adjustment_ars` seed. However, the `base` object computed by `computeMonthMetrics` (lines 430-446) has `cashEffect` computed by `computeCashEffect`, which intentionally EXCLUDES `adjustment_ars`. The returned `MonthMetrics` for the wizard month therefore carries two inconsistent numbers:

- `metrics.disponible` = includes wizard adjustment (via `calculateAvailableForMonth`)
- `metrics.cashEffect` = excludes wizard adjustment (via `computeCashEffect`)

Any consumer that reconstructs disponible as `sobranteAnterior + ingresosMes - totalGastos + cashEffect` will not match `metrics.disponible`. If a future component does this reconstruction (e.g. a breakdown tooltip or a test assertion), it will silently show the wrong figure. In a financial-correctness-critical app, having two fields in the same struct describe different realities of the same month is a latent correctness hazard.

**Fix:** Either (a) make `cashEffect` in the returned struct reflect the wizard adjustment when overriding `disponible`, or (b) add the wizard adjustment inside `computeMonthMetrics` itself (guarded by the wizard-month detection that already exists in `calculateAvailableForMonth`) so the struct is internally consistent. Option (b) is cleaner:

```typescript
// In arsMetrics useMemo, instead of overriding disponible post-hoc:
if (selectedMonth === wizardMonth) {
  // Re-compute with wizard adjustment folded in so cashEffect + disponible are consistent
  const wizardAdjustment = (monthlyData.transfers || [])
    .filter((t) => t.type === "adjustment_ars" && arsIsInRange(t.date))
    .reduce((sum, t) => sum + (t.amount ?? 0), 0);
  return {
    ...base,
    cashEffect: base.cashEffect + wizardAdjustment,
    disponible: base.disponible + wizardAdjustment,
  };
}
```

---

## Warnings

### WR-01: Non-null assertion `t.amount!` on structurally-optional field in adjustment path

**File:** `lib/resumen/dual-balances-core.ts:50-51`

**Issue:** `Transfer.amount` is typed as `amount?: number` (optional). The adjustment accumulation loop uses `t.amount!`:

```typescript
if (t.type === "adjustment_ars") arsAdjustmentInRange += t.amount!;
else if (t.type === "adjustment_usd") usdAdjustmentInRange += t.amount!;
```

If an `adjustment_ars` or `adjustment_usd` transfer ever reaches storage without an `amount` (e.g. due to a future UI bug, an import from a third-party export, or a manually edited backup), `t.amount!` evaluates to `undefined`, and `arsAdjustmentInRange += undefined` silently produces `NaN`. `NaN` then propagates through `arsPeriodCash` into `arsBalance`, corrupting every downstream display that depends on the period balance.

The same pattern exists in `hooks/useMoneyTracker.ts` lines 496, 499 and in the accumulated transfer loop (lines 474-502), but those predate Phase 23. The Phase 23 code in `dual-balances-core.ts` should set the right example.

**Fix:**
```typescript
if (t.type === "adjustment_ars") arsAdjustmentInRange += t.amount ?? 0;
else if (t.type === "adjustment_usd") usdAdjustmentInRange += t.amount ?? 0;
```

---

### WR-02: Asymmetric boundary condition between ARS and USD chained-disponible functions

**File:** `components/expense-tracker.tsx:322` vs `371`

**Issue:** `computeChainedDisponible` (ARS) uses strict-less-than for the base case:
```typescript
if (!wizardMonth || monthKey < wizardMonth) {
  return calculateAvailableForMonth(monthKey);
}
```
Then a separate branch handles `monthKey === wizardMonth` (line 325).

`computeChainedDisponibleUsd` (USD) uses less-than-or-equal:
```typescript
if (!wizardMonth || monthKey <= wizardMonth) {
  return computeUsdAvailableForMonth(monthKey);
}
```
This collapses both the "before wizard" and "wizard month" cases into one branch with no separate handling.

Today these produce the same result for the wizard month because neither USD path needs special wizard-month treatment. But the ARS version's structure exists precisely because the wizard month was special and required the `calculateAvailableForMonth` override (line 325). If the USD path ever needs wizard-month special-casing (e.g. a `adjustment_usd` seed is introduced), the `<=` boundary will route that month into the wrong base case silently, and no structural reminder exists to add the override.

**Fix:** Align the USD version's structure to match ARS for maintainability:
```typescript
const computeChainedDisponibleUsd = useCallback((monthKey: string): number => {
  if (!wizardMonth || monthKey < wizardMonth) {
    return computeUsdAvailableForMonth(monthKey);
  }
  if (monthKey === wizardMonth) {
    return computeUsdAvailableForMonth(monthKey); // same result, explicit for symmetry
  }
  // months after wizard: chain
  const prevKey = format(subMonths(parse(monthKey, "yyyy-MM", new Date()), 1), "yyyy-MM");
  const sobranteAnterior = prevKey === wizardMonth ? 0 : computeChainedDisponibleUsd(prevKey);
  // ... rest unchanged
```

---

### WR-03: `switch` on `TransferType` in `computeCashEffect` has no exhaustiveness guard

**File:** `lib/resumen/cash-effects.ts:52-58`

**Issue:** The `switch` over `t.type` handles four cases and a comment for the two excluded ones, but has no `default` branch. TypeScript does not flag this because `switch` on a union type without `default` is not an error — it's only exhaustive-checked if you use a `never` narrowing pattern. If a new `TransferType` value is added to the union in the future (e.g. `"currency_digital"`, `"split_payment"`), it will silently pass through with zero cash effect. Since `computeCashEffect` is the designated single source of truth for cash sign logic, a silent miss here means the new type would be invisible to ALL three engines consuming this function simultaneously — a systemic blind spot.

**Fix:** Add a `default` branch that asserts exhaustiveness, which TypeScript will flag as a compile error when new variants are added:
```typescript
default: {
  // Exhaustiveness guard: if a new TransferType is added, this becomes a TS error.
  const _: never = t.type;
  void _;
  break;
}
```
Note: `adjustment_ars` and `adjustment_usd` are intentionally excluded (Q3), so they must be listed as explicit `case` branches before the `default` (just a `break` with no delta change), or the guard will fire on them. The cleanest approach:
```typescript
case "adjustment_ars":
case "adjustment_usd":
  break; // intentionally excluded (Q3 — cuadre/seed artifacts)
default: {
  const _: never = t.type;
  void _;
}
```

---

## Info

### IN-01: `sumAportes` iterates investment movements separately from `computeCashEffect`

**File:** `lib/resumen/month-metrics.ts:75-95, 129-130`

**Issue:** `computeMonthMetrics` calls `sumAportes` twice (lines 129-130) and then `computeCashEffect` (line 135). Both `sumAportes` and `computeCashEffect` iterate over `inv.movements` for investments. The same movements array is traversed three times total (once for `aportesAll`, once for `aportesNoNeutros`, once inside `computeCashEffect`). There is no double-counting in the final numbers (they feed separate output fields: `aportesAll`, `aportesNoNeutros`, and `cashEffect`). This is a clarity trade-off: three separate passes make the code easier to read and test in isolation.

No action required unless profiling shows it is a concern, but it's worth noting that `sumAportes` and the investments branch of `computeCashEffect` share the same `!isInitial && !pendingIngreso && type === "aporte"` filter path, and any future change to that filter condition must be applied in both places.

**Fix (optional):** Document this explicitly in a comment above `sumAportes` or `computeMonthMetrics` so future editors know to keep the exclusion predicates (`isInitial`, `pendingIngreso`) in sync:
```typescript
// NOTE: sumAportes and computeCashEffect both iterate investment movements.
// They share the same exclusion predicates (isInitial, pendingIngreso).
// If you change either, update the other.
```

---

### IN-02: Implicit `undefined` propagation risk for `Transfer.usdAmount` / `arsAmount` in conversions

**File:** `lib/resumen/cash-effects.ts:53-54`

**Issue:** `currency_ars_to_usd` uses `t.usdAmount!` and `t.arsAmount!`; `currency_usd_to_ars` uses the same. These fields are defined as `arsAmount?: number` and `usdAmount?: number` on `Transfer`. The `!` non-null assertion is idiomatic here because the UI always sets these fields for conversion transfers, but if a manually-patched backup omits one (e.g. a user edits the JSON export and deletes `usdAmount`), the assertion silently produces `NaN` which propagates through the balance.

This is a lower-risk variant of WR-01 (the adjustment fields are more likely to be accidentally omitted than conversion fields since adjustments are simpler and sometimes created programmatically), but follows the same pattern.

**Fix (optional hardening):** Use nullish coalescing as a defensive belt-and-suspenders:
```typescript
case "currency_ars_to_usd": delta += isUsd ? (t.usdAmount ?? 0) : -(t.arsAmount ?? 0); break;
case "currency_usd_to_ars": delta += isUsd ? -(t.usdAmount ?? 0) : (t.arsAmount ?? 0); break;
```

---

_Reviewed: 2026-07-01_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
