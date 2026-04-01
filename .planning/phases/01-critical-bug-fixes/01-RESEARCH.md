# Phase 1: Critical Bug Fixes - Research

**Researched:** 2026-04-01
**Domain:** Bug fixes in Next.js 14 / React 18 personal finance tracker (localStorage-based)
**Confidence:** HIGH

## Summary

Phase 1 addresses 7 confirmed bugs in an existing expense tracker built with Next.js 14, React 18, TypeScript, Tailwind CSS, shadcn/ui (Radix primitives), and date-fns v4. All state lives in localStorage via a custom `useLocalStorage` hook, with domain logic split across `useMoneyTracker`, `useExpensesTracker`, `useInvestmentsTracker`, and `useIncomes` hooks. The bugs span hardcoded currency values, mismatched type enums, unfiltered calculations, division-by-zero, date arithmetic corruption, disabled form fields, and missing form pre-population.

Every bug has been traced to a specific file and line range in the codebase. The fixes are straightforward code corrections requiring no new libraries. The main architectural addition is a shared constants file for investment types and a "Reset all data" settings feature. The user has explicitly scoped this phase to "fix + minimal cleanup" with no large refactors.

**Primary recommendation:** Fix each bug at its root in the hooks/components, extract investment types as a shared constant, add form validation (disabled submit + red borders + blur triggers), and add a settings gear icon with a "Reset all data" button.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- No data migration needed -- user is starting fresh with clean data
- Add a "Reset all data" button behind a gear/settings icon in the header
- Reset requires a confirmation dialog ("Are you sure? This will delete all your financial data." with Cancel/Confirm)
- No auto-clear or version-based wipe -- user controls when to reset
- Canonical investment types: Plazo Fijo, FCI, Crypto, Acciones (4 types)
- Drop "Bonos" -- covered by FCI/Acciones
- Extract as shared constant used by both dialog and type system
- Disabled submit button when fields are invalid + tooltip on hover showing what needs fixing
- Red border on invalid fields for at-a-glance identification
- Validation triggers on blur (when user leaves the field)
- USD rate field: pre-fill with last used rate (persisted) to avoid the 0/empty problem
- Validation rules: amount > 0, USD rate > 0
- Installment dates: use last day of month when original day doesn't exist (Jan 31 -> Feb 28 -> Mar 31 -> Apr 30)
- Salary form: pre-fill with current values only when editing an existing salary entry; new entries start blank
- Fix + minimal cleanup scope: fix the bug AND do small related improvements (extract shared constants, add type safety)
- No big refactors -- those belong in Phase 2
- No scope creep into Phase 2 investment model restructuring

### Claude's Discretion
- Exact tooltip content and positioning for disabled submit button
- How to persist the "last used USD rate" (localStorage key or within monthlyData)
- Gear icon placement and settings menu design
- Red border styling specifics (shade, animation, etc.)

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| BUG-01 | Fix inversiones que siempre se guardan como ARS ignorando moneda original | `useInvestmentsTracker.ts` line 28: `currencyType` hardcoded to `CurrencyType.ARS` instead of reading from form. Investment dialog lacks currency selector entirely. |
| BUG-02 | Fix tipos de inversion que no coinciden entre dialog y types | Dialog uses `"FCI"`, `"PlazoFijo"`, `"Crypto"`, `"Acciones"`, `"Otros"`. Type definition uses `"Plazo Fijo" \| "Acciones" \| "Bonos" \| "Otros"`. Mismatch causes data to not match the type system. |
| BUG-03 | Fix calculateTotalAvailable() que suma todo sin filtrar por mes ni estado de inversion | `useMoneyTracker.ts` lines 153-178: sums ALL salaries, ALL expenses, ALL investments across all months with no date filtering and no investment status check. |
| BUG-04 | Fix division por cero cuando usdRate es 0 (muestra Infinity/NaN) | `expenses-table.tsx` line 126: `expense.amount / expense.usdRate` with no guard. `salary-card.tsx` line 98: `currentSalary?.amount / currentSalary?.usdRate` with no guard. No form validation prevents 0 from being submitted. |
| BUG-05 | Fix fechas de cuotas que se corrompen | `useExpensesTracker.ts` lines 45-46: uses `setMonth()` on a JS Date, which causes day overflow (Jan 31 + 1 month = Mar 3 instead of Feb 28). |
| BUG-06 | Fix campo de cuotas deshabilitado al editar un gasto existente | `expense-tracker.tsx` line 335: `disabled={!!editingExpense}` unconditionally disables installments field during edit. |
| BUG-07 | Fix formulario de sueldo que no pre-carga valores actuales al editar | `salary-card.tsx` lines 65-66: `defaultValue` is set from `currentSalary` but the form uses uncontrolled inputs. The `useEffect` on line 45 toggles form visibility but does not force re-render of defaultValues when switching months. |
</phase_requirements>

