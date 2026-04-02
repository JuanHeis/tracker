# Phase 6: Recurring Expenses - Context

**Gathered:** 2026-04-02
**Status:** Ready for planning

<domain>
## Phase Boundary

Define recurring expenses once and they auto-appear each month with payment tracking. User can create, pause, cancel, and track payment status of recurring expenses. Auto-generation fills current and missed months on app load. Generated instances are regular Expense objects with a recurring link.

</domain>

<decisions>
## Implementation Decisions

### Recurring definition
- Monthly frequency only — no weekly, biweekly, or quarterly
- Fixed amount per recurring (no per-instance override or variable amounts)
- Supports both ARS and USD currencies (reuses existing CurrencyType enum)
- Reuses existing expense categories PLUS 4 new ones: Seguros, Impuestos, Transporte, Salud
- Fields: name, amount, category, currencyType, status, createdAt

### Auto-generation
- Trigger: on app load — check all active recurrings and generate missing instances
- Generated instances are regular Expense objects stored in monthlyData.expenses with an extra `recurringId` field linking to the definition
- Backfill all missed months if user was away (no notification, silent generation)
- Generated expenses use the 1st day of the month as their date
- Charts, totals, and budget calculations work automatically since instances are regular Expenses

### Lifecycle (pause/cancel)
- Three statuses: Activa, Pausada, Cancelada
- Paused recurrings can be resumed; canceled recurrings are permanent (never generate again)
- Past and current month instances are always kept — only future generation stops
- Dedicated "Recurrentes" section/tab for managing recurring definitions (similar to investments table)
- Management table shows all recurrings (active, paused, canceled) with status badges; canceled ones greyed out

### Payment tracking
- Toggle paid/unpaid in the expenses table via checkbox or toggle (inline, no modal)
- Generated instances start as unpaid (pending) by default
- Unpaid recurrings always count toward monthly Disponible — money is committed regardless of payment status
- Visual distinction: 'Recurrente' badge + repeat/cycle icon next to expense name; paid/unpaid shown via checkbox or color coding (green check / amber pending)

### Claude's Discretion
- Exact data model for RecurringExpense definition (fields, storage location in localStorage)
- Migration strategy for adding recurringId to Expense interface and new categories to Category type
- Recurring management table layout and action button design
- How the "Recurrentes" tab integrates with existing UI (new tab in main view vs sidebar section)
- Exact badge and icon styling for recurring indicators in expenses table
- usdRate handling for USD recurring instances (use global rate at generation time)

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `hooks/useExpensesTracker.ts`: Expense CRUD and filtering — generation logic can call existing add methods
- `hooks/useMoneyTracker.ts`: Orchestrator hook — new `useRecurringExpenses` hook integrates here
- `components/expenses-table.tsx`: Expenses display — needs paid/unpaid toggle and recurring badge
- `components/ui/badge.tsx`: Status badges — reuse for Activa/Pausada/Cancelada and 'Recurrente' indicator
- `components/ui/table.tsx`: Table primitives — reuse for recurring management table
- `components/investment-dialog.tsx`: Dialog pattern — reference for recurring expense creation dialog
- `constants/colors.ts`: Category colors — extend with Seguros, Impuestos, Transporte, Salud

### Established Patterns
- State flows through useMoneyTracker -> domain hooks -> useLocalStorage -> localStorage
- Data migration pattern with `_migrationVersion` field (used in Phase 3)
- Click-to-edit with pencil icons (muted + hover:blue) for inline editing
- Expense interface: { id, date, name, amount, usdRate, category, currencyType, installments? }
- MonthlyData stores per-month data; recurrings are global (like investments, salaryHistory)

### Integration Points
- `hooks/useMoneyTracker.ts`: Add recurring definitions to MonthlyData or separate localStorage key; expose generation logic
- `components/expense-tracker.tsx`: Add "Recurrentes" tab/section to main UI
- `components/expenses-table.tsx`: Add recurringId awareness, paid/unpaid toggle, badge rendering
- `constants/colors.ts` + `Category` type: Add 4 new categories (Seguros, Impuestos, Transporte, Salud)

</code_context>

<specifics>
## Specific Ideas

- Recurring management table should feel like the investments table — a dedicated section with clear status visibility and action buttons
- Auto-generation on app load ensures "nunca perderse un peso" — even if user doesn't open the app for months, all recurring expenses are retroactively generated
- Unpaid = committed money: aligns with the core value of reflecting real financial reality, not just cash flow

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 06-recurring-expenses*
*Context gathered: 2026-04-02*
