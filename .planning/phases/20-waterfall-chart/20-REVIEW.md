---
phase: 20-waterfall-chart
reviewed: 2026-04-11T00:00:00Z
depth: standard
files_reviewed: 5
files_reviewed_list:
  - lib/projection/waterfall.ts
  - lib/projection/waterfall.test.ts
  - components/charts/waterfall-chart.tsx
  - components/charts/waterfall-tooltip.tsx
  - hooks/useMonthlyFlowData.ts
findings:
  critical: 0
  warning: 3
  info: 3
  total: 6
status: issues_found
---

# Phase 20: Code Review Report

**Reviewed:** 2026-04-11
**Depth:** standard
**Files Reviewed:** 5
**Status:** issues_found

## Summary

Five files were reviewed covering the pure computation layer (`waterfall.ts`), its unit tests, the React hook (`useMonthlyFlowData.ts`), and two chart components. The overall architecture is clean and well-separated. No security vulnerabilities or data-loss risks were found.

Three warnings require attention before Phase 21 integration:

1. The Inversiones bar renders with inverted coordinates when net investment flow is negative (more withdrawals than deposits in the period), producing a visually broken bar.
2. USD investment movement amounts are used directly without ARS conversion, mixing currency units in the total and producing incorrect numbers for users with USD investments.
3. Invalid or empty date strings passed to `isInRange` will throw at runtime instead of being filtered out gracefully.

---

## Warnings

### WR-01: Inversiones bar has inverted coordinates when net investment is negative

**File:** `lib/projection/waterfall.ts:225-237`

**Issue:** After `running -= investmentNet`, when `investmentNet < 0` (net withdrawals exceed deposits in the period), `barBottom` is set to `running` and `barTop` to `running + investmentNet`. Since `investmentNet` is negative, `barTop < barBottom`. Recharts renders a range bar from min to max internally, but the fill color assigned via `<Cell>` may render incorrectly or disappear, and the tooltip `amount` will show a negative number without a clear sign convention for the user.

The `Libre` bar correctly uses `Math.min`/`Math.max` to handle this case (lines 242-243), but `Inversiones` does not.

**Fix:** Mirror the Libre bar pattern for Inversiones:
```typescript
running -= investmentNet;
const inversionesBar: WaterfallBar = {
  name: "Inversiones",
  barBottom: Math.min(running, running + investmentNet),
  barTop: Math.max(running, running + investmentNet),
  amount: investmentNet,
  fill: WATERFALL_COLORS.inversiones,
  subcategories: buildSubcategories(
    Array.from(investmentByName.entries()),
    ([name]) => name,
    ([, amount]) => amount,
  ),
};
```

The same defensive guard should also be applied to `gastosFijosBar` and `gastosVariablesBar` in case a caller ever passes an `Expense` with a negative amount (which the type does not prevent).

---

### WR-02: USD investment movements used without ARS conversion

**File:** `lib/projection/waterfall.ts:171-178`

**Issue:** The comment at lines 172-173 acknowledges that "no per-movement usdRate available on movements", so USD investment amounts are summed directly in their raw USD units alongside ARS amounts. For a user who contributed USD 100 to an investment at a rate of 1200 ARS/USD, the Inversiones bar will show 100 instead of 120,000, drastically understating the investment outflow and correspondingly over-inflating the Libre bar.

The `Investment` model (`hooks/useMoneyTracker.ts:71-86`) does not carry a `usdRate` on individual movements, but the `WaterfallInput` could accept a `globalUsdRate` parameter to handle conversion at the bar level — the same approach the test file acknowledges at lines 299-301.

**Fix (minimal — unblock the visual):** Add an optional `globalUsdRate` parameter to `WaterfallInput` and `computeWaterfallData`, defaulting to 1, and apply it to USD investment movements:

```typescript
// In WaterfallInput
globalUsdRate?: number;   // ARS per USD, used for investment movement conversion

// In computeWaterfallData
const rate = input.globalUsdRate ?? 1;

// In the investment loop
const movAmount =
  inv.currencyType === CurrencyType.USD
    ? mov.amount * rate
    : mov.amount;
if (mov.type === "aporte") {
  invNet += movAmount;
} else {
  invNet -= movAmount;
}
```

`useMonthlyFlowData` and its caller in Phase 21 can then pass `globalUsdRate` from the currency engine.

---

### WR-03: `isInRange` throws on invalid or missing date strings

**File:** `lib/projection/waterfall.ts:83-86`

**Issue:** `parseISO("")` and `parseISO("invalid")` return `Invalid Date`. Passing `Invalid Date` to `isWithinInterval` throws `RangeError: Invalid time value`. If any `Expense`, `ExtraIncome`, or `InvestmentMovement` ever has a missing or malformed `date` field (possible from corrupted localStorage data), the entire `computeWaterfallData` call throws and crashes the chart.

Given that this project explicitly protects against localStorage schema corruption (see project memory), a defensive guard here is appropriate.

**Fix:**
```typescript
function isInRange(dateStr: string, range: { start: Date; end: Date }): boolean {
  if (!dateStr) return false;
  const d = parseISO(dateStr);
  if (isNaN(d.getTime())) return false;
  return isWithinInterval(d, { start: range.start, end: range.end });
}
```

---

## Info

### IN-01: `buildIngresosSubcategories` does not apply the top-5 cap

**File:** `lib/projection/waterfall.ts:256-281`

**Issue:** `buildSubcategories` caps at 5 entries plus an "Otros" bucket. `buildIngresosSubcategories` has no such cap — every distinct extra income name is added individually. A user with many freelance income sources will see an unbounded list in the tooltip, making it unreadable.

**Fix:** After sorting, apply the same 5+Otros truncation, or reuse `buildSubcategories` by including salary as a synthetic item:
```typescript
function buildIngresosSubcategories(
  salaryAmount: number,
  extraIncomes: ExtraIncome[],
): SubcategoryItem[] {
  const syntheticItems = salaryAmount > 0
    ? [{ name: "Sueldo", amount: salaryAmount }, ...extraIncomes.map(ei => ({ ...ei, _amount: toArsIncome(ei) }))]
    : [...extraIncomes];
  // ... or simply call buildSubcategories with a synthetic array
}
```

A simpler approach: build the full `items` array as today, then pass through the same slice-and-Otros logic from `buildSubcategories`.

---

### IN-02: Unstable `key` prop on `<Cell>` in waterfall chart

**File:** `components/charts/waterfall-chart.tsx:81`

**Issue:** `<Cell key={index} fill={entry.fill} />` uses array index as key. While the waterfall always has exactly 5 fixed bars (indices never reorder), React best-practice is to use a stable identifier. If bars are ever added or reordered, React will silently reuse DOM nodes.

**Fix:**
```tsx
<Cell key={entry.name} fill={entry.fill} />
```

`entry.name` is unique and stable within the waterfall bar set.

---

### IN-03: Test for USD investments asserts `toBeGreaterThan(0)` instead of verifying correct conversion

**File:** `lib/projection/waterfall.test.ts:289-307`

**Issue:** The test at line 306 (`expect(result[3].amount).toBeGreaterThan(0)`) is deliberately loose because the implementation currently cannot convert USD correctly (WR-02). This means the test passes even with the known-wrong value of 100 ARS instead of 120,000 ARS. The test comment at lines 299-301 acknowledges the gap.

Once WR-02 is resolved by adding `globalUsdRate`, this test should be updated to assert the exact converted value:
```typescript
const result = computeWaterfallData({ ...input, globalUsdRate: 1200 });
expect(result[3].amount).toBe(100 * 1200); // 120000
```

---

_Reviewed: 2026-04-11_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
