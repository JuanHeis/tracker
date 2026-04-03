---
phase: quick-8
plan: 1
type: execute
wave: 1
depends_on: []
files_modified:
  - components/expenses-table.tsx
  - components/income-table.tsx
  - components/movements-table.tsx
  - components/investment-row.tsx
  - components/investment-movements.tsx
  - components/budget-row.tsx
  - components/exchange-summary.tsx
  - components/config-card.tsx
  - components/salary-card.tsx
autonomous: true
requirements: [QUICK-8]

must_haves:
  truths:
    - "Every delete button in the app shows a confirmation dialog before deleting"
    - "Confirmation dialogs are in Spanish matching existing app style"
    - "Cancel dismisses dialog without deleting, Confirm executes delete"
  artifacts:
    - path: "components/expenses-table.tsx"
      provides: "AlertDialog for expense deletion"
      contains: "AlertDialog"
    - path: "components/income-table.tsx"
      provides: "AlertDialog for income deletion"
      contains: "AlertDialog"
    - path: "components/movements-table.tsx"
      provides: "AlertDialog for transfer deletion"
      contains: "AlertDialog"
    - path: "components/investment-row.tsx"
      provides: "AlertDialog for investment deletion"
      contains: "AlertDialog"
    - path: "components/investment-movements.tsx"
      provides: "AlertDialog for investment movement deletion"
      contains: "AlertDialog"
    - path: "components/budget-row.tsx"
      provides: "AlertDialog for budget category deletion"
      contains: "AlertDialog"
    - path: "components/exchange-summary.tsx"
      provides: "AlertDialog for USD purchase deletion"
      contains: "AlertDialog"
    - path: "components/config-card.tsx"
      provides: "AlertDialog for salary history entry deletion"
      contains: "AlertDialog"
    - path: "components/salary-card.tsx"
      provides: "AlertDialog for salary history entry deletion"
      contains: "AlertDialog"
  key_links:
    - from: "delete button onClick"
      to: "AlertDialog open state"
      via: "setDeleteTarget(id) instead of direct onDelete(id)"
      pattern: "setDeleteTarget"
---

<objective>
Add AlertDialog confirmation to all 9 delete buttons in the app that currently delete immediately without confirmation.

Purpose: Prevent accidental data loss from mis-taps on delete buttons.
Output: All delete buttons show a Spanish-language confirmation dialog before executing deletion.
</objective>

<execution_context>
@C:/Users/Juan/.claude/get-shit-done/workflows/execute-plan.md
@C:/Users/Juan/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@components/loans-table.tsx (reference implementation — lines 14-23 for imports, line 46 for state, lines 53-57 for handler, lines 114-133 for AlertDialog JSX)

