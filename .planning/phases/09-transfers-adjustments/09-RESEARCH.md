# Phase 9: Transfers & Adjustments - Research

**Researched:** 2026-04-02
**Domain:** Financial transfers, balance adjustments, data modeling for inter-account movements
**Confidence:** HIGH

## Summary

Phase 9 introduces two distinct but related features: (1) transfers between currency pools (ARS/USD conversions, cash in/out) and (2) manual balance adjustments to reconcile tracked vs real balances. Both features share a common data layer (a new `transfers` array in `MonthlyData`) and a new "Movimientos" tab for visibility.

The existing codebase provides strong patterns to follow. The `UsdPurchaseDialog` with its mode toggle (buy/register) is the direct template for the new unified "Nuevo movimiento" dialog. The `useCurrencyEngine` hook's `handleBuyUsd` pattern shows how to create typed entries and update `monthlyData`. The `calculateDualBalances()` function in `useMoneyTracker.ts` is the single point where all balance impacts must be wired. No new libraries are needed — this is purely application-layer logic using existing UI primitives.

**Primary recommendation:** Create a new `Transfer` interface and `useTransfers` hook following the established domain-hook pattern. Store transfers in `monthlyData.transfers[]`. Wire balance impacts into `calculateDualBalances()`. Build the Movimientos tab and transfer dialog using existing Radix UI components. Add the adjustment button to the Settings dialog content area.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Transfers = currency conversions only in current pool model (no multi-account yet)
- Existing "Compra USD" concept reclassified as a transfer type under the new system
- Bidirectional: ARS→USD (compra) and USD→ARS (venta) both supported
- Cash movements included: "Retiro a efectivo" (tracked→untracked) and "Deposito desde efectivo" (untracked→tracked)
- Both ARS and USD supported for cash in/out
- Existing USD purchase data stays where it is — no migration of old entries to new system
- Single unified "Nuevo movimiento" dialog with type selector
- Types: Transferencia ARS→USD | Transferencia USD→ARS | Retiro a efectivo | Deposito desde efectivo
- Fields change dynamically based on selected type
- For currency transfers: same UX as current Compra USD — user enters ARS amount and USD amount, effective rate auto-calculated, rate stored with transfer
- For cash deposits: amount + currency + optional text note
- For cash withdrawals: amount + currency only
- Balance adjustment: user enters real balance, system calculates difference vs tracked balance
- Confirmation dialog shows the math: "Saldo segun app: $X | Saldo real: $Y | Ajuste: +/-$Z"
- ARS and USD adjustable separately (two flows)
- Adjustment button lives in settings/tools area (under existing gear icon)
- System creates an automatic adjustment entry (positive or negative)
- Currency transfers (ARS↔USD) are patrimonio-neutral
- Balance adjustments affect patrimonio
- Cash out reduces patrimonio; Cash in increases patrimonio
- New "Movimientos" tab in main view alongside existing tabs
- Each row shows: Date | Type | Description (auto-generated) | Amount | Actions (edit/delete)
- Minimal information density — no running balances

### Claude's Discretion
- Exact tab naming and icon choice for Movimientos
- How the unified dialog adapts fields per type (show/hide vs separate form sections)
- Auto-generated description format for each movement type
- How adjustment entries are stored internally (new type vs special category on existing expense/income)
- Settings/tools area layout for the adjustment button
- Whether to show a "Compra USD" shortcut somewhere that opens the transfer dialog pre-set to ARS→USD

