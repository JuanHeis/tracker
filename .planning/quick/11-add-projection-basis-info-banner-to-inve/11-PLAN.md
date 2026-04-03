---
phase: quick-11
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - components/charts/investment-basis-info.tsx
  - components/charts/investment-chart.tsx
autonomous: true
requirements: [QUICK-11]
must_haves:
  truths:
    - "User sees what currentValue each investment projection starts from"
    - "User sees the annual rate applied to each investment"
    - "User sees whether each investment value was ever updated or is still the original"
    - "Banner only appears when there are visible projections"
  artifacts:
    - path: "components/charts/investment-basis-info.tsx"
      provides: "Projection basis disclosure component"
      min_lines: 30
    - path: "components/charts/investment-chart.tsx"
      provides: "Updated chart with basis info section"
  key_links:
    - from: "components/charts/investment-basis-info.tsx"
      to: "InvestmentProjection + Investment types"
      via: "props receiving projections and investments arrays"
      pattern: "projections.*InvestmentProjection"
---

<objective>
Add a transparent disclosure section below the investment chart showing what data each projection is based on.

Purpose: Users should understand "these projections are estimates based on these specific values" so they can decide if they need to update their investment values.
Output: New InvestmentBasisInfo component rendered below the InvestmentChart area.
</objective>

<execution_context>
@C:/Users/Juan/.claude/get-shit-done/workflows/execute-plan.md
@C:/Users/Juan/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@components/charts/investment-chart.tsx
@lib/projection/types.ts
@hooks/useMoneyTracker.ts (Investment interface lines 63-78)
@components/charts/chart-disclaimer.tsx (existing disclaimer pattern)

<interfaces>
From lib/projection/types.ts:
```typescript
export interface InvestmentProjection {
  investmentId: string;
  investmentName: string;
  type: InvestmentType;
  currencyType: CurrencyType;
  currentValue: number;
  monthlyContribution: number;
  annualRate: number;
  projectedValues: number[];
}
```

From hooks/useMoneyTracker.ts:
```typescript
export interface Investment {
  id: string;
  name: string;
  type: InvestmentType;
  currencyType: CurrencyType;
  status: "Activa" | "Finalizada";
  movements: InvestmentMovement[];
  currentValue: number;
  lastUpdated: string;   // yyyy-MM-dd
  createdAt: string;     // yyyy-MM-dd
  isLiquid?: boolean;
  tna?: number;
}

export interface InvestmentMovement {
  id: string;
  date: string;
  type: "aporte" | "retiro";
  amount: number;
  isInitial?: boolean;
}
```

InvestmentChart already receives both `projections: InvestmentProjection[]` and `investments: Investment[]` as props.
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Create InvestmentBasisInfo component</name>
  <files>components/charts/investment-basis-info.tsx</files>
  <action>
Create a new component `InvestmentBasisInfo` that receives `projections: InvestmentProjection[]` and `investments: Investment[]`.

For each projection, display a compact info row showing:
- Investment name (from projection.investmentName)
- Current value used as basis: format as currency with `$X.toLocaleString("es-AR")`, include currency symbol (ARS or USD based on projection.currencyType)
- Annual rate: format as percentage `(annualRate * 100).toFixed(0)%` — for Plazo Fijo show "TNA" label
- "Value updated" status: match projection.investmentId to the investment in the investments array. Check if the investment has any movements where `!m.isInitial` — if NO non-initial movements exist AND `lastUpdated === createdAt`, show a warning badge "Valor original - nunca actualizado" in amber. Otherwise show "Actualizado: {lastUpdated formatted}"

Layout:
- Wrap in a div with `text-xs text-muted-foreground` styling
- Add a header line: "Bases de proyeccion:" in slightly bolder text (font-medium)
- Each investment as a compact row using flex with gap-x-4 and flex-wrap
- Use Info icon from lucide-react (h-3 w-3) next to header
- For the "nunca actualizado" warning, use amber text color (text-amber-600 dark:text-amber-400) consistent with existing warning patterns in investment-chart.tsx
- If projections array is empty, render nothing (return null)

Do NOT add any interactivity — this is purely informational disclosure.
  </action>
  <verify>npx tsc --noEmit --pretty 2>&1 | head -20</verify>
  <done>Component renders a compact info section for each visible investment projection showing name, basis value, rate, and update status</done>
</task>

<task type="auto">
  <name>Task 2: Wire InvestmentBasisInfo into InvestmentChart</name>
  <files>components/charts/investment-chart.tsx</files>
  <action>
Import `InvestmentBasisInfo` from `./investment-basis-info`.

In the InvestmentChart component, add the InvestmentBasisInfo below the chart (after the ChartContainer/empty-state block, still inside CardContent). Pass:
- `projections={filteredProjections}` (so it respects type visibility toggles)
- `investments={investments}` (already available as prop)

Add a small top margin (mt-4) before the component for spacing.

Only render InvestmentBasisInfo when `filteredProjections.length > 0` (don't show it alongside the "Selecciona al menos un tipo" empty state).
  </action>
  <verify>npx tsc --noEmit --pretty 2>&1 | head -20</verify>
  <done>InvestmentBasisInfo appears below the investment chart, updates when type visibility toggles change, hidden when no projections visible</done>
</task>

</tasks>

<verification>
npx tsc --noEmit --pretty
npm run build 2>&1 | tail -5
</verification>

<success_criteria>
- Below the investment area chart, user sees a compact disclosure of each visible investment's projection basis
- Each entry shows: name, current value (with currency), annual rate %, and whether value was ever updated
- Investments with never-updated values show an amber warning
- Section respects type visibility toggles (only shows info for visible types)
- Section hidden when no projections exist or all types are toggled off
</success_criteria>

<output>
After completion, create `.planning/quick/11-add-projection-basis-info-banner-to-inve/11-SUMMARY.md`
</output>
