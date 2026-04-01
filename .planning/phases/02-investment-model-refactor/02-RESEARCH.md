# Phase 2: Investment Model Refactor - Research

**Researched:** 2026-04-01
**Domain:** React data model refactor, localStorage state migration, inline editing UI patterns
**Confidence:** HIGH

## Summary

This phase transforms investments from flat one-off transaction records into account-like entities with movements (aportes/retiros), tracked current values, performance metrics (gain/loss, %), and type-specific behavior (Plazo Fijo auto-calculation, currency enforcement). The current `Investment` interface is a simple record with `{id, date, name, amount, type, status, expectedEndDate, usdRate, currencyType}` stored in `MonthlyData.investments[]`. The refactor replaces this with a richer model containing `movements[]`, `currentValue`, `lastUpdated`, and PF-specific fields (`tna`, `plazoDias`, `startDate`).

The codebase is a Next.js 14 app using React 18, Radix UI primitives, Tailwind CSS, date-fns, and localStorage persistence via a custom `useLocalStorage` hook with migration support. All state flows through `useMoneyTracker` -> domain hooks -> localStorage. The investment hook (`useInvestmentsTracker`) and its UI components (`investments-table.tsx`, `investment-dialog.tsx`) will be heavily refactored. One new dependency is needed: `@number-flow/react` for animated number transitions.

**Primary recommendation:** Redesign the `Investment` interface first, write a localStorage migration function, then build the UI layer (expandable rows, inline edit, finalization) on top of the new model. The migration function in `migrateData()` already exists as a pattern -- extend it to handle the schema change.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **Movement registration**: Expandable row pattern -- click investment row to expand, revealing movement history + inline add form. Movements have: date, type (aporte/retiro), amount. Date defaults to today. Movements affect monthly liquidity immediately. Show last 5 movements (most recent first) with "ver todo" link. Inline form: [Fecha] [Monto] [Aporte|Retiro] [+]
- **Inline value update**: Click-to-edit on "Valor Actual" cell -- text display, click turns to input, Enter/blur saves. Gain/loss recalculates instantly. Use NumberFlow library for animated transitions. "Value outdated" warning (>7 days): small orange/yellow badge. Plazo Fijo value is read-only (auto-calculated from TNA)
- **Finalization flow**: "Finalizar" button per active row. One-click opens confirmation dialog. On confirm: auto-creates retiro movement for currentValue, sets status "Finalizada", zeroes currentValue. Permanent -- no reactivation. Finalized rows dimmed/reduced opacity + "Finalizada" badge. Final gain/loss visible on dimmed rows
- **Plazo Fijo specific**: At creation, type=PF shows TNA (%) and Plazo (dias) fields. Currency forced to ARS. Formula: Value = Capital x (1 + TNA/365 x dias) -- simple interest. TNA/plazo editable in expanded row. "Vencido" badge when today > start date + plazo days
- **Currency enforcement**: Crypto=USD always, Plazo Fijo=ARS always, FCI=user choice (ARS/USD), Acciones=user choice

### Claude's Discretion
- Exact styling for dimmed finalized rows (opacity level, color treatment)
- Animation/transition details for expandable rows
- Exact placement of badges (Desactualizado, Vencido, Finalizada)
- How "ver todo" displays full movement history (inline expand vs scrollable)
- NumberFlow configuration details
- Investment creation dialog layout adjustments for the new fields

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| INV-01 | User puede crear inversion como cuenta con nombre, tipo, moneda base y status | New Investment interface with name, type, currencyType, status fields. Currency enforcement per type. Dialog conditional fields for PF |
| INV-02 | User puede registrar aportes que restan del liquido del mes | Movement model with type="aporte". Expandable row inline form. calculateTotalAvailable must sum movements per month |
| INV-03 | User puede registrar retiros que vuelven al liquido del mes | Movement model with type="retiro". Same inline form with toggle. Retiro adds back to liquidity |
| INV-04 | User puede actualizar valor actual inline | Click-to-edit pattern on "Valor Actual" cell. NumberFlow for animated transitions. Local state for edit mode |
| INV-05 | User puede finalizar inversion (retiro total + status Finalizada + currentValue 0) | Finalization dialog, auto-retiro movement creation, status change, value zeroing |
| INV-06 | User ve ganancia/perdida y rendimiento % por cada inversion | Computed from currentValue vs totalInvested (sum of aportes - retiros). Display in table columns |
| INV-07 | User ve aviso "valor desactualizado" si lastUpdated > 7 dias | Badge component with date comparison. differenceInDays from date-fns |
| INV-08 | Plazo Fijo auto-calcula valor segun tasa y dias transcurridos | Formula: Capital x (1 + TNA/365 x dias). PF-specific fields (tna, plazoDias). Read-only value cell |
| INV-09 | Crypto=USD, FCI=ARS/USD, PF=ARS, Acciones=user choice | Currency enforcement logic in dialog and creation handler. Type-to-currency mapping |
| INV-10 | Tabla muestra: nombre, tipo, capital invertido, valor actual, ganancia, %, ultima actualizacion, acciones | New table columns replacing current simple table. Expandable rows for movements |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React | ^18 | UI framework | Already installed, project standard |
| Next.js | 14.2.16 | App framework | Already installed, project standard |
| date-fns | ^4.1.0 | Date manipulation (differenceInDays, addDays, format) | Already installed, used throughout codebase |
| @number-flow/react | 0.6.0 | Animated number transitions for gain/loss recalculation | User decision -- supports React 18, zero dependencies |