### Deferred Ideas (OUT OF SCOPE)
- Multi-account transfers (Banco X → Banco Y, MP → efectivo) — v2 CTA-01/02/03
- Migration of existing USD purchase entries to new transfer system — could be revisited in v2
- Cash as a tracked "account" instead of untracked pool — depends on multi-account in v2
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| TRANS-01 | User can register a transfer between own accounts (banco to MP, ARS to USD) | Transfer interface with type discriminator covers all transfer types. Unified dialog with dynamic fields per type. Balance impact logic in calculateDualBalances(). |
| TRANS-02 | Transfer does not affect patrimonio — only changes where the money is | Currency transfers (ARS↔USD) are patrimonio-neutral by design: subtract from one pool, add to other. Cash out/in DO affect patrimonio per user decision (cash exits/enters tracked world). |
| AJUST-01 | User can "Adjust real balance" — creates automatic adjustment entry to reconcile with reality | Adjustment dialog reads current tracked balance from calculateDualBalances(), user enters real balance, system creates adjustment transfer entry with calculated difference. |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React | ^18 | Component framework | Already in project |
| Next.js | 14.2.16 | App framework | Already in project |
| Radix UI Dialog | ^1.1.2 | Transfer and adjustment dialogs | Already used for all dialogs in project |
| Radix UI Tabs | ^1.1.1 | Movimientos tab in main view | Already used for main tab navigation |
| Radix UI Select | ^2.1.2 | Transfer type selector in dialog | Already used for currency/category selectors |
| lucide-react | ^0.454.0 | Icons for tab, dialog, and table actions | Already used throughout project |
| date-fns | ^4.1.0 | Date formatting for movement entries | Already used throughout project |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @radix-ui/react-tooltip | ^1.1.3 | Tooltips on adjustment math preview | Already available |
| @number-flow/react | ^0.6.0 | Animated number transitions | Already available, use for adjustment preview numbers |

### Alternatives Considered
None — no new libraries needed. This phase is purely application logic built on the existing stack.

**Installation:**
```bash
# No new packages needed
```

## Architecture Patterns

### Recommended Project Structure
```
hooks/
├── useTransfers.ts          # NEW: Transfer CRUD + adjustment logic
├── useMoneyTracker.ts       # MODIFIED: Wire transfers into calculateDualBalances, expose transfer functions
├── useCurrencyEngine.ts     # UNCHANGED (existing USD purchases stay separate)
components/
├── transfer-dialog.tsx      # NEW: Unified "Nuevo movimiento" dialog with type selector
├── adjustment-dialog.tsx    # NEW: "Ajustar saldo real" dialog with math preview
├── movements-table.tsx      # NEW: Table for Movimientos tab
├── expense-tracker.tsx      # MODIFIED: Add Movimientos tab, wire transfer/adjustment dialogs
├── config-card.tsx          # MODIFIED: Add "Ajustar saldo" button
```

### Pattern 1: Domain Hook (useTransfers)
**What:** Encapsulate all transfer and adjustment CRUD in a dedicated hook, following the established pattern of `useExpensesTracker`, `useIncomes`, `useInvestmentsTracker`.
**When to use:** Always — this is the project's standard for domain logic separation.
**Example:**
```typescript
// Following pattern from useExpensesTracker / useIncomes
export function useTransfers(
  monthlyData: MonthlyData,
  updateMonthlyData: (data: MonthlyData) => void,
  selectedYear: string,
  selectedMonth: string,
  viewMode: ViewMode,
  payDay: number,
) {
  // CRUD operations for transfers
  const handleAddTransfer = (transfer: Omit<Transfer, "id">) => { ... };
  const handleEditTransfer = (id: string) => { ... };
  const handleDeleteTransfer = (id: string) => { ... };
  const handleUpdateTransfer = (id: string, updates: Partial<Transfer>) => { ... };

  // Adjustment-specific
  const handleCreateAdjustment = (currency: "ARS" | "USD", realBalance: number, trackedBalance: number) => { ... };

  // Filtered for current period
  const filteredTransfers = useMemo(() => { ... }, [monthlyData.transfers, ...]);

  return { ... };
}
```

### Pattern 2: Transfer Data Model with Type Discriminator
**What:** Single `Transfer` interface with a `type` field that determines which fields are relevant, similar to how `UsdPurchase` uses `origin: "tracked" | "untracked"`.
**When to use:** For the unified transfer storage.
**Example:**
```typescript
export type TransferType =
  | "currency_ars_to_usd"    // ARS → USD conversion
  | "currency_usd_to_ars"    // USD → ARS conversion
  | "cash_out"               // Retiro a efectivo (tracked → untracked)
  | "cash_in"                // Deposito desde efectivo (untracked → tracked)
  | "adjustment_ars"         // Balance adjustment ARS
  | "adjustment_usd";        // Balance adjustment USD

export interface Transfer {
  id: string;
  date: string;              // yyyy-MM-dd
  type: TransferType;
  // Currency conversion fields (currency_ars_to_usd, currency_usd_to_ars)
  arsAmount?: number;        // ARS side of conversion
  usdAmount?: number;        // USD side of conversion
  exchangeRate?: number;     // Effective rate (arsAmount / usdAmount)
  // Cash and adjustment fields
  amount?: number;           // For cash_in/out and adjustments
  currency?: "ARS" | "USD";  // For cash_in/out
  // Metadata
  description?: string;      // Auto-generated or user note (cash_in allows text note)
  createdAt: string;         // ISO timestamp for ordering
}
```

