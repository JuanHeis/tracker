---
phase: quick-13
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - lib/projection/compound-interest.ts
  - lib/projection/types.ts
  - hooks/useProjectionEngine.ts
  - components/charts-container.tsx
  - components/charts/investment-chart.tsx
  - components/charts/investment-basis-info.tsx
autonomous: true
requirements: [QUICK-13]
must_haves:
  truths:
    - "When 'Con aportes' is active, each visible investment shows an editable monthly contribution input"
    - "Input defaults to the investment's current auto-detected contribution (last non-initial aporte amount)"
    - "Changing an input value immediately recalculates and redraws the projection curve"
    - "When 'Sin aportes' is active, contribution inputs are hidden"
  artifacts:
    - path: "lib/projection/compound-interest.ts"
      provides: "projectInvestment accepts optional contribution override"
    - path: "components/charts/investment-basis-info.tsx"
      provides: "Editable contribution inputs per investment"
  key_links:
    - from: "components/charts/investment-basis-info.tsx"
      to: "components/charts-container.tsx"
      via: "onContributionOverrideChange callback"
      pattern: "onContributionOverrideChange"
    - from: "components/charts-container.tsx"
      to: "hooks/useProjectionEngine.ts"
      via: "contributionOverrides in options"
      pattern: "contributionOverrides"
    - from: "hooks/useProjectionEngine.ts"
      to: "lib/projection/compound-interest.ts"
      via: "contributionOverrides passed to projectInvestment"
      pattern: "contributionOverrides"
---

<objective>
Add per-investment monthly contribution override inputs in the investment chart area so
users can simulate different contribution amounts (e.g., $50k/month into FCI, $20k into Crypto).

Purpose: Users currently get all-or-nothing contribution projection. This adds fine-grained control.
Output: Editable inline inputs in the basis-info section, reactive projection recalculation.
</objective>

<execution_context>
@C:/Users/Juan/.claude/get-shit-done/workflows/execute-plan.md
@C:/Users/Juan/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@lib/projection/compound-interest.ts (projectInvestment — accepts monthlyRate, horizonMonths, includeContributions)
@lib/projection/types.ts (InvestmentProjection type — has monthlyContribution field)
@hooks/useProjectionEngine.ts (computeInvestmentGrowth calls projectInvestment per investment)
@components/charts-container.tsx (state owner — includeContributions, passes to engine + chart)
@components/charts/investment-chart.tsx (renders chart + toggles, passes to InvestmentBasisInfo)
@components/charts/investment-basis-info.tsx (shows per-investment projection basis details)
</context>

<tasks>

<task type="auto">
  <name>Task 1: Thread contribution overrides through projection engine</name>
  <files>
    lib/projection/compound-interest.ts,
    hooks/useProjectionEngine.ts,
    components/charts-container.tsx
  </files>
  <action>
1. In `lib/projection/compound-interest.ts`, add an optional `contributionOverride?: number` parameter to `projectInvestment()` (after `includeContributions`). When provided AND `includeContributions` is true, use `contributionOverride` instead of auto-detecting from movements. Keep existing auto-detect as fallback when override is undefined.

Current logic (line 43-47):
```
let monthlyContribution = 0;
if (includeContributions) {
  const lastAporte = investment.movements
    .filter((m) => m.type === "aporte" && !m.isInitial)
    .at(-1);
  monthlyContribution = lastAporte?.amount ?? 0;
}
```
Change to:
```
let monthlyContribution = 0;
if (includeContributions) {
  if (contributionOverride !== undefined) {
    monthlyContribution = contributionOverride;
  } else {
    const lastAporte = investment.movements
      .filter((m) => m.type === "aporte" && !m.isInitial)
      .at(-1);
    monthlyContribution = lastAporte?.amount ?? 0;
  }
}
```

