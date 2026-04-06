---
phase: quick-22
plan: 1
type: execute
wave: 1
depends_on: []
files_modified:
  - lib/projection/net-flow.ts
  - lib/projection/net-flow.test.ts
  - components/simulator-dialog.tsx
autonomous: true
requirements: [FLOW-01, FLOW-02]

must_haves:
  truths:
    - "calculateMonthlyNetFlow returns per-month net flow derived from historical patrimony deltas"
    - "averageMonthlyNetFlow computes the mean of the last N months of net flow"
    - "Simulator base projection uses real historical average net flow instead of flat estimateMonthlyNetSavings"
    - "Simulator blue line (sinSimulacion) rises or falls based on real historical cash flow"
  artifacts:
    - path: "lib/projection/net-flow.ts"
      provides: "Pure functions for monthly net flow calculation and averaging"
      exports: ["calculateMonthlyNetFlow", "averageMonthlyNetFlow"]
    - path: "lib/projection/net-flow.test.ts"
      provides: "Unit tests for net flow functions"
      min_lines: 30
  key_links:
    - from: "lib/projection/net-flow.ts"
      to: "lib/projection/patrimony-history.ts"
      via: "imports reconstructHistoricalPatrimony"
      pattern: "reconstructHistoricalPatrimony"
    - from: "components/simulator-dialog.tsx"
      to: "lib/projection/net-flow.ts"
      via: "imports averageMonthlyNetFlow to replace estimateMonthlyNetSavings"
      pattern: "averageMonthlyNetFlow"
---

<objective>
Calculate monthly net flow from historical data and integrate into the simulator for realistic projections.

