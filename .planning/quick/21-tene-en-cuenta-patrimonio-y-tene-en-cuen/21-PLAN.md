---
phase: quick-21
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - hooks/useProjectionEngine.ts
  - components/simulator-dialog.tsx
  - components/expense-tracker.tsx
autonomous: true
requirements: [QUICK-21]
must_haves:
  truths:
    - "Simulator projection includes investment growth over time, not just linear savings"
    - "Simulator 'Sin simulacion' line matches the patrimony chart's base scenario"
    - "Adding simulated expenses still subtracts correctly from the investment-aware projection"
  artifacts:
    - path: "hooks/useProjectionEngine.ts"
      provides: "Exported computeInvestmentGrowth function"
      contains: "export function computeInvestmentGrowth"
    - path: "components/simulator-dialog.tsx"
      provides: "Investment-aware simulator projections"
      contains: "computeInvestmentGrowth"
    - path: "components/expense-tracker.tsx"
      provides: "Passes investments and config to SimulatorDialog"
      contains: "investments={"
  key_links:
    - from: "components/simulator-dialog.tsx"
      to: "hooks/useProjectionEngine.ts"
      via: "import computeInvestmentGrowth"
      pattern: "computeInvestmentGrowth"
    - from: "components/expense-tracker.tsx"
      to: "components/simulator-dialog.tsx"
      via: "investments prop"
      pattern: "investments="
---

<objective>
Make the expense simulator (Simulador de Gastos) include investment growth in its projections, matching the patrimony chart's base scenario behavior.

Purpose: Currently the simulator only uses `projectPatrimonyScenarios` which does linear `patrimony + (netSavings * month)`. The main patrimony chart in `useProjectionEngine` layers investment compound growth on top of this. The simulator should do the same so "Sin simulacion" matches the patrimony chart's base line and the user sees a realistic projection.

Output: Simulator projections that account for investment returns, giving the user an accurate picture of future balance impact from simulated expenses.
</objective>

<execution_context>
@C:/Users/Juan/.claude/get-shit-done/workflows/execute-plan.md
@C:/Users/Juan/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@hooks/useProjectionEngine.ts
@components/simulator-dialog.tsx
@components/expense-tracker.tsx
@lib/projection/simulator.ts
@lib/projection/scenario-engine.ts
@lib/projection/compound-interest.ts

<interfaces>
<!-- From hooks/useProjectionEngine.ts — the private function to export -->
```typescript
// Currently private — needs to be exported
function computeInvestmentGrowth(
  investments: Investment[],
  rateMultiplier: number,
  horizonMonths: number,
  includeContributions: boolean,
  globalUsdRate: number,
  customRates?: CustomAnnualRates,
  useRealRates?: boolean,
  contributionOverrides?: Record<string, number>
): { growth: number[]; projections: InvestmentProjection[] }
```

<!-- From hooks/useMoneyTracker.ts -->
```typescript
export interface Investment {
  id: string; name: string; type: InvestmentType; currencyType: CurrencyType;
  status: "Activa" | "Finalizada"; movements: InvestmentMovement[];
  currentValue: number; lastUpdated: string; createdAt: string;
  isLiquid?: boolean; tna?: number; plazoDias?: number; startDate?: string;
}
```

<!-- From lib/projection/types.ts -->
```typescript
export type CustomAnnualRates = Record<string, number>;
```

<!-- SimulatorDialog current props -->
```typescript
interface SimulatorDialogProps {
  open: boolean; onOpenChange: (open: boolean) => void;
  currentPatrimony: number; currentSalary: number;
  recurringExpenses: RecurringExpense[]; globalUsdRate: number;
}
```
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Export computeInvestmentGrowth and wire investment data to SimulatorDialog</name>
  <files>hooks/useProjectionEngine.ts, components/simulator-dialog.tsx, components/expense-tracker.tsx</files>
  <action>
1. In `hooks/useProjectionEngine.ts`: Change `function computeInvestmentGrowth(` to `export function computeInvestmentGrowth(`. No other changes to this file.

2. In `components/simulator-dialog.tsx`:
   - Add new props to `SimulatorDialogProps`:
     ```
     investments: Investment[]  // from useMoneyTracker (already filtered to active non-liquid by caller)
     customAnnualRates?: CustomAnnualRates
     ```
   - Import `computeInvestmentGrowth` from `@/hooks/useProjectionEngine`
   - Import `Investment` from `@/hooks/useMoneyTracker`
   - Import `CustomAnnualRates` from `@/lib/projection/types`
   - In the `useMemo` block (lines 78-113), after computing `scenarios.base`, add investment growth:
     ```typescript
     // Layer investment growth onto base scenario (rateMultiplier=1.0)
     const { growth: investmentGrowth } = computeInvestmentGrowth(
       investments,
       1.0,
       horizonMonths,
       false, // includeContributions — conservative estimate
       globalUsdRate,
       customAnnualRates,
     );
     const baseProjection = scenarios.base.map((v, m) => v + investmentGrowth[m]);
     ```
     Replace the old `const baseProjection = scenarios.base;` with this.
   - Add `investments` and `customAnnualRates` to the useMemo dependency array.

3. In `components/expense-tracker.tsx`:
   - Pass new props to `<SimulatorDialog>`:
     ```
     investments={monthlyData.investments.filter(i => i.status === "Activa" && !i.isLiquid)}
     customAnnualRates={customAnnualRates}
     ```
     The `customAnnualRates` state already exists in this component (line 214). The investments come from `monthlyData.investments` (same filtering used in `useProjectionEngine` line 174-176).
  </action>
  <verify>
    <automated>cd D:/Documents/Programing/nextjs/expense-tracker && npx tsc --noEmit 2>&1 | head -30</automated>
  </verify>
  <done>
    - TypeScript compiles with no errors
    - SimulatorDialog accepts investments prop and uses computeInvestmentGrowth
    - Simulator "Sin simulacion" line now includes investment compound growth
    - expense-tracker.tsx passes filtered active non-liquid investments and customAnnualRates
  </done>
</task>

</tasks>

<verification>
1. `npx tsc --noEmit` passes
2. Open the app, go to Simulador de Gastos
3. With no simulated expenses added, the chart should NOT appear (existing behavior)
4. Add a simulated expense — the "Sin simulacion" (blue) line should curve upward over 12+ months (due to investment growth), not be a straight line
5. The "Con simulacion" (orange dashed) line should show the expense impact subtracted from the investment-aware projection
6. Compare the simulator's "Sin simulacion" values at month 12 with the patrimony chart's "Base" scenario — they should match closely
</verification>

<success_criteria>
Simulator projections include investment compound growth, making "Sin simulacion" match the main patrimony chart's base scenario. Simulated expenses are correctly subtracted from this investment-aware baseline.
</success_criteria>

<output>
After completion, create `.planning/quick/21-tene-en-cuenta-patrimonio-y-tene-en-cuen/21-SUMMARY.md`
</output>
