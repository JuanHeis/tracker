---
phase: 22-resumen-del-mes-rediseno-conceptual-de-cash-flow
reviewed: 2026-06-01T00:00:00Z
depth: standard
files_reviewed: 12
files_reviewed_list:
  - components/expense-tracker.tsx
  - components/investment-purpose-wizard/investment-purpose-wizard.tsx
  - components/investment-purpose-wizard/purpose-suggestion.ts
  - components/investment-row.tsx
  - components/investments-table.tsx
  - components/resumen-card.tsx
  - components/settings-panel.tsx
  - hooks/useInvestmentsTracker.ts
  - hooks/useMoneyTracker.ts
  - lib/resumen/deficit-detector.ts
  - lib/resumen/month-metrics.ts
  - lib/resumen/resumen-config.ts
findings:
  critical: 0
  warning: 5
  info: 4
  total: 9
status: issues_found
---

# Phase 22: Code Review Report

**Reviewed:** 2026-06-01
**Depth:** standard
**Files Reviewed:** 12
**Status:** issues_found

## Summary

Phase 22 introduces the Resumen del Mes redesign: a pure `computeMonthMetrics` engine, a `evaluateDeficitState` engine, `ResumenConfig` localStorage persistence, and the `InvestmentPurposeWizard` one-shot migration modal. The new `lib/resumen/` modules are well-structured pure functions with clean separation of concerns. The primary issues found are: a stale-closure bug in the wizard's `useEffect` dependency array, an incorrect currency symbol hardcoded to `$` in the aguinaldo display block of `ResumenCard`, a double-clear race condition in `handleResetAllData`, a missing guard in `migrateData` that allows the `purpose` field to be silently dropped for existing investments, and several minor quality issues.

---

## Warnings

### WR-01: Stale closure in `InvestmentPurposeWizard` — `initialAssignments` captured at mount

**File:** `components/investment-purpose-wizard/investment-purpose-wizard.tsx:56-62`

**Issue:** `initialAssignments` is a plain function defined inside the component body — it closes over `investments` from the current render. However `useState(initialAssignments)` (lazy initializer form) is only called **once** at mount, and the `useEffect` that re-seeds when `open` changes calls `initialAssignments()` at that point. The issue is the `useEffect` dependency array `[open, investments.length]`: if the `investments` array reference changes (e.g. after a purpose update elsewhere) without `investments.length` changing, the re-seed will not fire. More concretely, `initialAssignments` itself is recreated on every render but is not in the deps array, so the effect always closes over whichever `investments` was captured at the time of the effect callback definition — which is the most recent render. This is the correct behaviour only by coincidence (the eslint suppression comment confirms the author was uncertain). The real latent bug is: if two investments are removed and two others added simultaneously (same length), the wizard will open with stale data.

**Fix:** Replace the length-based dependency with a stable identity reference so the comparison is exact:
```tsx
// Replace:
useEffect(() => {
  if (open) setAssignments(initialAssignments());
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [open, investments.length]);

// With:
useEffect(() => {
  if (open) {
    const map: Record<string, InvestmentPurpose> = {};
    for (const inv of investments) {
      map[inv.id] = inv.purpose ?? suggestPurpose({ name: inv.name, type: inv.type });
    }
    setAssignments(map);
  }
}, [open, investments]); // investments reference changes when parent updates state
```
The parent already rebuilds the array reference on every wizard open, so this is safe.

---

### WR-02: Aguinaldo amount displayed with hardcoded `$` instead of currency-aware symbol

**File:** `components/resumen-card.tsx:317-323`

**Issue:** The aguinaldo `FormattedAmount` lines inside the display block pass `currency="$"` rather than `currencyTagForFmt`. If the component is ever rendered for a USD view with an aguinaldo value (currently prevented by `showAguinaldoLine = !isUsd`, but the same hardcoded `$` symbol appears twice in the tooltip at lines 322-323 and once in the preview banner at line 224), the preview banner at line 224 will always show `$` regardless of the active currency. This is inconsistent with every other `FormattedAmount` call in the file.

