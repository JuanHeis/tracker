# Phase 17: Simulador de Gastos Futuros - Context

**Gathered:** 2026-04-05
**Status:** Ready for planning

<domain>
## Phase Boundary

Simulate future expenses (one-time and installment-based) to see their impact on projected finances. Users can define hypothetical expenses, stack multiple, and visualize the before/after effect on their patrimony projection. The simulator is ephemeral (no persistence) and self-contained inside a dialog. It does NOT modify real data — it's a "what-if" tool.

</domain>

<decisions>
## Implementation Decisions

### Simulator entry point
- Button added to the existing floating taskbar (alongside settings)
- Opens a Dialog/modal (same pattern as investment-dialog, loan-dialog)
- Impact visualization is self-contained inside the dialog — no overlay on the patrimony chart
- Ephemeral: closing the dialog discards all simulated data

### Expense definition
- Two types: gasto puntual (1 cuota) and gasto en cuotas (N cuotas)
- Form fields: nombre, monto total, cantidad de cuotas (1 = puntual), currency (ARS/USD)
- For installments: user enters total amount, simulator calculates per-cuota amount
- Can add multiple expenses in one session via "Agregar otro gasto" button
- Each expense shows in an editable list with individual delete buttons
- No recurring expense simulation (that already exists as a real feature)

### Impact visualization
- Mini chart inside the dialog showing two lines: "Sin gastos simulados" vs "Con gastos simulados"
- Before line = current base projection (using real income, recurring expenses, balance)
- After line = same projection minus simulated expenses applied to relevant months
- Chart updates in real-time as expenses are added/modified/removed
- Key summary numbers displayed alongside the chart: total cost, monthly max impact, balance at worst month
- Base scenario only (no optimista/pesimista — keeps the chart clean)
- Horizon selector reuses same options as patrimony chart (3, 6, 12, 24 months)

### Currency handling
- Each simulated expense can be ARS or USD (dual currency, like real expenses)
- USD expenses convert at globalUsdRate for projection calculation

### Separation from real data
- Simulator does NOT register real expenses — keep separate from actual CRUD
- No "convert to real expense" button — user goes to normal form to register
- No localStorage changes — ephemeral state lives in React state only (respects INFRA-03)

### Claude's Discretion
- Chart styling (colors, line styles for before/after)
- Exact layout of form vs chart inside the dialog
- Summary number placement and formatting
- How to handle the case where simulated expenses exceed available balance (warning? red zone?)
- Debounce strategy for real-time chart updates during typing

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `lib/projection/scenario-engine.ts`: projectPatrimonyScenarios — can extract base scenario logic
- `hooks/useProjectionEngine.ts`: orchestrates projection with real financial data (income, recurring, investments)
- `components/charts/chart-controls.tsx`: horizon selector (3/6/12/24 months) — reusable pattern
- `components/charts/patrimony-chart.tsx`: Recharts ComposedChart with dual lines pattern
- `components/ui/dialog.tsx`: Radix Dialog component for the modal
- `components/currency-input.tsx`: CurrencyInput with es-AR locale formatting
- `constants/investments.ts`: CurrencyType enum (ARS/USD)

### Established Patterns
- 'use client' + useHydration + ChartContainer for all chart components (Phase 14)
- Pure TypeScript projection functions with zero React deps (Phase 15)
- Dialog-based forms for entity creation (investment-dialog, loan-dialog, recurring-dialog)
- Floating taskbar with settings panel (quick-9, quick-19)

### Integration Points
- Reads from useMoneyTracker: current balance, income, recurring expenses, globalUsdRate
- Does NOT write to localStorage — all state is local React state
- Taskbar component: add simulator button alongside existing settings

</code_context>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 17-gamification-engine*
*Context gathered: 2026-04-05*
