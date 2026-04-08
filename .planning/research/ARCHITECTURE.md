# Architecture Research: Monthly Flow Panel (v1.3)

**Domain:** Monthly flow visualization + savings rate config integration into existing expense tracker
**Researched:** 2026-04-07
**Confidence:** HIGH — based on direct codebase analysis, not inference

---

## Existing Architecture (What We're Integrating Into)

### Layer Map

```
┌─────────────────────────────────────────────────────────────────────┐
│  PRESENTATION LAYER (components/)                                    │
│                                                                      │
│  expense-tracker.tsx  ← main orchestrator, renders all tabs         │
│  charts-container.tsx ← calls useProjectionEngine, renders charts   │
│  simulator-dialog.tsx ← receives monthlyNetFlow prop, runs sim      │
└────────────────────────────────────┬────────────────────────────────┘
                                     │ props
┌────────────────────────────────────▼────────────────────────────────┐
│  STATE MANAGEMENT LAYER (hooks/)                                     │
│                                                                      │
│  useMoneyTracker.ts          ← orchestrator (calls all sub-hooks)   │
│    ├─ useExpensesTracker.ts  ← filteredExpenses (by month+view)     │
│    ├─ useIncomes.ts          ← filteredIncomes, salary resolution    │
│    ├─ useInvestmentsTracker  ← investments[], movements, CRUD       │
│    ├─ useRecurringExpenses   ← recurringExpenses[], instances        │
│    ├─ useSalaryHistory.ts    ← getSalaryForMonth(), incomeConfig     │
│    ├─ useCurrencyEngine.ts   ← globalUsdRate, balances              │
│    └─ ...others (loans, transfers, budgets, payPeriod)              │
│                                                                      │
│  useProjectionEngine.ts  ← pure useMemo hook, receives data as args │
│                             calls estimateMonthlyNetSavings() TODAY  │
└────────────────────────────────────┬────────────────────────────────┘
                                     │ pure functions
┌────────────────────────────────────▼────────────────────────────────┐
│  PURE MATH LAYER (lib/projection/)                                   │
│                                                                      │
│  scenario-engine.ts    ← projectPatrimonyScenarios(p, savings, n)   │
│  net-flow.ts           ← calculateMonthlyNetFlow, averageMonthlyNetFlow │
│  income-projection.ts  ← estimateMonthlyNetSavings() ← TARGET       │
│  compound-interest.ts  ← investment rate math                       │
│  patrimony-history.ts  ← reconstructHistoricalPatrimony             │
│  simulator.ts          ← applySimulatedExpenses, buildSimulatorData  │
└─────────────────────────────────────────────────────────────────────┘
                                     │
┌────────────────────────────────────▼────────────────────────────────┐
│  PERSISTENCE LAYER (hooks/useLocalStorage.ts)                        │
│                                                                      │
│  "monthlyData"          ← master state (_migrationVersion: 8)       │
│  "recurringExpenses"    ← own key (useRecurringExpenses)            │
│  "salaryHistory"        ← own key (useSalaryHistory)                │
│  "customAnnualRates"    ← own key (charts-container)                │
│  "savingsRateConfig"    ← NEW key (useSavingsRate, to be created)   │
└─────────────────────────────────────────────────────────────────────┘
```

---

## What v1.3 Adds and Modifies

### New Files

```
lib/projection/
  savings-rate.ts           NEW — computeSavingsEstimate(), SavingsRateConfig type

hooks/
  useSavingsRate.ts         NEW — persists SavingsRateConfig in "savingsRateConfig" key
  useMonthlyFlowData.ts     NEW — derives waterfall data from existing filteredExpenses

components/
  monthly-flow-panel.tsx    NEW — panel shell (waterfall + selector + mini-projection)
  waterfall-chart.tsx       NEW — Recharts BarChart waterfall implementation
  savings-rate-selector.tsx NEW — toggle group: Auto | % | Fijo with input
```

### Modified Files

```
hooks/useProjectionEngine.ts    MODIFIED — replace estimateMonthlyNetSavings() call
                                            with computeSavingsEstimate() call
                                            add savingsRateConfig parameter

components/charts-container.tsx MODIFIED — pass savingsRateConfig to useProjectionEngine
                                            (or receive monthlyNetSavings as prop)

components/expense-tracker.tsx  MODIFIED — render MonthlyFlowPanel in expenses tab
                                            pass useSavingsRate data down

components/simulator-dialog.tsx MODIFIED — monthlyNetFlow prop already uses historicalNetFlow,
                                            but if mode = "auto" no change needed;
                                            if mode = "percentage"/"fixed" → use computed value
```