## Standard Stack

### Core (already installed -- no new dependencies)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js | 14.2.16 | App framework | Already in use |
| React | ^18 | UI library | Already in use |
| TypeScript | ^5 | Type safety | Already in use |
| date-fns | ^4.1.0 | Date manipulation | Already in use, has `lastDayOfMonth`, `setDate`, `endOfMonth` for BUG-05 fix |
| @radix-ui/react-dialog | ^1.1.2 | Dialogs | Already in use, needed for reset confirmation |
| @radix-ui/react-tooltip | ^1.1.3 | Tooltips | Already in use, needed for disabled button tooltip |
| @radix-ui/react-select | ^2.1.2 | Select dropdowns | Already in use |
| tailwind-merge + clsx | installed | Conditional classes | Already in use via `cn()` utility |

### Alternatives Considered
None -- this phase uses only existing dependencies. No new libraries needed.

## Architecture Patterns

### Current Project Structure
```
components/
  expense-tracker.tsx       # Main orchestrator component
  salary-card.tsx           # Salary display/edit card
  total-amounts.tsx         # "Total disponible" display
  investment-dialog.tsx     # Investment create/edit dialog
  expenses-table.tsx        # Expenses list
  investments-table.tsx     # Investments list
  income-table.tsx          # Incomes list
  ui/                       # shadcn/ui primitives (dialog, button, input, select, tooltip, etc.)
hooks/
  useMoneyTracker.ts        # Central state + types + calculateTotalAvailable
  useExpensesTracker.ts     # Expense CRUD + installment logic
  useInvestmentsTracker.ts  # Investment CRUD
  useIncomes.ts             # Salary + extra income CRUD
  useLocalStorage.ts        # localStorage persistence with migration
constants/
  colors.ts                 # Category color map (pattern to follow for investment types)
```

### Pattern 1: Shared Constants Extraction
**What:** Extract investment types as a shared constant array, similar to how `CATEGORIES` is defined in `constants/colors.ts`.
**When to use:** When the same list of values is needed in both the TypeScript type system and UI components.
**Example:**
```typescript
// constants/investments.ts
export const INVESTMENT_TYPES = ["Plazo Fijo", "FCI", "Crypto", "Acciones"] as const;
export type InvestmentType = (typeof INVESTMENT_TYPES)[number];
```
This constant is then used in the `Investment` interface type definition AND in the `<SelectItem>` rendering in `investment-dialog.tsx`.

### Pattern 2: Form Validation with Blur + Disabled Submit
**What:** Track field validity in component state, validate on blur, disable submit when invalid, show tooltip on disabled button.
**When to use:** All forms that accept numeric input (expenses, incomes, investments, salary).
**Example:**
```typescript
// Validation state pattern
const [errors, setErrors] = useState<Record<string, string>>({});

const validateField = (name: string, value: string) => {
  if (name === "amount" && (Number(value) <= 0 || isNaN(Number(value)))) {
    return "El monto debe ser mayor a 0";
  }
  if (name === "usdRate" && (Number(value) <= 0 || isNaN(Number(value)))) {
    return "La cotizacion USD debe ser mayor a 0";
  }
  return null;
};

// On input blur
const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
  const error = validateField(e.target.name, e.target.value);
  setErrors(prev => error 
    ? { ...prev, [e.target.name]: error } 
    : Object.fromEntries(Object.entries(prev).filter(([k]) => k !== e.target.name))
  );
};

// Disabled submit + tooltip
const hasErrors = Object.keys(errors).length > 0;
```