<interfaces>
<!-- AlertDialog pattern from loans-table.tsx -->
```typescript
// Imports needed:
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";

// State pattern:
const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

// Handler pattern:
const handleConfirmDelete = () => {
  if (deleteTarget) {
    onDelete(deleteTarget);  // call the existing callback
    setDeleteTarget(null);
  }
};

// Button change: onClick={() => onDelete(id)} --> onClick={() => setDeleteTarget(id)}

// Dialog JSX (placed at end of component return, inside a fragment if needed):
<AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Eliminar [item]?</AlertDialogTitle>
      <AlertDialogDescription>
        Esta accion no se puede deshacer.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Cancelar</AlertDialogCancel>
      <AlertDialogAction
        onClick={handleConfirmDelete}
        className="bg-red-600 hover:bg-red-700 text-white"
      >
        Eliminar
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Add delete confirmation to table components (5 files)</name>
  <files>
    components/expenses-table.tsx
    components/income-table.tsx
    components/movements-table.tsx
    components/investment-row.tsx
    components/investment-movements.tsx
  </files>
  <action>
Apply the AlertDialog confirmation pattern from loans-table.tsx to each file. For each file:

1. Add AlertDialog imports from "./ui/alert-dialog"
2. Add `const [deleteTarget, setDeleteTarget] = useState<string | null>(null);` state
3. Add handleConfirmDelete function that calls the existing onDelete callback and resets state
4. Change the delete button onClick from direct callback to `setDeleteTarget(id)`
5. Add AlertDialog JSX at end of component return (wrap in fragment if component returns a single element)

Specific per-file details:

**expenses-table.tsx** (line 245): `onDeleteExpense(expense.id)` -> `setDeleteTarget(expense.id)`. Handler calls `onDeleteExpense(deleteTarget)`. Title: "Eliminar gasto?"  Description: "Se eliminara este gasto permanentemente. Esta accion no se puede deshacer."

**income-table.tsx** (line 198): `onDeleteIncome(income.id)` -> `setDeleteTarget(income.id)`. Handler calls `onDeleteIncome(deleteTarget)`. Title: "Eliminar ingreso?" Description: "Se eliminara este ingreso permanentemente. Esta accion no se puede deshacer."

**movements-table.tsx** (line 99): `onDeleteTransfer(transfer.id)` -> `setDeleteTarget(transfer.id)`. Handler calls `onDeleteTransfer(deleteTarget)`. Title: "Eliminar transferencia?" Description: "Se eliminara esta transferencia permanentemente. Esta accion no se puede deshacer."

**investment-row.tsx** (line 146): `onDelete(investment.id)` -> `setDeleteTarget(investment.id)`. Handler calls `onDelete(deleteTarget)`. Title: "Eliminar inversion?" Description: "Se eliminara esta inversion y todos sus movimientos. Esta accion no se puede deshacer." NOTE: This component returns a fragment (<>...</>), so the AlertDialog can be added as a sibling inside the fragment.

**investment-movements.tsx** (line 161): This one has TWO params: `onDeleteMovement(investment.id, movement.id)`. Use `setDeleteTarget(movement.id)` and in handleConfirmDelete call `onDeleteMovement(investment.id, deleteTarget)`. Title: "Eliminar movimiento?" Description: "Se eliminara este movimiento de la inversion. Esta accion no se puede deshacer."
  </action>
  <verify>
    <automated>cd d:/Documents/Programing/nextjs/expense-tracker && npx tsc --noEmit 2>&1 | head -20</automated>
  </verify>
  <done>All 5 table components show AlertDialog before executing delete. TypeScript compiles without errors.</done>
</task>

<task type="auto">
  <name>Task 2: Add delete confirmation to card/row components (4 files)</name>
  <files>
    components/budget-row.tsx
    components/exchange-summary.tsx
    components/config-card.tsx
    components/salary-card.tsx
  </files>
  <action>
Apply the same AlertDialog confirmation pattern to each file:

**budget-row.tsx** (line 74): `onDelete(category)` -> `setDeleteTarget(category)`. NOTE: deleteTarget type is `string | null` since category is already a string name. Handler calls `onDelete(deleteTarget)`. Title: "Eliminar categoria?" Description: "Se eliminara esta categoria del presupuesto. Esta accion no se puede deshacer." The component returns a single div — wrap return in a fragment to add AlertDialog as sibling.

**exchange-summary.tsx** (line 122): `onDelete(purchase.id)` -> `setDeleteTarget(purchase.id)`. Handler calls `onDelete(deleteTarget)`. Title: "Eliminar compra de USD?" Description: "Se eliminara este registro de compra de dolares. Esta accion no se puede deshacer." Component returns a Card — wrap in fragment.

**config-card.tsx** (line 376): `onDeleteSalaryEntry(entry.id)` -> `setDeleteTarget(entry.id)`. Handler calls `onDeleteSalaryEntry(deleteTarget)`. Title: "Eliminar entrada de sueldo?" Description: "Se eliminara esta entrada del historial de sueldos. Esta accion no se puede deshacer." IMPORTANT: This is a large component — add deleteTarget state near other useState declarations, add handler near other handlers, and add AlertDialog JSX just before the closing of the component's return.

**salary-card.tsx** (line 594): Same pattern as config-card. `onDeleteSalaryEntry(entry.id)` -> `setDeleteTarget(entry.id)`. Handler calls `onDeleteSalaryEntry(deleteTarget)`. Title: "Eliminar entrada de sueldo?" Description: "Se eliminara esta entrada del historial de sueldos. Esta accion no se puede deshacer." Also a large component — same placement strategy.

For all files:
1. Add AlertDialog imports from "./ui/alert-dialog"
2. Add useState<string | null>(null) for deleteTarget
3. Add handleConfirmDelete function
4. Change onClick to setDeleteTarget
5. Add AlertDialog JSX
  </action>
  <verify>
    <automated>cd d:/Documents/Programing/nextjs/expense-tracker && npx tsc --noEmit 2>&1 | head -20 && npx next build 2>&1 | tail -5</automated>
  </verify>
  <done>All 9 delete buttons across the app now show confirmation dialogs. Full build succeeds with no errors.</done>
</task>

</tasks>

<verification>
1. `npx tsc --noEmit` — zero TypeScript errors
2. `npx next build` — successful build
3. Every file that had a direct onDelete click now uses setDeleteTarget + AlertDialog pattern
4. grep confirms all 9 files import AlertDialog: `grep -l "AlertDialog" components/*.tsx` should return all 9 files plus loans-table.tsx (10 total)
</verification>

<success_criteria>
- All 9 delete buttons show Spanish-language confirmation dialog before executing
- Each dialog has title, description, Cancel, and red Eliminar button
- Canceling dismisses dialog without side effects
- Confirming executes the original delete callback
- App builds and runs without errors
</success_criteria>

<output>
After completion, create `.planning/quick/8-add-delete-confirmation-dialogs-starting/8-SUMMARY.md`
</output>