### Unchanged Files

```
lib/projection/scenario-engine.ts    UNCHANGED — API is stable, only its input changes
lib/projection/net-flow.ts           UNCHANGED — averageMonthlyNetFlow still used in "auto" mode
lib/projection/patrimony-history.ts  UNCHANGED
lib/projection/compound-interest.ts  UNCHANGED
hooks/useMoneyTracker.ts             UNCHANGED (likely) — pass-through of savingsRateConfig
hooks/useLocalStorage.ts             UNCHANGED
All other components                 UNCHANGED
```

---

## Integration Points

### Point 1: `computeSavingsEstimate()` replaces `estimateMonthlyNetSavings()`

**Location:** `hooks/useProjectionEngine.ts` line 164

**Current call:**
```typescript
const netSavings = estimateMonthlyNetSavings(
  currentSalary,
  recurringExpenses,
  globalUsdRate
);
```

**New call (after refactor):**
```typescript
const netSavings = computeSavingsEstimate(savingsRateConfig, {
  historicalNetFlow: averageMonthlyNetFlow(
    calculateMonthlyNetFlow(historical), 6
  ),
  currentSalary,
});
```

`projectPatrimonyScenarios(currentPatrimony, netSavings, horizonMonths)` at line 214 is unchanged — it receives a plain number.

**What changes in the hook signature:**
```typescript
export function useProjectionEngine(
  monthlyData: MonthlyData,
  salaryEntries: SalaryEntry[],
  recurringExpenses: RecurringExpense[],   // can stay (still used for income calc)
  globalUsdRate: number,
  options?: {
    ...existing...
    savingsRateConfig?: SavingsRateConfig;  // NEW optional param
  }
)
```

When `savingsRateConfig` is absent, fall back to `estimateMonthlyNetSavings()` for backward compatibility during rollout.

### Point 2: `ChartsContainer` passes `savingsRateConfig`

**Location:** `components/charts-container.tsx` line 43

`ChartsContainer` already calls `useProjectionEngine` directly. It needs to receive `savingsRateConfig` as a prop from `expense-tracker.tsx`, or call `useSavingsRate` itself.

Recommended: `ChartsContainer` calls `useSavingsRate()` directly (simpler, avoids prop threading).

```typescript
// charts-container.tsx
import { useSavingsRate } from "@/hooks/useSavingsRate";

const { savingsRateConfig } = useSavingsRate();

const projection = useProjectionEngine(
  monthlyData, salaryEntries, recurringExpenses, globalUsdRate,
  { ..., savingsRateConfig }
);
```

### Point 3: `SimulatorDialog` receives updated `monthlyNetFlow`

**Location:** `components/expense-tracker.tsx` line 1008

Currently:
```typescript
monthlyNetFlow={historicalNetFlow}  // averageMonthlyNetFlow(points, 6)
```

After refactor, `historicalNetFlow` is the "auto" mode value. If the user has selected `mode: "percentage"` or `mode: "fixed"`, the simulator should use `computeSavingsEstimate(savingsRateConfig, {...})` instead.

```typescript
// expense-tracker.tsx
import { computeSavingsEstimate } from "@/lib/projection/savings-rate";

const effectiveNetFlow = computeSavingsEstimate(savingsRateConfig, {
  historicalNetFlow,
  currentSalary,
});
// Pass effectiveNetFlow to SimulatorDialog instead of historicalNetFlow
```

### Point 4: `MonthlyFlowPanel` placement in `expense-tracker.tsx`

The panel is rendered above the expenses table in the "Gastos" tab. It receives data via props — no internal hook calls — so it can be relocated to a "Resumen" tab later without changing component logic.

```typescript
// expense-tracker.tsx (inside expenses tab content)
<MonthlyFlowPanel
  flowData={monthlyFlowData}       // from useMonthlyFlowData hook
  savingsRateConfig={savingsRateConfig}
  onSavingsRateChange={setSavingsRateConfig}
  currentPatrimony={currentPatrimony}
  projectedPatrimony={miniProjection}
/>
```

---

## New Component and Hook Details

### `lib/projection/savings-rate.ts` (pure functions)

```typescript
export interface SavingsRateConfig {
  mode: "auto" | "percentage" | "fixed";
  percentageValue?: number;  // 0-100, mode "percentage" only
  fixedValue?: number;       // ARS amount, mode "fixed" only
}

export function computeSavingsEstimate(
  config: SavingsRateConfig,
  context: {
    historicalNetFlow: number;  // averageMonthlyNetFlow result
    currentSalary: number;
  }
): number {
  switch (config.mode) {
    case "auto":       return context.historicalNetFlow;
    case "percentage": return Math.round(context.currentSalary * (config.percentageValue ?? 0) / 100);
    case "fixed":      return config.fixedValue ?? 0;
  }
}
```

