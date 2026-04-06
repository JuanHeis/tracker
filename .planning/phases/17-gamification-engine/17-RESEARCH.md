# Phase 17: Simulador de Gastos Futuros - Research

**Researched:** 2026-04-05
**Domain:** Financial projection simulation / React ephemeral state UI
**Confidence:** HIGH

## Summary

This phase adds a self-contained "what-if" expense simulator that opens in a dialog from the floating taskbar. Users define hypothetical one-time or installment expenses, and a mini chart shows the impact on their projected patrimony (before vs after lines). All state is ephemeral React state -- no localStorage writes, no real data mutation.

The implementation is straightforward because the project already has all the building blocks: the projection engine (`projectPatrimonyScenarios` + `estimateMonthlyNetSavings`), the Recharts ComposedChart dual-line pattern (`patrimony-chart.tsx`), the Dialog component pattern, the `CurrencyInput` component, and the horizon selector (`ChartControls`). The main work is: (1) a new simulation engine function that applies simulated expenses to the base projection, (2) a dialog component with a form + editable expense list + mini chart, and (3) a taskbar button to open it.

**Primary recommendation:** Build a pure TypeScript `applySimulatedExpenses` function that takes the base projection array and an array of simulated expenses, returns a modified projection array. Keep all simulation logic in `lib/projection/` alongside existing engine code. The dialog component composes existing UI patterns (Dialog, CurrencyInput, ComposedChart).

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Button added to the existing floating taskbar (alongside settings)
- Opens a Dialog/modal (same pattern as investment-dialog, loan-dialog)
- Impact visualization is self-contained inside the dialog -- no overlay on the patrimony chart
- Ephemeral: closing the dialog discards all simulated data
- Two types: gasto puntual (1 cuota) and gasto en cuotas (N cuotas)
- Form fields: nombre, monto total, cantidad de cuotas (1 = puntual), currency (ARS/USD)
- For installments: user enters total amount, simulator calculates per-cuota amount
- Can add multiple expenses in one session via "Agregar otro gasto" button
- Each expense shows in an editable list with individual delete buttons
- No recurring expense simulation (that already exists as a real feature)
- Mini chart inside the dialog showing two lines: "Sin gastos simulados" vs "Con gastos simulados"
- Before line = current base projection (using real income, recurring expenses, balance)
- After line = same projection minus simulated expenses applied to relevant months
- Chart updates in real-time as expenses are added/modified/removed
- Key summary numbers displayed alongside the chart: total cost, monthly max impact, balance at worst month
- Base scenario only (no optimista/pesimista -- keeps the chart clean)
- Horizon selector reuses same options as patrimony chart (3, 6, 12, 24 months)
- Each simulated expense can be ARS or USD (dual currency, like real expenses)
- USD expenses convert at globalUsdRate for projection calculation
- Simulator does NOT register real expenses -- keep separate from actual CRUD
- No "convert to real expense" button -- user goes to normal form to register
- No localStorage changes -- ephemeral state lives in React state only (respects INFRA-03)

### Claude's Discretion
- Chart styling (colors, line styles for before/after)
- Exact layout of form vs chart inside the dialog
- Summary number placement and formatting
- How to handle the case where simulated expenses exceed available balance (warning? red zone?)
- Debounce strategy for real-time chart updates during typing

### Deferred Ideas (OUT OF SCOPE)
None
</user_constraints>

## Standard Stack

### Core (Already Installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Recharts | ^3.8.1 | ComposedChart with dual Lines for before/after | Already used for patrimony-chart and investment-chart |
| @radix-ui/react-dialog | ^1.1.2 | Dialog modal for simulator | Already used for investment-dialog, loan-dialog, settings |
| date-fns | ^4.1.0 | Month arithmetic (addMonths, format) | Already used throughout projection engine |
| React 18 | (via Next 14.2) | useState for ephemeral simulation state | Core framework |

