---
phase: quick-15
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - components/investment-dialog.tsx
  - hooks/useInvestmentsTracker.ts
autonomous: true
must_haves:
  truths:
    - "When creating a new investment, user sees an 'Inicial (wizard)' checkbox"
    - "Checking the checkbox marks the first movement as isInitial: true"
    - "isInitial movements are excluded from monthly outflow calculations (existing logic)"
  artifacts:
    - path: "components/investment-dialog.tsx"
      provides: "isInitial checkbox in creation form"
      contains: "isInitial"
    - path: "hooks/useInvestmentsTracker.ts"
      provides: "isInitial propagated to first movement"
      contains: "isInitial"
  key_links:
    - from: "components/investment-dialog.tsx"
      to: "hooks/useInvestmentsTracker.ts"
      via: "onAdd callback data includes isInitial"
      pattern: "isInitial"
---

<objective>
Add a checkbox to the investment creation dialog so users can mark an investment as "initial" (wizard-loaded). This flags the first movement with `isInitial: true`, which existing logic already uses to exclude it from monthly outflow calculations and projection contribution inference.

Purpose: User forgot to load an investment during the setup wizard and needs to retroactively mark it as initial patrimony.
Output: Updated InvestmentDialog with checkbox, updated handleAddInvestment to propagate flag.
</objective>

<execution_context>
@C:/Users/Juan/.claude/get-shit-done/workflows/execute-plan.md
@C:/Users/Juan/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@components/investment-dialog.tsx
@hooks/useInvestmentsTracker.ts

<interfaces>
<!-- From hooks/useMoneyTracker.ts line 60 — isInitial already exists on movements -->
```typescript
// InvestmentMovement already has:
isInitial?: boolean;   // true for wizard-loaded patrimony (not counted as monthly outflow)
```

<!-- From hooks/useInvestmentsTracker.ts — handleAddInvestment data shape -->
```typescript
handleAddInvestment(investmentData: {
  name: string;
  type: InvestmentType;
  currencyType: CurrencyType;
  initialAmount: number;
  date: string;
  tna?: number;
  plazoDias?: number;
  isLiquid?: boolean;
  // NEW: isInitial?: boolean — to be added
})
```

<!-- From components/investment-dialog.tsx — onAdd callback shape -->
```typescript
onAdd: (data: {
  name: string;
  type: InvestmentType;
  currencyType: CurrencyType;
  initialAmount: number;
  date: string;
  tna?: number;
  plazoDias?: number;
  // NEW: isInitial?: boolean — to be added
}) => void;
```
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Add isInitial checkbox to InvestmentDialog and propagate through handleAddInvestment</name>
  <files>components/investment-dialog.tsx, hooks/useInvestmentsTracker.ts</files>
  <action>
1. In `components/investment-dialog.tsx`:
   - Add `isInitial?: boolean` to the `onAdd` data type in `InvestmentDialogProps` (line 23-31)
   - Add `isInitial` state: `const [isInitial, setIsInitial] = useState(false);`
   - Reset isInitial in the useEffect that syncs on editingInvestment/open change (set to false)
   - Add checkbox UI block AFTER the existing "Disponibilidad inmediata" checkbox (after line 226), only shown when `!editingInvestment` (creation mode only). Use identical HTML pattern as the isLiquid checkbox:
     ```
     Label text: "Inversion inicial (wizard)"
     Helper text: "Marca el aporte inicial como patrimonio existente (no cuenta como gasto mensual)"
     ```
   - In handleSubmit creation branch (line 126-138), spread `...(isInitial && { isInitial: true })` into the data object, same pattern as isLiquid

2. In `hooks/useInvestmentsTracker.ts`:
   - Add `isInitial?: boolean` to the `investmentData` parameter type of `handleAddInvestment` (line 30-38)
   - In the movement object creation (line 47-52), conditionally add isInitial:
     ```typescript
     movements: [{
       id: crypto.randomUUID(),
       date: now,
       type: "aporte",
       amount: investmentData.initialAmount,
       ...(investmentData.isInitial && { isInitial: true }),
     }],
     ```

No schema migration needed — `isInitial` is already an optional field on InvestmentMovement.
  </action>
  <verify>
    <automated>cd D:/Documents/Programing/nextjs/expense-tracker && npx next build 2>&1 | tail -5</automated>
  </verify>
  <done>
    - New "Inversion inicial (wizard)" checkbox visible in investment creation dialog (not in edit mode)
    - Checking it causes the first movement to have isInitial: true
    - Existing isInitial filtering logic in useMoneyTracker, compound-interest, investment-chart, and investment-basis-info works without changes
  </done>
</task>

</tasks>

<verification>
- Build passes with no type errors
- Creating investment with checkbox checked produces movement with `isInitial: true`
- Creating investment without checkbox produces movement without `isInitial`
- Edit mode does NOT show the checkbox
</verification>

<success_criteria>
User can create a new investment and mark it as "initial (wizard)" so it behaves identically to wizard-loaded investments for outflow calculations and projection basis.
</success_criteria>

<output>
After completion, create `.planning/quick/15-add-checkbox-to-mark-investment-as-initi/15-SUMMARY.md`
</output>
