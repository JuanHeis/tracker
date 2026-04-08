# Phase 18: Savings Rate Engine & Persistence - Research

**Researched:** 2026-04-08
**Domain:** Pure computation + localStorage persistence + Radix Slider UI
**Confidence:** HIGH

## Summary

Phase 18 introduces a configurable savings rate system with three modes (auto/percentage/fixed) that replaces the existing `estimateMonthlyNetSavings()` with a new `computeSavingsEstimate()` pure function. The persistence layer uses its own localStorage key (`"savingsRateConfig"`) avoiding any schema migration. A `useSavingsRate` hook wraps persistence + computation, and a `SavingsRateSelector` component provides the UI with a Radix Slider for percentage mode.

The codebase already has all the building blocks: `averageMonthlyNetFlow()` in `lib/projection/net-flow.ts` computes the historical average needed for auto mode, `useLocalStorage` hook handles typed localStorage persistence with SSR safety, and the projection types system is well-structured for extension. The only new dependency is `@radix-ui/react-slider` for the percentage slider UI.

**Primary recommendation:** Build three layers bottom-up: (1) pure `computeSavingsEstimate()` function with tests, (2) `useSavingsRate` hook combining persistence + computation, (3) `SavingsRateSelector` UI component. Keep the function pure and the hook as the single integration point.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| SAVE-01 | User can choose savings rate mode: auto (historical average), percentage of salary, or fixed amount | Three-mode discriminated union type `SavingsRateConfig`; `SavingsRateSelector` component with mode switcher |
| SAVE-02 | In auto mode, shows calculated value from `averageMonthlyNetFlow` | `averageMonthlyNetFlow()` already exists in `lib/projection/net-flow.ts`; auto mode reads this value and displays it |
| SAVE-03 | In percentage mode, slider/input 0-100 showing resulting amount | `@radix-ui/react-slider` + shadcn Slider wrapper; multiply percentage by current salary for display |
| SAVE-04 | Configuration persists in localStorage under `"savingsRateConfig"` key | `useLocalStorage` hook already handles typed persistence with SSR safety; new key outside STORAGE_KEYS |
| REF-01 | `computeSavingsEstimate()` replaces `estimateMonthlyNetSavings()` in projection engine | Pure function taking `SavingsRateConfig` + financial context, returns monthly savings scalar; wiring into `useProjectionEngine` happens in Phase 19 |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @radix-ui/react-slider | ^1.x | Accessible slider for percentage mode | Already using Radix for all primitives; shadcn pattern |
| React 18 | ^18 | Component framework | Already in use |
| TypeScript | existing | Type safety for config types | Already in use |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| useLocalStorage hook | existing | Persist savingsRateConfig | For the `useSavingsRate` hook |
| vitest | existing | Unit tests for pure function | For `computeSavingsEstimate()` tests |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| @radix-ui/react-slider | HTML range input | Radix gives accessibility, keyboard nav, RTL for free; consistent with project's Radix usage |
| Separate localStorage key | Extending MonthlyData | Separate key avoids schema migration per STATE.md decision |

**Installation:**
```bash
npm install @radix-ui/react-slider
```

## Architecture Patterns

### Recommended Project Structure
```
lib/projection/
├── savings-rate.ts          # computeSavingsEstimate() pure function + types
├── savings-rate.test.ts     # Unit tests for all three modes
├── income-projection.ts     # Existing (estimateMonthlyNetSavings stays until Phase 19 wires replacement)
├── net-flow.ts              # Existing (averageMonthlyNetFlow used by auto mode)
hooks/
├── useSavingsRate.ts        # Hook: useLocalStorage + computeSavingsEstimate orchestration
components/
├── savings-rate-selector.tsx # UI: mode selector + slider/input + display
components/ui/
├── slider.tsx               # shadcn-style Slider wrapper around @radix-ui/react-slider
```

### Pattern 1: Discriminated Union for Config
**What:** Use a TypeScript discriminated union for the three savings rate modes
**When to use:** When a config can be one of several shapes with different fields per mode
**Example:**
```typescript
type SavingsRateConfig =
  | { mode: "auto" }
  | { mode: "percentage"; percentage: number }  // 0-100
  | { mode: "fixed"; amount: number };           // monthly ARS amount

const DEFAULT_CONFIG: SavingsRateConfig = { mode: "auto" };
```

### Pattern 2: Pure Computation Function
**What:** `computeSavingsEstimate()` takes config + financial context, returns a single number
**When to use:** For the core savings scalar that downstream consumers need
**Example:**
```typescript
interface SavingsEstimateInput {
  config: SavingsRateConfig;
  currentSalary: number;
  averageNetFlow: number; // from averageMonthlyNetFlow()
}

export function computeSavingsEstimate(input: SavingsEstimateInput): number {
  switch (input.config.mode) {
    case "auto":
      return Math.max(0, input.averageNetFlow);
    case "percentage":
      return Math.round(input.currentSalary * input.config.percentage / 100);
    case "fixed":
      return input.config.amount;
  }
}
```

