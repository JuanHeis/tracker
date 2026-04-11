# Phase 21: Monthly Flow Panel Assembly - Context

**Gathered:** 2026-04-11
**Status:** Ready for planning

<domain>
## Phase Boundary

User has a complete Monthly Flow panel that combines waterfall chart, savings rate selector, mini-projection, and inline simulation into a single cohesive view. The panel replaces the existing ResumenCard in the main layout. MonthlyFlowPanel is props-only (no internal hooks) for placement flexibility.

</domain>

<decisions>
## Implementation Decisions

### Placement in App
- **D-01:** MonthlyFlowPanel REPLACES ResumenCard in the main view layout. It is NOT a new tab — it occupies the space where ResumenCard currently lives in expense-tracker.tsx. ResumenCard is removed from the layout.
- **D-02:** SavingsRateSelector moves FROM the sidebar (currently after PatrimonioCard & ExchangeSummary) INTO the MonthlyFlowPanel. Remove it from the sidebar to avoid duplication.

### Panel Layout
- **D-03:** Vertical stack layout, top to bottom:
  1. WaterfallChart (existing Phase 20 component)
  2. SavingsRateSelector (moved from sidebar)
  3. Mini-projection chart (new, compact LineChart)
  4. Inline simulation input (new, simple field)
- **D-04:** Each section is visually separated (consistent with existing card styling in the app).

### Mini-Projection
- **D-05:** Compact LineChart (~150px height) showing 3 scenario lines (pesimista/base/optimista) projected to 12 months. Similar to SimulatorDialog's mini chart pattern.
- **D-06:** No elaborate axes — just labels showing final estimated value per scenario. Title: "Patrimonio estimado (12 meses)".
- **D-07:** When savings rate changes, the mini-projection updates in real time (same useMemo dependency pattern as other charts).

### Inline Simulation
- **D-08:** Single numeric input field: "Gasto hipotetico mensual: $[____]" in ARS. No name, no installments — this is for quick "what-if" scenarios. The full SimulatorDialog already exists for detailed simulations.
- **D-09:** When user types an amount, both the waterfall chart and mini-projection update in real time by subtracting that amount from the monthly flow.
- **D-10:** Show impact summary: "Libre baja de $X a $Y" (or similar brief text showing the delta).
- **D-11:** Ephemeral — the simulated amount resets when navigating away or refreshing. Uses local useState, same pattern as SimulatorDialog.

### Architecture (from ROADMAP — locked)
- **D-12:** MonthlyFlowPanel is a props-only component — no internal hooks (useMoneyTracker, useSavingsRate, etc.). All data passed via props from expense-tracker.tsx which is the orchestrator.
- **D-13:** expense-tracker.tsx calls useMonthlyFlowData, useSavingsRate, useProjectionEngine and passes results as props to MonthlyFlowPanel.

### Claude's Discretion
- Exact section spacing and visual separation between the 4 sections
- How to handle the panel when salary is 0 or no data exists for the month
- Whether to add a small header/title to the panel
- Mini-projection chart styling (line colors, opacity for scenarios)
- Whether the impact text shows percentage change or only absolute values

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Components to Compose (Phase 18-20 outputs)
- `components/charts/waterfall-chart.tsx` — WaterfallChart component (props: data: WaterfallBar[])
- `components/charts/waterfall-tooltip.tsx` — WaterfallTooltipContent for hover
- `components/savings-rate-selector.tsx` — SavingsRateSelector (props: config, onConfigChange, estimate, currentSalary, averageNetFlow)
- `hooks/useMonthlyFlowData.ts` — Returns WaterfallBar[] from computeWaterfallData
- `hooks/useSavingsRate.ts` — Returns { config, setConfig, estimate }
- `lib/projection/waterfall.ts` — computeWaterfallData, WaterfallBar, WaterfallInput types

### Projection Engine (for mini-projection)
- `hooks/useProjectionEngine.ts` — Returns projection scenarios for patrimony chart
- `lib/projection/scenario-engine.ts` — projectPatrimonyScenarios() with 3 scenario multipliers
- `components/simulator-dialog.tsx` — Reference for mini chart pattern and ephemeral state

### Integration Points (modify)
- `components/expense-tracker.tsx` — Main orchestrator: remove ResumenCard, remove SavingsRateSelector from sidebar, add MonthlyFlowPanel in its place, wire all props
- `components/resumen-card.tsx` — Currently rendered in main layout, will be replaced

### Requirements
- `.planning/REQUIREMENTS.md` §v1.3 — MPROJ-01, MPROJ-02, ISIM-01, ISIM-02

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `WaterfallChart`: Props-only component accepting `data: WaterfallBar[]` — ready to compose
- `SavingsRateSelector`: Props-only component with 5 props — ready to relocate
- `useProjectionEngine`: Returns scenario projections consumable by mini-chart
- `SimulatorDialog`: Reference pattern for ephemeral state + mini Recharts LineChart
- `ChartContainer` (shadcn/ui): Wrapper for all Recharts charts

### Established Patterns
- Props-only component pattern: WaterfallChart, SavingsRateSelector already follow this
- expense-tracker.tsx as single orchestrator: all hooks called at top level, data flows down
- Radix UI Tabs for tab system (but NOT used here — panel replaces ResumenCard directly)
- Local useState for ephemeral simulation state (SimulatorDialog pattern)

### Integration Points
- expense-tracker.tsx line ~742: SavingsRateSelector currently in sidebar — remove from here
- expense-tracker.tsx: ResumenCard currently in main content area — replace with MonthlyFlowPanel
- Factory reset (WIZ-10): savingsRateConfig localStorage key must still be cleared on reset

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

*Phase: 21-monthly-flow-panel-assembly*
*Context gathered: 2026-04-11*