### Supporting (already installed)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @radix-ui/react-dialog | ^1.1.2 | Finalization confirmation dialog | Finalization flow |
| lucide-react | ^0.454.0 | Icons (ChevronDown, ChevronUp for expand, AlertTriangle for warnings) | Expandable row toggles, badge icons |
| class-variance-authority | ^0.7.0 | Badge variants for status indicators | Finalizada, Vencido, Desactualizado badges |
| tailwind-merge + clsx (cn utility) | installed | Conditional class merging | Dimmed rows, active edit states |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| @number-flow/react | react-countup, framer-motion AnimatePresence | NumberFlow is user's locked decision; lightweight, zero-dep, purpose-built |
| Click-to-edit custom | react-contenteditable or Radix inline edit | No library needed -- simple input/text toggle with local state is cleaner |
| Expandable rows custom | @tanstack/table with expanding | Overkill -- current table is Radix UI primitives, simple state toggle sufficient |

**Installation:**
```bash
npm install @number-flow/react
```

## Architecture Patterns

### Recommended Project Structure
```
hooks/
├── useMoneyTracker.ts          # Updated Investment interface + migration
├── useInvestmentsTracker.ts    # Heavily refactored -- movements, value tracking, finalization
components/
├── investments-table.tsx       # Rewritten -- expandable rows, new columns, inline edit
├── investment-dialog.tsx       # Extended -- PF fields, currency enforcement
├── investment-row.tsx          # NEW -- single investment row with expand/collapse
├── investment-movements.tsx    # NEW -- movement list + inline add form (expanded content)
├── investment-value-cell.tsx   # NEW -- click-to-edit cell with NumberFlow
constants/
├── investments.ts              # Existing -- may add currency mapping
```

### Pattern 1: New Investment Data Model
**What:** Replace flat Investment record with account-like entity
**When to use:** Foundation for all other patterns in this phase
```typescript
// New Investment interface
interface InvestmentMovement {
  id: string;
  date: string;          // yyyy-MM-dd
  type: "aporte" | "retiro";
  amount: number;
}

interface Investment {
  id: string;
  name: string;
  type: InvestmentType;  // "Plazo Fijo" | "FCI" | "Crypto" | "Acciones"
  currencyType: CurrencyType;
  status: "Activa" | "Finalizada";
  movements: InvestmentMovement[];
  currentValue: number;
  lastUpdated: string;   // ISO date string
  // PF-specific (optional, only for Plazo Fijo)
  tna?: number;          // Annual nominal rate as percentage
  plazoDias?: number;    // Term in days
  startDate?: string;    // PF start date for calculation
  createdAt: string;     // When the investment was created
}
```

### Pattern 2: localStorage Data Migration
**What:** Migrate existing Investment[] to new schema without data loss
**When to use:** On app load, via existing `migrateData()` in useMoneyTracker
```typescript
function migrateData(data: MonthlyData): MonthlyData {
  return {
    ...data,
    // ... existing migrations ...
    investments: (data.investments || []).map((investment: any) => ({
      ...investment,
      currencyType: investment.currencyType || CurrencyType.ARS,
      // New fields with safe defaults
      movements: investment.movements || [{
        id: crypto.randomUUID(),
        date: investment.date,
        type: "aporte" as const,
        amount: investment.amount,
      }],
      currentValue: investment.currentValue ?? investment.amount,
      lastUpdated: investment.lastUpdated || investment.date,
      createdAt: investment.createdAt || investment.date,
    })),
  };
}
```

