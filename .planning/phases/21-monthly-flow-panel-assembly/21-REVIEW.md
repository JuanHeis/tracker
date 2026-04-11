---
phase: 21-monthly-flow-panel-assembly
reviewed: 2026-04-11T00:00:00Z
depth: standard
files_reviewed: 3
files_reviewed_list:
  - components/charts/mini-projection-chart.tsx
  - components/monthly-flow-panel.tsx
  - components/expense-tracker.tsx (MonthlyFlowPanel wiring, lines 267-300 and 732-742)
findings:
  critical: 0
  warning: 3
  info: 2
  total: 5
status: issues_found
---

# Phase 21: Code Review Report

**Reviewed:** 2026-04-11
**Depth:** standard
**Files Reviewed:** 3
**Status:** issues_found

## Summary

Three files were reviewed: the new `MiniProjectionChart` component, the new `MonthlyFlowPanel` orchestrator, and the MonthlyFlowPanel wiring section of `expense-tracker.tsx`. No security vulnerabilities or crashes were found. There are three warnings, all in `monthly-flow-panel.tsx`, centered on the inline simulation feature: an uncapped input that can push values into nonsensical territory silently, a potential silent data-length mismatch in the simulated chart data, and missing input labeling for accessibility. Two info items cover duplicated utility code and a typo in a user-visible string.

---

## Warnings

### WR-01: Uncapped simulation input — arbitrarily large values accepted silently

**File:** `components/monthly-flow-panel.tsx:148-152`

**Issue:** The `onChange` handler clamps negative values to 0 but places no upper bound on `simulatedAmount`. A user can type a number larger than `savingsEstimate` (or even larger than their entire salary), causing `adjustedSavings` (line 79) to go deeply negative. The waterfall `Libre` bar and all three projection curves will then display large negative numbers with no warning to the user, making the UI misleading rather than helpful.

**Fix:** Cap the simulated amount at `savingsEstimate` (or at `currentSalary` as a looser but still meaningful bound) and show the impact text in a warning color when the value exceeds available libre:

```tsx
onChange={(e) => {
  const val = parseFloat(e.target.value);
  const clamped = isNaN(val) || val < 0 ? 0 : val;
  setSimulatedAmount(clamped);
}}
```

And in the impact text section, reflect when the simulation is in deficit:

```tsx
{simulatedAmount > 0 && (
  <p className={`text-xs ${adjustedLibre < 0 ? "text-destructive" : "text-muted-foreground"}`}>
    Libre baja de {formatArs(originalLibre)} a{" "}
    {formatArs(adjustedLibre)}
    {adjustedLibre < 0 && " (deficit)"}
  </p>
)}
```

---

### WR-02: Simulated chart data length may silently diverge from scenario engine output

**File:** `components/monthly-flow-panel.tsx:85-89`

**Issue:** When the simulation is active, `adjustedProjectionData` re-maps `projectionData` (the pre-filtered array from `expense-tracker.tsx:292-299`) against freshly computed `scenarios` arrays using positional index `i`. `projectPatrimonyScenarios` is called with `horizonMonths: 12`, so it always produces 13 values (indices 0–12). However, `projectionData` is built by filtering `miniProjection.patrimonyData` to only rows where `proyeccionBase !== null`. If the projection engine returns fewer than 12 future-projection rows (e.g., because data for the current month is still null), `projectionData` will have fewer than 12 entries and the simulated chart will silently render fewer months than the original, with no error.

**Fix:** Assert or guard that lengths match before mapping, or derive `horizonMonths` from `projectionData.length` rather than hard-coding `12`:

```tsx
const adjustedSavings = savingsEstimate - simulatedAmount;
const horizonMonths = projectionData.length; // use actual length, not hardcoded 12
const scenarios = projectPatrimonyScenarios(
  currentPatrimony,
  adjustedSavings,
  horizonMonths
);
const data = projectionData.map((point, i) => ({
  month: point.month,
  optimista: scenarios.optimista[i] ?? point.optimista,
  base: scenarios.base[i] ?? point.base,
  pesimista: scenarios.pesimista[i] ?? point.pesimista,
}));
const projected: ProjectionSummary = {
  optimista: scenarios.optimista[horizonMonths] ?? projectedPatrimony.optimista,
  base: scenarios.base[horizonMonths] ?? projectedPatrimony.base,
  pesimista: scenarios.pesimista[horizonMonths] ?? projectedPatrimony.pesimista,
};
```

---

### WR-03: `<label>` not associated with its `<Input>` — accessibility gap

**File:** `components/monthly-flow-panel.tsx:138-153`

**Issue:** The `<label>` element (line 138) has no `htmlFor` attribute linking it to the numeric `<Input>`. Screen readers cannot associate the label with the field, and clicking the label text does not focus the input. This is a standard HTML accessibility requirement (WCAG 1.3.1).

**Fix:** Add an `id` to the input and a matching `htmlFor` to the label:

```tsx
<label htmlFor="simulated-expense" className="text-sm font-medium">
  Gasto hipotetico mensual
</label>
<div className="flex items-center gap-2">
  <span className="text-sm text-muted-foreground">$</span>
  <Input
    id="simulated-expense"
    type="number"
    ...
  />
</div>
```

---

## Info

### IN-01: `formatArs` duplicated across two files

**File:** `components/charts/mini-projection-chart.tsx:13-18` and `components/monthly-flow-panel.tsx:14-19`

**Issue:** The `formatArs` formatter is defined identically in both files. This is code duplication that will cause drift if formatting requirements change (e.g., switching to compact notation or adding USD support).

**Fix:** Extract to a shared utility, for example `lib/format.ts`:

```ts
export const formatArs = (value: number) =>
  new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(value);
```

Then import in both components.

---

### IN-02: Typo in user-visible label

**File:** `components/monthly-flow-panel.tsx:139`

**Issue:** The label text reads `"Gasto hipotetico mensual"`. The correct Spanish spelling is `"hipotético"` (with accent). While minor, it is a user-visible string.

**Fix:**

```tsx
<label htmlFor="simulated-expense" className="text-sm font-medium">
  Gasto hipotético mensual
</label>
```

---

_Reviewed: 2026-04-11_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