2. In `hooks/useProjectionEngine.ts`:
   - Add `contributionOverrides?: Record<string, number>` to the options parameter type
   - Extract it in the hook body alongside other options
   - In `computeInvestmentGrowth`, add `contributionOverrides?: Record<string, number>` parameter
   - When calling `projectInvestment` inside the `.map()` (line 64), pass `contributionOverrides?.[inv.id]` as the new `contributionOverride` parameter
   - Thread `contributionOverrides` from the hook options through all 3 calls to `computeInvestmentGrowth` (base, optimista, pesimista)
   - Add `contributionOverrides` to the useMemo dependency array

3. In `components/charts-container.tsx`:
   - Add state: `const [contributionOverrides, setContributionOverrides] = useState<Record<string, number>>({});`
   - Pass `contributionOverrides` in the options object to `useProjectionEngine`
   - Pass `contributionOverrides` and `onContributionOverrideChange` callback to `InvestmentChart`
   - The callback signature: `(investmentId: string, value: number) => void` — updates the Record
   - Reset `contributionOverrides` to `{}` when `includeContributions` is toggled OFF (clear overrides when disabling contributions)
  </action>
  <verify>
    TypeScript compiles: npx tsc --noEmit 2>&1 | head -30
  </verify>
  <done>
    contributionOverrides flows from ChartsContainer state through useProjectionEngine to projectInvestment.
    Overrides take precedence over auto-detected aporte amounts when present.
    TypeScript compiles with no errors.
  </done>
</task>

<task type="auto">
  <name>Task 2: Add editable contribution inputs in investment basis info</name>
  <files>
    components/charts/investment-chart.tsx,
    components/charts/investment-basis-info.tsx
  </files>
  <action>
1. In `components/charts/investment-chart.tsx`:
   - Add to `InvestmentChartProps`: `contributionOverrides: Record<string, number>` and `onContributionOverrideChange: (investmentId: string, value: number) => void`
   - Pass both new props through to `InvestmentBasisInfo` along with `includeContributions`

2. In `components/charts/investment-basis-info.tsx`:
   - Add to props: `includeContributions: boolean`, `contributionOverrides: Record<string, number>`, `onContributionOverrideChange: (investmentId: string, value: number) => void`
   - When `includeContributions` is true, show an editable input for each investment's monthly contribution
   - Layout: Add a new row/column to each investment line showing "Aporte mensual:" with an inline number input
   - The input value: use `contributionOverrides[p.investmentId]` if defined, otherwise use `p.monthlyContribution` (from the projection which has the auto-detected value)
   - On input change: parse to number, call `onContributionOverrideChange(p.investmentId, parsedValue)`
   - Input styling: use compact inline style matching the existing text-xs aesthetic. Use `<Input>` from `@/components/ui/input` with classes `h-6 w-24 text-xs px-1 inline` or similar compact sizing. Show the currency symbol prefix matching the investment's currencyType.
   - When `includeContributions` is false, do NOT show the contribution inputs at all
   - Handle edge case: if user clears the input (empty string), treat as 0
  </action>
  <verify>
    npx tsc --noEmit 2>&1 | head -30 && echo "--- Build check ---" && npx next build 2>&1 | tail -5
  </verify>
  <done>
    Each visible investment in the basis info section shows an editable monthly contribution input when "Con aportes" is active.
    Inputs default to the auto-detected contribution amount.
    Changing a value triggers projection recalculation via the callback chain.
    Inputs hidden when "Sin aportes" is active.
    Build succeeds with no errors.
  </done>
</task>

</tasks>

<verification>
1. `npx tsc --noEmit` — no type errors
2. `npx next build` — build succeeds
3. Manual flow: toggle "Con aportes" — contribution inputs appear per investment in basis info
4. Change a contribution value — chart curve updates immediately
5. Toggle "Sin aportes" — inputs disappear, projections revert to no-contribution mode
</verification>

<success_criteria>
- Per-investment contribution inputs visible when "Con aportes" active
- Default values match auto-detected last aporte amounts
- Changing values recalculates projection curves in real-time
- Inputs hidden when contributions disabled
- No TypeScript errors, build passes
</success_criteria>

<output>
After completion, create `.planning/quick/13-add-per-investment-monthly-contribution-/13-SUMMARY.md`
</output>