### Supporting (Already Available)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| CurrencyInput | local component | es-AR locale money formatting | All monto inputs in the simulator form |
| ChartContainer + ChartConfig | shadcn/ui chart | Recharts wrapper with theming | Wrap the mini ComposedChart |
| useHydration | local hook | SSR safety for chart rendering | Inside the dialog chart component |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Recharts ComposedChart | Area chart with fill between lines | ComposedChart already proven in codebase, stick with it |
| useState for expense list | useReducer | List is small (few items), useState with spread is simpler |

**Installation:** No new packages needed -- all dependencies are already installed.

## Architecture Patterns

### Recommended Project Structure
```
lib/projection/
  simulator.ts           # Pure TS: applySimulatedExpenses(), computeSimulatorSummary()
components/
  simulator-dialog.tsx   # Dialog with form + expense list + mini chart
  charts/
    simulator-chart.tsx  # Mini ComposedChart (before/after lines)
```

### Pattern 1: Pure Projection Function (Matching Existing Engine Pattern)
**What:** A pure TypeScript function that takes base projection values and simulated expenses, returns a modified array of values with expenses subtracted in the correct months.
**When to use:** This is the core computation -- must be pure (no React deps) to match Phase 15 conventions.
**Example:**
```typescript
// lib/projection/simulator.ts
export interface SimulatedExpense {
  id: string;
  name: string;
  totalAmount: number;
  installments: number;  // 1 = one-time, N = N monthly installments
  currencyType: CurrencyType;
}

export interface SimulatorDataPoint {
  month: string;       // Display label
  monthKey: string;    // "2026-04"
  sinSimulacion: number;
  conSimulacion: number;
}

/**
 * Apply simulated expenses to base projection.
 * Installments: spread totalAmount/installments across N consecutive months starting from month 1.
 * One-time: full amount in month 1.
 * USD amounts converted at globalUsdRate.
 */
export function applySimulatedExpenses(
  baseProjection: number[],        // From projectPatrimonyScenarios base scenario
  simulatedExpenses: SimulatedExpense[],
  globalUsdRate: number
): number[] {
  const result = [...baseProjection];
  for (const expense of simulatedExpenses) {
    const amountArs = expense.currencyType === CurrencyType.USD
      ? expense.totalAmount * globalUsdRate
      : expense.totalAmount;
    const perMonth = amountArs / expense.installments;
    
    for (let i = 0; i < expense.installments; i++) {
      const monthIndex = i + 1; // Start from month 1 (future)
      if (monthIndex < result.length) {
        // Cumulative: subtract from this month AND all subsequent months
        for (let j = monthIndex; j < result.length; j++) {
          result[j] -= perMonth;
        }
      }
    }
  }
  return result;
}
```

### Pattern 2: Ephemeral State Dialog (Matching investment-dialog Pattern)
**What:** Dialog with local useState, no persistence. Form adds to an in-memory list.
**When to use:** For the simulator dialog -- all state dies when dialog closes.
**Example:**
```typescript
// components/simulator-dialog.tsx
export function SimulatorDialog({ open, onOpenChange, ...dataProps }) {
  const [expenses, setExpenses] = useState<SimulatedExpense[]>([]);
  const [horizonMonths, setHorizonMonths] = useState(12);
  
  // Reset state when dialog closes
  useEffect(() => {
    if (!open) setExpenses([]);
  }, [open]);
  
  // Compute projections reactively
  const projectionData = useMemo(() => {
    // ... compute base + simulated projection
  }, [expenses, horizonMonths, ...dataProps]);
}
```

### Pattern 3: Mini Chart Inside Dialog (Reusing patrimony-chart patterns)
**What:** A simplified ComposedChart with two lines (before/after) inside the dialog body.
**When to use:** For the impact visualization.
**Key differences from full PatrimonyChart:**
- Only 2 lines (sinSimulacion, conSimulacion) instead of 4 (historical + 3 scenarios)
- No ReferenceLine for "Hoy" (all data is future projection)
- Smaller height (dialog context)
- No scenario toggles

