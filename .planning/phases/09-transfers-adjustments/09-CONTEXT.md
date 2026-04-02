# Phase 9: Transfers & Adjustments - Context

**Gathered:** 2026-04-02
**Status:** Ready for planning

<domain>
## Phase Boundary

Register inter-account transfers (currency conversions, cash in/out) and manual balance adjustments without creating fake income/expense entries. Reclassify existing Compra USD concept as a transfer type. All movements visible in a new dedicated Movimientos tab. Multi-account support is v2 — this phase works within the current pool model (single ARS balance, single USD balance).

</domain>

<decisions>
## Implementation Decisions

### Transfer scope and types
- Transfers = currency conversions only in current pool model (no multi-account yet)
- Existing "Compra USD" concept reclassified as a transfer type under the new system
- Bidirectional: ARS→USD (compra) and USD→ARS (venta) both supported
- Cash movements included: "Retiro a efectivo" (tracked→untracked) and "Deposito desde efectivo" (untracked→tracked)
- Both ARS and USD supported for cash in/out
- Existing USD purchase data stays where it is — no migration of old entries to new system
- When multi-account arrives in v2, transfers expand to include inter-account moves

### Transfer dialog
- Single unified "Nuevo movimiento" dialog with type selector
- Types: Transferencia ARS→USD | Transferencia USD→ARS | Retiro a efectivo | Deposito desde efectivo
- Fields change dynamically based on selected type
- For currency transfers: same UX as current Compra USD — user enters ARS amount and USD amount, effective rate auto-calculated, rate stored with transfer
- For cash deposits: amount + currency + optional text note (e.g., "efectivo de venta mueble")
- For cash withdrawals: amount + currency only

### Balance adjustment
- User enters their real/actual balance, system calculates the difference vs tracked balance
- Confirmation dialog shows the math: "Saldo segun app: $145.000 | Saldo real: $150.000 | Ajuste: +$5.000"
- ARS and USD adjustable separately (two flows)
- Button lives in settings/tools area (under existing gear icon), not in the Balance card
- System creates an automatic adjustment entry (positive or negative) to reconcile

### Patrimonio impact
- Currency transfers (ARS↔USD) are patrimonio-neutral — money changes form, total unchanged
- Balance adjustments affect patrimonio — the adjustment reflects reality, patrimonio should match reality
- Cash out (retiro a efectivo) reduces patrimonio — once money leaves tracked pool, it's gone from the app's perspective
- Cash in (deposito desde efectivo) increases patrimonio — money enters the tracked pool

### Transaction visibility
- New "Movimientos" tab in main view alongside existing tabs (expenses, incomes, investments)
- Each row shows: Date | Type (Transferencia/Ajuste/Retiro efectivo/Deposito) | Description (auto-generated, e.g., "ARS → USD @ 1.200") | Amount | Actions (edit/delete)
- Minimal information density — no running balances or detailed breakdowns in the table

### Claude's Discretion
- Exact tab naming and icon choice for Movimientos
- How the unified dialog adapts fields per type (show/hide vs separate form sections)
- Auto-generated description format for each movement type
- How adjustment entries are stored internally (new type vs special category on existing expense/income)
- Settings/tools area layout for the adjustment button
- Whether to show a "Compra USD" shortcut somewhere that opens the transfer dialog pre-set to ARS→USD

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `components/usd-purchase-dialog.tsx`: Current ARS→USD dialog — pattern reference for transfer dialog. Mode toggle already exists (buy/register)
- `components/ui/dialog.tsx`: Radix UI dialog — reuse for transfer and adjustment dialogs
- `components/ui/tabs.tsx`: Tab component — extend for new Movimientos tab
- `components/ui/badge.tsx`: Status badges — use for movement type tags
- `components/ui/select.tsx`: Select component — use for transfer type selector
- `components/formatted-amount.tsx`: Currency formatting — reuse in Movimientos table
- `hooks/useCurrencyEngine.ts`: Exchange rate logic — reuse for currency transfer calculations

### Established Patterns
- `calculateDualBalances()` in useMoneyTracker.ts — needs to include transfers and adjustments in balance calculation
- USD purchases stored in `monthlyData[key].usdPurchases[]` — new transfers need similar storage
- Data migration pattern from Phase 3 (v3 migration with `_migrationVersion` field)
- Click-to-edit with pencil icon (Phase 2/3)
- Dialog with mode toggle (usd-purchase-dialog.tsx)
- State flows through useMoneyTracker → domain hooks → useLocalStorage → localStorage

### Integration Points
- `hooks/useMoneyTracker.ts`: calculateDualBalances() must account for transfers, adjustments, and cash movements
- `components/expense-tracker.tsx`: Add Movimientos tab to main view
- Settings area: Add "Ajustar saldo" tool
- `total-amounts.tsx`: Balance display — adjustment button could link to settings tool

</code_context>

<specifics>
## Specific Ideas

- Transfer dialog should feel familiar to users of current Compra USD — same UX for entering amounts and seeing the effective rate
- Adjustment confirmation with visible math ("Saldo segun app" vs "Saldo real" = "Ajuste") prevents accidental miscorrections
- Cash deposit note field helps users remember context for untracked money that enters the system
- Movimientos tab gives transfers/adjustments first-class visibility without polluting the income/expense tables

</specifics>

<deferred>
## Deferred Ideas

- Multi-account transfers (Banco X → Banco Y, MP → efectivo) — v2 CTA-01/02/03
- Migration of existing USD purchase entries to new transfer system — could be revisited in v2
- Cash as a tracked "account" instead of untracked pool — depends on multi-account in v2

</deferred>

---

*Phase: 09-transfers-adjustments*
*Context gathered: 2026-04-02*