### Pattern 3: Balance Impact in calculateDualBalances
**What:** Extend the existing `calculateDualBalances()` function to process transfers array alongside expenses, incomes, and investments.
**When to use:** This is the ONLY place balance math lives — all new movement types MUST be wired here.
**Example:**
```typescript
// Inside calculateDualBalances() in useMoneyTracker.ts
// After existing expense/income/investment processing:

(monthlyData.transfers || []).forEach((transfer) => {
  switch (transfer.type) {
    case "currency_ars_to_usd":
      // Patrimonio-neutral: ARS down, USD up
      if (isInArsRange(transfer.date)) arsBalance -= transfer.arsAmount!;
      usdBalance += transfer.usdAmount!;
      break;
    case "currency_usd_to_ars":
      // Patrimonio-neutral: USD down, ARS up
      usdBalance -= transfer.usdAmount!;
      if (isInArsRange(transfer.date)) arsBalance += transfer.arsAmount!;
      break;
    case "cash_out":
      // Reduces patrimonio — money leaves tracked world
      if (transfer.currency === "ARS" && isInArsRange(transfer.date)) {
        arsBalance -= transfer.amount!;
      } else if (transfer.currency === "USD") {
        usdBalance -= transfer.amount!;
      }
      break;
    case "cash_in":
      // Increases patrimonio — money enters tracked world
      if (transfer.currency === "ARS" && isInArsRange(transfer.date)) {
        arsBalance += transfer.amount!;
      } else if (transfer.currency === "USD") {
        usdBalance += transfer.amount!;
      }
      break;
    case "adjustment_ars":
      if (isInArsRange(transfer.date)) arsBalance += transfer.amount!; // amount is the diff (+ or -)
      break;
    case "adjustment_usd":
      usdBalance += transfer.amount!; // amount is the diff (+ or -)
      break;
  }
});
```

### Pattern 4: Dialog with Dynamic Fields (Mode Toggle)
**What:** The unified transfer dialog uses a type selector (Select component) that shows/hides fields based on selected type. Direct evolution of `UsdPurchaseDialog`'s buy/register mode toggle.
**When to use:** For the "Nuevo movimiento" dialog.
**Example approach:**
```typescript
// Type selector determines which form section renders
const [transferType, setTransferType] = useState<TransferType>("currency_ars_to_usd");

// Render different field groups based on type:
// - currency_ars_to_usd / currency_usd_to_ars: arsAmount + usdAmount (like UsdPurchaseDialog buy mode)
// - cash_out: amount + currency selector
// - cash_in: amount + currency selector + optional note
```

### Pattern 5: Adjustment Flow (Two-Step Confirmation)
**What:** Adjustment dialog reads current tracked balance, user enters real balance, system shows the math, user confirms.
**When to use:** For the "Ajustar saldo real" feature.
**Example approach:**
```typescript
// Step 1: User selects currency (ARS or USD) and enters real balance
// Step 2: System shows confirmation:
//   "Saldo segun app: $145.000"
//   "Saldo real: $150.000"
//   "Ajuste: +$5.000"
// Step 3: On confirm, create Transfer with type "adjustment_ars" and amount = +5000
```

