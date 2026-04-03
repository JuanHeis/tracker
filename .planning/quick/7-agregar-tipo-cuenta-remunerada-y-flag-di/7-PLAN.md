---
phase: quick-7
plan: 1
type: execute
wave: 1
depends_on: []
files_modified:
  - constants/investments.ts
  - hooks/useMoneyTracker.ts
  - hooks/useInvestmentsTracker.ts
  - hooks/useSetupWizard.ts
  - components/investment-dialog.tsx
  - components/setup-wizard/wizard-step-investments.tsx
autonomous: true
requirements: [QUICK-7]

must_haves:
  truths:
    - "User can select 'Cuenta remunerada' as investment type with ARS enforcement"
    - "User can toggle 'Disponibilidad inmediata' checkbox when creating/editing investments"
    - "Investments with isLiquid=true and status Activa add currentValue to Liquido ARS instead of Inversiones ARS in patrimonio"
    - "Existing investments gain isLiquid=false via migration without data loss"
    - "Setup wizard shows isLiquid checkbox in investments step"
  artifacts:
    - path: "constants/investments.ts"
      provides: "Cuenta remunerada type with ARS currency enforcement"
      contains: "Cuenta remunerada"
    - path: "hooks/useMoneyTracker.ts"
      provides: "isLiquid field on Investment, migration, patrimonio logic"
      contains: "isLiquid"
    - path: "components/investment-dialog.tsx"
      provides: "Disponibilidad inmediata checkbox"
      contains: "isLiquid"
  key_links:
    - from: "hooks/useMoneyTracker.ts (calculateDualBalances)"
      to: "components/patrimonio-card.tsx"
      via: "arsBalance and arsInvestments values change based on isLiquid"
      pattern: "isLiquid.*currentValue"
---

<objective>
Add "Cuenta remunerada" investment type and "Disponibilidad inmediata" (isLiquid) flag to investments.

Purpose: Cuenta remunerada (e.g., Mercado Pago) is liquid money that should count as available cash in patrimonio, not locked investment. The isLiquid flag lets any investment type be marked as immediately available.

Output: New investment type, isLiquid field on Investment interface, checkbox in dialogs, updated patrimonio calculation, data migration.
</objective>

<execution_context>
@C:/Users/Juan/.claude/get-shit-done/workflows/execute-plan.md
@C:/Users/Juan/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@constants/investments.ts
@hooks/useMoneyTracker.ts
@hooks/useInvestmentsTracker.ts
@hooks/useSetupWizard.ts
@components/investment-dialog.tsx
@components/setup-wizard/wizard-step-investments.tsx
@components/patrimonio-card.tsx
</context>

<tasks>

<task type="auto">
  <name>Task 1: Add Cuenta remunerada type, isLiquid field, migration, and patrimonio logic</name>
  <files>constants/investments.ts, hooks/useMoneyTracker.ts, hooks/useInvestmentsTracker.ts, hooks/useSetupWizard.ts</files>
  <action>
1. **constants/investments.ts** — Add "Cuenta remunerada" to the INVESTMENT_TYPES tuple (after "Acciones"). Add currency enforcement entry: `"Cuenta remunerada": CurrencyType.ARS`. The InvestmentType union updates automatically from the const.

2. **hooks/useMoneyTracker.ts** — Three changes:
   a. **Investment interface:** Add `isLiquid?: boolean` field (optional, defaults to false for backward compat).
   b. **migrateData:** Bump `_migrationVersion` to 8. In the investments mapping, add `isLiquid: investment.isLiquid ?? false` to ensure all existing investments get the field. Add migration block: `if (currentVersion < 8) { /* isLiquid defaulting already handled in map */ }`.
   c. **calculateDualBalances:** Modify the `arsInvestments` and `usdInvestments` reduction (lines ~425-430). Split active investments into liquid vs non-liquid:
      - Non-liquid (isLiquid falsy): sum into arsInvestments/usdInvestments as before
      - Liquid (isLiquid === true): sum currentValue into arsBalance/usdBalance respectively INSTEAD of arsInvestments/usdInvestments
      
      Replace the two reduce blocks (lines 425-430) with:
      ```
      let arsInvestments = 0;
      let usdInvestments = 0;
      (monthlyData.investments || [])
        .filter((i) => i.status === "Activa")
        .forEach((i) => {
          if (i.isLiquid) {
            if (i.currencyType === CurrencyType.ARS) arsBalance += i.currentValue;
            else usdBalance += i.currentValue;
          } else {
            if (i.currencyType === CurrencyType.ARS) arsInvestments += i.currentValue;
            else usdInvestments += i.currentValue;
          }
        });
      ```
      Move these declarations BEFORE the return statement but keep them in the correct scope. The `arsBalance`/`usdBalance` variables are already `let`, so they can be mutated.