**Fix:**
```tsx
// Line 224 — preview banner:
<FormattedAmount value={aguinaldoPreview.estimatedAmount} currency={currencyTagForFmt} />
// (50% de <FormattedAmount value={aguinaldoPreview.bestSalary} currency={currencyTagForFmt} />)

// Line 317 — display value:
<FormattedAmount value={aguinaldoAmount} currency={currencyTagForFmt} />

// Lines 322-323 — tooltip:
<p>50% del mejor ingreso fijo del semestre (<FormattedAmount value={aguinaldoInfo.bestSalary} currency={currencyTagForFmt} />)</p>
```

---

### WR-03: `handleResetAllData` in `ExpenseTracker` clears a subset of keys; `SettingsPanel` "Re-ejecutar wizard" clears `STORAGE_KEYS` then also removes the same keys — double-clear divergence

**File:** `components/expense-tracker.tsx:623-634` and `components/settings-panel.tsx:724-728`

**Issue:** `handleResetAllData` (expense-tracker.tsx lines 623-634) manually enumerates specific keys and does NOT include `customAnnualRates` or any keys from `STORAGE_KEYS`. The "Re-ejecutar wizard" button in `SettingsPanel` (lines 724-728) uses `STORAGE_KEYS.forEach(key => localStorage.removeItem(key))` but ALSO manually removes `SAVINGS_RATE_KEY` and `RESUMEN_CONFIG_KEY` separately, implying those two are not in `STORAGE_KEYS`. If `STORAGE_KEYS` grows or changes, the two reset paths will diverge further, leaving orphaned data in localStorage after a reset. This risks corrupted state on the next boot if a migration expects a field that was partially cleared.

**Fix:** Centralise the reset list in a single constant (e.g. extend `STORAGE_KEYS`) and call it from both handlers:
```ts
// In useDataPersistence or a shared constants file:
export const ALL_STORAGE_KEYS = [
  ...STORAGE_KEYS,
  SAVINGS_RATE_KEY,
  RESUMEN_CONFIG_KEY,
  "customAnnualRates",
  "lastUsedUsdRate",
];

// Both reset paths:
ALL_STORAGE_KEYS.forEach((key) => localStorage.removeItem(key));
window.location.reload();
```

---

### WR-04: Migration in `migrateData` silently drops `purpose` field for existing investments

**File:** `hooks/useMoneyTracker.ts:212-233`

**Issue:** The investment migration block (lines 212-233) reconstructs each investment using an explicit object literal that lists only known fields. The `purpose` field is **not** included in the spread/re-assignment. Any investment that already has a `purpose` stored in localStorage will have it silently dropped back to `undefined` every time `migrateData` runs (i.e., every app boot), because `migrateData` runs unconditionally on every load. After the drop, `getInvestmentPurpose` returns `"ahorro"` as the fallback — so the *wizard* marks it `needsPurposeWizard = false` (because `wizardCompletedAt` is set), and the user-assigned purpose is permanently lost.

**Fix:** Add `purpose` to the migration object:
```ts
investments: (data.investments || []).map((investment: any) => ({
  id: investment.id,
  name: investment.name,
  type: investment.type,
  currencyType: investment.currencyType || CurrencyType.ARS,
  status: investment.status || "Activa",
  movements: investment.movements || [/* ... */],
  currentValue: investment.currentValue ?? investment.amount ?? 0,
  lastUpdated: investment.lastUpdated || investment.date || new Date().toISOString().split('T')[0],
  createdAt: investment.createdAt || investment.date || new Date().toISOString().split('T')[0],
  // Preserve existing purpose (undefined is fine — getInvestmentPurpose handles it)
  ...(investment.purpose !== undefined && { purpose: investment.purpose }),
  ...(investment.isLiquid && { isLiquid: true }),
  ...(investment.tna !== undefined && { tna: investment.tna }),
  ...(investment.plazoDias !== undefined && { plazoDias: investment.plazoDias }),
  ...(investment.startDate !== undefined && { startDate: investment.startDate }),
})),
```
The same pattern is already used for `isLiquid`, `tna`, `plazoDias`, and `startDate`.

---

### WR-05: `evaluateDeficitState` threshold triggers when `lastSalary = 0`

**File:** `lib/resumen/deficit-detector.ts:34`