### Pattern 3: Safe Date Arithmetic with date-fns
**What:** Use date-fns functions that correctly handle end-of-month rollover instead of raw `Date.setMonth()`.
**When to use:** When calculating installment dates that need to preserve end-of-month intent.
**Example:**
```typescript
import { addMonths, endOfMonth, getDate, setDate, min } from "date-fns";

function getInstallmentDate(startDate: Date, monthsToAdd: number): Date {
  const originalDay = getDate(startDate);
  const targetMonth = addMonths(startDate, monthsToAdd);
  const lastDayOfTargetMonth = getDate(endOfMonth(targetMonth));
  const targetDay = Math.min(originalDay, lastDayOfTargetMonth);
  return setDate(targetMonth, targetDay);
}
```
This ensures Jan 31 + 1 = Feb 28, Jan 31 + 2 = Mar 31 (preserves original day when possible).

### Pattern 4: localStorage "Last Used" Persistence
**What:** Store the last used USD rate in a separate localStorage key for pre-filling forms.
**When to use:** For the USD rate field across all forms.
**Recommendation:** Use a dedicated localStorage key `lastUsedUsdRate` (simpler than embedding in monthlyData, and cross-month). Update it whenever any form successfully submits with a USD rate > 0.

### Pattern 5: Settings Reset with Confirmation
**What:** A gear icon in the header that opens a settings area with a "Reset all data" button protected by a confirmation dialog.
**When to use:** Provides user-controlled data reset as decided by the user.
**Implementation:** Add a `Settings` (gear) icon from lucide-react next to the ThemeToggle. Clicking opens a Radix Dialog with the reset confirmation. On confirm, call `localStorage.removeItem("monthlyData")` and reload state.

### Anti-Patterns to Avoid
- **Raw `Date.setMonth()` for month arithmetic:** Causes day overflow. Always use date-fns `addMonths` which handles this, plus manual clamping for the "preserve original day" behavior.
- **Hardcoded enum values in form handlers:** The `CurrencyType.ARS` hardcode in `handleAddInvestment` is exactly this anti-pattern. Always read from form data.
- **Unguarded division:** Any `x / y` where `y` comes from user input must guard against 0.
- **Duplicated type lists:** Investment types listed in one place (dialog) and defined differently in another (type definition). Extract to single source of truth.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| End-of-month date arithmetic | Manual day clamping with raw Date API | date-fns `addMonths` + `endOfMonth` + `setDate` | Edge cases (leap years, 28/29/30/31 day months) |
| Dialog/tooltip components | Custom modal or tooltip | Existing Radix UI `Dialog` and `Tooltip` components | Already in project, accessible by default |
| Conditional class merging | String concatenation | `cn()` utility (already exists in `lib/utils.ts`) | Handles falsy values, merges Tailwind classes correctly |

## Common Pitfalls

### Pitfall 1: Uncontrolled Input `defaultValue` Staleness
**What goes wrong:** React uncontrolled inputs with `defaultValue` only set the value on initial mount. If the component re-renders with new data but doesn't remount, the old value stays.
**Why it happens:** The salary form in `salary-card.tsx` sets `defaultValue={currentSalary?.amount}` but the form does not remount when the user clicks "Edit" because visibility is toggled, not the component key.
**How to avoid:** Use a `key` prop on the form element that changes when editing state changes (e.g., `key={selectedMonth}` or `key={showSalaryForm ? "form" : "display"}`). This forces React to remount the form with fresh default values. The expense dialog already uses this pattern: `key={open ? "open" : "closed"}`.
**Warning signs:** Form shows stale/empty values after toggling between view and edit modes.

### Pitfall 2: Type Assertion Hiding Mismatches
**What goes wrong:** `formData.get("type") as Investment["type"]` silently accepts any string, even if the form sends `"PlazoFijo"` but the type expects `"Plazo Fijo"`.
**Why it happens:** TypeScript `as` casts bypass type checking at runtime.
**How to avoid:** Use the shared constant array to validate, or ensure form values match type definitions exactly.
**Warning signs:** Data persisted to localStorage doesn't match TypeScript interfaces.

### Pitfall 3: `setMonth()` Day Overflow
**What goes wrong:** `new Date("2026-01-31").setMonth(1)` produces March 3 (Feb has 28 days, so 31 overflows by 3).
**Why it happens:** JavaScript Date `setMonth` does not clamp to end-of-month.
**How to avoid:** Use date-fns `addMonths` which returns end-of-month correctly, then manually set the day to `min(originalDay, lastDayOfTargetMonth)` if the user's intent is "same day or last day."
**Warning signs:** Installment dates in months with fewer days land in the wrong month.