This function has zero dependencies and is trivially unit-testable.

### `hooks/useSavingsRate.ts`

```typescript
const DEFAULT_CONFIG: SavingsRateConfig = { mode: "auto" };

export function useSavingsRate() {
  const [savingsRateConfig, setSavingsRateConfig] =
    useLocalStorage<SavingsRateConfig>("savingsRateConfig", DEFAULT_CONFIG);

  return { savingsRateConfig, setSavingsRateConfig };
}
```

Uses own localStorage key — no risk of breaking `monthlyData` schema.

### `hooks/useMonthlyFlowData.ts`

Computes the waterfall breakdown for a given month. Receives pre-filtered data as arguments (not calling hooks internally):

```typescript
export interface MonthlyFlowData {
  totalIncome: number;         // salary + extraIncomes (ARS)
  fixedExpenses: number;       // sum of expenses where recurringId != null
  variableExpenses: number;    // sum of expenses where recurringId == null
  investmentContributions: number; // sum of non-initial aporte movements in month
  libre: number;               // totalIncome - fixedExpenses - variableExpenses - investmentContributions
  breakdown: {
    income: { salary: number; extras: number };
    fixed: { name: string; amount: number }[];
    variable: { category: string; total: number }[];
  };
}

export function computeMonthlyFlowData(
  filteredExpenses: Expense[],
  filteredIncomes: ExtraIncome[],
  currentSalary: number,
  investments: Investment[],
  monthKey: string,       // "yyyy-MM" to filter investment movements
  globalUsdRate: number
): MonthlyFlowData
```

This is a pure function in `hooks/useMonthlyFlowData.ts` or `lib/projection/monthly-flow.ts`. The hook wrapper calls it inside `useMemo`.

---

## Data Flow: How All Pieces Connect

```
useMoneyTracker
  ├─ filteredExpenses          ─┐
  ├─ filteredIncomes            ├─► useMonthlyFlowData ──► MonthlyFlowData
  ├─ monthlyData.investments    ┘
  └─ globalUsdRate

useSavingsRate ──────────────────────► SavingsRateConfig
                                              │
                          ┌───────────────────┼──────────────────┐
                          ▼                   ▼                  ▼
                  computeSavingsEstimate  SavingsRateSelector  ChartsContainer
                          │                                       │
                          └──────────────► useProjectionEngine ◄─┘
                                                  │
                                        projectPatrimonyScenarios
                                        (API unchanged)
```

---

## Recommended Build Order

The ordering follows strict dependency chains — each step can be verified before the next depends on it.

### Step 1: Pure function foundation
Create `lib/projection/savings-rate.ts` with `SavingsRateConfig` type and `computeSavingsEstimate()`.
No React, no hooks, testable in isolation.

### Step 2: Persistence hook
Create `hooks/useSavingsRate.ts` using existing `useLocalStorage` pattern.
Write a unit test for `computeSavingsEstimate()` (all 3 modes).

### Step 3: Projection engine refactor
Modify `hooks/useProjectionEngine.ts` to accept optional `savingsRateConfig` parameter.
When present: call `computeSavingsEstimate()`. When absent: fall back to `estimateMonthlyNetSavings()`.
This preserves ChartsContainer behavior during the transition.

### Step 4: Wire ChartsContainer and SimulatorDialog
`ChartsContainer`: call `useSavingsRate()` directly, pass config to `useProjectionEngine`.
`expense-tracker.tsx`: replace `historicalNetFlow` passed to `SimulatorDialog` with `computeSavingsEstimate(savingsRateConfig, {...})`.

### Step 5: Waterfall data hook
Create `hooks/useMonthlyFlowData.ts` (or pure function in `lib/`).
Input: `filteredExpenses`, `filteredIncomes`, `currentSalary`, `investments`, `monthKey`, `globalUsdRate`.
Output: `MonthlyFlowData`. Verified by inspecting the numbers against known month data.

### Step 6: UI components (leaf-first)
Build in order: `savings-rate-selector.tsx` → `waterfall-chart.tsx` → `monthly-flow-panel.tsx`.
Each receives data as props. No internal hook calls.