**Issue:** When `lastSalary` is 0 (e.g. freelancer with no salary entry, or USD view where salary is hardcoded to 0), `threshold = 0`. Any non-zero `cumulativeDeficit` will satisfy `cumulative > threshold` and trigger the `recurrente` banner immediately — even if the deficit is a single cent. This causes false positives for USD-mode users on every boot.

**Fix:** Guard against the zero-salary case:
```ts
const threshold = lastSalary > 0
  ? (lastSalary * thresholdPercent) / 100
  : Infinity;  // Can't be exceeded — disable the cumulative trigger
```
Note: the `consecutive >= 2` path still works correctly for the USD case, which is the intended detection method when no salary baseline exists.

---

## Info

### IN-01: `computeUsdAvailableForMonth` in `ExpenseTracker` duplicates logic from `calculateAvailableForMonth` in `useMoneyTracker`

**File:** `components/expense-tracker.tsx:278-314`

**Issue:** `computeUsdAvailableForMonth` (lines 278-314) is a 36-line inline function that mirrors almost exactly the structure of `calculateAvailableForMonth` in `hooks/useMoneyTracker.ts` (lines 578-658), but for USD only. This creates two maintenance surfaces for the same cash-flow iteration logic. If a new transfer type or loan edge case is added to one, the other may lag behind.

**Fix:** Consider extracting a shared `computeAvailableForMonthByCurrency(monthKey, currency)` utility or extending `calculateAvailableForMonth` to return both ARS and USD in a single pass, then exposing the pair from `useMoneyTracker`.

---

### IN-02: `resultadoHistoryArs` loop re-implements aguinaldo lookup inline

**File:** `components/expense-tracker.tsx:363-397`

**Issue:** The 6-month history loop (lines 363-397) manually re-implements aguinaldo override resolution and `calculateAguinaldo` lookup. This is equivalent to what `getAguinaldoForMonth` already does (lines 765-801 in `useMoneyTracker`), but without the override check being hoisted to a hook. If the aguinaldo override logic changes, this inline copy will lag.

**Fix:** Call `getAguinaldoForMonth(cursorKey)?.amount ?? 0` inside the loop instead of duplicating the override/auto resolution.

---

### IN-03: `purpose-suggestion.ts` — heuristic comment lists `"Cuenta remunerada" → "objetivo"` but the domain semantics may be inverted

**File:** `components/investment-purpose-wizard/purpose-suggestion.ts:26`

**Issue:** A "Cuenta remunerada" (interest-bearing savings account) is functionally a savings vehicle, not an objective/goal fund. Mapping it to `"objetivo"` instead of `"ahorro"` means aportes to these accounts are treated as **neutral** (not counted as egresos in `resultadoDelMes`), which understates actual savings outflow. This is a design decision rather than a code bug, but the rationale is not documented in the file.

**Fix:** Add an inline comment explaining the intentional mapping:
```ts
// "Cuenta remunerada" maps to "objetivo" so that regular transfers into
// a savings account (e.g., fondo de emergencia) are treated as neutral
// aportes rather than reducing the monthly resultado. Change to "ahorro"
// if the account is intended as discretionary savings.
if (inv.type === "Cuenta remunerada") return "objetivo";
```

---

### IN-04: `InvestmentPurposeWizard` — `handleAcceptSuggestions` ignores existing `purpose` on investments

**File:** `components/investment-purpose-wizard/investment-purpose-wizard.tsx:64-69`

**Issue:** The "Aceptar sugerencias" button (lines 64-69) overwrites all assignments with fresh `suggestPurpose()` results, discarding any overrides the user may have made row-by-row before clicking the button. The expected UX is "apply suggestions to rows I haven't touched yet," not "reset all to suggestions." The current implementation also overwrites investments that already have a `purpose` value (it iterates over all investments, not just those with `purpose === undefined`).

**Fix:**
```ts
const handleAcceptSuggestions = () => {
  setAssignments((prev) => {
    const next = { ...prev };
    for (const inv of investments) {
      // Only overwrite if the user hasn't touched this row in this wizard session
      // and the investment had no prior purpose
      if (inv.purpose === undefined) {
        next[inv.id] = suggestPurpose({ name: inv.name, type: inv.type });
      }
    }
    return next;
  });
};
```

---

_Reviewed: 2026-06-01_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