### Pattern 3: Hook as Integration Layer
**What:** `useSavingsRate` hook combines persistence + computation into a single return
**When to use:** Components need both the config (for UI) and the computed estimate (for display/pass-down)
**Example:**
```typescript
export function useSavingsRate(currentSalary: number, averageNetFlow: number) {
  const [config, setConfig] = useLocalStorage<SavingsRateConfig>(
    "savingsRateConfig",
    { mode: "auto" }
  );

  const estimate = useMemo(
    () => computeSavingsEstimate({ config, currentSalary, averageNetFlow }),
    [config, currentSalary, averageNetFlow]
  );

  return { config, setConfig, estimate };
}
```

### Pattern 4: shadcn Slider Component
**What:** Thin wrapper around Radix Slider following existing shadcn patterns in the project
**When to use:** For the percentage mode slider UI
**Example:**
```typescript
// components/ui/slider.tsx
import * as SliderPrimitive from "@radix-ui/react-slider";
import { cn } from "@/lib/utils";

const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>
>(({ className, ...props }, ref) => (
  <SliderPrimitive.Root
    ref={ref}
    className={cn("relative flex w-full touch-none select-none items-center", className)}
    {...props}
  >
    <SliderPrimitive.Track className="relative h-2 w-full grow overflow-hidden rounded-full bg-secondary">
      <SliderPrimitive.Range className="absolute h-full bg-primary" />
    </SliderPrimitive.Track>
    <SliderPrimitive.Thumb className="block h-5 w-5 rounded-full border-2 border-primary bg-background ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" />
  </SliderPrimitive.Root>
));
```

### Anti-Patterns to Avoid
- **Mutating localStorage in the pure function:** `computeSavingsEstimate()` must be side-effect free. Persistence belongs in the hook only.
- **Adding savingsRateConfig to STORAGE_KEYS:** Per STATE.md decision, this uses its own key and should NOT be added to the export/import STORAGE_KEYS array (that would break import validation for older backups). Consider adding it to OPTIONAL_KEYS if export/import support is desired later.
- **Coupling UI state to the hook:** The `SavingsRateSelector` should receive `config`, `setConfig`, and display values as props -- not call hooks internally (props-only pattern per STATE.md).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Accessible slider | Custom range input with drag handlers | @radix-ui/react-slider | Keyboard nav, ARIA labels, touch support, RTL |
| localStorage with SSR safety | Raw `window.localStorage` calls | Existing `useLocalStorage` hook | Handles SSR, JSON parse/stringify, error handling |
| Historical average calculation | New averaging function | Existing `averageMonthlyNetFlow()` | Already tested, handles edge cases (empty data, rounding) |

**Key insight:** Nearly everything needed already exists in the codebase. The new code is primarily a thin configuration/persistence layer on top of existing calculations.

## Common Pitfalls

### Pitfall 1: Auto Mode with No Historical Data
**What goes wrong:** `averageMonthlyNetFlow()` returns 0 when there's no history (new user), making auto mode show $0 savings
**Why it happens:** New users or users with only 1 month of data have no delta to average
**How to avoid:** When `averageNetFlow` is 0 and mode is auto, fall back to `estimateMonthlyNetSavings()` (salary minus recurring) or show a message explaining insufficient data
**Warning signs:** Users who just completed the wizard seeing $0 savings estimate

### Pitfall 2: Percentage Mode Losing Decimal Precision
**What goes wrong:** Slider steps of 1% are too coarse for high salaries; 1% of $2M = $20K swing
**Why it happens:** Using integer percentages only
**How to avoid:** Allow 0.5% or 1% steps -- 1% is likely fine for this use case given Argentine salary ranges, but test with real numbers
**Warning signs:** User unable to fine-tune their percentage

### Pitfall 3: Stale Salary Reference in Percentage Mode
**What goes wrong:** User changes salary but percentage display still shows old resulting amount
**Why it happens:** Computed estimate not reacting to salary changes
**How to avoid:** `useMemo` depends on `currentSalary` so it recalculates automatically. Verify the dependency array includes salary.
**Warning signs:** Displayed amount not matching percentage * current salary

### Pitfall 4: localStorage Key Not Cleared on Factory Reset
**What goes wrong:** User triggers "Re-ejecutar wizard" but savingsRateConfig persists from old session
**Why it happens:** `STORAGE_KEYS.forEach(key => localStorage.removeItem(key))` in settings-panel.tsx doesn't include `"savingsRateConfig"` since it's a separate key
**How to avoid:** Add `"savingsRateConfig"` to the factory reset logic in settings-panel.tsx (the `STORAGE_KEYS` loop or a separate call)
**Warning signs:** Old savings config showing up after wizard re-run