### Anti-Patterns to Avoid
- **Writing to localStorage:** The simulator MUST NOT modify MonthlyData or any persisted state. All simulation lives in React state.
- **Reusing useProjectionEngine directly:** The hook does too much (historical, 3 scenarios, investments). Extract only what's needed: call `estimateMonthlyNetSavings` and `projectPatrimonyScenarios` for the base scenario, then apply simulated expenses on top.
- **Complex form validation during typing:** Keep validation minimal -- only validate on "add expense" action, not on every keystroke. This avoids debounce complexity.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Money input formatting | Custom number parser | CurrencyInput component | Already handles es-AR locale (dots as thousands, comma as decimal) |
| Modal accessibility | Custom overlay | Radix Dialog (via shadcn) | Focus trap, escape key, aria attributes |
| Chart rendering | Canvas/SVG from scratch | Recharts ComposedChart | Proven pattern in codebase |
| Month arithmetic | Manual date math | date-fns addMonths/format | Edge cases with month boundaries |

**Key insight:** This phase requires zero new libraries. Every building block exists in the codebase already.

## Common Pitfalls

### Pitfall 1: Cumulative vs Per-Month Expense Application
**What goes wrong:** Subtracting the installment amount only from the specific month instead of cumulatively from that month onward. The projection shows patrimony "recovering" after the expense month.
**Why it happens:** Confusion between "expense in month M" and "patrimony impact from month M onward."
**How to avoid:** Each installment payment reduces patrimony cumulatively -- subtract from the month of payment AND all subsequent months in the projection array.
**Warning signs:** The "after" line dips and then returns to meet the "before" line.

### Pitfall 2: Dialog State Not Resetting on Close
**What goes wrong:** User closes dialog, reopens it, and sees previous simulation data.
**Why it happens:** React state persists as long as component is mounted (Dialog renders but hides).
**How to avoid:** Use `useEffect` to reset expense list when `open` transitions to `false`, OR use a key prop on the dialog content to force remount.
**Warning signs:** Stale expenses appear when reopening the dialog.

### Pitfall 3: USD Conversion Using Wrong Rate
**What goes wrong:** USD expenses not properly converted to ARS for projection impact.
**Why it happens:** Forgetting to multiply by globalUsdRate, or using a stale rate.
**How to avoid:** Convert at the computation layer (in `applySimulatedExpenses`), not at the display layer. Pass `globalUsdRate` as a parameter.
**Warning signs:** USD expenses show unrealistically small or large impact.

### Pitfall 4: Chart Flickering During Rapid Input
**What goes wrong:** Chart re-renders on every keystroke, causing visual jitter.
**Why it happens:** Direct binding of form values to projection computation.
**How to avoid:** Only recalculate projection when an expense is ADDED to the list (via button click), not while user is typing in the form. The expense list drives the chart, not the form fields.
**Warning signs:** Chart stutters while typing in the amount field.

### Pitfall 5: Missing Month 0 in Projection
**What goes wrong:** Projection array starts from month 1, but chart expects month 0 (current month) as the anchor point.
**Why it happens:** Off-by-one in projection generation.
**How to avoid:** Month 0 = current patrimony (same for both lines). Expenses start from month 1.
**Warning signs:** Both lines don't start at the same point.

## Code Examples

### Getting Base Projection Data for Simulator
```typescript
// The simulator needs these values from the app's existing data:
// 1. currentPatrimony (from historical reconstruction)
// 2. monthlyNetSavings (from income - recurring expenses)
// 3. horizonMonths (from horizon selector)

import { estimateMonthlyNetSavings } from "@/lib/projection/income-projection";
import { projectPatrimonyScenarios } from "@/lib/projection/scenario-engine";

// Inside the dialog, with data passed as props:
const netSavings = estimateMonthlyNetSavings(
  currentSalary,
  activeRecurringExpenses,
  globalUsdRate
);

// Get base scenario only (index into .base)
const scenarios = projectPatrimonyScenarios(
  currentPatrimony,
  netSavings,
  horizonMonths
);
const baseProjection = scenarios.base; // number[] of length horizonMonths + 1
```

