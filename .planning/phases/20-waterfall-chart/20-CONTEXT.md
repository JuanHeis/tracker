# Phase 20: Waterfall Chart - Context

**Gathered:** 2026-04-11
**Status:** Ready for planning

<domain>
## Phase Boundary

User sees a visual breakdown of how their monthly income flows through expense categories to arrive at free cash. Delivers: computeWaterfallData() pure function, useMonthlyFlowData hook, and WaterfallChart component using Recharts range-value pattern.

</domain>

<decisions>
## Implementation Decisions

### Visual Design
- **D-01:** Vertical bar orientation — classic waterfall chart with bars left-to-right: Ingresos, Gastos Fijos, Gastos Variables, Inversiones, Libre. Consistent with existing Recharts vertical charts.
- **D-02:** Semantic financial color scheme: green for ingresos, red/orange tones for gastos (fijos vs variables distinguished by shade), blue for inversiones, emerald/light-green for libre. Aligns with CARD-05 convention (verde ingresos, rojo egresos, azul inversiones).
- **D-03:** No connectors between bars — clean floating bars with [start, end] range-value pattern. The vertical gap between bars implicitly communicates the "waterfall" flow.

### Subcategory Breakdown
- **D-04:** Tooltip on hover shows subcategory detail per segment. Reuses existing Recharts tooltip pattern from PatrimonyChart/InvestmentChart.
- **D-05:** Top 5 subcategories by amount displayed in tooltip, remaining grouped as "Otros ($X)". Keeps tooltips legible regardless of expense count.

### Interactivity
- **D-06:** Tooltips on hover (primary interaction) plus entry animation — bars grow from 0 to final value when chart loads. No click-to-expand, no permanent labels.

### Month Selection
- **D-07:** Waterfall uses the existing global selectedMonth/selectedYear from expense-tracker.tsx. No additional month selector UI. When the user changes month via the existing selector, the waterfall updates.

### Data Logic (from ROADMAP — locked)
- **D-08:** Fixed expenses classified by presence of `recurringId` on the expense object. All other expenses are variable.
- **D-09:** USD expenses converted to ARS using each transaction's own `expense.usdRate` (not the global rate).
- **D-10:** Exclude `isInitial` investment movements from waterfall aggregation (these are wizard setup movements, not real monthly flow).
- **D-11:** Recharts waterfall uses `[start, end]` range-value pattern per bar (NOT transparent-floor stacking hack).

### Claude's Discretion
- Exact color hex values for each segment (within the semantic scheme)
- Tooltip component styling and formatting
- Animation duration and easing
- How to handle months with zero income or zero expenses (empty segments)
- Bar width and spacing

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Chart Patterns (follow existing)
- `components/charts-container.tsx` — Orchestrator that wires chart sub-components, pattern to follow for adding WaterfallChart
- `components/charts/patrimony-chart.tsx` — ComposedChart + ChartContainer pattern, tooltip implementation reference
- `components/charts/expenses-by-month.tsx` — Monthly expense aggregation and BarChart pattern

### Data Sources (read for aggregation logic)
- `hooks/useMoneyTracker.ts` — Central hook with MonthlyData, calculateDualBalances(), expense arrays
- `hooks/useRecurringExpenses.ts` — recurringId field, RecurringExpense template, generateMissingInstances()
- `hooks/useCurrencyEngine.ts` — globalUsdRate, USD conversion patterns

### Projection Layer (Phase 18-19 outputs)
- `lib/projection/savings-rate.ts` — computeSavingsEstimate() pure function pattern to follow
- `lib/projection/net-flow.ts` — calculateMonthlyNetFlow() for reference on month-over-month aggregation

### Requirements
- `.planning/REQUIREMENTS.md` §v1.3 Waterfall — FLOW-01 through FLOW-05

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `ChartContainer` (shadcn/ui): Wrapper used by all existing charts — reuse for WaterfallChart
- `useHydration` hook: SSR guard pattern used by all chart components
- Recharts `BarChart` with `Bar` component: Already used in expenses-by-month.tsx
- `FormattedAmount` component: For consistent currency formatting in tooltips
- `Intl.NumberFormat` with "es-AR" locale: Used in SavingsRateSelector for ARS formatting

### Established Patterns
- "use client" + useHydration + ChartContainer: Mandatory chart rendering pattern (INFRA-02)
- Pure computation function + hook + component: Three-layer pattern (see savings-rate.ts → useSavingsRate → SavingsRateSelector)
- Props-driven components: MonthlyFlowPanel will be props-only (Phase 21), so WaterfallChart should also receive data as props

### Integration Points
- `expense-tracker.tsx`: Passes selectedMonth, selectedYear, and all financial data to child components
- `charts-container.tsx`: Will need to include WaterfallChart or it will be consumed by MonthlyFlowPanel in Phase 21
- Phase 21 consumes WaterfallChart as a child of MonthlyFlowPanel — component must accept data via props

</code_context>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches within the decided constraints.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 20-waterfall-chart*
*Context gathered: 2026-04-11*