### Pitfall 4: Division by Zero in Display Components
**What goes wrong:** `amount / usdRate` produces `Infinity` or `NaN` when `usdRate` is 0 or undefined.
**Why it happens:** No validation prevents 0 from being saved, and display components don't guard the division.
**How to avoid:** Two-layer defense: (1) validate on form submission that usdRate > 0, (2) guard display code with fallback: `usdRate > 0 ? amount / usdRate : 0`.
**Warning signs:** "Infinity" or "NaN" displayed in the UI.

### Pitfall 5: `calculateTotalAvailable` Summing All Months
**What goes wrong:** The "Total disponible" card shows a meaningless number because it sums all salaries, expenses, and investments across all months regardless of the selected month or investment status.
**Why it happens:** The function iterates over all entries in `monthlyData` without any date or status filter.
**How to avoid:** Filter by `selectedMonth`/`selectedYear` (matching the pattern used in `filteredExpenses`), and exclude finalized investments from the "blocked" total.
**Warning signs:** Number grows unboundedly as more months of data are added.

## Code Examples

### BUG-01 Fix: Read Currency from Form
```typescript
// useInvestmentsTracker.ts - handleAddInvestment
// BEFORE (bug): currencyType: CurrencyType.ARS  (hardcoded)
// AFTER (fix): read from form data
const newInvestment: Investment = {
  id: crypto.randomUUID(),
  // ... other fields ...
  currencyType: formData.get("currencyType") as CurrencyType,
  // Also need to add currency selector to investment-dialog.tsx
};
```

### BUG-02 Fix: Shared Investment Type Constant
```typescript
// constants/investments.ts (new file)
export const INVESTMENT_TYPES = ["Plazo Fijo", "FCI", "Crypto", "Acciones"] as const;
export type InvestmentType = (typeof INVESTMENT_TYPES)[number];

// hooks/useMoneyTracker.ts - update Investment interface
export interface Investment {
  // ...
  type: InvestmentType;  // was: "Plazo Fijo" | "Acciones" | "Bonos" | "Otros"
  // ...
}

// components/investment-dialog.tsx - use same constant
import { INVESTMENT_TYPES } from "@/constants/investments";
// In JSX:
{INVESTMENT_TYPES.map((type) => (
  <SelectItem key={type} value={type}>{type}</SelectItem>
))}
```

### BUG-03 Fix: Filter calculateTotalAvailable by Month
```typescript
// useMoneyTracker.ts - calculateTotalAvailable
const calculateTotalAvailable = () => {
  const monthKey = getCurrentMonthKey();
  
  const monthlySalary = monthlyData.salaries[monthKey]?.amount || 0;
  
  const monthlyExtraIncomes = monthlyData.extraIncomes
    .filter(income => income.date.startsWith(monthKey))
    .reduce((sum, income) => sum + income.amount, 0);
  
  const monthlyExpenses = monthlyData.expenses
    .filter(expense => expense.date.startsWith(monthKey))
    .reduce((sum, expense) => sum + expense.amount, 0);
  
  const monthlyActiveInvestments = (monthlyData.investments || [])
    .filter(inv => inv.date.startsWith(monthKey) && inv.status === "Activa")
    .reduce((sum, inv) => sum + inv.amount, 0);

  return {
    total: monthlySalary + monthlyExtraIncomes - monthlyExpenses,
    availableForUse: monthlySalary + monthlyExtraIncomes - monthlyExpenses - monthlyActiveInvestments,
    blockedInInvestments: monthlyActiveInvestments,
  };
};
```

### BUG-05 Fix: Safe Installment Date Calculation
```typescript
// useExpensesTracker.ts - inside handleAddExpense
import { addMonths, endOfMonth, getDate, setDate } from "date-fns";

if (installments > 1) {
  const startDate = new Date(baseExpense.date);
  const originalDay = getDate(startDate);

  for (let i = 0; i < installments; i++) {
    const targetMonth = addMonths(startDate, i);
    const lastDay = getDate(endOfMonth(targetMonth));
    const safeDay = Math.min(originalDay, lastDay);
    const installmentDate = setDate(targetMonth, safeDay);

    newExpenses.push({
      ...baseExpense,
      id: crypto.randomUUID(),
      date: format(installmentDate, "yyyy-MM-dd"),
      installments: {
        total: installments,
        current: i + 1,
        startDate: baseExpense.date,
      },
    });
  }
}
```

