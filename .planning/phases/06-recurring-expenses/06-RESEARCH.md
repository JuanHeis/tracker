# Phase 6: Recurring Expenses - Research

**Researched:** 2026-04-02
**Domain:** Recurring expense definitions, auto-generation, lifecycle management, payment tracking
**Confidence:** HIGH

## Summary

Phase 6 adds recurring expense definitions that auto-generate regular Expense objects each month. The core pattern is a "template + instance" model: users define recurring expense templates (stored globally like investments/salaryHistory), and the app auto-generates Expense instances into monthlyData.expenses on each app load, linked back to the template via a `recurringId` field.

This is a pure frontend/localStorage feature with no new libraries needed. The existing codebase provides all necessary patterns: useLocalStorage for persistence, migrateData for schema evolution, investment-dialog pattern for creation UI, investments-table pattern for management table, and badge.tsx for status indicators. The main complexity lies in the auto-generation logic (handling backfill of missed months, avoiding duplicates) and the data migration to extend the Expense interface.

**Primary recommendation:** Store RecurringExpense definitions in a separate localStorage key (like salaryHistory), add `recurringId?: string` and `isPaid?: boolean` to the Expense interface via migration v6, and run auto-generation in useMoneyTracker initialization.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Monthly frequency only — no weekly, biweekly, or quarterly
- Fixed amount per recurring (no per-instance override or variable amounts)
- Supports both ARS and USD currencies (reuses existing CurrencyType enum)
- Reuses existing expense categories PLUS 4 new ones: Seguros, Impuestos, Transporte, Salud
- Fields: name, amount, category, currencyType, status, createdAt
- Auto-generation triggers on app load — check all active recurrings and generate missing instances
- Generated instances are regular Expense objects stored in monthlyData.expenses with extra `recurringId` field
- Backfill all missed months if user was away (silent generation)
- Generated expenses use the 1st day of the month as their date
- Three statuses: Activa, Pausada, Cancelada
- Paused recurrings can be resumed; canceled recurrings are permanent
- Past and current month instances always kept — only future generation stops
- Dedicated "Recurrentes" section/tab for managing recurring definitions
- Management table shows all recurrings with status badges; canceled ones greyed out
- Toggle paid/unpaid inline (no modal) via checkbox or toggle
- Generated instances start as unpaid (pending) by default
- Unpaid recurrings always count toward monthly Disponible
- Visual distinction: 'Recurrente' badge + repeat/cycle icon next to expense name; paid/unpaid via checkbox or color coding

### Claude's Discretion
- Exact data model for RecurringExpense definition (fields, storage location in localStorage)
- Migration strategy for adding recurringId to Expense interface and new categories to Category type
- Recurring management table layout and action button design
- How the "Recurrentes" tab integrates with existing UI (new tab in main view vs sidebar section)
- Exact badge and icon styling for recurring indicators in expenses table
- usdRate handling for USD recurring instances (use global rate at generation time)

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| REC-01 | User can define recurring expense (name, amount, category, monthly frequency) | RecurringExpense interface + creation dialog + useRecurringExpenses hook |
| REC-02 | Recurring expenses auto-generate each month | Auto-generation logic in useMoneyTracker init, generateMissingInstances function |
| REC-03 | User can pause or cancel a recurring expense | Status field with Activa/Pausada/Cancelada, management table with action buttons |
| REC-04 | User can mark recurring expense as paid each month | isPaid field on Expense, inline toggle in expenses-table |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React 18 | ^18 | UI framework | Already in project |
| Next.js | 14.2.16 | App framework | Already in project |
| date-fns | ^4.1.0 | Date manipulation (month iteration, formatting) | Already in project |
| lucide-react | ^0.454.0 | Icons (Repeat, Check, Circle, Pause, XCircle) | Already in project |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @radix-ui/react-dialog | ^1.1.2 | Recurring creation dialog | Already in project |
| @radix-ui/react-tabs | ^1.1.1 | "Recurrentes" tab | Already in project |

### Alternatives Considered
None — this phase uses only existing project dependencies.

**Installation:**
```bash
# No new packages needed
```

## Architecture Patterns

### Recommended Project Structure
```
hooks/
├── useRecurringExpenses.ts   # NEW: Recurring CRUD + auto-generation logic
├── useMoneyTracker.ts        # MODIFY: Wire recurring hook, run auto-gen on init
├── useExpensesTracker.ts     # No changes (instances are regular expenses)
components/
├── recurring-dialog.tsx      # NEW: Create/edit recurring expense definition
├── recurring-table.tsx       # NEW: Management table for recurring definitions
├── expenses-table.tsx        # MODIFY: Add recurring badge, paid/unpaid toggle
├── expense-tracker.tsx       # MODIFY: Add "Recurrentes" tab
constants/
├── colors.ts                 # MODIFY: Add 4 new categories
```

