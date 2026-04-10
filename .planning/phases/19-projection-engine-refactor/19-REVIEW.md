---
phase: 19-projection-engine-refactor
reviewed: 2026-04-10T00:00:00Z
depth: standard
files_reviewed: 4
files_reviewed_list:
  - hooks/useProjectionEngine.ts
  - components/charts-container.tsx
  - components/expense-tracker.tsx
  - lib/projection/income-projection.ts
findings:
  critical: 0
  warning: 3
  info: 2
  total: 5
status: issues_found
---

# Phase 19: Code Review Report

**Reviewed:** 2026-04-10
**Depth:** standard
**Files Reviewed:** 4
**Status:** issues_found

## Summary

Phase 19 replaces `recurringExpenses`-based savings estimation with the configurable `savingsRate.estimate` from the Phase 18 `useSavingsRate` hook. The four changed files are correctly wired: `estimateMonthlyNetSavings` is fully deleted, the parameter rename is clean, and the single-source-of-truth pattern is well executed.

Three warnings were found: one bounds mismatch that can cause a silent `undefined` access in a high-stakes number calculation, one duplicate component render, and one import that is present but never used in the reviewed code. Two info items cover dead-imported constant and a minor label-generation inconsistency.

---

## Warnings

### WR-01: `InvestmentChart` month-labels slice may produce fewer labels than projection values

**File:** `components/charts-container.tsx:88-91`

**Issue:** `monthLabels` is built by slicing `patrimonyData` from `currentMonthIndex` onward. `currentMonthIndex` is the index of the current month in the combined historical + future array. The `InvestmentChart` also receives `projections`, where each `projection.projectedValues` has `horizonMonths + 1` entries (index 0 = current month, indices 1..horizonMonths = future months). When the current month appears at position N in `patrimonyData`, the slice has `patrimonyData.length - N` elements. `patrimonyData.length` equals `historical.length + horizonMonths` (the current month is included in historical or added as the bridge point), so the slice has `horizonMonths + 1` elements in the common case — but only when `currentMonthIndex` lands exactly on the bridge point. If `currentMonthIndex` is 0 (fallback from `findIndex` returning -1, line 285 of the hook), the slice is the entire `patrimonyData` array, which includes historical months before the current one. If `InvestmentChart` zips labels and values by index it will misalign: label[0] will be a historical month while `projectedValues[0]` is the current-month value.

**Fix:** Pass the labels explicitly from the already-available future portion of `patrimonyData`, or derive them from `projection.horizonMonths` inside `InvestmentChart`. A safe guard in the consumer:

```tsx
// charts-container.tsx – replace lines 88-91
monthLabels={projection.patrimonyData
  .filter((p) => p.proyeccionBase !== null)
  .map((p) => p.month)}
```

This selects only points that carry projection values, which is exactly the range `projectedValues` covers.

---

### WR-02: `ChartDisclaimer` rendered twice

**File:** `components/charts-container.tsx:85,102`

**Issue:** `ChartDisclaimer` is rendered at line 85 (after `PatrimonyChart`) and again at line 102 (after `InvestmentChart`). The component presumably shows a static disclaimer about USD rate assumptions. Rendering it twice is almost certainly unintentional — the second render produces duplicate content visible to the user.

**Fix:** Remove the first occurrence (line 85) and keep only the trailing one, or vice-versa depending on the desired visual placement:

```tsx
// Remove line 85:
// <ChartDisclaimer globalUsdRate={globalUsdRate} />

// Keep only the one at line 102 (after InvestmentChart)
<ChartDisclaimer globalUsdRate={globalUsdRate} />
```

---

### WR-03: `SCENARIOS` imported but never referenced in `useProjectionEngine.ts`

**File:** `hooks/useProjectionEngine.ts:19`

**Issue:** `SCENARIOS` is imported from `@/lib/projection/types` (line 19) but is not called anywhere in the file. The three scenarios (optimista, base, pesimista) are driven by the hardcoded multipliers `1.5`, `1.0`, and `0.5` passed to `computeInvestmentGrowth` at lines 183-203, not by iterating over `SCENARIOS`. This means the scenario multipliers defined in `types.ts` (`rateMultiplier: 1.5 / 1.0 / 0.5`) and the ones hardcoded in the hook can silently diverge in the future.

**Fix (short-term):** Remove the unused import to eliminate the dead reference.

```ts
// Remove line 19:
// import { SCENARIOS } from "@/lib/projection/types";
```

**Fix (preferred, eliminates divergence risk):** Drive the growth computations from `SCENARIOS`:

```ts
import { SCENARIOS } from "@/lib/projection/types";

const [optimistaScenario, baseScenario, pesimistaScenario] = SCENARIOS;

const optimistaGrowth = computeInvestmentGrowth(activeInvestments, optimistaScenario.rateMultiplier, ...).growth;
const baseResult      = computeInvestmentGrowth(activeInvestments, baseScenario.rateMultiplier, ...);
const pesimistaGrowth = computeInvestmentGrowth(activeInvestments, pesimistaScenario.rateMultiplier, ...).growth;
```

---

## Info

### IN-01: Historical month label uses different format path than future months

**File:** `hooks/useProjectionEngine.ts:307-311` vs `260-262`

**Issue:** Historical month labels are generated by `formatMonthLabel()` which calls `new Date(parseInt(year), parseInt(month) - 1, 1)` and formats via `date-fns`. Future month labels call `addMonths(now, m)` and format directly. Both ultimately produce the same `"MMM yy"` format string, so the visual output is identical. However, `formatMonthLabel` uses a local `Date` constructor with integer parsing. If `monthKey` ever comes from a source with a non-zero-padded month (e.g., `"2026-4"` instead of `"2026-04"`), `parseInt("4") - 1 = 3` is still correct — so this is not a bug in practice given the `"yyyy-MM"` contract. Still, consolidating both paths to use the same helper reduces future maintenance risk.

**Fix:** Use `formatMonthLabel` for future months too:

```ts
// In the future-months loop (lines 258-268):
const monthKey = format(futureDate, "yyyy-MM");
patrimonyData.push({
  month: formatMonthLabel(monthKey),   // reuse helper
  ...
});
```

---

### IN-02: `incomeProjection` returned but not consumed by any chart in `ChartsContainer`

**File:** `hooks/useProjectionEngine.ts:288` / `components/charts-container.tsx`

**Issue:** `useProjectionEngine` returns `incomeProjection` (a flat-line salary array), but `ChartsContainer` never reads this field from the `projection` object. No `incomeProjection` prop is passed to any child component. This is not a bug — it may be reserved for a future chart — but it means the flat array is allocated on every render with no consumer. This is a negligible cost at current horizons (<=60 elements), so it is purely informational.

**Fix:** No action required until Phase 20 consumes it. Consider adding a `// TODO(Phase-20): wire incomeProjection to monthly flow chart` comment on line 288 to document intent.

---

_Reviewed: 2026-04-10_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
