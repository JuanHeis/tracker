# Phase 8: Budgets - Research

**Researched:** 2026-04-02
**Domain:** Budget management UI with progress visualization (React, Tailwind, localStorage)
**Confidence:** HIGH

## Summary

Phase 8 adds a "Presupuestos" tab where users define monthly spending caps per expense category and see visual progress bars with color-coded alerts. The implementation is entirely frontend — no new libraries are needed. The budget data model lives in localStorage (either as a separate key or within `monthlyData`), a new `useBudgetTracker` hook computes spending vs limits per category using existing expense data filtered by the active pay period, and a new tab component renders progress bars with category colors, amber/red thresholds, and tooltip breakdowns.

The domain is straightforward: sum expenses by category for the active period, compare against user-defined limits, render progress bars. The main complexity lies in (1) the monthly limit snapshot system (preserving historical limits when the user changes a budget), (2) correctly integrating with the existing `viewMode`/pay period system, and (3) converting USD expenses to ARS for budget comparison using their stored exchange rates.

**Primary recommendation:** Build a custom `useBudgetTracker` hook that reads from a new `budgets` localStorage key, computes per-category spending from `monthlyData.expenses` using the same date filtering as `useExpensesTracker`, and exposes budget CRUD + computed progress data. Use a simple Tailwind `div`-based progress bar (no library needed) with dynamic `style={{ width }}` and conditional color classes.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Dedicated "Presupuestos" tab alongside Gastos/Ingresos/Inversiones/Movimientos
- Create budget via "+ Agregar presupuesto" button with dropdown showing only categories without a budget yet
- Edit/remove budget via pencil + trash icons (consistent with Phase 2/3/4 click-to-edit pattern)
- Budgets set in ARS only — USD expenses converted at their stored rate for comparison
- Each budget row: category name (with color dot from CATEGORIES constant), full-width progress bar below, "$spent / $limit" and percentage on the right, pencil + trash icons
- Bar color: category's own color by default, turns amber at 80%, red at 100%+
- Summary header at top of tab: "Total presupuestado: $X | Gastado: $Y | Disponible: $Z" with aggregate progress bar
- Tooltip on each budget bar showing expense breakdown (list of individual expenses in that category for the period)
- Budget rows sorted by percentage used, highest first (most critical at top)
- Warning threshold: 80% — bar turns amber, warning icon appears
- Exceeded threshold: 100% — bar fills completely in red, shows "Excedido en $X.XXX"
- Alert is visual only: bar color change + warning icon next to percentage
- No real-time warning when adding expenses — budget status only visible in Presupuestos tab
- Fixed monthly limits, no rollover of unused budget
- Budget spending follows the active view mode (periodo personalizado or mes calendario from Phase 4)
- Per-month limit history: when a budget limit is changed, past months retain their original limits
- Monthly limit snapshot created on first expense of the month (lazy — no empty snapshots)
- Cuotas (installment payments) count toward the budget in the month they fall, not when originally created
- No budgets set: friendly empty state with explanation text and prominent CTA
- Budgeted category with $0 spent: shows normally with empty bar
- Rows sorted by percentage used, descending; exceeded budgets always at top

### Claude's Discretion
- Exact progress bar component implementation (custom or library)
- Summary header layout and styling details
- Tooltip positioning and formatting for expense breakdown
- How limit snapshots are stored in localStorage (within monthlyData or separate key)
- Tab icon choice for Presupuestos
- NumberFlow animation on budget amounts (if it fits naturally)
- How the "Agregar presupuesto" dialog/inline form is designed

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| PRES-01 | User puede definir tope mensual por categoria de gasto | Budget CRUD in `useBudgetTracker` hook + "Agregar presupuesto" UI with category dropdown; localStorage persistence for budget definitions |
| PRES-02 | User ve barra de progreso visual del gasto vs presupuesto por categoria | Custom Tailwind progress bar per budget row, computed from filtered expenses summed by category vs stored limit; tooltip with expense breakdown |
| PRES-03 | User ve alerta visual al acercarse al limite del presupuesto | Conditional bar color (amber at 80%, red at 100%+), warning icon via lucide-react, "Excedido en $X" text |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React 18 | ^18 | Component framework | Already in project |
| Tailwind CSS | ^3.4.1 | Styling, progress bar | Already in project; div-based bars trivial with Tailwind |
| @radix-ui/react-tooltip | ^1.1.3 | Tooltip for expense breakdown on bars | Already in project, used in Phase 5 desglose pattern |
| @radix-ui/react-dialog | ^1.1.2 | Budget create/edit dialog | Already in project |
| @radix-ui/react-select | ^2.1.2 | Category dropdown in budget form | Already in project |
| lucide-react | ^0.454.0 | Warning icon, pencil/trash icons | Already in project |
| date-fns | ^4.1.0 | Date filtering for period-scoped budget calculation | Already in project |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @number-flow/react | ^0.6.0 | Animated budget amounts | Optional — use if amount transitions feel natural |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Custom Tailwind div bar | @radix-ui/react-progress or shadcn/ui Progress | Extra dependency for a trivial component; custom div gives full control over color transitions and category colors |
| Separate localStorage key | Store budgets inside monthlyData | Separate key is simpler — budgets are global definitions, not per-month data; snapshots can be a nested object within the same key |