### BUG-06 Fix: Allow Installment Editing
```typescript
// expense-tracker.tsx - remove the disabled attribute or make it conditional
// BEFORE: disabled={!!editingExpense}
// AFTER: remove the disabled prop entirely, or keep it disabled
// only for installment expenses where changing count would be destructive
<Input
  type="number"
  placeholder="Cuotas (opcional)"
  name="installments"
  min="1"
  defaultValue={editingExpense?.installments?.total}
  // Remove: disabled={!!editingExpense}
/>
```

### BUG-07 Fix: Force Form Remount on Edit
```typescript
// salary-card.tsx - add key to force remount when toggling to edit mode
<form 
  onSubmit={onSalarySubmit} 
  className="space-y-4"
  key={`salary-form-${selectedMonth}-${showSalaryForm}`}
>
```

### Settings Reset Button
```typescript
// New: settings gear in header with reset dialog
import { Settings } from "lucide-react";

// In expense-tracker.tsx header, next to ThemeToggle:
<Dialog>
  <DialogTrigger asChild>
    <Button variant="ghost" size="icon">
      <Settings className="h-5 w-5" />
    </Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Configuracion</DialogTitle>
    </DialogHeader>
    {/* Reset button with confirmation */}
  </DialogContent>
</Dialog>
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `Date.setMonth()` for month math | `date-fns addMonths` | Always was better | Prevents day overflow bugs |
| Duplicated string literals for types | `as const` arrays + derived types | TypeScript 3.4+ | Single source of truth |
| Uncontrolled forms with stale defaults | `key` prop to force remount | React pattern | Ensures fresh default values |

## Open Questions

1. **Should installment count be editable on existing expenses?**
   - What we know: BUG-06 says the field is disabled and shouldn't be. The CONTEXT.md confirms "can edit installments on existing expenses."
   - What's unclear: Editing installment count on an existing expense with already-generated installments is complex (need to add/remove sibling expenses). Editing other fields on an installment expense is straightforward.
   - Recommendation: Allow editing all fields on individual installment entries (name, amount, date, category). For changing installment *count*, consider this carefully -- it may mean allowing edits to individual installment records rather than changing the count retroactively. The simplest interpretation: remove the `disabled` attribute so fields can be edited on each installment entry individually.

2. **Last used USD rate persistence mechanism**
   - What we know: User wants pre-fill with last used rate. CONTEXT.md says Claude's discretion on localStorage key vs monthlyData.
   - Recommendation: Use a separate `localStorage` key `lastUsedUsdRate` (a plain number). This is simpler, cross-month, and doesn't pollute the monthlyData structure. Update it on every successful form submission that includes a usdRate > 0.

3. **calculateTotalAvailable scope after fix**
   - What we know: The card title says "Dinero disponible (Todos los meses)" but BUG-03 says it should filter by selected month.
   - What's unclear: Should it be "all months cumulative" or "selected month only"? The success criteria says "filtered to the selected month."
   - Recommendation: Follow the success criteria -- filter to selected month. Update the card title to reflect this (e.g., "Resumen del Mes" or "Disponible este mes").

## Sources

### Primary (HIGH confidence)
- Direct codebase analysis of all source files in the project
- `useInvestmentsTracker.ts` -- confirmed BUG-01 hardcoded currency on line 28
- `useMoneyTracker.ts` -- confirmed BUG-03 unfiltered calculation on lines 153-178
- `useExpensesTracker.ts` -- confirmed BUG-05 `setMonth` on lines 45-46
- `expense-tracker.tsx` -- confirmed BUG-06 `disabled={!!editingExpense}` on line 335
- `investment-dialog.tsx` -- confirmed BUG-02 type mismatch in Select options
- `salary-card.tsx` -- confirmed BUG-07 defaultValue staleness issue
- `expenses-table.tsx` line 126 and `salary-card.tsx` line 98 -- confirmed BUG-04 unguarded division

### Secondary (MEDIUM confidence)
- date-fns v4 API: `addMonths`, `endOfMonth`, `setDate`, `getDate` -- standard functions confirmed in date-fns docs

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - no new libraries needed, all already installed and verified in package.json
- Architecture: HIGH - all bugs traced to specific lines, fixes are well-understood patterns
- Pitfalls: HIGH - each pitfall directly observed in the codebase

**Research date:** 2026-04-01
**Valid until:** 2026-05-01 (stable -- no external dependencies changing)