### Pattern 1: Template + Instance Model
**What:** RecurringExpense definitions are templates stored globally. Instances are regular Expense objects with a `recurringId` link.
**When to use:** When generated items need to behave exactly like manually created items (for charts, totals, balance calculations).
**Example:**
```typescript
// RecurringExpense definition (template)
export interface RecurringExpense {
  id: string;
  name: string;
  amount: number;
  category: Category;
  currencyType: CurrencyType;
  status: "Activa" | "Pausada" | "Cancelada";
  createdAt: string; // yyyy-MM format — first month to generate
}

// Extended Expense (instance) — adds optional fields
export interface Expense {
  // ... existing fields ...
  recurringId?: string;  // Links to RecurringExpense.id
  isPaid?: boolean;      // Only meaningful for recurring instances
}
```

### Pattern 2: Separate localStorage Key (like salaryHistory)
**What:** Store RecurringExpense definitions in their own localStorage key rather than inside monthlyData.
**When to use:** When data is global (not per-month) and needs to persist across all months.
**Why:** RecurringExpense definitions are global — they don't belong to any single month. This matches the salaryHistory and incomeConfig patterns already established.
**Example:**
```typescript
// In useRecurringExpenses.ts
const [recurringExpenses, setRecurringExpenses] = useLocalStorage<RecurringExpense[]>(
  "recurringExpenses",
  []
);
```

### Pattern 3: Auto-Generation on App Load
**What:** On hook initialization, iterate all active recurring definitions and generate any missing Expense instances.
**When to use:** Every time the app loads (useMoneyTracker initializes).
**Key logic:**
```typescript
function generateMissingInstances(
  recurrings: RecurringExpense[],
  existingExpenses: Expense[],
  globalUsdRate: number
): Expense[] {
  const now = new Date();
  const currentMonth = format(now, "yyyy-MM");
  const newExpenses: Expense[] = [];

  for (const rec of recurrings) {
    if (rec.status !== "Activa") continue;

    // Iterate from createdAt month to current month
    let month = rec.createdAt; // yyyy-MM
    while (month <= currentMonth) {
      // Check if instance already exists for this recurring + month
      const exists = existingExpenses.some(
        (e) => e.recurringId === rec.id && e.date.startsWith(month)
      );
      if (!exists) {
        newExpenses.push({
          id: crypto.randomUUID(),
          date: `${month}-01`, // 1st of month
          name: rec.name,
          amount: rec.amount,
          usdRate: rec.currencyType === CurrencyType.USD ? globalUsdRate : 0,
          category: rec.category,
          currencyType: rec.currencyType,
          recurringId: rec.id,
          isPaid: false,
        });
      }
      // Advance to next month
      month = format(addMonths(parse(`${month}-01`, "yyyy-MM-dd", new Date()), 1), "yyyy-MM");
    }
  }
  return newExpenses;
}
```

### Pattern 4: Data Migration v6
**What:** Extend Expense interface and Category type without breaking existing data.
**When to use:** During migration phase when schema evolves.
**Key considerations:**
- `recurringId` and `isPaid` are optional fields — existing expenses simply don't have them
- New categories (Seguros, Impuestos, Transporte, Salud) just need to be added to the Category union and CATEGORIES constant
- Migration v6 only needs to bump version number — no data transformation required since new fields are optional
```typescript
// In migrateData:
if (currentVersion < 6) {
  // No data transformation needed — recurringId and isPaid are optional
  // Just bump version
}
migrated._migrationVersion = 6;
```

### Anti-Patterns to Avoid
- **Storing recurring definitions inside monthlyData:** Definitions are global, not per-month. Would cause duplication and sync issues.
- **Running auto-generation in useEffect:** Would cause re-renders. Run it synchronously during initialization or as a one-time effect with proper dependency management.
- **Modifying existing expense amounts from recurring template changes:** User decided fixed amounts; changing a recurring definition should NOT update past instances.
- **Blocking UI during auto-generation:** Generation should be synchronous and fast (simple loop + localStorage write). No loading states needed.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Month iteration | Manual month arithmetic | date-fns `addMonths` + `format` | Already used in project, handles edge cases |
| UUID generation | Custom ID generation | `crypto.randomUUID()` | Already established pattern in project |
| Date formatting | String manipulation | date-fns `format` / `parse` | Consistent with existing codebase |

**Key insight:** This phase needs zero new libraries. Every building block already exists in the codebase.

## Common Pitfalls

### Pitfall 1: Duplicate Instance Generation
**What goes wrong:** Auto-generation creates duplicate expenses if run multiple times.
**Why it happens:** No deduplication check, or check uses wrong key (e.g., just name instead of recurringId + month).
**How to avoid:** Always check `existingExpenses.some(e => e.recurringId === rec.id && e.date.startsWith(month))` before generating.
**Warning signs:** Multiple identical expenses appearing in the same month.