### Anti-Patterns to Avoid
- **Storing adjustments as fake expenses/incomes:** Creates confusion in income/expense reports. Use the dedicated `Transfer` type with `adjustment_ars`/`adjustment_usd` discriminator.
- **Duplicating balance calculation logic:** ALL balance math must go through `calculateDualBalances()`. Do not compute balances separately in the adjustment dialog — read from the existing function.
- **Migrating existing USD purchases:** The user explicitly decided old data stays in `usdPurchases[]`. New ARS↔USD transfers go in `transfers[]`. Both arrays are processed in `calculateDualBalances()`.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Dialog component | Custom modal | Radix UI Dialog (already in project) | Accessibility, focus trap, ESC handling |
| Type selector | Custom radio/toggle | Radix UI Select (already in project) | Consistent UX with existing category/currency selectors |
| Tab navigation | Custom tab logic | Radix UI Tabs (already in project) | Already handles the main tab system |
| Currency formatting | Manual toLocaleString calls | `FormattedAmount` component (already exists) | Consistent formatting with hydration guard |
| UUID generation | Custom ID | `crypto.randomUUID()` | Already used for all entity IDs in project |

**Key insight:** This phase adds zero new dependencies. Every UI primitive needed already exists in the project.

## Common Pitfalls

### Pitfall 1: Double-Counting ARS↔USD Transfers with Existing USD Purchases
**What goes wrong:** If currency transfers process the same ARS deduction that `usdPurchases` already handles, balances are wrong.
**Why it happens:** Both `usdPurchases` and new `transfers` with `currency_ars_to_usd` affect ARS and USD balances.
**How to avoid:** Old purchases stay in `usdPurchases[]` (no migration). New transfers go in `transfers[]`. The "Comprar/Registrar USD" button can either: (a) keep using the old dialog and `useCurrencyEngine`, or (b) redirect to the new transfer dialog pre-set to ARS→USD. Either way, do NOT process the same entry in both arrays.
**Warning signs:** Patrimonio changes when doing a currency conversion (should be neutral).

### Pitfall 2: ARS Scoping vs USD Cumulative for Transfers
**What goes wrong:** Applying ARS date-range scoping rules to USD-side impacts, or vice versa.
**Why it happens:** The project has a fundamental rule: ARS balance is month-scoped (via `isInArsRange`), USD balance is cumulative across all time.
**How to avoid:** For currency transfers, the ARS side uses `isInArsRange()` filtering, the USD side always applies. For cash movements, ARS uses range, USD always applies. For adjustments, same pattern.
**Warning signs:** USD balance changes when switching months (it should be cumulative).

### Pitfall 3: Adjustment Reading Stale Balance
**What goes wrong:** Adjustment dialog shows stale tracked balance if it captures the value at dialog open time and the user makes changes in another tab before confirming.
**Why it happens:** `calculateDualBalances()` is called once per render cycle.
**How to avoid:** Read the current balance at confirmation time, not at dialog open time. Or re-compute when the dialog is about to show the confirmation step.
**Warning signs:** Adjustment creates an entry that doesn't actually reconcile the balance.

### Pitfall 4: Missing Migration for New `transfers` Array
**What goes wrong:** Existing users crash because `monthlyData.transfers` is `undefined`.
**Why it happens:** Old localStorage data doesn't have the `transfers` field.
**How to avoid:** Add `transfers: (data as any).transfers || []` in `migrateData()`, similar to how `usdPurchases` was handled. Bump `_migrationVersion` to 5.
**Warning signs:** TypeError on `.forEach()` of `undefined`.

### Pitfall 5: Tab Width Overflow
**What goes wrong:** Adding a 5th tab ("Movimientos") to the existing TabsList causes layout overflow or cramped text.
**Why it happens:** Current TabsList has 4 tabs (Gastos, Ingresos, Inversiones, Charts) in a `w-[400px]` container.
**How to avoid:** Widen the TabsList container (e.g., `w-[500px]`) or use shorter tab labels. The icon + text pattern is already established.
**Warning signs:** Tab text wraps or truncates on smaller screens.

## Code Examples

### Transfer Entry Creation (following existing pattern)
```typescript
// Following the pattern from useCurrencyEngine.handleBuyUsd
const handleAddTransfer = (data: Omit<Transfer, "id" | "createdAt">) => {
  const transfer: Transfer = {
    ...data,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  };
  updateMonthlyData({
    ...monthlyData,
    transfers: [...(monthlyData.transfers || []), transfer],
  });
};
```

