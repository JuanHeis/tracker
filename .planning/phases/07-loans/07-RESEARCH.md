# Phase 7: Loans - Research

**Researched:** 2026-04-02
**Domain:** Loan/debt tracking with patrimonio integration (localStorage, React, shadcn/ui)
**Confidence:** HIGH

## Summary

Phase 7 adds loan tracking ("prestamos dados" and "deudas") as a new domain entity in the expense tracker. Loans follow the same architectural pattern as investments: entity with sub-items (payments instead of movements), expandable row UI, and integration into the patrimonio calculation. The codebase already has every UI primitive and architectural pattern needed -- no new libraries are required.

The core complexity lies in three areas: (1) the liquid balance impact model (lending reduces liquid, collecting restores it; borrowing records a liability but does NOT touch liquid, paying a debt reduces liquid), (2) the three distinct completion paths (cobrar/pagar, perdonar, eliminar) each with different financial semantics, and (3) data migration to add `loans[]` to MonthlyData without breaking existing data.

**Primary recommendation:** Follow the investment entity pattern exactly (type definition, domain hook, expandable row component, main tab), adapting for loan-specific semantics (payments instead of movements, forgiveness as a completion path, persona field).

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Single dialog with mode toggle: "Preste" / "Debo" -- same pattern as Phase 9 transfer dialog
- Fields: Persona (required), Monto (required, > 0), Moneda (ARS/USD), Fecha (default today), Nota (optional free text)
- Both ARS and USD supported -- loan stored in original currency, converted for patrimonio using globalUsdRate
- Registering a loan immediately affects liquid balance: lending reduces liquid, borrowing does not change liquid
- Collecting a loan adds money back to liquid; paying a debt reduces liquid
- Partial payments allowed -- payments must be in same currency as original loan
- Expandable row pattern (same as investment movements in Phase 2)
- When remaining balance reaches 0, status auto-changes to Cobrado/Pagado
- Completed loans stay visible with dimmed style + status badge
- Two new lines in patrimonio card: "Prestamos dados" (positive, asset) and "Deudas" (negative, liability)
- Patrimonio formula: Liquido ARS + Liquido USD (converted) + Inversiones + Prestamos dados - Deudas
- Patrimonio tooltip shows totals with count, not individual loan details
- USD loans converted using globalUsdRate for patrimonio display
- Loans do NOT appear in resumen card (Ingresos/Egresos/Disponible) -- they are balance sheet items
- Disponible DOES reflect actual liquid (lending drops Disponible)
- Own tab: "Prestamos" in main tabbed interface
- Table columns: Persona | Tipo | Monto original | Resta | Moneda | Fecha | Estado | Acciones
- Mixed table -- preste and debo in same table, distinguished by colored badges
- Each lending event is a separate row (no auto-merge per person)
- Editable after creation: persona name, note, date
- Immutable after creation: monto original, moneda, tipo
- Delete with confirmation dialog -- reverses all liquid impact
- Separate "Perdonar" (forgive) action for loans given: writes off remaining balance, patrimonio drops, liquid unchanged
- Three completion paths: Cobrar/Pagar, Perdonar, Eliminar
- Empty state: "No tenes prestamos registrados" + CTA button