### Pitfall 2: Stale Generation After Pause/Cancel
**What goes wrong:** Pausing a recurring doesn't stop generation because status check is missing in the generation loop.
**Why it happens:** Status filtering forgotten or applied too late.
**How to avoid:** Filter `rec.status !== "Activa"` at the very start of the generation loop. For pause, also need to track *when* it was paused to avoid generating for months after the pause date.
**Warning signs:** Paused recurrings still generating new instances.

### Pitfall 3: USD Rate at Generation Time
**What goes wrong:** USD recurring instances get rate 0 or stale rate.
**Why it happens:** globalUsdRate not available during generation, or not passed to the generation function.
**How to avoid:** Pass globalUsdRate to generateMissingInstances. Read from localStorage if needed during initialization.
**Warning signs:** USD recurring expenses showing $0 rate.

### Pitfall 4: Auto-Generation Timing in React Lifecycle
**What goes wrong:** Generation runs before monthlyData is loaded from localStorage, or runs on every re-render.
**Why it happens:** React initialization order isn't controlled.
**How to avoid:** Run generation inside the useLocalStorage migration function or as a one-time effect (useEffect with empty deps) that writes back. Alternatively, run it in the useRecurringExpenses hook init and have useMoneyTracker call it.
**Warning signs:** Missing expenses on first load, or infinite re-render loops.