**Installation:**
```bash
# No new packages needed — all dependencies already in project
```

## Architecture Patterns

### Recommended Project Structure
```
hooks/
├── useBudgetTracker.ts    # Budget CRUD + spending computation hook
components/
├── budget-tab.tsx          # Main Presupuestos tab content
├── budget-row.tsx          # Individual budget row with bar + tooltip
├── budget-dialog.tsx       # Create/edit budget dialog
```

### Pattern 1: Budget Data Model
**What:** Two-level data structure — budget definitions (category -> limit) and monthly snapshots (monthKey -> category -> limit at that time)
**When to use:** Always — this is the core data model

```typescript
// Budget definition (current active limits)
interface BudgetDefinition {
  category: Category;
  monthlyLimit: number; // ARS
}

// Monthly snapshot (historical limits for a specific month)
interface BudgetSnapshot {
  [category: string]: number; // category -> limit that was active
}

// Top-level localStorage shape
interface BudgetData {
  definitions: BudgetDefinition[];
  snapshots: Record<string, BudgetSnapshot>; // monthKey -> snapshot
}
```

**Snapshot logic:** When computing budget progress for a month:
1. Check if a snapshot exists for that monthKey
2. If yes, use the snapshot's limit (historical accuracy)
3. If no, use the current definition's limit (current month or no expenses yet)
4. Snapshot is created lazily: on first budget computation for a month where expenses exist, capture current limits

### Pattern 2: Spending Computation
**What:** Reuse existing expense filtering to sum per-category spending
**When to use:** In `useBudgetTracker` hook

```typescript
// Filter expenses the same way useExpensesTracker does
const { start, end } = getFilterDateRange(monthKey, viewMode, payDay);

const categorySpending: Record<string, number> = {};
expenses
  .filter(e => {
    const d = parse(e.date, "yyyy-MM-dd", new Date());
    return d >= start && d <= end;
  })
  .forEach(expense => {
    // Convert to ARS: USD expenses use their stored rate
    const arsAmount = expense.currencyType === CurrencyType.USD
      ? expense.amount * expense.usdRate
      : expense.amount;
    const cat = expense.category;
    categorySpending[cat] = (categorySpending[cat] || 0) + arsAmount;
  });
```

### Pattern 3: Custom Progress Bar with Category Colors
**What:** Simple div-based progress bar using Tailwind + inline styles
**When to use:** Each budget row

```tsx
function BudgetProgressBar({ 
  percentage, 
  categoryColor, 
}: { 
  percentage: number; 
  categoryColor: string; 
}) {
  const barColor = percentage >= 100 
    ? "rgb(239 68 68)"     // red-500
    : percentage >= 80 
    ? "rgb(245 158 11)"    // amber-500  
    : categoryColor;        // category's own color
  
  const clampedWidth = Math.min(percentage, 100);
  
  return (
    <div className="h-2 w-full rounded-full bg-muted">
      <div
        className="h-full rounded-full transition-all duration-300"
        style={{ 
          width: `${clampedWidth}%`, 
          backgroundColor: barColor 
        }}
      />
    </div>
  );
}
```

### Pattern 4: Hook Integration with useMoneyTracker
**What:** New `useBudgetTracker` hook follows the same pattern as other domain hooks
**When to use:** Wire into `useMoneyTracker` like `useExpensesTracker`, `useTransfers`, etc.

The hook needs:
- `monthlyData.expenses` — to compute spending
- `viewMode` and `payDay` — to filter by active period
- `selectedYear` and `selectedMonth` — to determine which month to compute for
- Its own localStorage key — `"budgetData"` for persistence

