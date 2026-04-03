---
phase: quick-10
plan: 10
type: execute
wave: 1
depends_on: []
files_modified:
  - components/charts-container.tsx
  - components/charts/investment-chart.tsx
autonomous: true
requirements: []
must_haves:
  truths:
    - "User can toggle contributions on/off and see projections update"
    - "User sees a warning when no investments have contributions configured"
    - "User can show/hide individual investment types in the chart"
  artifacts:
    - path: "components/charts/investment-chart.tsx"
      provides: "Contributions toggle, no-contributions warning, type visibility toggles"
    - path: "components/charts-container.tsx"
      provides: "includeContributions state passed to projection engine"
  key_links:
    - from: "components/charts-container.tsx"
      to: "hooks/useProjectionEngine.ts"
      via: "includeContributions option"
      pattern: "includeContributions"
---

<objective>
Enhance InvestmentChart with three features: (1) toggle to include/exclude monthly contributions in projections, (2) warning when no investments have contributions, (3) per-type visibility toggles.

Purpose: Give the user control over what the investment projection chart displays.
Output: Updated investment-chart.tsx and charts-container.tsx.
</objective>

<execution_context>
@C:/Users/Juan/.claude/get-shit-done/workflows/execute-plan.md
@C:/Users/Juan/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@components/charts/investment-chart.tsx
@components/charts-container.tsx
@hooks/useProjectionEngine.ts
@lib/projection/types.ts
@hooks/useMoneyTracker.ts (Investment, InvestmentMovement interfaces)
@components/charts/chart-controls.tsx (for UI pattern reference)

<interfaces>
From hooks/useProjectionEngine.ts:
- useProjectionEngine already accepts `options.includeContributions?: boolean` (defaults to false)
- When true, it uses each investment's last non-initial "aporte" movement amount as monthlyContribution

From lib/projection/types.ts:
```typescript
export interface InvestmentProjection {
  investmentId: string;
  investmentName: string;
  type: InvestmentType;
  currencyType: CurrencyType;
  currentValue: number;
  monthlyContribution: number; // 0 if aportes futuros disabled
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
  movements: InvestmentMovement[];
  status: "Activa" | "Finalizada";
  currentValue: number;
  isLiquid?: boolean;
  // ...
}
export interface InvestmentMovement {
  type: "aporte" | "retiro";
  amount: number;
  isInitial?: boolean;
}
```
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Add includeContributions state and pass to projection engine</name>
  <files>components/charts-container.tsx</files>
  <action>
In ChartsContainer:

1. Add state: `const [includeContributions, setIncludeContributions] = useState(false);`

2. Pass to useProjectionEngine options: `{ horizonMonths, includeContributions }`

3. Pass new props to InvestmentChart:
   - `includeContributions={includeContributions}`
   - `onToggleContributions={() => setIncludeContributions(prev => !prev)}`
   - `investments={monthlyData.investments.filter(i => i.status === "Activa" && !i.isLiquid)}` (for contribution warning check)

Keep everything else unchanged.
  </action>
  <verify>TypeScript compiles: npx tsc --noEmit --pretty 2>&1 | head -20</verify>
  <done>ChartsContainer passes includeContributions to engine and new props to InvestmentChart</done>
</task>

<task type="auto">
  <name>Task 2: Add contributions toggle, no-contributions warning, and type visibility controls to InvestmentChart</name>
  <files>components/charts/investment-chart.tsx</files>
  <action>
Update InvestmentChartProps to accept:
```typescript
interface InvestmentChartProps {
  projections: InvestmentProjection[];
  monthLabels: string[];
  globalUsdRate: number;
  includeContributions: boolean;
  onToggleContributions: () => void;
  investments: Investment[];  // For checking if contributions exist
}
```

Import `Investment` from `@/hooks/useMoneyTracker`, `Button` from `@/components/ui/button`, and `useState` from React. Also import `AlertTriangle` from `lucide-react` for the warning icon.

**Feature 1 — Contributions toggle:**
In the CardHeader, next to the CardTitle, add a flex row with a Button (size="sm"):
- Label: "Con aportes" when includeContributions is true (variant="default"), "Sin aportes" when false (variant="outline")
- onClick: onToggleContributions
- Place it right-aligned in the header using `flex items-center justify-between`

**Feature 2 — No-contributions warning:**
Determine if ANY active investment has at least one non-initial "aporte" movement:
```typescript
const hasAnyContributions = investments.some(inv =>
  inv.movements.some(m => m.type === "aporte" && !m.isInitial)
);
```
When `includeContributions` is true AND `!hasAnyContributions`, show a warning div below the header:
```tsx
<div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 rounded-md px-3 py-2 mx-0">
  <AlertTriangle className="h-4 w-4 shrink-0" />
  <span>Ninguna inversion tiene aportes mensuales configurados. Agrega movimientos de tipo "aporte" para ver el efecto.</span>
</div>
```

**Feature 3 — Per-type visibility toggles:**
Add local state for visible types:
```typescript
const uniqueTypes = Array.from(new Set(projections.map(p => p.type)));
const [visibleTypes, setVisibleTypes] = useState<Record<string, boolean>>({});
```
Initialize missing types as `true` (use a useMemo or inline default — when a key is missing from visibleTypes, treat as visible).

Below the contributions toggle row (still inside CardHeader area or just below it), render a row of small toggle Buttons for each uniqueType:
- variant="default" if visible (or not in visibleTypes), variant="outline" if hidden
- onClick toggles that type
- Use the chart color dot next to name: `<span className="inline-block w-2 h-2 rounded-full mr-1" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />`

Filter projections before passing to buildInvestmentChartData:
```typescript
const filteredProjections = projections.filter(p => visibleTypes[p.type] !== false);
```
Use filteredProjections for both buildInvestmentChartData and the Area rendering. If filteredProjections is empty but projections is not, show a subtle message "Selecciona al menos un tipo de inversion" instead of the chart.

Keep the existing empty-state (projections.length === 0) check BEFORE the new logic. The type visibility toggles only appear when there are projections.
  </action>
  <verify>npx tsc --noEmit --pretty 2>&1 | head -20 ; echo "---" ; npx next build 2>&1 | tail -5</verify>
  <done>
- Contributions toggle button visible in InvestmentChart header, toggling updates projections
- Warning appears when contributions enabled but no investments have aporte movements
- Per-type toggle buttons visible, clicking hides/shows that type's area in the chart
  </done>
</task>

</tasks>

<verification>
1. `npx tsc --noEmit` passes with no errors
2. Visual: InvestmentChart shows toggle button, type buttons, and chart renders correctly
3. Toggling "Con aportes" changes projection values (if contributions exist)
4. Warning appears when no contributions exist and toggle is on
5. Hiding a type removes its area from the chart
</verification>

<success_criteria>
- Contributions toggle works and updates projection engine output
- Warning message displays correctly when no contributions configured
- Individual investment types can be shown/hidden independently
- All existing chart functionality preserved
</success_criteria>

<output>
After completion, create `.planning/quick/10-investment-chart-toggle-contributions-bu/10-SUMMARY.md`
</output>