### Pattern 3: Expandable Row with Local State
**What:** Toggle expanded state per row, render movement content below
**When to use:** Investment table rows
```typescript
// In investments-table or parent component
const [expandedId, setExpandedId] = useState<string | null>(null);

// Render pattern: for each investment, render main row + conditional expanded row
{investments.map((inv) => (
  <React.Fragment key={inv.id}>
    <TableRow onClick={() => setExpandedId(expandedId === inv.id ? null : inv.id)}>
      {/* main columns */}
    </TableRow>
    {expandedId === inv.id && (
      <TableRow>
        <TableCell colSpan={8}>
          <InvestmentMovements investment={inv} onAddMovement={...} />
        </TableCell>
      </TableRow>
    )}
  </React.Fragment>
))}
```

### Pattern 4: Click-to-Edit Cell
**What:** Inline editing for currentValue -- text display toggles to input on click
**When to use:** "Valor Actual" column for non-PF investments
```typescript
function InvestmentValueCell({ investment, onUpdate }: Props) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(investment.currentValue);
  const isPF = investment.type === "Plazo Fijo";

  const handleSave = () => {
    setEditing(false);
    onUpdate(investment.id, value);
  };

  if (isPF) {
    // Read-only, auto-calculated
    return <NumberFlow value={calculatePFValue(investment)} />;
  }

  if (editing) {
    return (
      <Input
        type="number"
        value={value}
        onChange={(e) => setValue(Number(e.target.value))}
        onKeyDown={(e) => e.key === "Enter" && handleSave()}
        onBlur={handleSave}
        autoFocus
      />
    );
  }

  return (
    <span onClick={() => setEditing(true)} className="cursor-pointer">
      <NumberFlow value={investment.currentValue} />
    </span>
  );
}
```

### Pattern 5: Plazo Fijo Auto-Calculation
**What:** Simple interest formula matching Argentine banking practice
**When to use:** Whenever a PF investment's current value is displayed
```typescript
function calculatePFValue(investment: Investment): number {
  if (!investment.tna || !investment.plazoDias || !investment.startDate) {
    return investment.currentValue;
  }
  const totalInvested = investment.movements
    .reduce((sum, m) => m.type === "aporte" ? sum + m.amount : sum - m.amount, 0);
  const elapsedDays = differenceInDays(new Date(), new Date(investment.startDate));
  const daysToUse = Math.min(elapsedDays, investment.plazoDias);
  return totalInvested * (1 + (investment.tna / 100) / 365 * daysToUse);
}
```

### Pattern 6: Movement-Based Liquidity Calculation
**What:** Replace flat `investment.amount` in liquidity calc with movement sums per month
**When to use:** calculateTotalAvailable in useMoneyTracker
```typescript
// Instead of summing investment.amount for the month:
const monthlyInvestmentImpact = (monthlyData.investments || [])
  .filter((inv) => inv.status === "Activa")
  .flatMap((inv) => inv.movements)
  .filter((mov) => mov.date.startsWith(monthKey))
  .reduce((sum, mov) => {
    return mov.type === "aporte" ? sum + mov.amount : sum - mov.amount;
  }, 0);
```