### Auto-Generated Descriptions
```typescript
function generateDescription(transfer: Transfer): string {
  switch (transfer.type) {
    case "currency_ars_to_usd":
      return `ARS → USD @ ${transfer.exchangeRate?.toLocaleString()}`;
    case "currency_usd_to_ars":
      return `USD → ARS @ ${transfer.exchangeRate?.toLocaleString()}`;
    case "cash_out":
      return `Retiro a efectivo (${transfer.currency})`;
    case "cash_in":
      return transfer.description
        ? `Deposito: ${transfer.description}`
        : `Deposito desde efectivo (${transfer.currency})`;
    case "adjustment_ars":
      return `Ajuste saldo ARS`;
    case "adjustment_usd":
      return `Ajuste saldo USD`;
  }
}
```

### Adjustment Calculation
```typescript
// In adjustment dialog, after user enters real balance:
const trackedBalance = currency === "ARS"
  ? calculateDualBalances().arsBalance
  : calculateDualBalances().usdBalance;

const adjustmentAmount = realBalance - trackedBalance;
// adjustmentAmount > 0 means app was under-counting (add money)
// adjustmentAmount < 0 means app was over-counting (remove money)

// Create adjustment transfer:
handleAddTransfer({
  date: format(new Date(), "yyyy-MM-dd"),
  type: currency === "ARS" ? "adjustment_ars" : "adjustment_usd",
  amount: adjustmentAmount,
  description: `Ajuste saldo ${currency}`,
});
```

### Migration Addition
```typescript
// In migrateData(), add alongside existing array defaults:
transfers: (data as any).transfers || [],
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| USD purchases in separate `usdPurchases[]` array | Keep `usdPurchases[]` for legacy, new transfers in `transfers[]` | This phase | Two parallel arrays, both processed in `calculateDualBalances()` |
| "Compra USD" as standalone concept | Compra USD = a type of transfer (but old data not migrated) | This phase | New ARS→USD transfers use transfer system; old purchases unchanged |
| No way to reconcile tracked vs real balance | Adjustment entries auto-created from user-declared real balance | This phase | Patrimonio accuracy improves |

**Deprecated/outdated:**
- Nothing deprecated. Existing `usdPurchases[]` and `useCurrencyEngine` remain active for backward compatibility with existing data.

## Open Questions

1. **"Compra USD" button behavior after phase**
   - What we know: User decided existing Compra USD data stays. New transfers use the transfer system.
   - What's unclear: Should the existing "Comprar/Registrar USD" button continue using `useCurrencyEngine`/`UsdPurchaseDialog`, or should it open the new transfer dialog pre-set to ARS→USD?
   - Recommendation: Keep the old button functional for now (no migration = no breaking change). Optionally add the transfer dialog as an additional path. This is in Claude's discretion per CONTEXT.md — recommend keeping both paths since old data stays separate anyway.

2. **Movimientos tab: show all-time or month-scoped?**
   - What we know: The table shows Date/Type/Description/Amount/Actions. Existing tabs (Gastos, Ingresos) are filtered by current month/period.
   - What's unclear: Should Movimientos follow the same month/period filtering?
   - Recommendation: Yes, follow the same filtering pattern for consistency. Users expect tab content to respect the month selector. All-time view is not needed since adjustments are period-specific.

## Sources

### Primary (HIGH confidence)
- Direct codebase analysis of `useMoneyTracker.ts`, `useCurrencyEngine.ts`, `usd-purchase-dialog.tsx`, `expense-tracker.tsx`, `config-card.tsx`, `total-amounts.tsx`
- `MonthlyData` interface and `calculateDualBalances()` function — definitive source for data model and balance logic
- Existing hook patterns (`useExpensesTracker`, `useIncomes`, `useInvestmentsTracker`) — definitive source for domain hook structure

### Secondary (MEDIUM confidence)
- Radix UI component usage patterns inferred from existing dialog/tabs/select implementations in codebase

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - No new libraries; all components exist in project
- Architecture: HIGH - Clear patterns established in prior phases, direct extension
- Pitfalls: HIGH - Based on actual code analysis of calculateDualBalances() scoping rules and migration patterns

**Research date:** 2026-04-02
**Valid until:** 2026-05-02 (stable — no external dependencies to change)