### Claude's Discretion
- Exact dialog field layout and mode toggle styling
- Expandable row animation/transition details
- Badge colors and styling for Preste/Debo/Cobrado/Pagado/Perdonado
- Tab icon choice for Prestamos
- Confirmation dialog exact copy for Perdonar action
- How Perdonar action is accessed (button in expanded row, dropdown, etc.)
- Whether to show a quick summary (total prestado, total adeudado) above the table

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| PREST-01 | User puede registrar "le preste $X a [persona]" con fecha y monto | Loan dialog with mode toggle, Loan type definition, useLoans hook handleAddLoan, liquid balance reduction in calculateDualBalances |
| PREST-02 | User puede registrar "debo $X a [persona]" con fecha y monto | Same dialog with "Debo" toggle mode, LoanType discriminated union, no liquid impact on creation |
| PREST-03 | Prestamo dado cuenta como activo, deuda cuenta como pasivo en patrimonio | PatrimonioCard additions (two new lines), calculateDualBalances must compute arsLoansGiven/usdLoansGiven/arsDebts/usdDebts, patrimonio formula update |
| PREST-04 | User puede marcar prestamo como cobrado (vuelve al liquido) o deuda como pagada (sale del liquido) | Partial payment system with expandable row inline form, auto-status transition when remaining=0, liquid impact in calculateDualBalances |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React | 18+ | Component framework | Already in project |
| shadcn/ui | current | Dialog, Badge, Table, Tabs, Input, Select, Button, Tooltip | Already in project, all needed primitives exist |
| date-fns | current | Date formatting, parsing | Already used throughout project |
| lucide-react | current | Icons (Handshake, Plus, Pencil, Trash2, ChevronDown/Up) | Already in project |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @radix-ui/react-dialog | current | Dialog primitive (via shadcn) | Loan creation dialog, confirmation dialogs |
| @radix-ui/react-tooltip | current | Tooltip primitive (via shadcn) | Patrimonio tooltip updates |

### Alternatives Considered
None -- project stack is fully established, no new dependencies needed.

**Installation:**
```bash
# No new packages needed
```

## Architecture Patterns

### Recommended Project Structure
```
hooks/
  useLoans.ts              # Domain hook (CRUD + payments + forgiveness)
components/
  loan-dialog.tsx          # Creation dialog with Preste/Debo toggle
  loans-table.tsx          # Main table with expandable rows
  loan-row.tsx             # Single loan row with expand/collapse
  loan-payments.tsx        # Expandable payment history + inline form
```

### Pattern 1: Domain Hook (follow useTransfers.ts / useInvestmentsTracker.ts)
**What:** Dedicated hook that receives monthlyData + updater, returns filtered data + CRUD handlers
**When to use:** Every new domain entity in this project
**Example:**
```typescript
// Follow exact pattern from useTransfers.ts
export function useLoans(
  monthlyData: MonthlyData,
  updateMonthlyData: (data: MonthlyData) => void,
  selectedYear: string,
  selectedMonth: string,
  viewMode: ViewMode,
  payDay: number
) {
  const filteredLoans = useMemo(() => {
    // Filter by date range like useTransfers
  }, [monthlyData.loans, selectedYear, selectedMonth, viewMode, payDay]);

  const handleAddLoan = (data: Omit<Loan, "id" | "createdAt" | "payments" | "status">) => {
    const loan: Loan = {
      ...data,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      payments: [],
      status: "Pendiente",
    };
    updateMonthlyData({
      ...monthlyData,
      loans: [...(monthlyData.loans || []), loan],
    });
  };

  // handleAddPayment, handleDeleteLoan, handleForgiveLoan, etc.
}
```

### Pattern 2: Expandable Row (follow investment-row.tsx + investment-movements.tsx)
**What:** Table row that expands on click to show sub-content (payments history + inline add form)
**When to use:** Loan rows in the loans table
**Example:**
```typescript
// Same pattern as InvestmentRow
export function LoanRow({ loan, isExpanded, onToggleExpand, ... }: LoanRowProps) {
  return (
    <>
      <TableRow
        className={`cursor-pointer ${isCompleted ? "opacity-60" : ""}`}
        onClick={onToggleExpand}
      >
        {/* Loan columns */}
      </TableRow>
      {isExpanded && (
        <TableRow>
          <TableCell colSpan={8} className="bg-muted/30 p-4">
            <LoanPayments loan={loan} onAddPayment={...} />
          </TableCell>
        </TableRow>
      )}
    </>
  );
}
```