### Anti-Patterns to Avoid
- **Storing computed values:** Don't persist gain/loss or percentage -- compute from currentValue and sum of movements at render time
- **Filtering investments by date:** Current code filters investments by date to show "this month's investments." The new model should show ALL active investments regardless of creation date (they're persistent accounts, not monthly transactions). Monthly filtering applies only to movements for liquidity calculation
- **Mutating movements array directly:** Always create new arrays when adding/removing movements (React immutability)
- **Coupling PF calculation to render:** Extract PF value calculation to a pure function, don't embed formula in JSX

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Animated number transitions | Custom CSS transitions on number changes | @number-flow/react `<NumberFlow value={n} />` | Handles digit-by-digit animation, locale formatting, accessibility |
| Date difference calculations | Manual day counting | date-fns `differenceInDays`, `addDays` | Already in project, handles edge cases (DST, leap years) |
| Dialog/modal for finalization | Custom modal | Existing Radix UI Dialog component | Already used throughout project, accessible, focus-trapped |
| Badge status indicators | Custom styled spans | Existing `<Badge>` component with new variants | CVA-based, consistent with existing UI |

**Key insight:** This phase is primarily a data model and UI pattern change, not a library-heavy feature. The only new dependency is NumberFlow. Everything else uses existing project infrastructure.

## Common Pitfalls

### Pitfall 1: Data Migration Breaks Existing Users
**What goes wrong:** Changing the Investment interface without migration causes existing localStorage data to crash the app on load
**Why it happens:** Old records lack `movements[]`, `currentValue`, `lastUpdated` fields
**How to avoid:** The `migrateData()` function in `useMoneyTracker.ts` already runs on every load. Extend it to convert old flat investments to the new model: create a single "aporte" movement from the old `amount`, set `currentValue = amount`, set `lastUpdated = date`
**Warning signs:** App crashes or shows blank data after deploying the refactor

### Pitfall 2: Monthly Filtering vs Account Persistence
**What goes wrong:** Current `filteredInvestments` filters by date within the selected month. New model treats investments as persistent accounts -- showing only "this month's investments" hides active investments created in prior months
**Why it happens:** Old model stored investments as one-off transactions tied to a month
**How to avoid:** Change filtering: show ALL active investments (+ finalized ones dimmed) regardless of month. Only movements are filtered by month for liquidity calculation
**Warning signs:** User creates investment in January, switches to February, investment disappears

### Pitfall 3: Finalization Creates Orphan Movement
**What goes wrong:** Finalization auto-creates a retiro movement but doesn't properly account for it in liquidity
**Why it happens:** The retiro must be dated to the current month and must add back to liquidity
**How to avoid:** Finalization handler: (1) create retiro movement with today's date, (2) set status to "Finalizada", (3) set currentValue to 0. The retiro movement naturally adds to the month's liquidity through the movement-based calculation
**Warning signs:** Finalizing an investment doesn't return money to available balance

### Pitfall 4: NumberFlow Hydration Mismatch
**What goes wrong:** Server-rendered value differs from client-calculated value, causing hydration error
**Why it happens:** Next.js SSR renders a different number than client-side calculation
**How to avoid:** Wrap NumberFlow in hydration check (project already uses `useHydration()` hook pattern). Render placeholder during SSR, NumberFlow only on client
**Warning signs:** React hydration warnings in console

### Pitfall 5: Plazo Fijo Calculation Drift
**What goes wrong:** PF value shows different results depending on when user views it (because it's based on elapsed days)
**Why it happens:** The formula uses `new Date()` which changes every day
**How to avoid:** This is actually correct behavior -- PF value grows daily. But ensure: (1) the displayed value clearly auto-updates, (2) `lastUpdated` for PF is NOT set by the auto-calc (it's always "current"), (3) "Desactualizado" badge should NOT appear for PF since value is always current

### Pitfall 6: Currency Enforcement Not Preventing User Override
**What goes wrong:** User selects Crypto type but then changes currency to ARS
**Why it happens:** Currency select is not disabled/hidden when type enforces currency
**How to avoid:** In the investment dialog: when type changes, if type has forced currency, (1) set currency value programmatically, (2) disable the currency select. Map: `{ "Crypto": "USD", "Plazo Fijo": "ARS", "FCI": null, "Acciones": null }`

## Code Examples

### NumberFlow Basic Usage
```typescript
// Source: https://number-flow.barvian.me/
import NumberFlow from '@number-flow/react';

// Basic animated number
<NumberFlow value={123456.78} />

// With formatting (Intl.NumberFormat options)
<NumberFlow
  value={investment.currentValue}
  format={{ style: 'currency', currency: 'ARS' }}
/>

// With prefix for currency symbol
<NumberFlow value={gainLoss} prefix="$" />

// Group multiple related numbers for synchronized animation
import { NumberFlowGroup } from '@number-flow/react';
<NumberFlowGroup>
  <NumberFlow value={currentValue} />
  <NumberFlow value={gainLossPercent} suffix="%" />
</NumberFlowGroup>
```

### Gain/Loss Calculation
```typescript
function calculateGainLoss(investment: Investment) {
  const totalInvested = investment.movements.reduce((sum, m) => {
    return m.type === "aporte" ? sum + m.amount : sum - m.amount;
  }, 0);

  const gainLoss = investment.currentValue - totalInvested;
  const percentage = totalInvested > 0
    ? ((investment.currentValue - totalInvested) / totalInvested) * 100
    : 0;

  return { totalInvested, gainLoss, percentage };
}
```

### Value Outdated Check
```typescript
import { differenceInDays } from 'date-fns';

function isValueOutdated(investment: Investment): boolean {
  if (investment.type === "Plazo Fijo") return false; // Auto-calculated
  if (investment.status === "Finalizada") return false;
  return differenceInDays(new Date(), new Date(investment.lastUpdated)) > 7;
}
```

### Plazo Fijo Vencido Check
```typescript
import { addDays, isAfter } from 'date-fns';

function isPlazoFijoVencido(investment: Investment): boolean {
  if (investment.type !== "Plazo Fijo" || !investment.startDate || !investment.plazoDias) {
    return false;
  }
  const endDate = addDays(new Date(investment.startDate), investment.plazoDias);
  return isAfter(new Date(), endDate);
}
```

### Currency Enforcement Map
```typescript
const CURRENCY_ENFORCEMENT: Record<InvestmentType, CurrencyType | null> = {
  "Crypto": CurrencyType.USD,
  "Plazo Fijo": CurrencyType.ARS,
  "FCI": null,       // User choice
  "Acciones": null,   // User choice
};
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Investment as flat transaction | Investment as account with movements | This phase | Complete data model redesign |
| Filter investments by month | Show all active investments, filter movements by month | This phase | Investments persist across months |
| Edit via modal dialog | Inline edit for value, expandable row for movements | This phase | More direct manipulation UX |
| Manual status tracking | Auto-finalization with movement generation | This phase | Consistent accounting |

## Open Questions

1. **Investments array location in MonthlyData**
   - What we know: Currently `investments` lives inside `MonthlyData` which is keyed by month. But investments are now persistent accounts, not monthly.
   - What's unclear: Should investments be stored separately from MonthlyData (own localStorage key), or kept inside but filtered differently?
   - Recommendation: Move investments to a separate localStorage key (e.g., `"investments"`) with their own `useLocalStorage` instance. This avoids the conceptual mismatch of monthly-scoped data containing persistent accounts. Movements naturally carry dates for monthly filtering. This is the cleanest approach but requires more refactoring of useMoneyTracker.

2. **Investment removal from MonthlyData structure**
   - What we know: MonthlyData currently has `{ salaries, expenses, extraIncomes, investments }`. If investments become a separate store, MonthlyData loses the investments field.
   - What's unclear: How much of useMoneyTracker's interface changes ripple through the app
   - Recommendation: Keep investments in MonthlyData for now to minimize refactoring scope. The filtering change (show all active, not just current month) can be done within the existing structure. A separate store is cleaner but higher risk for Phase 2.

3. **"Ver todo" movement history display**
   - What we know: Expanded row shows last 5 movements, "ver todo" shows all
   - What's unclear: Exact UX -- scrollable list in expanded area vs separate dialog
   - Recommendation: Scrollable expanded area with max-height (Claude's discretion area). Start with simple approach, enhance later if needed.

## Sources

### Primary (HIGH confidence)
- Codebase analysis: `hooks/useMoneyTracker.ts`, `hooks/useInvestmentsTracker.ts`, `components/investments-table.tsx`, `components/investment-dialog.tsx` -- current implementation fully read
- NumberFlow official site: https://number-flow.barvian.me/ -- API, usage, capabilities
- npm registry: `@number-flow/react@0.6.0` -- version, peer deps (React ^18 || ^19)
- date-fns: already in project at ^4.1.0 -- `differenceInDays`, `addDays`, `isAfter` all available

### Secondary (MEDIUM confidence)
- Argentine Plazo Fijo simple interest formula: Capital x (1 + TNA/365 x dias) -- standard banking practice, confirmed by user decision

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - all libraries already installed except NumberFlow (verified compatible)
- Architecture: HIGH - full codebase read, patterns understood, migration path clear
- Pitfalls: HIGH - identified from actual code analysis (monthly filtering, migration, hydration)

**Research date:** 2026-04-01
**Valid until:** 2026-05-01 (stable domain, no fast-moving dependencies)
