---
phase: quick-16
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - hooks/useExpensesTracker.ts
  - hooks/useMoneyTracker.ts
  - components/expense-tracker.tsx
  - components/resumen-card.tsx
autonomous: true
requirements: [QUICK-16]
must_haves:
  truths:
    - "Monthly summary EGRESOS section shows 'Por pagar' line with total of unpaid recurring expenses"
    - "Por pagar amount is orange/amber colored to distinguish from paid expenses (red) and investments (blue)"
    - "Por pagar only appears when there are unpaid recurring expenses (> 0)"
    - "Disponible tooltip breakdown includes Por pagar as a separate line"
  artifacts:
    - path: "components/resumen-card.tsx"
      provides: "Por pagar display line in EGRESOS section"
    - path: "hooks/useExpensesTracker.ts"
      provides: "porPagar computation from filtered expenses"
  key_links:
    - from: "hooks/useExpensesTracker.ts"
      to: "components/resumen-card.tsx"
      via: "porPagar prop through useMoneyTracker and expense-tracker"
      pattern: "porPagar"
---

<objective>
Add a "Por pagar" line in the monthly summary (ResumenCard) EGRESOS section showing the total of unpaid recurring expenses for the selected month.

Purpose: The user wants to see how much of their monthly expenses are unpaid recurring obligations — money that is liquid but already reserved for payments.
Output: ResumenCard displays "Por pagar" in EGRESOS when unpaid recurring expenses exist.
</objective>

<execution_context>
@C:/Users/Juan/.claude/get-shit-done/workflows/execute-plan.md
@C:/Users/Juan/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@hooks/useExpensesTracker.ts
@hooks/useMoneyTracker.ts
@components/expense-tracker.tsx
@components/resumen-card.tsx

Key data model context:
- Expense has optional `recurringId?: string` and `isPaid?: boolean`
- Recurring expenses are generated with `isPaid: false` by useRecurringExpenses
- `filteredExpenses` in useExpensesTracker already contains all expenses for the month (including recurring)
- `totalExpenses` is the sum of ALL filteredExpenses amounts (paid and unpaid)
- "Por pagar" is a SUBSET of totalExpenses, not an additional amount — it shows how much within Gastos is still unpaid
</context>

<tasks>

<task type="auto">
  <name>Task 1: Compute porPagar and pipe through to ResumenCard</name>
  <files>hooks/useExpensesTracker.ts, hooks/useMoneyTracker.ts, components/expense-tracker.tsx</files>
  <action>
1. In `hooks/useExpensesTracker.ts`, after `totalExpenses` computation (~line 86), add:
   ```
   const porPagar = filteredExpenses
     .filter((e) => e.recurringId && !e.isPaid)
     .reduce((sum, e) => sum + e.amount, 0);
   ```
   Add `porPagar` to the returned object.

2. In `hooks/useMoneyTracker.ts`, expose `porPagar` from `expensesTracker`:
   Add `porPagar: expensesTracker.porPagar` to the return object (near line 714 where `totalExpenses` is returned).

3. In `components/expense-tracker.tsx`, destructure `porPagar` from the useMoneyTracker hook (near line 122 where `totalExpenses` is destructured), and pass it to ResumenCard:
   ```
   porPagar={porPagar}
   ```
  </action>
  <verify>
    <automated>npx tsc --noEmit 2>&1 | head -20</automated>
  </verify>
  <done>porPagar is computed from filtered expenses and passed as prop to ResumenCard</done>
</task>

<task type="auto">
  <name>Task 2: Display Por pagar line in ResumenCard EGRESOS section</name>
  <files>components/resumen-card.tsx</files>
  <action>
1. Add `porPagar: number` to the `ResumenCardProps` interface.

2. In the EGRESOS section, AFTER the "Aportes inversiones" block (~line 248) and BEFORE the `<hr>` separator, add a conditional "Por pagar" line (only shown when porPagar > 0):
   ```tsx
   {porPagar > 0 && (
     <div className="flex justify-between">
       <span>Por pagar:</span>
       <Tooltip>
         <TooltipTrigger asChild>
           <span className="font-medium text-amber-500 dark:text-amber-400 cursor-help">
             <FormattedAmount value={-porPagar} currency="ARS" />
           </span>
         </TooltipTrigger>
         <TooltipContent className="max-w-xs">
           <p>Total de gastos recurrentes aun no pagados este mes</p>
         </TooltipContent>
       </Tooltip>
     </div>
   )}
   ```
   Use amber color to distinguish from paid Gastos (red) and Aportes (blue). Display as negative value (with `-porPagar`) to match the convention of Aportes inversiones showing negative.

3. In the Disponible tooltip breakdown (the TooltipContent near line 263), add a "Por pagar" line after the Aportes line:
   ```tsx
   {porPagar > 0 && (
     <p className="text-amber-400">- Por pagar: <FormattedAmount value={porPagar} currency="$" /></p>
   )}
   ```

IMPORTANT: Do NOT change the `disponible` calculation — "Por pagar" is already included in `totalGastos`. This is purely an informational breakdown showing the user what portion of their expenses are unpaid recurring obligations.
  </action>
  <verify>
    <automated>npx tsc --noEmit 2>&1 | head -20</automated>
  </verify>
  <done>ResumenCard shows "Por pagar" in amber in EGRESOS section when unpaid recurring expenses exist, with tooltip explaining the concept. Disponible tooltip also shows the breakdown.</done>
</task>

</tasks>

<verification>
- `npx tsc --noEmit` passes with no errors
- App renders without crashes
- When recurring expenses exist with isPaid=false, "Por pagar" line appears in amber in EGRESOS section
- When all recurring expenses are paid, "Por pagar" line is hidden
- Disponible value unchanged (Por pagar is subset of Gastos, not additional)
</verification>

<success_criteria>
- "Por pagar" line visible in EGRESOS section with amber styling when unpaid recurring expenses exist
- Tooltip on Por pagar explains it is unpaid recurring expenses
- Disponible tooltip breakdown includes Por pagar as separate line
- No change to actual Disponible calculation (informational only)
</success_criteria>

<output>
After completion, create `.planning/quick/16-add-por-pagar-category-for-unpaid-recurr/16-SUMMARY.md`
</output>