### Pattern 3: Mode Toggle Dialog (follow transfer-dialog.tsx)
**What:** Single dialog with mode selection that changes form behavior
**When to use:** Loan creation dialog (Preste vs Debo modes)
**Example:**
```typescript
// TransferDialog uses Select for type switching
// LoanDialog should use a two-button toggle (like employment type in salary card)
const [loanType, setLoanType] = useState<"preste" | "debo">("preste");
```

### Pattern 4: Data Migration (follow existing migrateData pattern)
**What:** Increment _migrationVersion, initialize loans[] array for existing data
**When to use:** When adding `loans` field to MonthlyData
**Example:**
```typescript
// In migrateData function, add:
if (currentVersion < 6) {
  migrated.loans = (migrated as any).loans || [];
}
// Update _migrationVersion to 6
```

### Anti-Patterns to Avoid
- **Separate dialogs for Preste/Debo:** Use a single dialog with mode toggle, consistent with TransferDialog
- **Auto-merging loans by persona:** Each loan is independent -- user decision is explicit
- **Including loans in Resumen card income/expense totals:** Loans are balance sheet items, NOT income/expense
- **Modifying monto original after creation:** Immutable field -- changes happen through payments only
- **Computing remaining balance from derived state:** Store payments[], compute remaining = original - sum(payments). Do NOT store remaining as a field that needs manual sync.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Dialog component | Custom modal | shadcn Dialog (already exists) | Accessibility, focus management |
| Table component | Custom table | shadcn Table (already exists) | Consistent styling with investments table |
| Date formatting | Custom formatters | date-fns format/parse (already used) | Edge cases with locales |
| UUID generation | Custom IDs | crypto.randomUUID() (already used) | Standard in project |
| Currency formatting | Custom formatters | FormattedAmount + currencySymbol() (already exist) | Consistency with rest of app |

**Key insight:** This phase requires ZERO new utilities or libraries. Every primitive exists. The work is purely domain logic + UI composition.

## Common Pitfalls

### Pitfall 1: Liquid Balance Double-Counting
**What goes wrong:** Loan creation and payments both affect liquid, leading to double-counting if not carefully modeled
**Why it happens:** Lending $50k creates an asset but ALSO reduces liquid. If the payment collection also "adds" to liquid without removing the asset portion, patrimonio inflates.
**How to avoid:** Model clearly: (1) lending reduces liquid by amount, (2) remaining balance IS the asset, (3) collecting a payment reduces the asset and adds to liquid -- net patrimonio unchanged. The key insight: remaining balance = original - sum(payments). Patrimonio uses remaining balance as the asset.
**Warning signs:** Patrimonio changes when a loan is fully collected (it should stay the same)

### Pitfall 2: Forgiveness vs Delete Semantics
**What goes wrong:** Confusing "Perdonar" (write off remaining, patrimonio drops) with "Eliminar" (undo everything as if never existed)
**Why it happens:** Both end the loan, but financial impact is completely different
**How to avoid:**
- **Perdonar:** Status becomes "Perdonado", remaining balance written off. Patrimonio drops (asset disappears). Liquid unchanged. Past payments stay in history.
- **Eliminar:** Loan + all payments removed entirely. Liquid reversed to pre-loan state. As if it never happened.
**Warning signs:** Liquid balance changes on forgiveness (it should NOT)

### Pitfall 3: Stale Remaining Balance
**What goes wrong:** Storing `remainingBalance` as a field that must be manually updated vs computing it
**Why it happens:** Desire to avoid recomputing on every render
**How to avoid:** Always compute: `remaining = loan.amount - loan.payments.reduce((sum, p) => sum + p.amount, 0)`. Never store a separate `remaining` field. This is the same principle as investment `capitalInvested` which is computed from movements.
**Warning signs:** Remaining balance doesn't match sum of payments