3. **hooks/useInvestmentsTracker.ts** — Update `handleAddInvestment` to accept and pass through `isLiquid?: boolean` in the investmentData parameter. When creating `newInvestment`, spread `...(investmentData.isLiquid && { isLiquid: true })`. Only store if true (falsy = not liquid, saves space).

4. **hooks/useSetupWizard.ts** — Add `isLiquid?: boolean` to WizardInvestment interface. In `commitWizardData`, pass through isLiquid when mapping: `...(wi.isLiquid && { isLiquid: true })`.
  </action>
  <verify>
    <automated>cd D:/Documents/Programing/nextjs/expense-tracker && npx tsc --noEmit 2>&1 | head -30</automated>
  </verify>
  <done>
    - "Cuenta remunerada" appears in INVESTMENT_TYPES with ARS enforcement
    - Investment interface has isLiquid field
    - Migration v8 adds isLiquid to existing investments
    - calculateDualBalances routes liquid investments to arsBalance/usdBalance
    - handleAddInvestment accepts isLiquid
    - WizardInvestment supports isLiquid
    - TypeScript compiles without errors
  </done>
</task>

<task type="auto">
  <name>Task 2: Add isLiquid checkbox to investment dialog and wizard</name>
  <files>components/investment-dialog.tsx, components/setup-wizard/wizard-step-investments.tsx</files>
  <action>
1. **components/investment-dialog.tsx** — Add a "Disponibilidad inmediata" checkbox:
   a. Add state: `const [isLiquid, setIsLiquid] = useState(editingInvestment?.isLiquid ?? false);`
   b. In the useEffect that syncs on editingInvestment change, also reset: `setIsLiquid(editingInvestment?.isLiquid ?? false);`
   c. Add checkbox UI AFTER the currency Select, BEFORE the Plazo Fijo fields. Use a native HTML checkbox styled with Tailwind (no shadcn Checkbox component exists):
      ```tsx
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={isLiquid}
          onChange={(e) => setIsLiquid(e.target.checked)}
          className="h-4 w-4 rounded border-border accent-primary"
        />
        <span className="text-sm">Disponibilidad inmediata</span>
      </label>
      <p className="text-xs text-muted-foreground -mt-2">
        Suma al liquido en vez de inversiones en el patrimonio
      </p>
      ```
   d. In handleSubmit for new investment: add `isLiquid` to the data object passed to `onAdd` (only if true).
   e. In handleSubmit for edit: the isLiquid field should also be updatable. Extend the onUpdate callback type to accept `isLiquid?: boolean`. Update the `InvestmentDialogProps.onUpdate` signature and the edit submission to include `isLiquid`.
   f. Update `handleUpdateInvestment` in useInvestmentsTracker.ts to accept and apply `isLiquid` in the updates parameter type.

2. **components/setup-wizard/wizard-step-investments.tsx** — Add isLiquid to the wizard add form:
   a. Add state: `const [formIsLiquid, setFormIsLiquid] = useState(false);`
   b. Add the same checkbox UI after the currency Select, before Plazo Fijo fields.
   c. In `handleAdd`, include `...(formIsLiquid && { isLiquid: true })` in newInvestment.
   d. In `clearForm`, reset: `setFormIsLiquid(false);`
   e. In the investment list items display, show a small badge "(liquida)" next to the type badge if `inv.isLiquid` is true:
      ```tsx
      {inv.isLiquid && (
        <Badge variant="outline" className="shrink-0 text-xs">liquida</Badge>
      )}
      ```
  </action>
  <verify>
    <automated>cd D:/Documents/Programing/nextjs/expense-tracker && npx tsc --noEmit 2>&1 | head -30 && npx next build 2>&1 | tail -5</automated>
  </verify>
  <done>
    - Investment dialog shows "Disponibilidad inmediata" checkbox for both new and edit modes
    - Wizard investment step shows "Disponibilidad inmediata" checkbox
    - Wizard investment list shows "(liquida)" badge for liquid investments
    - isLiquid value persists through add and edit flows
    - Project builds without errors
  </done>
</task>

</tasks>

<verification>
1. TypeScript compiles: `npx tsc --noEmit`
2. Build succeeds: `npx next build`
3. Manual spot check: Open app, create a "Cuenta remunerada" investment with isLiquid=true, verify patrimonio card shows its value under "Liquido ARS" not "Inversiones ARS"
</verification>

<success_criteria>
- "Cuenta remunerada" available in investment type dropdown with ARS-only enforcement
- isLiquid checkbox visible in investment dialog and wizard
- Liquid investments (isLiquid=true) add to Liquido ARS/USD in patrimonio calculation
- Existing localStorage data migrates cleanly (isLiquid defaults to false)
- No TypeScript errors, build passes
</success_criteria>

<output>
After completion, create `.planning/quick/7-agregar-tipo-cuenta-remunerada-y-flag-di/7-SUMMARY.md`
</output>
