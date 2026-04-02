# Phase 8: Budgets - Context

**Gathered:** 2026-04-02
**Status:** Ready for planning

<domain>
## Phase Boundary

Set monthly spending limits per expense category with visual progress bars and proximity alerts. User defines a cap for any category, sees how much they've spent vs the limit, and gets visual warnings when approaching or exceeding it. Dedicated Presupuestos tab in the main view. No new expense types or categories — this phase adds a budget overlay on top of existing expense data.

</domain>

<decisions>
## Implementation Decisions

### Budget setup UX
- Dedicated "Presupuestos" tab alongside Gastos/Ingresos/Inversiones/Movimientos
- Create budget via "+ Agregar presupuesto" button with dropdown showing only categories without a budget yet
- Edit/remove budget via pencil + trash icons (consistent with Phase 2/3/4 click-to-edit pattern)
- Budgets set in ARS only — USD expenses converted at their stored rate for comparison

### Progress visualization
- Each budget row: category name (with color dot from CATEGORIES constant), full-width progress bar below, "$spent / $limit" and percentage on the right, pencil + trash icons
- Bar color: category's own color by default, turns amber at 80%, red at 100%+
- Summary header at top of tab: "Total presupuestado: $X | Gastado: $Y | Disponible: $Z" with aggregate progress bar
- Tooltip on each budget bar showing expense breakdown (list of individual expenses in that category for the period) — extends Phase 5 tooltip-desglose pattern (CARD-04)
- Budget rows sorted by percentage used, highest first (most critical at top)

### Alert behavior
- Warning threshold: 80% — bar turns amber, warning icon appears
- Exceeded threshold: 100% — bar fills completely in red, shows "Excedido en $X.XXX"
- Alert is visual only: bar color change + warning icon next to percentage
- No real-time warning when adding expenses — budget status only visible in Presupuestos tab

### Monthly scope
- Fixed monthly limits, no rollover of unused budget
- Budget spending follows the active view mode (periodo personalizado or mes calendario from Phase 4)
- Per-month limit history: when a budget limit is changed, past months retain their original limits
- Monthly limit snapshot created on first expense of the month (lazy — no empty snapshots)

### Expense counting
- Cuotas (installment payments) count toward the budget in the month they fall, not when originally created
- Budget hook sums all expenses in the category for the active period — designed to naturally include future recurring expenses (Phase 6) when they generate real expense entries

### Empty states
- No budgets set: friendly empty state with explanation text ("Define limites de gasto por categoria") and prominent "+ Crear primer presupuesto" CTA
- Budgeted category with $0 spent: shows normally with empty bar, "$0 / $limit — 0%"

### Category ordering
- Rows sorted by percentage used, descending (most critical budgets at top)
- Exceeded budgets (>100%) always at the very top

### Claude's Discretion
- Exact progress bar component implementation (custom or library)
- Summary header layout and styling details
- Tooltip positioning and formatting for expense breakdown
- How limit snapshots are stored in localStorage (within monthlyData or separate key)
- Tab icon choice for Presupuestos
- NumberFlow animation on budget amounts (if it fits naturally)
- How the "Agregar presupuesto" dialog/inline form is designed

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `constants/colors.ts`: CATEGORIES constant maps all 12 categories to RGB colors — reuse for budget bar default colors
- `hooks/useExpensesTracker.ts`: Expense filtering by category — reuse logic for summing per-category spending
- `components/ui/tooltip.tsx`: Radix tooltip — extend for budget bar breakdown tooltips
- `components/ui/tabs.tsx`: Tab component — add Presupuestos tab
- `components/ui/badge.tsx`: Status badges — use for warning indicators
- `components/formatted-amount.tsx`: Currency formatting — reuse across budget displays
- `hooks/usePayPeriod.ts`: Provides viewMode and date range — budget spending must respect active period

### Established Patterns
- Click-to-edit with pencil icons (muted + hover:blue) — Phase 2/3/4
- Tooltip with TooltipProvider/Trigger/Content from Radix — Phase 5 desglose pattern
- State flows through useMoneyTracker -> domain hooks -> useLocalStorage -> localStorage
- Category type is a union type in useMoneyTracker.ts with 12 values
- `cn()` utility for conditional class merging
- FormattedAmount component handles currency display

### Integration Points
- `hooks/useMoneyTracker.ts`: New useBudgetTracker hook integrates here, needs access to expenses and pay period
- `components/expense-tracker.tsx`: Add Presupuestos tab to main tab bar
- `hooks/useLocalStorage.ts`: Budget data persisted via localStorage (new key or within monthlyData)
- `hooks/usePayPeriod.ts`: Budget calculations must use the same date range as the active view mode

</code_context>

<specifics>
## Specific Ideas

- Budget bars use category colors by default (each category already has an assigned color) which makes the tab visually distinctive and scannable
- The sort-by-percentage approach puts "fires" at the top — user opens the tab and immediately sees what needs attention
- Snapshot-on-first-expense keeps localStorage lean while preserving historical accuracy when limits change
- Tooltip breakdown on budget bars maintains the "nunca perderse un peso" philosophy — user can always trace any number

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 08-budgets*
*Context gathered: 2026-04-02*