### Pitfall 4: Currency Mismatch in Patrimonio
**What goes wrong:** ARS and USD loans mixed incorrectly in patrimonio calculation
**Why it happens:** Not separating ARS vs USD loan totals before conversion
**How to avoid:** Compute four separate totals: arsLoansGiven, usdLoansGiven, arsDebts, usdDebts. Convert USD totals using globalUsdRate. Same pattern as arsInvestments/usdInvestments in current calculateDualBalances.
**Warning signs:** Patrimonio shows wrong value when globalUsdRate changes

### Pitfall 5: Liquid Impact Timing with View Mode
**What goes wrong:** Loan liquid impact not respecting ARS date range scoping (viewMode/payDay)
**Why it happens:** USD is cumulative, ARS is period-scoped -- same complexity as existing balance calculation
**How to avoid:** Follow the exact same pattern as investment movements in calculateDualBalances: ARS loans scoped by isInArsRange, USD loans cumulative. Apply the same logic to payments.
**Warning signs:** Switching between "Periodo" and "Mes" views doesn't change ARS liquid impact of loans

## Code Examples

### Type Definitions
```typescript
// In useMoneyTracker.ts (or could be in a separate types file)
export type LoanType = "preste" | "debo";

export type LoanStatus = "Pendiente" | "Cobrado" | "Pagado" | "Perdonado";

export interface LoanPayment {
  id: string;
  date: string;          // yyyy-MM-dd
  amount: number;        // Always positive, same currency as loan
  createdAt: string;     // ISO timestamp
}

export interface Loan {
  id: string;
  type: LoanType;        // "preste" = I lent (asset), "debo" = I owe (liability)
  persona: string;       // Required, free text
  amount: number;        // Original amount, immutable after creation
  currencyType: CurrencyType;  // ARS or USD, immutable after creation
  date: string;          // yyyy-MM-dd
  note?: string;         // Optional free text
  status: LoanStatus;    // Auto-transitions when remaining = 0
  payments: LoanPayment[];
  createdAt: string;     // ISO timestamp
}
```

### MonthlyData Extension
```typescript
export interface MonthlyData {
  // ... existing fields ...
  loans?: Loan[];        // Optional for backward compat until migration
}
```

### Liquid Balance Impact in calculateDualBalances
```typescript
// Inside calculateDualBalances, after transfers section:

// Loans: lending reduces liquid, collecting restores it
// Debts: paying reduces liquid (borrowing itself doesn't change liquid)
(monthlyData.loans || []).forEach((loan) => {
  const remaining = loan.amount - loan.payments.reduce((sum, p) => sum + p.amount, 0);
  const isForgivenOrDeleted = loan.status === "Perdonado";

  if (loan.type === "preste") {
    // Lending: original amount left liquid when lent
    if (loan.currencyType === CurrencyType.USD) {
      usdBalance -= loan.amount;  // Cumulative
      // Payments return money to liquid
      loan.payments.forEach(p => { usdBalance += p.amount; });
    } else {
      // ARS: scope by date range
      if (isInArsRange(loan.date)) arsBalance -= loan.amount;
      loan.payments.forEach(p => {
        if (isInArsRange(p.date)) arsBalance += p.amount;
      });
    }
  } else {
    // Debo: borrowing doesn't change liquid, but paying does
    if (loan.currencyType === CurrencyType.USD) {
      loan.payments.forEach(p => { usdBalance -= p.amount; });
    } else {
      loan.payments.forEach(p => {
        if (isInArsRange(p.date)) arsBalance -= p.amount;
      });
    }
  }
});

// Loan values for patrimonio (separate from liquid)
const arsLoansGiven = (monthlyData.loans || [])
  .filter(l => l.type === "preste" && l.status !== "Perdonado" && l.currencyType === CurrencyType.ARS)
  .reduce((sum, l) => sum + (l.amount - l.payments.reduce((s, p) => s + p.amount, 0)), 0);
const usdLoansGiven = (monthlyData.loans || [])
  .filter(l => l.type === "preste" && l.status !== "Perdonado" && l.currencyType === CurrencyType.USD)
  .reduce((sum, l) => sum + (l.amount - l.payments.reduce((s, p) => s + p.amount, 0)), 0);
const arsDebts = (monthlyData.loans || [])
  .filter(l => l.type === "debo" && l.status !== "Pagado" && l.currencyType === CurrencyType.ARS)
  .reduce((sum, l) => sum + (l.amount - l.payments.reduce((s, p) => s + p.amount, 0)), 0);
const usdDebts = (monthlyData.loans || [])
  .filter(l => l.type === "debo" && l.status !== "Pagado" && l.currencyType === CurrencyType.USD)
  .reduce((sum, l) => sum + (l.amount - l.payments.reduce((s, p) => s + p.amount, 0)), 0);
```