### Pattern 5: Tab Integration
**What:** Add "Presupuestos" as 6th tab in the main TabsList
**When to use:** In `expense-tracker.tsx`

The existing tab system uses `activeTab` state with string values. Add `"budgets"` value. The TabsList already uses `w-auto` (changed in Phase 9), so adding a 6th tab works without layout changes.

### Anti-Patterns to Avoid
- **Storing budget data inside monthlyData:** Budget definitions are global (not per-month), so mixing them with per-month data creates unnecessary coupling. Use a separate localStorage key.
- **Recomputing spending on every render without memoization:** The expense filtering + summing is O(n) on all expenses. Use `useMemo` with proper dependency array.
- **Hardcoding ARS-only logic without handling USD expenses:** USD expenses MUST be converted to ARS using their stored `usdRate` for budget comparison. Missing this would undercount spending.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Tooltip with rich content | Custom hover state | @radix-ui/react-tooltip (already in project) | Handles positioning, accessibility, delay |
| Category dropdown | Custom list | @radix-ui/react-select (already in project) | Consistent with existing category selectors |
| Dialog for budget CRUD | Custom modal | @radix-ui/react-dialog (already in project) | Handles focus trap, escape key, overlay |
| Date range filtering | Custom date logic | `getFilterDateRange` from `usePayPeriod` | Already handles both viewMode variants correctly |

**Key insight:** This phase is almost entirely about UI composition from existing primitives. The only "new" logic is the budget data model, snapshot system, and per-category spending aggregation. Everything else reuses project patterns.

## Common Pitfalls

### Pitfall 1: USD Expense Conversion
**What goes wrong:** Budget is in ARS but USD expenses are stored in their native USD amount. If you sum `expense.amount` without conversion, USD expenses are vastly undercounted.
**Why it happens:** The `amount` field for USD expenses stores the USD value (e.g., 50 for US$50), not the ARS equivalent.
**How to avoid:** Always convert: `arsAmount = expense.currencyType === CurrencyType.USD ? expense.amount * expense.usdRate : expense.amount`
**Warning signs:** Budget bar shows much less spending than expected when user has USD expenses.

### Pitfall 2: Snapshot Timing
**What goes wrong:** Snapshots created too eagerly (empty months get snapshots) or too late (limit change before snapshot means historical limit is lost).
**Why it happens:** The "lazy on first expense" rule has edge cases — what if user changes limit mid-month after expenses exist but before the tab was opened?
**How to avoid:** Create snapshot on first budget progress computation for a month that has expenses, not on expense creation. Store snapshot the first time `useBudgetTracker` calculates spending for a given month+category where expenses exist and no snapshot exists yet.
**Warning signs:** Changing a budget limit retroactively affects past months.

### Pitfall 3: View Mode Mismatch
**What goes wrong:** Budget spending doesn't match what user sees in the Gastos tab because the date range differs.
**Why it happens:** Using a different filtering approach than `useExpensesTracker`.
**How to avoid:** Use the exact same `getFilterDateRange(monthKey, viewMode, payDay)` call. Import from `usePayPeriod`.
**Warning signs:** Budget says "$50,000 spent" but Gastos tab shows different total for same category.

### Pitfall 4: Category Type Safety
**What goes wrong:** Budget category stored as string doesn't match the `Category` union type, causing silent mismatches.
**Why it happens:** Form data comes as strings; TypeScript doesn't enforce runtime types.
**How to avoid:** Use the `Category` type from `useMoneyTracker` for budget definitions. The category dropdown should use `Object.keys(CATEGORIES)` (same as expense form).
**Warning signs:** Budget exists for a category but spending shows $0 despite having expenses in that category.

### Pitfall 5: Stale Spending Data
**What goes wrong:** Budget progress doesn't update after adding/editing/deleting an expense until page refresh.
**Why it happens:** Budget hook reads from `monthlyData.expenses` which is React state — if the hook doesn't depend on `monthlyData` reactively, it shows stale data.
**How to avoid:** `useBudgetTracker` must receive `monthlyData.expenses` as a dependency (either via props or by receiving `monthlyData` directly). Spending computation should be in `useMemo` with `[monthlyData.expenses, monthKey, viewMode, payDay]` deps.
**Warning signs:** Adding an expense on the Gastos tab doesn't update the budget bar until navigating away and back.