Purpose: The simulator currently uses `estimateMonthlyNetSavings` (salary - recurring expenses only) to project the "sin simulacion" line. This ignores variable expenses, installments, loan payments, extra income, and investment contributions. By computing actual historical net flow (delta between consecutive months' patrimony) and averaging it, the simulator line becomes realistic -- rising or falling based on what actually happened.

Output: Pure net-flow calculation functions with tests, simulator dialog updated to use real flow.
</objective>

<execution_context>
@C:/Users/Juan/.claude/get-shit-done/workflows/execute-plan.md
@C:/Users/Juan/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@lib/projection/patrimony-history.ts
@lib/projection/simulator.ts
@lib/projection/scenario-engine.ts
@lib/projection/income-projection.ts
@lib/projection/types.ts
@hooks/useProjectionEngine.ts
@components/simulator-dialog.tsx

<interfaces>
<!-- Key types and contracts the executor needs -->

From lib/projection/types.ts:
```typescript
export interface HistoricalPoint {
  monthKey: string; // "yyyy-MM"
  patrimony: number; // Total in ARS
}
```

From lib/projection/patrimony-history.ts:
```typescript
export function reconstructHistoricalPatrimony(
  monthlyData: MonthlyData,
  salaryHistory: SalaryEntry[],
  globalUsdRate: number
): HistoricalPoint[];
```

From lib/projection/income-projection.ts:
```typescript
export function estimateMonthlyNetSavings(
  currentSalary: number,
  activeRecurringExpenses: RecurringExpense[],
  globalUsdRate: number
): number;
```

From lib/projection/scenario-engine.ts:
```typescript
export function projectPatrimonyScenarios(
  currentPatrimony: number,
  monthlyNetSavings: number,
  horizonMonths: number
): { optimista: number[]; base: number[]; pesimista: number[] };
```

From hooks/useMoneyTracker.ts:
```typescript
export interface MonthlyData {
  salaries: { [key: string]: { amount: number; usdRate: number } };
  expenses: Expense[];
  extraIncomes: ExtraIncome[];
  investments: Investment[];
  usdPurchases: UsdPurchase[];
  salaryOverrides?: Record<string, { amount: number; usdRate: number }>;
  aguinaldoOverrides?: Record<string, { amount: number }>;
  transfers?: Transfer[];
  loans?: Loan[];
}
```

SimulatorDialog props:
```typescript
interface SimulatorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentPatrimony: number;
  currentSalary: number;
  recurringExpenses: RecurringExpense[];
  globalUsdRate: number;
  investments: Investment[];
  customAnnualRates?: CustomAnnualRates;
}
```
</interfaces>
</context>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: Create net flow calculation functions with tests</name>
  <files>lib/projection/net-flow.ts, lib/projection/net-flow.test.ts</files>
  <behavior>
    - calculateMonthlyNetFlow: given HistoricalPoint[], returns {monthKey, netFlow}[] where netFlow = patrimony[m] - patrimony[m-1] for each consecutive month pair
    - calculateMonthlyNetFlow: first month has no delta, so returns N-1 entries for N historical points
    - calculateMonthlyNetFlow: returns empty array for 0 or 1 historical points
    - averageMonthlyNetFlow: given netFlow array and lastN, returns mean of last N entries (or all if fewer than N)
    - averageMonthlyNetFlow: returns 0 for empty array
    - averageMonthlyNetFlow: with lastN=3 and 5 entries, only averages the last 3
    - averageMonthlyNetFlow: result can be negative (user overspent)
  </behavior>
  <action>
Create `lib/projection/net-flow.ts` with two pure functions:

1. `calculateMonthlyNetFlow(historicalPoints: HistoricalPoint[]): { monthKey: string; netFlow: number }[]`
   - Takes the output of `reconstructHistoricalPatrimony` (already sorted chronologically)
   - For each consecutive pair of months, computes `netFlow = patrimony[i] - patrimony[i-1]`
   - Returns array of `{monthKey, netFlow}` starting from the second month
   - Empty or single-element input returns `[]`

2. `averageMonthlyNetFlow(flows: { monthKey: string; netFlow: number }[], lastN?: number): number`
   - Takes the output of `calculateMonthlyNetFlow`
   - If `lastN` provided, only considers the last N entries
   - Returns the arithmetic mean, rounded to integer
   - Returns 0 for empty input
   - Can return negative values (net outflow)

Import `HistoricalPoint` from `@/lib/projection/types`.

Create `lib/projection/net-flow.test.ts` with vitest tests covering all behaviors listed above. Use `describe`/`it` blocks. Test data: construct simple HistoricalPoint arrays directly (no need to call reconstructHistoricalPatrimony in tests).
  </action>
  <verify>
    <automated>npx vitest run lib/projection/net-flow.test.ts</automated>
  </verify>
  <done>Both functions exported, all tests pass. Functions are pure with zero React dependencies.</done>
</task>

<task type="auto">
  <name>Task 2: Integrate historical net flow into simulator projection</name>
  <files>components/simulator-dialog.tsx, components/expense-tracker.tsx</files>
  <action>
The simulator dialog currently computes the base projection using `estimateMonthlyNetSavings(currentSalary, recurringExpenses, globalUsdRate)` which only considers salary minus recurring expenses. Replace this with real historical average net flow.

**Changes to `components/expense-tracker.tsx`:**

1. Import `reconstructHistoricalPatrimony` from `@/lib/projection/patrimony-history`, `calculateMonthlyNetFlow` and `averageMonthlyNetFlow` from `@/lib/projection/net-flow`, and the `salaryEntries` (already available as the hook `useSalaryHistory` -- check how it's already used in the file).
2. Compute `historicalNetFlow` as a useMemo: call `reconstructHistoricalPatrimony(monthlyData, salaryEntries, globalUsdRate)` then `calculateMonthlyNetFlow(result)` then `averageMonthlyNetFlow(flows, 6)` (last 6 months average).
3. Pass new prop `monthlyNetFlow: number` to `SimulatorDialog` with this computed average.

**Changes to `components/simulator-dialog.tsx`:**

1. Add `monthlyNetFlow: number` to `SimulatorDialogProps`.
2. In the `useMemo` that computes `chartData` and `summary`:
   - Replace `const netSavings = estimateMonthlyNetSavings(currentSalary, recurringExpenses, globalUsdRate)` with using the `monthlyNetFlow` prop directly.
   - The rest stays the same: `projectPatrimonyScenarios(currentPatrimony, monthlyNetFlow, horizonMonths)` etc.
3. Remove the import of `estimateMonthlyNetSavings` (no longer needed in this file).
4. Remove `currentSalary` and `recurringExpenses` from props since they are no longer needed by this component (the net flow is computed externally now). Update the interface and destructuring accordingly.
5. Display the monthly net flow value in the dialog header area, below the description: show a small info line like "Flujo neto mensual promedio: $XXX.XXX" (formatted with es-AR locale). Color it green if positive, red if negative.
6. Remove `currentSalary` and `recurringExpenses` from the useMemo dependency array.

**Changes back to `components/expense-tracker.tsx`:**
- Remove `currentSalary` and `recurringExpenses` props from the SimulatorDialog call site since they were removed from the interface.

IMPORTANT: Check how `salaryEntries` / `useSalaryHistory` is used in expense-tracker.tsx. It may already be available. If it uses a different pattern (e.g., `getSalaryForMonth` from the hook), find the salary entries array. Search for `useSalaryHistory` in the file.
  </action>
  <verify>
    <automated>npx next build 2>&1 | head -30</automated>
  </verify>
  <done>Simulator dialog uses real historical average net flow for projections. The "sin simulacion" line now rises/falls based on actual spending patterns. Monthly net flow displayed in dialog with appropriate color.</done>
</task>

</tasks>

<verification>
1. `npx vitest run lib/projection/net-flow.test.ts` -- all net flow unit tests pass
2. `npx next build` -- no type errors, builds successfully
3. Open simulator dialog -- "Flujo neto mensual promedio" displays with correct sign/color
4. Add a simulated expense -- blue line reflects real monthly flow trajectory, not flat
</verification>

<success_criteria>
- Net flow pure functions exist with tests, all passing
- Simulator base projection uses average of last 6 months of real net flow
- Simulator dialog displays the monthly net flow value
- No regressions in build
</success_criteria>

<output>
After completion, create `.planning/quick/22-calcular-flujo-neto-mensual-e-integrar-e/22-SUMMARY.md`
</output>