### Patrimonio Formula Update
```typescript
// In PatrimonioCard, updated formula:
const patrimonio = globalUsdRate > 0
  ? arsBalance
    + usdBalance * globalUsdRate
    + arsInvestments
    + usdInvestments * globalUsdRate
    + arsLoansGiven
    + usdLoansGiven * globalUsdRate
    - arsDebts
    - usdDebts * globalUsdRate
  : 0;
```

### Data Migration
```typescript
// In migrateData function:
if (currentVersion < 6) {
  migrated.loans = (migrated as any).loans || [];
}
// Update: _migrationVersion: 6
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| N/A | Entity with sub-items pattern (investments) | Phase 2 | Loans follow same proven pattern |
| N/A | Discriminated union types (TransferType) | Phase 9 | LoanType follows same pattern |
| N/A | Mode toggle dialog (TransferDialog) | Phase 9 | Loan dialog follows same UX pattern |

**Deprecated/outdated:**
- None relevant -- all patterns are from recent phases in this project

## Open Questions

1. **Forgiven loan patrimonio filtering**
   - What we know: Perdonar writes off the remaining balance and patrimonio drops
   - What's unclear: Should forgiven loans with partial payments still show the collected portion in patrimonio? No -- once forgiven, remaining = 0 and the loan is no longer an asset. Previously collected payments already went to liquid, which IS in patrimonio.
   - Recommendation: Forgiven loans excluded from patrimonio asset calculation entirely. Liquid already has the collected payments.

2. **ARS loan date scoping nuance**
   - What we know: ARS balance is period-scoped, USD is cumulative
   - What's unclear: Should the loan original amount reduce ARS liquid only in the period it was created, or carry forward?
   - Recommendation: Follow exact same pattern as investment aportes -- ARS loan creation date scoped by isInArsRange. This means a loan from last month won't reduce THIS month's Disponible (correct -- it already reduced last month's).

## Sources

### Primary (HIGH confidence)
- Project codebase: `hooks/useMoneyTracker.ts` -- MonthlyData type, calculateDualBalances, migrateData patterns
- Project codebase: `hooks/useTransfers.ts` -- Domain hook pattern (CRUD + filtering)
- Project codebase: `hooks/useInvestmentsTracker.ts` -- Entity with sub-items pattern
- Project codebase: `components/investment-row.tsx` -- Expandable row with dimmed finalized style
- Project codebase: `components/investment-movements.tsx` -- Inline sub-item form in expanded row
- Project codebase: `components/transfer-dialog.tsx` -- Mode toggle dialog pattern
- Project codebase: `components/patrimonio-card.tsx` -- Current patrimonio calculation and tooltip
- Project codebase: `components/expense-tracker.tsx` -- Tab structure (5 tabs currently)

### Secondary (MEDIUM confidence)
- None needed -- all patterns are internal to this project

### Tertiary (LOW confidence)
- None

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - No new libraries, all primitives exist in project
- Architecture: HIGH - Direct pattern replication from investments (Phase 2) and transfers (Phase 9)
- Pitfalls: HIGH - Financial logic is well-defined by user decisions, edge cases documented

**Research date:** 2026-04-02
**Valid until:** 2026-05-02 (stable -- internal patterns only, no external dependencies)
