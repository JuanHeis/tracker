# Phase 7: Loans - Context

**Gathered:** 2026-04-02
**Status:** Ready for planning

<domain>
## Phase Boundary

Register money lent ("le presté a X") and money owed ("le debo a X") as trackable entities with payment history. Loans given count as assets, debts owed count as liabilities, both affecting patrimonio. Partial payments supported with expandable row history. New dedicated Préstamos tab. No multi-account support (current pool model).

</domain>

<decisions>
## Implementation Decisions

### Loan registration UX
- Single dialog with mode toggle: "Presté" / "Debo" — same pattern as Phase 9 transfer dialog
- Fields: Persona (required), Monto (required, > 0), Moneda (ARS/USD), Fecha (default today), Nota (optional free text)
- Both ARS and USD supported — loan stored in original currency, converted for patrimonio using globalUsdRate
- Registering a loan immediately affects liquid balance: lending reduces liquid, borrowing (registering debt) does not change liquid (it's a liability)
- Collecting a loan adds money back to liquid; paying a debt reduces liquid

### Partial payments & history
- Partial payments allowed — user registers payments against a loan, remaining balance tracked automatically
- Payments must be in same currency as original loan (no cross-currency payments)
- Expandable row pattern (same as investment movements in Phase 2): click loan row to expand, see payment history + inline "Registrar pago" form
- When remaining balance reaches 0, status auto-changes to Cobrado (for presté) or Pagado (for debo)
- Completed loans stay visible in table with dimmed style (like finalized investments) + status badge

### Patrimonio integration
- Two new lines in patrimonio card: "Préstamos dados" (positive, asset) and "Deudas" (negative, liability)
- Patrimonio formula: Líquido ARS + Líquido USD (converted) + Inversiones + Préstamos dados - Deudas
- Patrimonio tooltip shows totals with count: "Préstamos dados: $50.000 (2 activos)" — not individual loan details
- USD loans converted using globalUsdRate for patrimonio display, with conversion math in tooltip
- Loans do NOT appear in resumen card (Ingresos/Egresos/Disponible) — they are balance sheet items, not income/expense
- Disponible DOES reflect actual liquid (if you lent $50k this month, Disponible drops by $50k)

### Loan visibility & management
- Own tab: "Préstamos" in main tabbed interface alongside Gastos, Ingresos, Inversiones, Movimientos
- Table columns: Persona | Tipo (Presté/Debo with colored badge) | Monto original | Resta | Moneda | Fecha | Estado | Acciones (edit/delete)
- Mixed table — presté and debo in same table, distinguished by colored badges (green Presté = asset, red Debo = liability)
- Each lending event is a separate row (no auto-merge per person) — allows per-reason tracking with notes

### Editing & data integrity
- Editable after creation: persona name, note, date (for corrections)
- Immutable after creation: monto original, moneda, tipo (Presté/Debo) — changes happen through payments
- Consistent with investment edit pattern (Phase 2: type and currency locked after creation)

### Same-person handling
- Separate loans always — lending $20k to Juan for "alquiler" and $30k for "viaje" are independent rows
- No aggregation or grouping by person

### Empty state
- Centered message: "No tenés préstamos registrados" + description + prominent "+ Nuevo préstamo" CTA button
- Shows when Préstamos tab has zero loans

### Delete & forgiveness
- Delete with confirmation dialog — reverses all liquid impact (as if loan never existed), removes all payments
- Separate "Perdonar" (forgive) action for loans given (Presté): writes off remaining balance, money is gone (patrimonio drops), liquid unchanged
- Three distinct completion paths:
  - Cobrar/Pagar: money returns to/leaves liquid, patrimonio unchanged
  - Perdonar: remaining written off, patrimonio drops (asset disappears), liquid unchanged
  - Eliminar: everything reversed as if never existed

### Claude's Discretion
- Exact dialog field layout and mode toggle styling
- Expandable row animation/transition details
- Badge colors and styling for Presté/Debo/Cobrado/Pagado/Perdonado
- Tab icon choice for Préstamos
- Confirmation dialog exact copy for Perdonar action
- How Perdonar action is accessed (button in expanded row, dropdown, etc.)
- Whether to show a quick summary (total prestado, total adeudado) above the table

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `components/ui/dialog.tsx`: Radix UI dialog — reuse for loan creation and confirmations
- `components/ui/badge.tsx`: Status badges — use for Presté/Debo type and Pendiente/Cobrado/Pagado/Perdonado status
- `components/ui/table.tsx`: Table primitives — extend with expandable row (pattern from investments-table)
- `components/ui/tabs.tsx`: Tab component — add Préstamos tab
- `components/formatted-amount.tsx`: Currency formatting — reuse in loan table and payment history
- `components/transfer-dialog.tsx`: Mode toggle pattern (from Phase 9) — reference for Presté/Debo toggle
- `components/investment-movements.tsx`: Expandable row with inline form — reuse pattern for payment history
- `components/investment-row.tsx`: Row with expand, dimmed finalized style — reuse pattern for completed loans
- `hooks/useCurrencyEngine.ts`: Exchange rate logic — reuse for USD loan patrimonio conversion
- `hooks/useTransfers.ts`: Domain hook pattern — follow for useLoans.ts

### Established Patterns
- All state flows through `useMoneyTracker` → domain hooks → `useLocalStorage` → localStorage
- Investment account model with movements[] — loans follow similar entity pattern with payments[]
- Discriminated union types for categories (TransferType in Phase 9) — use for LoanType
- `calculateDualBalances()` in useMoneyTracker — must include loan impact on liquid balances
- Click-to-edit with pencil icon (Phase 2/3) for editing persona/note/date
- `crypto.randomUUID()` for ID generation — use for loan and payment IDs
- Finalized investments dimmed style — reuse for completed loans

### Integration Points
- `hooks/useMoneyTracker.ts`: Must add Loan type, include loans in calculateDualBalances and patrimonio calculation
- `components/expense-tracker.tsx`: Add Préstamos tab to main tabbed interface
- `components/patrimonio-card.tsx`: Add Préstamos dados and Deudas lines to patrimonio display and tooltip
- `components/resumen-card.tsx`: Disponible must reflect liquid changes from loans (already calculated via balances)
- `hooks/useLocalStorage.ts`: Data migration for adding loans[] to MonthlyData

</code_context>

<specifics>
## Specific Ideas

- Loan dialog should feel consistent with transfer dialog (Phase 9) — same mode toggle pattern, familiar UX
- Expandable row for payment history reuses the investment movements pattern — established UX, no new learning curve
- Three completion paths (cobrar/pagar, perdonar, eliminar) give the user full control over financial reality — key for a "nunca perderse un peso" app
- Perdonar is distinct from delete: "ya fue, no me la devuelve" vs "registré mal, borrar todo"

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 07-loans*
*Context gathered: 2026-04-02*
