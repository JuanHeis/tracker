---
phase: quick-23
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - hooks/useExpensesTracker.ts
  - components/expenses-table.tsx
  - components/expense-tracker.tsx
autonomous: true
requirements: [PENDING-EXPENSE-TOGGLE]
must_haves:
  truths:
    - "User can mark a regular (non-recurring) expense as 'por pagar' when creating it"
    - "User can toggle any expense between paid and pending states in the table"
    - "Pending regular expenses show the amber Circle icon, paid show green Check"
    - "Pending regular expenses are included in the 'por pagar' summary total"
    - "Existing expenses without isPaid property remain treated as paid (no data breakage)"
  artifacts:
    - path: "hooks/useExpensesTracker.ts"
      provides: "Updated porPagar calculation including non-recurring pending expenses"
    - path: "components/expenses-table.tsx"
      provides: "Toggle button visible for all expenses, not just recurring"
    - path: "components/expense-tracker.tsx"
      provides: "Por pagar checkbox in expense creation/edit dialog"
  key_links:
    - from: "components/expense-tracker.tsx"
      to: "hooks/useExpensesTracker.ts"
      via: "FormData field 'isPending' read in handleAddExpense/handleUpdateExpense"
      pattern: "formData\\.get.*isPending"
    - from: "components/expenses-table.tsx"
      to: "hooks/useMoneyTracker.ts"
      via: "onTogglePaid callback (already exists, toggleExpensePaid)"
      pattern: "onTogglePaid"
---

<objective>
Add optional "por pagar" (pending payment) status to regular one-time expenses, allowing users to mark expenses as unpaid and see them in the pending summary.

Purpose: Currently only recurring-generated expenses can be marked as pending. Users want the same capability for regular expenses.
Output: Updated expense form with "Por pagar" checkbox, toggle visible for all expenses in table, porPagar summary includes all pending expenses.
</objective>

<execution_context>
@C:/Users/Juan/.claude/get-shit-done/workflows/execute-plan.md
@C:/Users/Juan/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@hooks/useMoneyTracker.ts (Expense interface at line 46, toggleExpensePaid at line 601)
@hooks/useExpensesTracker.ts (porPagar filter at line 88, handleAddExpense at line 22, handleUpdateExpense at line 112)
@components/expenses-table.tsx (toggle button at line 170, recurringId guard)
@components/expense-tracker.tsx (expense dialog form at line 730)

<interfaces>
From hooks/useMoneyTracker.ts:
```typescript
export interface Expense {
  id: string;
  date: string;
  name: string;
  amount: number;
  usdRate: number;
  category: Category;
  currencyType: CurrencyType;
  installments?: { total: number; current: number; startDate: string; };
  recurringId?: string;
  isPaid?: boolean;  // undefined = paid (default), false = pending, true = explicitly paid
}
```

toggleExpensePaid (line 601) already works on ANY expense by id — no recurringId check.
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Update porPagar filter and add isPending to form handlers</name>
  <files>hooks/useExpensesTracker.ts</files>
  <action>
1. Update the `porPagar` calculation (line 88-90) to include ALL expenses where `isPaid === false`, not just those with `recurringId`:

Change:
```typescript
const porPagar = filteredExpenses
  .filter((e) => e.recurringId && !e.isPaid)
  .reduce((sum, e) => sum + e.amount, 0);
```
To:
```typescript
const porPagar = filteredExpenses
  .filter((e) => e.isPaid === false)
  .reduce((sum, e) => sum + e.amount, 0);
```

Note: Use strict `=== false` check, NOT `!e.isPaid`. This ensures expenses with `isPaid: undefined` (existing data, default paid) are NOT counted as pending. Only explicitly set `false` values count.

2. In `handleAddExpense` (line 22): After building `baseExpense` object (line 28-36), read the isPending field from formData and conditionally add `isPaid: false`:

```typescript
const isPending = formData.get("isPending") === "on";
const baseExpense = {
  id: crypto.randomUUID(),
  date: formData.get("date") as string,
  name: formData.get("name") as string,
  amount,
  usdRate,
  category: formData.get("category") as Category,
  currencyType,
  ...(isPending ? { isPaid: false } : {}),
};
```

