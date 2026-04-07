---
phase: quick-25
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - hooks/useRecurringExpenses.ts
  - components/recurring-dialog.tsx
  - components/recurring-table.tsx
  - components/expense-tracker.tsx
autonomous: true
requirements: [QUICK-25]

must_haves:
  truths:
    - "User can click edit on any non-cancelled recurring expense and see its current values pre-filled in a dialog"
    - "User can change the amount (and optionally name/category/currency) and save"
    - "Updated recurring expense reflects the new amount in the table immediately"
    - "Future auto-generated expense instances use the new amount"
  artifacts:
    - path: "hooks/useRecurringExpenses.ts"
      provides: "updateRecurring function"
      exports: ["updateRecurring"]
    - path: "components/recurring-dialog.tsx"
      provides: "Dialog supporting both add and edit modes"
    - path: "components/recurring-table.tsx"
      provides: "Edit button per row"
    - path: "components/expense-tracker.tsx"
      provides: "Wiring of edit state and callbacks"
  key_links:
    - from: "components/recurring-table.tsx"
      to: "components/expense-tracker.tsx"
      via: "onEdit callback prop"
      pattern: "onEdit\\(rec\\)"
    - from: "components/expense-tracker.tsx"
      to: "components/recurring-dialog.tsx"
      via: "editingRecurring state passed as prop"
      pattern: "editingRecurring"
    - from: "components/recurring-dialog.tsx"
      to: "hooks/useRecurringExpenses.ts"
      via: "onEdit callback calling updateRecurring"
      pattern: "updateRecurring"
---

<objective>
Add ability to edit recurring expense values (amount, name, category, currency).

Purpose: User added a recurring expense with wrong amount and needs to correct it. Currently there is no edit — only add/pause/cancel.
Output: Pencil edit button on each active/paused recurring row, reusing the existing RecurringDialog in edit mode.
</objective>

<execution_context>
@C:/Users/Juan/.claude/get-shit-done/workflows/execute-plan.md
@C:/Users/Juan/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@hooks/useRecurringExpenses.ts
@components/recurring-dialog.tsx
@components/recurring-table.tsx
@components/expense-tracker.tsx

<interfaces>
<!-- From hooks/useRecurringExpenses.ts -->
```typescript
export interface RecurringExpense {
  id: string;
  name: string;
  amount: number;
  category: Category;
  currencyType: CurrencyType;
  status: RecurringStatus;
  createdAt: string;
  pausedAt?: string;
}

// Hook returns:
// { recurringExpenses, addRecurring, updateStatus, generateMissingInstances }
```

<!-- From components/recurring-dialog.tsx -->
```typescript
interface RecurringDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (data: { name: string; amount: number; category: Category; currencyType: CurrencyType }) => void;
}
```

<!-- From components/recurring-table.tsx -->
```typescript
interface RecurringTableProps {
  recurrings: RecurringExpense[];
  onUpdateStatus: (id: string, status: RecurringStatus) => void;
}
```

<!-- Existing edit pattern from budget-tab.tsx for reference -->
```typescript
// Pattern: editingState + dialog reuse
const [editingBudget, setEditingBudget] = useState<{ category: Category; limit: number } | null>(null);
const handleEdit = (category, currentLimit) => { setEditingBudget({ category, limit: currentLimit }); };
// Dialog receives editingBudget prop, pre-fills if non-null, title changes
```
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Add updateRecurring to hook and make dialog support edit mode</name>
  <files>hooks/useRecurringExpenses.ts, components/recurring-dialog.tsx</files>
  <action>
**In hooks/useRecurringExpenses.ts:**
Add `updateRecurring` function that takes `(id: string, data: { name: string; amount: number; category: Category; currencyType: CurrencyType })` and updates the matching recurring expense in the array via `setRecurringExpenses`. Only update name, amount, category, currencyType — preserve id, status, createdAt, pausedAt. Return it from the hook alongside existing exports.