### Pitfall 5: Negative Auto Mode Values
**What goes wrong:** `averageMonthlyNetFlow` can be negative (user consistently overspends), leading to negative savings estimate
**Why it happens:** Historical data shows net outflow
**How to avoid:** `computeSavingsEstimate()` for auto mode should use `Math.max(0, averageNetFlow)` -- savings can't be negative (that's a deficit, not savings). Display a warning if historical average is negative.
**Warning signs:** Projection showing patrimony decreasing even in "base" scenario

## Code Examples

### Existing: averageMonthlyNetFlow Usage in expense-tracker.tsx
```typescript
// Currently in expense-tracker.tsx (line ~257-261)
const historicalNetFlow = useMemo(() => {
  const points = reconstructHistoricalPatrimony(monthlyData, salaryHistory.entries, globalUsdRate);
  const flows = calculateMonthlyNetFlow(points);
  return averageMonthlyNetFlow(flows, 6);
}, [monthlyData, salaryHistory.entries, globalUsdRate]);
```
This is the value that auto mode will consume directly.

### Existing: estimateMonthlyNetSavings (to be replaced by Phase 19)
```typescript
// lib/projection/income-projection.ts (line 19-34)
export function estimateMonthlyNetSavings(
  currentSalary: number,
  activeRecurringExpenses: RecurringExpense[],
  globalUsdRate: number
): number {
  // Subtracts active recurring expenses from salary
  return Math.max(0, currentSalary - totalRecurring);
}
```
This function stays until Phase 19 wires `computeSavingsEstimate()` into the projection engine. Phase 18 creates the replacement but does NOT wire it.

### Existing: useLocalStorage Pattern
```typescript
// hooks/useLocalStorage.ts
const [storedValue, setStoredValue] = useLocalStorage<SavingsRateConfig>(
  "savingsRateConfig",
  { mode: "auto" }
);
```
The hook handles SSR safety, JSON serialization, and error handling.

### Existing: SimulatorDialog monthlyNetFlow Prop
```typescript
// SimulatorDialog currently receives monthlyNetFlow directly:
<SimulatorDialog
  monthlyNetFlow={historicalNetFlow}
  // ... other props
/>
```
Phase 19 will change this to use the configured savings estimate instead.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `estimateMonthlyNetSavings()` (salary - recurring) | `computeSavingsEstimate()` (3 modes) | Phase 18 (creates), Phase 19 (wires) | More accurate savings estimation for projections |
| Single hardcoded savings calculation | User-configurable savings rate | Phase 18 | User controls their own financial assumptions |

**Deprecated/outdated:**
- `estimateMonthlyNetSavings()`: Will be superseded by `computeSavingsEstimate()` in Phase 19. Phase 18 creates the new function but does NOT remove the old one.

## Open Questions

1. **Should savingsRateConfig be included in JSON export/import?**
   - What we know: STATE.md says "no schema migration" and the key is separate from STORAGE_KEYS
   - What's unclear: Whether users expect their savings config to transfer with backups
   - Recommendation: Add to OPTIONAL_KEYS in useDataPersistence for export/import support without breaking older imports. Defer to Phase 19 or handle as quick follow-up.

2. **What happens in percentage mode when user has no salary configured?**
   - What we know: `currentSalary` could be 0 if user skipped income setup
   - What's unclear: Whether to show $0 or disable percentage mode
   - Recommendation: Show $0 with a hint "Configura tu ingreso fijo para usar este modo"

## Sources

### Primary (HIGH confidence)
- Codebase analysis: `lib/projection/net-flow.ts`, `lib/projection/income-projection.ts`, `hooks/useProjectionEngine.ts` -- verified existing computation patterns
- Codebase analysis: `hooks/useLocalStorage.ts` -- verified persistence pattern
- Codebase analysis: `hooks/useDataPersistence.ts` -- verified STORAGE_KEYS and export/import logic
- Codebase analysis: `components/expense-tracker.tsx` -- verified `historicalNetFlow` computation and `SimulatorDialog` wiring
- Codebase analysis: `lib/projection/scenario-engine.ts` -- verified how `monthlyNetSavings` scalar is consumed

### Secondary (MEDIUM confidence)
- @radix-ui/react-slider API pattern based on established Radix usage in the project (consistent with other @radix-ui packages already installed)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries already in use except @radix-ui/react-slider (same family as existing Radix deps)
- Architecture: HIGH - Direct extension of existing patterns (pure functions + hooks + props-only components)
- Pitfalls: HIGH - Based on direct codebase analysis of edge cases

**Research date:** 2026-04-08
**Valid until:** 2026-05-08 (stable domain, no external API dependencies)