### Simulator Summary Computation
```typescript
export function computeSimulatorSummary(
  baseProjection: number[],
  simulatedProjection: number[]
): { totalCost: number; maxMonthlyImpact: number; worstBalance: number } {
  let totalCost = 0;
  let maxMonthlyImpact = 0;

  for (let m = 1; m < baseProjection.length; m++) {
    const monthImpact = (baseProjection[m] - baseProjection[m - 1]) 
                       - (simulatedProjection[m] - simulatedProjection[m - 1]);
    if (monthImpact > 0) {
      totalCost += monthImpact;
      maxMonthlyImpact = Math.max(maxMonthlyImpact, monthImpact);
    }
  }

  const worstBalance = Math.min(...simulatedProjection.slice(1));

  return { totalCost, maxMonthlyImpact, worstBalance };
}
```

### Horizon Selector (Reuse Pattern)
```typescript
// Reuse the same Select pattern from ChartControls but without scenario toggles
<Select value={String(horizonMonths)} onValueChange={(v) => setHorizonMonths(Number(v))}>
  <SelectTrigger className="w-[140px]">
    <SelectValue />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="3">3 meses</SelectItem>
    <SelectItem value="6">6 meses</SelectItem>
    <SelectItem value="12">12 meses</SelectItem>
    <SelectItem value="24">24 meses</SelectItem>
  </SelectContent>
</Select>
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Recharts 2.x | Recharts 3.8.1 | Phase 14 | ComposedChart API stable, use same patterns |
| Projection in components | Pure TS in lib/projection/ | Phase 15 | Simulator math goes in lib/projection/simulator.ts |

**Deprecated/outdated:**
- None relevant -- all projection patterns established in Phases 14-16 are current.

## Open Questions

1. **Start month for installments**
   - What we know: User enters total amount + number of installments. Per-cuota = total / installments.
   - What's unclear: Do installments start from "next month" (month 1 in projection)? Or should user pick a start date?
   - Recommendation: Default to month 1 (next month). This keeps the form simple and matches the ephemeral "quick what-if" nature. The CONTEXT.md says "applied to relevant months" without specifying a start date picker, suggesting simplicity is preferred.

2. **Negative balance visualization**
   - What we know: User could simulate expenses that exceed their projected patrimony.
   - What's unclear: How to visually handle negative values (the "after" line going below zero).
   - Recommendation: Let the line go negative naturally. Add a red-shaded zone or a warning badge when the simulated projection goes below zero. This is listed under Claude's Discretion.

## Sources

### Primary (HIGH confidence)
- Project codebase direct inspection:
  - `lib/projection/scenario-engine.ts` - projectPatrimonyScenarios function
  - `lib/projection/income-projection.ts` - estimateMonthlyNetSavings function
  - `hooks/useProjectionEngine.ts` - orchestrator pattern for projections
  - `components/charts/patrimony-chart.tsx` - Recharts ComposedChart with dual lines
  - `components/charts/chart-controls.tsx` - horizon selector pattern
  - `components/investment-dialog.tsx` - Dialog form pattern
  - `components/currency-input.tsx` - CurrencyInput component
  - `components/expense-tracker.tsx` - taskbar/settings button integration point

### Secondary (MEDIUM confidence)
- Phase 14-16 decisions in STATE.md - established patterns for charts and projections

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - all libraries already in use, no new dependencies
- Architecture: HIGH - follows established patterns (pure TS engine + dialog + chart)
- Pitfalls: HIGH - common React state and projection math issues, well-understood

**Research date:** 2026-04-05
**Valid until:** 2026-05-05 (stable -- no moving parts, all internal code)