### Step 7: Wire MonthlyFlowPanel into expense-tracker.tsx
Add `useMonthlyFlowData` call in `expense-tracker.tsx`. Render `<MonthlyFlowPanel>` above expenses table in the "Gastos" tab. Pass mini-projection from `projectedPatrimony` from `useProjectionEngine`.

---

## Component Responsibilities

| Component | Owns | Communicates With |
|-----------|------|-------------------|
| `useSavingsRate` | SavingsRateConfig persistence | `useLocalStorage` (storage), `ChartsContainer` + `MonthlyFlowPanel` (consumers) |
| `useMonthlyFlowData` | Waterfall data derivation | `useMoneyTracker` data (inputs), `MonthlyFlowPanel` (consumer) |
| `computeSavingsEstimate` | Monthly savings number | `useProjectionEngine` (primary consumer), `expense-tracker.tsx` for simulator |
| `useProjectionEngine` | All projection math | `ChartsContainer` (consumer), now accepts `savingsRateConfig` as optional param |
| `MonthlyFlowPanel` | Panel shell + layout | Receives `flowData`, `savingsRateConfig`, `projectedPatrimony` as props |
| `WaterfallChart` | Recharts waterfall rendering | Receives `MonthlyFlowData` as prop |
| `SavingsRateSelector` | Toggle UI + input | Receives `config` + `onChange` as props |

---

## Anti-Patterns to Avoid

### Anti-Pattern 1: Calling useSavingsRate inside useProjectionEngine

**What it would look like:** `useProjectionEngine` reads `savingsRateConfig` from `useLocalStorage` internally.
**Why wrong:** `useProjectionEngine` is explicitly designed to receive all data as parameters for decoupling and testability (decision documented in `.planning/STATE.md` entry [15-02]). Breaking this couples projection math to storage.
**Do this instead:** Pass `savingsRateConfig` as an optional field in the `options` parameter.

### Anti-Pattern 2: Putting waterfall aggregation logic inside the component

**What it would look like:** `MonthlyFlowPanel` calls `filteredExpenses.filter(e => e.recurringId)` inline.
**Why wrong:** Makes the component untestable and unmovable between tabs. The component spec requires it to be "autocontenido" (self-contained via props).
**Do this instead:** `useMonthlyFlowData` hook in `expense-tracker.tsx` computes the aggregation. `MonthlyFlowPanel` receives `MonthlyFlowData` as a prop.

### Anti-Pattern 3: Adding savingsRateConfig to monthlyData

**What it would look like:** `monthlyData.savingsRateConfig = { mode: "auto" }` and a migration entry.
**Why wrong:** `monthlyData` already has 8 migration versions. SavingsRateConfig is app-level config, not per-month financial data. Mixing them increases schema fragility.
**Do this instead:** Own localStorage key `"savingsRateConfig"` via `useSavingsRate`. Zero migration needed.

### Anti-Pattern 4: Creating a new Recharts library for the waterfall

**What it would look like:** Adding `recharts-waterfall` or similar npm package.
**Why wrong:** The existing `BarChart` from Recharts 3.x handles waterfalls with stacked bars and custom shapes. The project constraint is explicit: "No agregar nueva librería de charts."
**Do this instead:** `BarChart` with a running-offset technique — each bar is `[offset, offset + value]` using Recharts' `Cell` + `Bar` with custom domain.

---

## Scaling Considerations

This is a localStorage single-user app. Scaling in this context means performance as data grows.

| Concern | Mitigation |
|---------|------------|
| `useMonthlyFlowData` recomputing on every render | `useMemo` with `[filteredExpenses, filteredIncomes, currentSalary, selectedMonth]` dependencies |
| `computeSavingsEstimate` called in 3 places | It's O(1) — no memoization needed |
| `MonthlyFlowPanel` re-rendering when unrelated state changes | Props-only interface means React bailout works correctly; wrap in `React.memo` if needed |
| Waterfall chart with many expense rows | Aggregate by category (already in breakdown design) — chart has ~5 bars regardless of expense count |

---

## Sources

- Direct codebase analysis: `hooks/useProjectionEngine.ts`, `hooks/useMoneyTracker.ts`, `lib/projection/` (all files)
- `components/charts-container.tsx`, `components/simulator-dialog.tsx` — call site analysis
- `.planning/phases/18-flujo-mensual-panel-unificado/PROMPT.md` — feature specification
- `.planning/PROJECT.md` — milestone requirements
- `.planning/codebase/ARCHITECTURE.md` — existing architecture patterns (2026-03-31)

---

*Architecture research for: Monthly Flow Panel (v1.3)*
*Researched: 2026-04-07*
