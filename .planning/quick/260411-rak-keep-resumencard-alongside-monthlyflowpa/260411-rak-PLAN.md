---
phase: 260411-rak
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - components/expense-tracker.tsx
autonomous: true
requirements: [D-01, D-02, D-03, D-04, D-05]

must_haves:
  truths:
    - "ResumenCard is visible in the sidebar showing ingresos, egresos, and disponible"
    - "MonthlyFlowPanel renders below ResumenCard in the same sidebar column"
    - "Both components are visible together without one replacing the other"
    - "SavingsRateSelector remains inside MonthlyFlowPanel (not duplicated in sidebar)"
  artifacts:
    - path: "components/expense-tracker.tsx"
      provides: "ResumenCard import restored and JSX wired above MonthlyFlowPanel"
      contains: "ResumenCard"
  key_links:
    - from: "components/expense-tracker.tsx"
      to: "components/resumen-card.tsx"
      via: "import { ResumenCard }"
      pattern: "import.*ResumenCard.*resumen-card"
    - from: "components/expense-tracker.tsx"
      to: "components/monthly-flow-panel.tsx"
      via: "import { MonthlyFlowPanel }"
      pattern: "import.*MonthlyFlowPanel.*monthly-flow-panel"
---

<objective>
Restore ResumenCard alongside MonthlyFlowPanel in the sidebar of expense-tracker.tsx.

Purpose: Phase 21 replaced ResumenCard with MonthlyFlowPanel. The user wants both visible — ResumenCard as the quick summary, MonthlyFlowPanel as the detailed flow breakdown below it.

Output: expense-tracker.tsx with both components rendered in the sidebar column.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@components/expense-tracker.tsx
@components/resumen-card.tsx

<interfaces>
<!-- ResumenCard props — all variables already exist in expense-tracker.tsx -->
From components/resumen-card.tsx:
```typescript
interface ResumenCardProps {
  ingresoFijo: number;
  ingresoFijoIsOverride: boolean;
  otrosIngresos: number;
  aguinaldoAmount: number | null;
  aguinaldoInfo: { bestSalary: number; isOverride: boolean } | null;
  totalGastos: number;
  aportesInversiones: number;
  porPagarArs: number;
  porPagarUsd: number;
  disponible: number;
  isPendiente: boolean;
  payDay: number;
  aguinaldoPreview: { estimatedAmount: number; bestSalary: number; targetMonth: string } | null;
  onSetAguinaldoOverride: (monthKey: string, amount: number) => void;
  onClearAguinaldoOverride: (monthKey: string) => void;
  selectedMonth: string;
}
```

Variable mappings (all exist in current expense-tracker.tsx):
- ingresoFijo={currentMonthSalary.amount}            (line ~130 area, from useMoneyTracker)
- ingresoFijoIsOverride={currentMonthSalary.isOverride}
- otrosIngresos={otrosIngresosArs}                    (line 303)
- aguinaldoAmount={aguinaldoData?.amount ?? null}     (line 234)
- aguinaldoInfo from aguinaldoData                    (line 234)
- totalGastos={totalExpenses}                         (line 130)
- aportesInversiones={dualBalancesForCards.arsInvestmentContributions}
- porPagarArs={porPagarArs}                           (line 131)
- porPagarUsd={porPagarUsd}                           (line 132)
- disponible={availableMoney}                         (line 133)
- isPendiente={isPendiente}                           (line 312)
- payDay={incomeConfig.payDay}
- aguinaldoPreview={aguinaldoPreviewData}             (line 237)
- onSetAguinaldoOverride={setAguinaldoOverride}       (line 179)
- onClearAguinaldoOverride={clearAguinaldoOverride}   (line 180)
- selectedMonth={selectedMonth}
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Restore ResumenCard import and JSX above MonthlyFlowPanel</name>
  <files>components/expense-tracker.tsx</files>
  <action>
Two changes to components/expense-tracker.tsx:

1. **Add import** (per D-01): After the existing MonthlyFlowPanel import on line 52, add:
   ```typescript
   import { ResumenCard } from "@/components/resumen-card";
   ```

2. **Add ResumenCard JSX** (per D-01, D-02): In the sidebar `<div className="flex flex-col gap-4">` (around line 731), add ResumenCard ABOVE the existing MonthlyFlowPanel. The JSX block to insert before `<MonthlyFlowPanel`:
   ```tsx
   <ResumenCard
     ingresoFijo={currentMonthSalary.amount}
     ingresoFijoIsOverride={currentMonthSalary.isOverride}
     otrosIngresos={otrosIngresosArs}
     aguinaldoAmount={aguinaldoData?.amount ?? null}
     aguinaldoInfo={
       aguinaldoData
         ? { bestSalary: aguinaldoData.bestSalary, isOverride: aguinaldoData.isOverride }
         : null
     }
     totalGastos={totalExpenses}
     aportesInversiones={dualBalancesForCards.arsInvestmentContributions}
     porPagarArs={porPagarArs}
     porPagarUsd={porPagarUsd}
     disponible={availableMoney}
     isPendiente={isPendiente}
     payDay={incomeConfig.payDay}
     aguinaldoPreview={aguinaldoPreviewData}
     onSetAguinaldoOverride={setAguinaldoOverride}
     onClearAguinaldoOverride={clearAguinaldoOverride}
     selectedMonth={selectedMonth}
   />
   ```

Per D-03: Do NOT touch SavingsRateSelector — it stays inside MonthlyFlowPanel.
Per D-05: Do NOT modify resumen-card.tsx or monthly-flow-panel.tsx internals.

The sidebar column will now render: ResumenCard -> MonthlyFlowPanel -> PatrimonioCard -> ExchangeSummary.
The gap-4 on the parent flex-col provides natural spacing between them (Claude's discretion: no extra separator needed, gap-4 = 1rem is sufficient visual separation).
  </action>
  <verify>
    <automated>cd "D:/Documents/Programing/nextjs/expense-tracker" && npx next build 2>&1 | tail -5</automated>
  </verify>
  <done>
    - ResumenCard is imported in expense-tracker.tsx
    - ResumenCard JSX renders above MonthlyFlowPanel in the sidebar flex column
    - MonthlyFlowPanel remains in place with all its existing props
    - Build succeeds with no TypeScript errors
    - No changes to resumen-card.tsx or monthly-flow-panel.tsx
  </done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

No new trust boundaries. This is a pure layout/wiring change restoring existing component usage.

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-rak-01 | N/A | N/A | accept | No security surface change — restoring previously-removed JSX with same props from same data sources |
</threat_model>

<verification>
- `npx next build` completes without errors
- Visual: sidebar shows ResumenCard above MonthlyFlowPanel (both visible)
- ResumenCard displays ingresos, egresos, disponible as before Phase 21
- MonthlyFlowPanel displays waterfall chart, savings selector, projection as implemented in Phase 21
</verification>

<success_criteria>
- ResumenCard and MonthlyFlowPanel both render in the sidebar
- ResumenCard appears above MonthlyFlowPanel
- No TypeScript or build errors
- No changes to component internals
</success_criteria>

<output>
After completion, create `.planning/quick/260411-rak-keep-resumencard-alongside-monthlyflowpa/260411-rak-SUMMARY.md`
</output>
