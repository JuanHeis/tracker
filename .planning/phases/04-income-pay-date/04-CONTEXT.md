# Phase 4: Income & Pay Date - Context

**Gathered:** 2026-04-02
**Status:** Ready for planning

<domain>
## Phase Boundary

Rename income terminology ("Salario" -> "Ingreso fijo", "Ingresos extras" -> "Otros ingresos"), add configurable pay date with dual calendar views (custom period vs calendar month), implement salary history with effective dates and forward-only increases, and auto-calculate aguinaldo for dependiente employees in June/December. The monthly card redesign is Phase 5 — this phase focuses on the income data model, pay timing, and aguinaldo logic.

</domain>

<decisions>
## Implementation Decisions

### Employment configuration
- Config lives inside the salary card (no separate settings page)
- Employment type (dependiente/independiente) and pay date (day of month) always visible in the card with pencil icon to edit
- Pay date field: number input validated 1-31; if month doesn't have that day, use last day of month
- Defaults for first-time users: dependiente, day 1 (no onboarding wizard)
- Employment type and pay date are global settings (not per-month)

### Salary history & increases
- Salary with effective date model: user enters amount + effective date, system auto-applies to all months from that date forward until the next raise
- Per-month override allowed: if actual deposit differs, user can override just that month without affecting future months
- Timeline visible in salary card: small list of salary changes ("Desde Ene 2026: $500.000" / "Desde Mar 2026: $600.000") with click to edit
- Editing a past salary entry retroactively updates all months between that entry and the next raise (recalculates)
- Current per-month `salaries` data model needs migration to effective-date model with optional per-month overrides

### Pay period views
- Segmented control in header near month selector: [Periodo | Mes]
- Custom period view (default): combines all transactions from pay date of this month to day before pay date of next month as one period
- Calendar month view: traditional monthly view with "Pendiente de cobro" indicator before pay date
- Default view: custom period
- In custom period view, expenses and incomes from both calendar months are combined into one view

### Pendiente de cobro
- In calendar month view only (before pay date in the current month)
- Both: amber banner at top of salary card ("Pendiente de cobro — Cobras el dia 10") AND dimmed salary amount
- Banner and dimming disappear after pay date passes

### Aguinaldo
- Only for dependiente users; hidden entirely for independiente
- Auto-calculated: 50% of best salary in the semester (Jan-Jun for June, Jul-Dec for December)
- Appears as separate line in salary card in June/December: "Aguinaldo (auto): $X"
- Editable: user can override the calculated amount if actual deposit differs
- Preview in May/November: blue info banner in salary card "Aguinaldo estimado en junio: $X (50% de $Y)"
- When switching to independiente: keep existing aguinaldos in data, hide future ones. Switching back resumes

### Terminology rename
- "Salario" -> "Ingreso fijo" everywhere (card, forms, charts, labels)
- "Ingresos extras" -> "Otros ingresos" everywhere
- Affects: salary-card.tsx, expense-tracker.tsx, charts/salary-by-month.tsx, useIncomes.ts, useMoneyTracker.ts
- Variable/function names can stay as-is internally (salaries, handleSetSalary, etc.) — only user-facing labels change

### Claude's Discretion
- Exact segmented control styling (use existing Shadcn/Radix patterns)
- Salary timeline layout details within the card
- Migration strategy from current per-month salary model to effective-date model
- How override indicator shows in the timeline (e.g., badge, different color)
- Exact aguinaldo formula display in tooltip/hover

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `components/salary-card.tsx`: Main salary display/edit — will be heavily refactored (add employment config, timeline, pendiente banner, aguinaldo line)
- `hooks/useIncomes.ts`: Salary + extra income logic — needs effective-date model, aguinaldo calculation
- `hooks/useMoneyTracker.ts`: `MonthlyData.salaries` type — needs schema migration for new model
- `components/formatted-amount.tsx`: Currency formatting — reuse for aguinaldo display
- `components/ui/badge.tsx`: Status badges — use for "Pendiente de cobro", "Vencido"
- `components/ui/tooltip.tsx`: Tooltips — use for aguinaldo formula explanation
- `charts/salary-by-month.tsx`: Chart with "Salario" label — needs terminology rename

### Established Patterns
- Click-to-edit with pencil icon (established in Phase 2/3) — reuse for employment config and salary timeline editing
- State flows through useMoneyTracker -> domain hooks -> useLocalStorage -> localStorage
- Data migration pattern from Phase 3 (v3 migration with `_migrationVersion` field)
- `cn()` utility for conditional class merging
- Validation: disabled submit + red borders + blur trigger (Phase 1)

### Integration Points
- `hooks/useMoneyTracker.ts`: MonthlyData type needs extension (employmentType, payDate, salaryHistory, aguinaldos)
- `components/expense-tracker.tsx`: Month selector area needs segmented control for period toggle
- `hooks/useIncomes.ts`: filteredIncomes logic needs to support custom period date ranges
- Balance calculations in useMoneyTracker need to respect active view (period vs calendar month)

</code_context>

<specifics>
## Specific Ideas

- Salary timeline in card should feel like a changelog — compact, scannable, most recent first
- Pendiente de cobro is a real-world concept: before your pay date, you haven't been paid yet for this month — the visual should clearly communicate this state
- Aguinaldo preview is a financial planning feature: knowing in May what you'll get in June helps budgeting
- Custom period view is the "real" financial view — calendar month is just for bank statement reconciliation

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 04-income-pay-date*
*Context gathered: 2026-04-02*