3. In `handleUpdateExpense` (line 112): Similarly read isPending from formData and apply to updatedExpense. For edit, if the checkbox is unchecked, remove isPaid (so it reverts to default paid state). If checked, set isPaid: false:

```typescript
const isPending = formData.get("isPending") === "on";
const updatedExpense = {
  ...editingExpense,
  date: formData.get("date") as string,
  name: formData.get("name") as string,
  amount,
  usdRate,
  category: formData.get("category") as Category,
  currencyType,
  ...(isPending ? { isPaid: false } : { isPaid: undefined }),
};
```

Using `isPaid: undefined` when unchecked ensures the property is effectively removed (treated as paid), maintaining backward compatibility.
  </action>
  <verify>
    <automated>cd D:/Documents/Programing/nextjs/expense-tracker && npx tsc --noEmit 2>&1 | head -20</automated>
  </verify>
  <done>porPagar includes all expenses with isPaid===false; add/edit handlers read isPending from form</done>
</task>

<task type="auto">
  <name>Task 2: Show toggle for all expenses and add checkbox to form dialog</name>
  <files>components/expenses-table.tsx, components/expense-tracker.tsx</files>
  <action>
**expenses-table.tsx** (line 170):

Remove the `expense.recurringId &&` guard from the toggle button condition. Change:
```tsx
{expense.recurringId && onTogglePaid && (
```
To:
```tsx
{onTogglePaid && (
```

This makes the paid/pending toggle button (Check/Circle icons) visible for ALL expenses, not just recurring ones. The toggle already works correctly via `toggleExpensePaid` in useMoneyTracker.

**expense-tracker.tsx** (expense dialog form, around line 828 before the submit button):

Add a "Por pagar" checkbox after the category/installments row (after line 828, before the TooltipProvider at line 829). Follow the existing checkbox pattern from investment-dialog.tsx:

```tsx
<label className="flex items-center gap-2 cursor-pointer">
  <input
    type="checkbox"
    name="isPending"
    defaultChecked={editingExpense?.isPaid === false}
    className="h-4 w-4 rounded border-border accent-primary"
  />
  <span className="text-sm">Por pagar</span>
</label>
```

Key details:
- Use `name="isPending"` so FormData picks it up (returns "on" when checked)
- Use `defaultChecked={editingExpense?.isPaid === false}` for edit mode — only checked when explicitly pending
- Use strict `=== false` to distinguish from `undefined` (paid by default)
- Place it in the form between the category/installments row and the submit button
- No `useState` needed — this is an uncontrolled input like the rest of the form fields
  </action>
  <verify>
    <automated>cd D:/Documents/Programing/nextjs/expense-tracker && npx tsc --noEmit 2>&1 | head -20 && npm run build 2>&1 | tail -5</automated>
  </verify>
  <done>Toggle button visible for all expenses in table; "Por pagar" checkbox in expense add/edit dialog; existing expenses without isPaid continue to show as paid (no visual change)</done>
</task>

</tasks>

<verification>
1. TypeScript compiles without errors: `npx tsc --noEmit`
2. Build succeeds: `npm run build`
3. Manual verification: Create a new expense with "Por pagar" checked — should show amber Circle icon in table and be included in por pagar summary total
4. Manual verification: Edit an existing expense, check "Por pagar" — after save, shows pending icon
5. Manual verification: Toggle an expense from pending to paid using the icon — Circle changes to Check, por pagar total decreases
6. Backward compatibility: Existing expenses without isPaid property still show as paid (no icon change, not in por pagar total)
</verification>

<success_criteria>
- Regular expenses can be created as "por pagar" via checkbox in dialog
- All expenses show toggle button (not just recurring)
- porPagar summary includes both recurring and regular pending expenses
- Existing data is not broken (isPaid undefined = paid)
</success_criteria>

<output>
After completion, create `.planning/quick/23-add-pending-payment-status-to-expenses-w/23-SUMMARY.md`
</output>