## Code Examples

### Expense Filtering (reuse from existing codebase)
```typescript
// Source: hooks/useExpensesTracker.ts lines 77-81
// Existing pattern for filtering expenses by active period
const monthKey = `${selectedYear}-${selectedMonth.split("-")[1]}`;
const { start: filterStart, end: filterEnd } = getFilterDateRange(monthKey, viewMode, payDay);
const filteredExpenses = monthlyData.expenses.filter((expense) => {
  const expenseDate = parse(expense.date, "yyyy-MM-dd", new Date());
  return expenseDate >= filterStart && expenseDate <= filterEnd;
});
```

### Category Colors (source of truth)
```typescript
// Source: constants/colors.ts
// 16 categories, each with an RGB color string
// Use for default progress bar color: CATEGORIES[category].color
import { CATEGORIES } from "@/constants/colors";
const barColor = CATEGORIES["Supermercado"].color; // "rgb(59 130 246)"
```

### Tooltip Pattern (Phase 5 desglose)
```tsx
// Source: components/resumen-card.tsx — existing tooltip pattern
<TooltipProvider>
  <Tooltip>
    <TooltipTrigger asChild>
      <div>{/* budget bar here */}</div>
    </TooltipTrigger>
    <TooltipContent>
      <div className="space-y-1 text-xs">
        {expensesInCategory.map(e => (
          <div key={e.id} className="flex justify-between gap-4">
            <span>{e.name}</span>
            <span>${e.amount.toLocaleString()}</span>
          </div>
        ))}
      </div>
    </TooltipContent>
  </Tooltip>
</TooltipProvider>
```

### Tab Addition Pattern
```tsx
// Source: components/expense-tracker.tsx lines 293-313
// Add after "Movimientos" TabsTrigger:
<TabsTrigger value="budgets">
  <Target className="h-4 w-4 mr-1" /> {/* or PiggyBank, Gauge — Claude's discretion */}
  Presupuestos
</TabsTrigger>
```

### Click-to-Edit Pattern (pencil + trash)
```tsx
// Source: Established across Phase 2/3/4 — icons always visible
<button onClick={() => onEdit(budget)} className="text-muted-foreground hover:text-blue-500">
  <Pencil className="h-4 w-4" />
</button>
<button onClick={() => onDelete(budget.category)} className="text-muted-foreground hover:text-red-500">
  <Trash2 className="h-4 w-4" />
</button>
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| CSS `<progress>` element | Div-based progress bars with Tailwind | ~2022+ | Full styling control, consistent cross-browser |
| Separate state management lib | React hooks + localStorage | Project convention | No Redux/Zustand needed for this scale |

**Deprecated/outdated:**
- None relevant — this phase uses only existing project patterns.

## Open Questions

1. **Snapshot storage location**
   - What we know: Snapshots must persist across sessions. Options: within `budgetData` localStorage key (recommended) or within `monthlyData`.
   - What's unclear: Whether including snapshots in the same key as definitions is cleaner than a third key.
   - Recommendation: Single `budgetData` key with `{ definitions, snapshots }` shape. Keeps budget concerns isolated. Planner can finalize.

2. **NumberFlow on budget amounts**
   - What we know: Project uses `@number-flow/react` for animated numbers (Phase 2). Budget amounts change when switching months.
   - What's unclear: Whether the animation adds value here or feels noisy.
   - Recommendation: Use it for the summary header totals (Total presupuestado, Gastado, Disponible) since those are prominent. Skip for individual row amounts to avoid visual noise.

## Sources

### Primary (HIGH confidence)
- Direct codebase inspection: `hooks/useMoneyTracker.ts`, `hooks/useExpensesTracker.ts`, `hooks/usePayPeriod.ts`, `hooks/useLocalStorage.ts`, `constants/colors.ts`, `components/expense-tracker.tsx`
- Package.json dependencies verified

### Secondary (MEDIUM confidence)
- Tailwind CSS documentation for progress bar patterns (well-established pattern)
- Radix UI tooltip/dialog/select APIs (already in use in project)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries already in project, no new dependencies
- Architecture: HIGH - Follows established hook + component patterns from prior phases
- Pitfalls: HIGH - Based on direct code inspection of existing expense filtering, currency handling, and state management

**Research date:** 2026-04-02
**Valid until:** 2026-05-02 (stable domain, no external dependencies)