### Pitfall 5: Orphaned Instances After Recurring Deletion
**What goes wrong:** If a recurring definition is somehow removed, its instances remain as regular expenses with a dangling recurringId.
**Why it happens:** No cleanup cascade.
**How to avoid:** Since canceled recurrings are never deleted (just status change), this is mostly a non-issue. But if implementing delete: leave instances as-is (they're valid expenses). Clear recurringId so they become standalone.
**Warning signs:** Expenses with recurringId pointing to non-existent definitions.

### Pitfall 6: Category Type Expansion Breaking Existing Code
**What goes wrong:** Adding new categories to the Category union type causes TypeScript errors in exhaustive switches.
**Why it happens:** If any code does exhaustive pattern matching on categories.
**How to avoid:** Check all usages of Category type. The CATEGORIES record in colors.ts is the main place — just add entries. The category Select dropdown in expense-tracker.tsx iterates CATEGORIES keys, so new categories auto-appear.
**Warning signs:** TypeScript compilation errors after adding new categories.

## Code Examples

### RecurringExpense Hook Pattern
```typescript
// hooks/useRecurringExpenses.ts
import { useLocalStorage } from "./useLocalStorage";
import { format, addMonths, parse } from "date-fns";
import type { Expense, Category } from "./useMoneyTracker";
import { CurrencyType } from "@/constants/investments";

export type RecurringStatus = "Activa" | "Pausada" | "Cancelada";

export interface RecurringExpense {
  id: string;
  name: string;
  amount: number;
  category: Category;
  currencyType: CurrencyType;
  status: RecurringStatus;
  createdAt: string; // yyyy-MM — first month to generate
}

export function useRecurringExpenses(
  monthlyData: MonthlyData,
  updateMonthlyData: (data: MonthlyData) => void,
  globalUsdRate: number
) {
  const [recurringExpenses, setRecurringExpenses] = useLocalStorage<RecurringExpense[]>(
    "recurringExpenses",
    []
  );

  const addRecurring = (data: Omit<RecurringExpense, "id" | "status" | "createdAt">) => {
    const newRecurring: RecurringExpense = {
      ...data,
      id: crypto.randomUUID(),
      status: "Activa",
      createdAt: format(new Date(), "yyyy-MM"),
    };
    setRecurringExpenses([...recurringExpenses, newRecurring]);
  };

  const updateStatus = (id: string, status: RecurringStatus) => {
    setRecurringExpenses(
      recurringExpenses.map((r) => (r.id === id ? { ...r, status } : r))
    );
  };

  const generateMissingInstances = () => {
    const currentMonth = format(new Date(), "yyyy-MM");
    const newExpenses: Expense[] = [];

    for (const rec of recurringExpenses) {
      if (rec.status !== "Activa") continue;

      let month = rec.createdAt;
      while (month <= currentMonth) {
        const exists = monthlyData.expenses.some(
          (e) => e.recurringId === rec.id && e.date.startsWith(month)
        );
        if (!exists) {
          newExpenses.push({
            id: crypto.randomUUID(),
            date: `${month}-01`,
            name: rec.name,
            amount: rec.amount,
            usdRate: rec.currencyType === CurrencyType.USD ? globalUsdRate : 0,
            category: rec.category,
            currencyType: rec.currencyType,
            recurringId: rec.id,
            isPaid: false,
          });
        }
        const nextDate = addMonths(parse(`${month}-01`, "yyyy-MM-dd", new Date()), 1);
        month = format(nextDate, "yyyy-MM");
      }
    }

    if (newExpenses.length > 0) {
      updateMonthlyData({
        ...monthlyData,
        expenses: [...monthlyData.expenses, ...newExpenses],
      });
    }
  };

  return { recurringExpenses, addRecurring, updateStatus, generateMissingInstances };
}
```

### Paid/Unpaid Toggle in Expenses Table
```typescript
// In expenses-table.tsx — inline toggle
<TableCell className={className}>
  {expense.recurringId && (
    <button
      onClick={() => onTogglePaid(expense.id)}
      className="inline-flex items-center"
    >
      {expense.isPaid ? (
        <Check className="h-4 w-4 text-green-500" />
      ) : (
        <Circle className="h-4 w-4 text-amber-500" />
      )}
    </button>
  )}
</TableCell>
```

### Recurring Badge in Expense Name Column
```typescript
// In expenses-table.tsx — name cell
<TableCell className={className}>
  {expense.name}
  {expense.recurringId && (
    <Badge variant="outline" className="ml-2 text-xs">
      <Repeat className="h-3 w-3 mr-1" />
      Recurrente
    </Badge>
  )}
  {expense.installments && (
    <span className="ml-2 text-sm text-gray-500">
      ({expense.installments.current}/{expense.installments.total})
    </span>
  )}
</TableCell>
```

### New Categories Addition
```typescript
// constants/colors.ts — add 4 new categories
export const CATEGORIES: Record<Category, { color: string }> = {
  // ... existing 12 categories ...
  Seguros: { color: "rgb(244 63 94)" },      // rose-500
  Impuestos: { color: "rgb(217 70 239)" },    // fuchsia-500
  Transporte: { color: "rgb(14 165 233)" },   // sky-500
  Salud: { color: "rgb(16 185 129)" },        // emerald-500
};

// hooks/useMoneyTracker.ts — extend Category type
export type Category =
  | "Alquiler" | "Supermercado" | "Entretenimiento" | "Salidas"
  | "Vacaciones" | "Servicios" | "Vestimenta" | "Subscripciones"
  | "Insumos" | "Estudio" | "Otros" | "Gym"
  | "Seguros" | "Impuestos" | "Transporte" | "Salud";
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Per-month data only | Global entities (salaryHistory, investments) | Phase 2-4 | Established pattern for recurring to follow |
| Migration v5 | Migration v6 needed | This phase | Bump version, add optional fields |

**Deprecated/outdated:**
- None applicable — this is a pure application feature, not library-dependent.

## Open Questions

1. **Auto-generation trigger timing**
   - What we know: Must run on app load, must not cause infinite loops
   - What's unclear: Best place in React lifecycle — during useLocalStorage migration, or as useEffect in useRecurringExpenses
   - Recommendation: Use useEffect with empty deps in useRecurringExpenses, called by useMoneyTracker. Guard with a ref to prevent double-execution in StrictMode.

2. **Pause date tracking**
   - What we know: Paused recurrings should stop future generation
   - What's unclear: Should we track WHEN it was paused (to know which months to skip)?
   - Recommendation: Add optional `pausedAt?: string` (yyyy-MM) to RecurringExpense. Generation skips months after pausedAt. On resume, clear pausedAt. This prevents backfill of paused months when resuming.

3. **Tab placement for "Recurrentes"**
   - What we know: Needs a dedicated section similar to investments table
   - What's unclear: New 6th tab vs sub-section within Gastos tab
   - Recommendation: Add as a 6th tab in the main TabsList (pattern already supports 5 tabs with w-auto). Keeps it consistent with the investments management pattern.

## Sources

### Primary (HIGH confidence)
- Codebase analysis: hooks/useMoneyTracker.ts, hooks/useExpensesTracker.ts, hooks/useLocalStorage.ts
- Codebase analysis: constants/colors.ts, constants/investments.ts
- Codebase analysis: components/expense-tracker.tsx, components/expenses-table.tsx
- Codebase analysis: components/investments-table.tsx (management table pattern)
- Codebase analysis: components/investment-dialog.tsx (creation dialog pattern)

### Secondary (MEDIUM confidence)
- date-fns addMonths behavior — verified in codebase usage (useExpensesTracker.ts installment generation)
- useLocalStorage migration pattern — verified in migrateData function

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - No new libraries needed, all patterns exist in codebase
- Architecture: HIGH - Template+instance model is well-understood, matches existing salaryHistory/investments patterns
- Pitfalls: HIGH - Identified from codebase analysis, deduplication and lifecycle concerns are straightforward

**Research date:** 2026-04-02
**Valid until:** 2026-05-02 (stable — no external dependencies)
