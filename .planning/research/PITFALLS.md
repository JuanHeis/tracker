# Pitfalls Research

**Domain:** Monthly Flow Panel — Waterfall chart + Savings rate config + Projection refactor
**Researched:** 2026-04-07
**Confidence:** HIGH (all claims verified against actual codebase + official Recharts docs + issue tracker)

---

## Critical Pitfalls

### Pitfall 1: Recharts waterfall — stacked bar approach breaks on negative values

**What goes wrong:**
The naive waterfall implementation uses stacked `<Bar>` components where one bar is transparent (the "floor") and the other is the visible segment. This works when all segments are positive (salary→fixed→variable→free is always a downward cascade of positive subtractions). But if the app ever displays a month where variable expenses exceed remaining balance (i.e., a negative "libre" segment), the transparent-floor approach mispositions all bars — they all snap to y=0 instead of floating at their running total.

**Why it happens:**
Recharts stacked bars are designed for additive stacking from a shared zero baseline. The transparent-floor trick exploits this, but the Recharts stacking logic explicitly resets bar position to 0 when `barBottom` becomes negative (confirmed in recharts/recharts issue #2507 and the open issue #7010). The range-value approach (`[low, high]` array as dataKey) avoids this by giving Recharts explicit coordinates instead of relying on stacking math.

**How to avoid:**
Use the **range-value pattern**: transform raw flow data into `[start, end]` pairs via a `computeWaterfallData()` helper before passing to the chart. Each bar segment is drawn between its explicit start and end value. Add a custom `shape` prop to the `<Bar>` to color each segment conditionally (green for income, red for fixed, orange for variable, blue for investment, lighter green for libre).

```typescript
// computeWaterfallData() produces:
// { label: "Gastos Fijos", range: [1_200_000, 350_000], color: "#dc2626" }
// Recharts Bar receives this as dataKey and renders [low, high] bar
```

The official Recharts Waterfall example (recharts.github.io/en-US/examples/Waterfall/) uses this exact approach.

**Warning signs:**
- Bar segments overlap or all start from zero when the "libre" amount goes negative
- Tooltip shows raw array values `[1200000, 350000]` instead of the segment amount — means custom tooltip formatter is missing

**Phase to address:** Phase implementing `waterfall-chart.tsx`

---

### Pitfall 2: useProjectionEngine receives `estimateMonthlyNetSavings()` result — refactor must update ALL call sites

**What goes wrong:**
`estimateMonthlyNetSavings()` is called inside `useProjectionEngine` (line 164 of `hooks/useProjectionEngine.ts`), and the result feeds `projectPatrimonyScenarios()`. The simulator dialog receives `historicalNetFlow` (already the corrected average) as `monthlyNetFlow`. These are two different inputs computed two different ways. After refactor, if `computeSavingsEstimate()` is wired into `useProjectionEngine` but the `SimulatorDialog` still passes `historicalNetFlow` directly, the two projections diverge — Charts tab and Simulator tab show different futures using different base assumptions.

**Why it happens:**
The `SimulatorDialog` in `expense-tracker.tsx` already uses `historicalNetFlow` (line 1008), not `estimateMonthlyNetSavings()`. So the simulator is already semi-correct but disconnected from whatever savings rate the user configures. After adding `SavingsRateConfig`, if you only update `useProjectionEngine` and forget to thread the new computed value into the `SimulatorDialog` props, they silently diverge.

**How to avoid:**
Define a single computed value in `expense-tracker.tsx` (or a new `useSavingsRate` hook):
```typescript
const monthlyNetSavings = computeSavingsEstimate(savingsRateConfig, {
  historicalNetFlow,
  currentSalary,
});
```
Pass this `monthlyNetSavings` to **both** `useProjectionEngine` (replacing its internal `estimateMonthlyNetSavings()` call) **and** `SimulatorDialog` (replacing `historicalNetFlow`). One source of truth, two consumers.

**Warning signs:**
- Charts tab projects $12M at 12 months but simulator shows $9M for the same horizon — they should agree on the base scenario with zero simulated expenses
- `estimateMonthlyNetSavings` still appears in grep output after refactor is "complete"

**Phase to address:** Phase implementing `lib/projection/savings-rate.ts` + `useProjectionEngine` refactor

---

### Pitfall 3: `SavingsRateConfig` in a separate localStorage key causes state-sync bugs

**What goes wrong:**
The app uses a single `useLocalStorage("monthlyData", ...)` orchestrated through `useMoneyTracker`. If `SavingsRateConfig` goes into its own key (e.g., `"savingsRateConfig"`), it will be managed by a separate `useLocalStorage` instance in a new `useSavingsRate` hook. The two hooks are not synchronized — a full `localStorage.clear()` (used during testing or data reset) wipes `monthlyData` but may leave `savingsRateConfig` stale. More critically: the existing `migrateData()` function in `useMoneyTracker.ts` handles all migrations in one pass with a `_migrationVersion` counter. A separate key has no migration versioning at all.

**Why it happens:**
`useLocalStorage` is a thin wrapper with no cross-key awareness. Each key is an island. The `migrateData` pattern established in `useMoneyTracker` (versioned, backward-compatible) was built specifically to avoid data corruption. Bypassing it for a new key means the new key has zero migration safety.

**How to avoid:**
Use a separate key **but** give `useSavingsRate` its own type guard and default:
```typescript
const DEFAULT_SAVINGS_CONFIG: SavingsRateConfig = { mode: "auto" };
const [config, setConfig] = useLocalStorage<SavingsRateConfig>(
  "savingsRateConfig",
  DEFAULT_SAVINGS_CONFIG
);
```
Because `SavingsRateConfig` is small and has a stable default (`mode: "auto"`), no migration function is needed — missing keys default to `{ mode: "auto" }` which is the correct behavior for new users. Document in code that this key is **intentionally** separate from `monthlyData` and why.

**Warning signs:**
- After resetting the app, the savings rate selector shows an old saved value instead of defaulting to "Auto"
- TypeScript error on `config.percentageValue` when `mode` is `"auto"` — means the type union isn't properly narrowed

**Phase to address:** Phase implementing `hooks/useSavingsRate.ts`

---

### Pitfall 4: Waterfall classification of "fixed" vs "variable" uses `recurringId` on filtered expenses — not on the recurring definitions

**What goes wrong:**
The PROMPT specifies: expenses with `recurringId` present are fixed, expenses without are variable. This is correct. The mistake is computing waterfall totals from `recurringExpenses` (the definitions) instead of `filteredExpenses` (the actual expense instances for the month). Using definitions gives you the configured monthly amount. Using actual instances gives you what was actually generated and potentially edited. If the user edited a recurring-generated expense (e.g., changed the amount for one month), the definition and the instance diverge.

**Why it happens:**
`useRecurringExpenses` stores the template definitions in their own localStorage key (`"recurringExpenses"`). Each month, `generateMissingInstances()` creates `Expense` objects in `monthlyData.expenses` with `recurringId` set. The actual month's total for fixed expenses must come from summing `filteredExpenses.filter(e => e.recurringId)`, not from summing `recurringExpenses.filter(r => r.status === "Activa")`.

**How to avoid:**
In `useMonthlyFlowData.ts`, always aggregate from `filteredExpenses` (already filtered to selected month by `useExpensesTracker`):
```typescript
const fixedExpenses = filteredExpenses.filter(e => e.recurringId != null);
const variableExpenses = filteredExpenses.filter(e => e.recurringId == null);
```
Never use recurring definitions as the source of monthly amounts.

**Warning signs:**
- Waterfall fixed expenses total doesn't match the actual expenses table total for fixed items
- Month where user edited a recurring amount shows incorrect fixed total in waterfall

**Phase to address:** Phase implementing `hooks/useMonthlyFlowData.ts`

---

### Pitfall 5: Dual currency in waterfall — USD expenses converted at `globalUsdRate` snapshot vs. per-transaction rate

**What goes wrong:**
The codebase stores expenses with both `amount` (in the expense's native currency) and `usdRate` (the rate at time of entry). When aggregating for the waterfall, converting USD expenses using `globalUsdRate` instead of `expense.usdRate` produces a different total than what the existing `totalExpenses` calculation shows — creating a visible inconsistency where the waterfall total for the month doesn't match the summary card total.

**Why it happens:**
`useExpensesTracker` computes `totalExpenses` by summing expenses using each expense's own `usdRate`. The waterfall will naturally want to show a single ARS total. If you convert using `globalUsdRate` (current rate), USD expense amounts shift every time the rate changes, making the waterfall "live" while the table totals are historical.

**How to avoid:**
Use `expense.usdRate` for the conversion when computing waterfall segment totals — the same logic the existing `totalExpenses` calculation uses. This keeps the waterfall consistent with all other views. Add a small indicator "(USD)" next to fixed/variable segments if any USD expenses exist in that category, so the user understands the exchange rate effect.

**Warning signs:**
- Waterfall "Gastos Fijos + Gastos Variables" total doesn't equal `totalExpenses` from the expenses table header
- Changing `globalUsdRate` causes waterfall bar heights to change but expense table totals don't move

**Phase to address:** Phase implementing `useMonthlyFlowData.ts`

---

### Pitfall 6: `useProjectionEngine`'s `useMemo` dependency array — `savingsRateConfig` not included

**What goes wrong:**
After refactoring `useProjectionEngine` to accept `savingsRateConfig` as a parameter and call `computeSavingsEstimate()` inside its `useMemo`, the memo's dependency array must include the config object. If `savingsRateConfig` is a new object on each render (created inline as `{ mode: "auto" }` at the call site), React will re-run the entire projection on every render, defeating memoization. Conversely, if the dependency is omitted, changing the savings rate won't update the projection.

**Why it happens:**
`useProjectionEngine` is already a well-designed pure `useMemo` hook (no `useState`, no localStorage writes). Its current dependency array at line 299 includes `recurringExpenses` as an array reference — stable because it comes from `useLocalStorage`. The new `savingsRateConfig` must also be stable across renders. An object literal passed as a prop is a new reference every render.

**How to avoid:**
Thread `savingsRateConfig` from the `useSavingsRate` hook, which returns a stable reference (stored value from `useLocalStorage`). Do not reconstruct the config object at the call site. Include it in the dependency array. Since the current hook signature for `useProjectionEngine` takes explicit params, the cleanest pattern is to compute `monthlyNetSavings` outside the hook and pass the scalar value in:

```typescript
// In expense-tracker.tsx or ChartsContainer:
const monthlyNetSavings = computeSavingsEstimate(savingsRateConfig, {
  historicalNetFlow,
  currentSalary,
});
// Pass scalar to the hook — avoids adding a new object dependency
```

**Warning signs:**
- Selecting "50%" savings rate visually updates the mini-projection but the full projection in Charts tab doesn't update
- React DevTools Profiler shows `useProjectionEngine` firing on every keystroke in unrelated forms

**Phase to address:** Phase wiring `useSavingsRate` into `ChartsContainer` and `expense-tracker.tsx`

---

### Pitfall 7: Investment contribution amounts in waterfall — `isInitial` movements inflate outflow

**What goes wrong:**
To compute the "Inversiones" waterfall segment, the code filters `investment.movements` for the current month with `type === "aporte"`. However, investments created via the Setup Wizard have an initial movement marked `isInitial: true`. This initial movement should **not** count as a monthly outflow in the waterfall (it represents the wizard-loaded starting patrimony, not a cash outflow from that month's income). Including it inflates the investment bar to an impossible height (e.g., $7M total investment "outflow" in the first month).

**Why it happens:**
`isInitial: true` was added specifically to `useMoneyTracker.ts` (the investment movements balance calculation, line ~418) to exclude these from the liquid balance calculation. The same filter must be applied when computing the waterfall investment segment.

**How to avoid:**
```typescript
const investmentOutflow = monthlyData.investments
  .flatMap(inv => inv.movements)
  .filter(mov =>
    mov.type === "aporte" &&
    !mov.isInitial &&                          // exclude wizard-loaded patrimony
    mov.date.startsWith(selectedMonth)         // current month only
  )
  .reduce((sum, mov) => sum + mov.amount, 0);
```

**Warning signs:**
- First-month waterfall shows a massive "Inversiones" bar that exceeds total income several times over
- Libre amount in the waterfall is deeply negative for the first month the app was set up

**Phase to address:** Phase implementing `useMonthlyFlowData.ts`

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Inline `computeWaterfallData` inside `waterfall-chart.tsx` | Faster to write | Untestable — chart data logic can't be unit tested without rendering the chart | Never — put it in `lib/projection/` |
| `mode: "auto"` computes `averageMonthlyNetFlow` inside the component on each render | No new hook needed | Projection engine and waterfall each compute historical net flow independently — two `reconstructHistoricalPatrimony` calls | Never — compute once in the parent hook |
| Passing `savingsRateConfig` as inline object to `useProjectionEngine` | One less import | Breaks `useMemo` stability — full projection recalculates every render | Never |
| Showing the "libre" segment as `salary - all_expenses` without accounting for investment outflows | Simple formula | The user thinks they have more liquid cash than they do | Never — investments are a real cash outflow |
| Skipping the `isInitial` filter on investment movements | Fewer lines of code | Catastrophically wrong "Inversiones" bar in first-month waterfall | Never |

---

## Integration Gotchas

| Integration Point | Common Mistake | Correct Approach |
|-------------------|----------------|------------------|
| `useProjectionEngine` + `savingsRateConfig` | Passing config object directly as hook param, adding it to `useMemo` deps | Compute scalar `monthlyNetSavings` outside the hook, pass number — stable, no object identity issue |
| `SimulatorDialog` + new savings rate | Forgetting to update `monthlyNetFlow` prop after refactor | Thread `monthlyNetSavings` from same source as projection engine — one variable, two consumers |
| Waterfall aggregation source | Using `recurringExpenses` (definitions) as source of fixed expense amounts | Always aggregate from `filteredExpenses.filter(e => e.recurringId != null)` |
| Waterfall + investment movements | Including `isInitial` movements | Always filter `!mov.isInitial` before computing monthly investment outflow |
| `useSavingsRate` localStorage key | No default value / missing type guard | Default `{ mode: "auto" }` handles first-time users and reset scenarios automatically |
| `ChartsContainer` post-refactor | `ChartsContainer` currently passes `recurringExpenses` to `useProjectionEngine` for `estimateMonthlyNetSavings`; after refactor the hook should accept `monthlyNetSavings: number` instead | Remove `estimateMonthlyNetSavings` import from `useProjectionEngine`, accept `monthlyNetSavings` as explicit parameter, update `ChartsContainer` caller |

---

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| `reconstructHistoricalPatrimony()` called in both `useProjectionEngine` (for chart) and `expense-tracker.tsx` (for `historicalNetFlow` for simulator) | Double computation on every render | Compute once in a shared `useMemo` at the `expense-tracker.tsx` level, pass result down | Felt immediately with 2+ years of data (~24 months x full expense scan) |
| Waterfall re-aggregating all `filteredExpenses` on every render without `useMemo` | Visible lag when user types in expense form while waterfall is visible | Wrap `useMonthlyFlowData` aggregation in `useMemo` with `[filteredExpenses, selectedMonth, globalUsdRate]` deps | When user has 200+ expenses in a month |
| Mini-projection calling full `projectPatrimonyScenarios` inside the waterfall panel | Projection recalculates on every expense update | Reuse the `projectedPatrimony` result already returned by `useProjectionEngine` — don't run a second projection | On every keystroke if expenses are edited inline |

---

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Waterfall shows current selected month (which may be historical, not current) while savings rate selector defaults to projecting from now | User adjusts "Agosto 2025" waterfall and sees projections that don't match reality | Waterfall reflects `selectedMonth`, mini-projection always uses current patrimony + current savings rate regardless of selected month |
| Savings rate "Auto" mode shows a confusing number if the user only has 1-2 months of history | Average of 1 data point is meaningless as a projection signal | Show disclaimer "Menos de 3 meses de historial — el promedio puede no ser representativo" when historical points < 3 |
| "Libre" bar in waterfall goes negative (user overspent) — chart breaks visually | Bar renders below zero axis, overlapping with labels | Cap the "libre" bar display at zero, add a red indicator showing the overspend amount separately |
| Changing savings rate % slider updates mini-projection in real time but Charts tab doesn't visibly react until user navigates there | User thinks changing the rate has no effect on the main projection | Show a small badge or note near the savings selector indicating "La proyeccion en Charts fue actualizada" |

---

## "Looks Done But Isn't" Checklist

- [ ] **Waterfall classification:** Verify that pausing a recurring expense mid-month correctly moves those instances to "variable" or removes them — check `recurringId` on paused-month instances is still present (it is, since generated before pause was set)
- [ ] **Savings rate persistence:** After page refresh, selector shows saved mode (not always "Auto") — test all three modes survive a hard reload
- [ ] **Projection consistency:** Open Charts tab after changing savings rate to "Fijo $500k" — verify the projection base line moved, not just the mini-projection
- [ ] **Simulator consistency:** Open simulator after changing savings rate — verify `monthlyNetFlow` prop received matches the value used in Charts projection
- [ ] **`estimateMonthlyNetSavings` removal:** Run `grep -r "estimateMonthlyNetSavings" .` — should return zero call sites after refactor (function may remain in `income-projection.ts` as dead code, but zero active calls)
- [ ] **Investment outflow in waterfall:** Newly set up user (wizard) sees a reasonable "Inversiones" bar in first month — not a multi-million peso number
- [ ] **Negative libre handling:** Test a month where expenses exceed income — waterfall renders without overlapping labels or off-axis bars
- [ ] **Responsive layout:** Waterfall chart at 375px mobile width — bars still labeled, not truncated or overlapping horizontally

---

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Wrong waterfall bar positions due to stacked bar approach | MEDIUM | Rewrite `waterfall-chart.tsx` to range-value approach; data shape changes require updating `computeWaterfallData` signature |
| Simulator and Charts diverge after savings rate refactor | LOW | Identify the scalar computed in `expense-tracker.tsx`, thread to both consumers; 1-file change |
| `isInitial` movements inflating investment bar | LOW | Add `.filter(mov => !mov.isInitial)` in `useMonthlyFlowData.ts`; pure data filter, no schema change |
| `savingsRateConfig` missing from `useMemo` dependencies | LOW | Add to array; React will re-run memo once, then stabilize |
| USD expense conversion inconsistency in waterfall | LOW | Replace `globalUsdRate` with `expense.usdRate` in aggregation loop; same pattern already used in `totalExpenses` |

---

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Recharts waterfall stacked bar breaks on negatives | Phase: `waterfall-chart.tsx` implementation | Test with a month where all expenses exceed income; bars stay correctly positioned |
| estimateMonthlyNetSavings not removed from all call sites | Phase: `savings-rate.ts` + `useProjectionEngine` refactor | `grep -r "estimateMonthlyNetSavings"` returns zero call sites |
| SavingsRateConfig separate key without defaults | Phase: `useSavingsRate.ts` implementation | Hard reload with empty localStorage; selector shows "Auto" |
| Fixed vs variable uses definitions instead of instances | Phase: `useMonthlyFlowData.ts` | Edit one recurring instance amount; waterfall reflects edited value |
| USD expenses converted at global rate not per-transaction rate | Phase: `useMonthlyFlowData.ts` | Waterfall fixed+variable total equals totalExpenses header value |
| useMemo dependency instability with savingsRateConfig | Phase: wiring into ChartsContainer | React DevTools Profiler: projection rerenders only when config changes, not on unrelated state updates |
| isInitial investment movements in waterfall | Phase: `useMonthlyFlowData.ts` | First-month investment bar is reasonable (same as actual contributions, not cumulative patrimony) |

---

## Sources

- [Recharts waterfall chart official example](https://recharts.github.io/en-US/examples/Waterfall/) — range-value pattern (HIGH confidence)
- [recharts/recharts issue #7010 — native waterfall feature request](https://github.com/recharts/recharts/issues/7010) — stacked bar breaks on negative barBottom (HIGH confidence)
- [recharts/recharts issue #2507 — fixed zero position with negative values](https://github.com/recharts/recharts/issues/2507) — root cause of stacking failure (HIGH confidence)
- [recharts/recharts issue #1427 — BarChart negative values not rendering correctly](https://github.com/recharts/recharts/issues/1427) (HIGH confidence)
- [useMemo — React official docs](https://react.dev/reference/react/useMemo) — dependency array requirements (HIGH confidence)
- Codebase: `hooks/useProjectionEngine.ts` line 164 — current `estimateMonthlyNetSavings` call site (verified)
- Codebase: `components/expense-tracker.tsx` lines 1004–1011 — SimulatorDialog call site with `historicalNetFlow` (verified)
- Codebase: `hooks/useMoneyTracker.ts` — `!mov.isInitial` filter pattern in investment balance calculation (verified)
- Codebase: `hooks/useRecurringExpenses.ts` — `recurringId` field semantics and `generateMissingInstances` logic (verified)
- Codebase: `lib/projection/scenario-engine.ts` — `projectPatrimonyScenarios` accepts scalar `monthlyNetSavings` (verified)

---
*Pitfalls research for: Monthly Flow Panel (v1.3) — expense-tracker app*
*Researched: 2026-04-07*