**In components/recurring-dialog.tsx:**
1. Add optional prop `editingRecurring?: RecurringExpense | null` and `onEdit?: (id: string, data: { name: string; amount: number; category: Category; currencyType: CurrencyType }) => void`
2. When `editingRecurring` is provided:
   - Dialog title becomes "Editar gasto recurrente" instead of "Nuevo gasto recurrente"
   - Pre-fill name input with `defaultValue={editingRecurring.name}`
   - Pre-fill amount CurrencyInput with `defaultValue={editingRecurring.amount}`
   - Set `selectedCurrency` initial state from `editingRecurring.currencyType`
   - Set `selectedCategory` initial state from `editingRecurring.category`
   - Submit button text becomes "Guardar" instead of "Agregar"
   - On submit, call `onEdit(editingRecurring.id, data)` instead of `onAdd(data)`
3. Use `useEffect` to sync state when `editingRecurring` changes (ephemeral dialog pattern per project convention): when `editingRecurring` is truthy set selectedCurrency and selectedCategory from it; when dialog closes (open goes false) reset to defaults.
4. Keep form `key` as `open ? "open" : "closed"` so inputs reset properly between open/close cycles.
  </action>
  <verify>
    <automated>cd D:/Documents/Programing/nextjs/expense-tracker && npx tsc --noEmit 2>&1 | head -20</automated>
  </verify>
  <done>useRecurringExpenses exports updateRecurring. RecurringDialog accepts editingRecurring and onEdit props, pre-fills fields and changes title/button when editing.</done>
</task>

<task type="auto">
  <name>Task 2: Add edit button to table and wire everything in expense-tracker</name>
  <files>components/recurring-table.tsx, components/expense-tracker.tsx</files>
  <action>
**In components/recurring-table.tsx:**
1. Import `Pencil` from lucide-react (already importing Pause, Play, XCircle)
2. Add `onEdit: (recurring: RecurringExpense) => void` to RecurringTableProps
3. For each non-Cancelada row, add a Pencil edit button BEFORE the existing Pause/Play buttons inside the flex div. Use same styling pattern: `variant="ghost" size="icon" className="h-8 w-8" title="Editar"`. OnClick calls `onEdit(rec)`.

**In components/expense-tracker.tsx:**
1. Import `updateRecurring` from the hook destructuring (it's already using `useRecurringExpenses` via `addRecurring` and `updateRecurringStatus` — check the hook usage around line 196 and add `updateRecurring` to the destructured values).
2. Add state: `const [editingRecurring, setEditingRecurring] = useState<RecurringExpense | null>(null);` (import RecurringExpense type from hook)
3. Pass `onEdit={setEditingRecurring}` to `<RecurringTable>`
4. Update `<RecurringDialog>` props:
   - `open={recurringDialogOpen || !!editingRecurring}` (opens for both add and edit)
   - `onOpenChange={(open) => { setRecurringDialogOpen(open); if (!open) setEditingRecurring(null); }}`
   - `editingRecurring={editingRecurring}`
   - `onEdit={(id, data) => { updateRecurring(id, data); setEditingRecurring(null); }}`
  </action>
  <verify>
    <automated>cd D:/Documents/Programing/nextjs/expense-tracker && npx tsc --noEmit 2>&1 | head -20</automated>
  </verify>
  <done>Each active/paused recurring row shows a pencil edit button. Clicking it opens the dialog pre-filled with current values. Saving updates the recurring expense amount (and any other edited fields). The table reflects changes immediately.</done>
</task>

</tasks>

<verification>
1. `npx tsc --noEmit` passes with zero errors
2. `npm run build` succeeds
3. Manual: Navigate to Recurrentes tab, see edit pencil icon on active/paused rows, click it, verify dialog pre-fills with current values, change amount, save, verify table shows updated amount
</verification>

<success_criteria>
- Pencil edit button visible on all non-cancelled recurring expense rows
- Clicking edit opens dialog with pre-filled name, amount, category, currency
- Dialog title shows "Editar gasto recurrente" and button shows "Guardar" in edit mode
- Saving updates the recurring expense in localStorage
- Future generated expense instances use the new amount
- No TypeScript errors
</success_criteria>

<output>
After completion, create `.planning/quick/25-editar-valor-de-gastos-recurrentes/25-SUMMARY.md`
</output>
