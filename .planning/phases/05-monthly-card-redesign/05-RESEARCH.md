# Phase 5: Monthly Card Redesign - Research

**Researched:** 2026-04-02
**Domain:** React component decomposition, UI presentation layer, tooltip patterns
**Confidence:** HIGH

## Summary

Phase 5 is a pure presentation-layer refactoring. The current `salary-card.tsx` (670 lines) and `total-amounts.tsx` (77 lines) get split into three focused cards: **Resumen del Mes** (monthly summary), **Patrimonio** (accumulated wealth), and **Configuracion** (employment settings). No new data models, hooks, or calculations are needed — all data is already computed by `useMoneyTracker`, `useSalaryHistory`, `useIncomes`, and `usePayPeriod`. The work is extracting existing JSX into new component files, adding missing line items (otros ingresos, aportes inversiones), extending the existing Radix tooltip pattern to all summary numbers, and applying semantic color conventions.

The main complexity is correctly computing the individual line items for the Resumen card (ingreso fijo, otros ingresos, aguinaldo, gastos, aportes inversiones, disponible) from existing hook data — some of these values are currently bundled in `calculateDualBalances()` and need to be surfaced individually. The Patrimonio card is essentially `total-amounts.tsx` extracted into its own Card wrapper with color adjustments. The Config card extracts all edit-mode state and JSX from `salary-card.tsx`.

**Primary recommendation:** Split salary-card.tsx into three new component files, compute individual line-item values in the parent (expense-tracker.tsx) from existing hook returns, and pass them as simple props. Extend the existing Tooltip pattern for desglose on every number.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Split into 3 separate cards: Resumen del Mes, Patrimonio, Configuracion
- Resumen card gets "Este mes" badge, Patrimonio gets "Historico" badge
- Resumen line items: Ingreso fijo, Otros ingresos, Aguinaldo (when applicable), Gastos, Aportes inversiones, Disponible
- Patrimonio shows: Liquido ARS, Liquido USD, Inversiones ARS, Inversiones USD, Patrimonio Total
- Config card contains: employment type toggle, pay day, cotizacion USD, salary history timeline
- Tooltips on every summary number with formula + actual values
- Patrimonio tooltip shows USD conversion math
- Section headers colored: INGRESOS green, EGRESOS red
- Investment lines in blue, liquid lines neutral/white, total bold white/gold
- USD amounts follow semantic meaning instead of exclusively green

### Claude's Discretion
- Month-over-month patrimonio change indicator (arrow + amount vs previous month)
- Exact badge/chip styling for "Este mes" / "Historico" labels
- Card ordering in the sidebar layout
- Exact tooltip positioning and sizing for formula desgloses
- How to handle edge cases (no income, no expenses, no investments)
- NumberFlow animation on card values (established pattern from Phase 2)

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| CARD-01 | Resumen mensual con desglose claro: Ingresos (fijo + otros) / Egresos (gastos + aportes inversiones) / Disponible | Resumen card component with individual line items computed from existing hook data. See Architecture Patterns for data flow. |
| CARD-02 | Separacion visual explicita "Este mes" vs "Historico" con etiquetas y colores distintos | Card split + Badge component chips ("Este mes" / "Historico"). Badge component already exists at `components/ui/badge.tsx`. |
| CARD-03 | Patrimonio total = Liquido ARS + Liquido USD (convertido) + sum currentValue inversiones activas | Patrimonio card, formula already implemented in `calculateDualBalances()` and `total-amounts.tsx`. Extract into standalone card. |
| CARD-04 | Cada numero muestra tooltip o desglose de como se calcula | Extend existing Radix Tooltip pattern (already on Disponible and Aguinaldo) to all summary numbers. See Code Examples for tooltip patterns. |
| CARD-05 | Colores semanticos: verde ingresos, rojo egresos, azul inversiones | Tailwind color classes applied to section headers and line items. See Architecture Patterns for color mapping. |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React | ^18 | Component framework | Already in project |
| @radix-ui/react-tooltip | ^1.1.3 | Accessible tooltips | Already used for Disponible tooltip |
| @number-flow/react | ^0.6.0 | Animated number transitions | Established in Phase 2, use for card values |
| lucide-react | ^0.454.0 | Icons (Pencil, Check, X, Plus, Trash2) | Already used across all edit patterns |
| class-variance-authority | ^0.7.0 | Badge variant styling | Already used in badge.tsx |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| date-fns | ^4.1.0 | Date formatting for salary timeline | Already used in salary-card.tsx |
| tailwind-merge | ^2.5.4 | Class merging via cn() | Already used project-wide |

### Alternatives Considered
None — this phase uses only existing project dependencies. No new libraries needed.

## Architecture Patterns

### Recommended Component Structure
```
components/
├── resumen-card.tsx         # NEW: Monthly income/expense/available summary
├── patrimonio-card.tsx      # NEW: All-time accumulated wealth display
├── config-card.tsx          # NEW: Employment settings, salary history
├── salary-card.tsx          # DELETED after migration
├── total-amounts.tsx        # DELETED after migration
├── expense-tracker.tsx      # MODIFIED: swap old cards for 3 new ones
├── formatted-amount.tsx     # UNCHANGED: reuse across all cards
└── ui/
    ├── badge.tsx            # UNCHANGED: use for "Este mes"/"Historico" chips
    ├── card.tsx             # UNCHANGED: Card/CardHeader/CardContent/CardTitle
    └── tooltip.tsx          # UNCHANGED: TooltipProvider/Trigger/Content
```

### Pattern 1: Data Computation in Parent, Dumb Card Components

**What:** Compute all individual line-item values in `expense-tracker.tsx` from existing hook returns, pass as simple typed props to each card. Cards are pure display components with minimal state (only edit-mode UI state).

**When to use:** Always for this refactor. The data already exists in hooks — cards should not re-derive it.

**Key data sources for Resumen card line items:**
```typescript
// In expense-tracker.tsx, compute from existing hook returns:

// Ingreso fijo — already available
const ingresoFijo = getSalaryForMonth(selectedMonth, monthlyData.salaryOverrides || {});

// Otros ingresos — sum of filteredIncomes (ExtraIncome[]) for ARS
const otrosIngresos = filteredIncomes
  .filter(i => i.currencyType !== CurrencyType.USD)
  .reduce((sum, i) => sum + i.amount, 0);

// Aguinaldo — already computed via getAguinaldoForMonth()

// Gastos — totalExpenses already available from useExpensesTracker

// Aportes inversiones (this month) — needs computation:
// Sum of aporte movements in ARS date range for current month
const aportesInversiones = (monthlyData.investments || [])
  .flatMap(inv => inv.currencyType !== CurrencyType.USD
    ? inv.movements.filter(m => m.type === "aporte" && isInRange(m.date))
    : []
  )
  .reduce((sum, m) => sum + m.amount, 0);

// Disponible — availableMoney (arsBalance from calculateDualBalances)
```

**Why this pattern:** Keeps each card under ~150 lines. All three cards receive pre-computed numbers. Edit interactions (Config card) pass callbacks up.

### Pattern 2: Tooltip Desglose on Every Number

**What:** Wrap every summary number in a `<Tooltip>` with formula breakdown showing names AND actual values.

**When to use:** Every numeric display in Resumen and Patrimonio cards.

**Example tooltip content:**
- **Disponible:** "Ingreso fijo $500.000 + Otros ingresos $50.000 + Aguinaldo $0 - Gastos $250.000 - Aportes inv. $50.000 = $250.000"
- **Patrimonio:** "Liq ARS $300.000 + Liq USD US$500 x $1.200 = $600.000 + Inv ARS $100.000 + Inv USD US$200 x $1.200 = $240.000 = $1.240.000"
- **Otros ingresos:** "Freelance $30.000 + Venta $20.000 = $50.000" (itemized)

### Pattern 3: Semantic Color Mapping

**What:** Consistent Tailwind color classes for financial categories.

| Element | Color Classes |
|---------|--------------|
| "INGRESOS" section header | `text-green-600 dark:text-green-400` |
| "EGRESOS" section header | `text-red-600 dark:text-red-400` |
| Income line amounts | `text-green-600 dark:text-green-400` (positive) |
| Expense line amounts | `text-red-500` (negative) |
| Investment lines (aportes, patrimonio inv rows) | `text-blue-500 dark:text-blue-400` |
| Patrimonio liquid lines | Default text color (neutral) |
| Patrimonio total | `font-bold` (white/foreground) |
| "Este mes" badge | Green variant background |
| "Historico" badge | Blue or slate variant background |

### Pattern 4: Badge Chips for Card Identity

**What:** Use existing `Badge` component from `components/ui/badge.tsx` in CardHeader alongside title.

```tsx
<CardHeader className="flex flex-row items-center justify-between">
  <CardTitle>Resumen del Mes</CardTitle>
  <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
    Este mes
  </Badge>
</CardHeader>
```

### Anti-Patterns to Avoid
- **Re-deriving data in card components:** Cards should NOT call calculateDualBalances() or access monthlyData directly. Parent computes, cards display.
- **Monolithic card component:** Do NOT merge all three cards back into one file. The whole point is separation of concerns.
- **Inconsistent tooltip implementation:** Do NOT mix inline title attributes with Radix Tooltip. Use Radix Tooltip consistently everywhere.
- **Forgetting dark mode:** Every color must have both light and dark variants using Tailwind's `dark:` prefix.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Tooltip accessibility | Custom hover divs | @radix-ui/react-tooltip | Handles focus, screen readers, positioning, escape key |
| Number formatting | Custom toLocaleString wrapper | FormattedAmount component | Already handles hydration guard for SSR |
| Badge variants | Custom styled divs | Badge component (badge.tsx) | Already has CVA variants, consistent styling |
| Number animations | CSS transitions on numbers | @number-flow/react | Already established in Phase 2, handles digit morphing |

**Key insight:** Every UI primitive needed already exists in the project. This phase creates zero new UI primitives — only new compositions of existing ones.

## Common Pitfalls

### Pitfall 1: Missing Investment Contributions Line Item
**What goes wrong:** The Resumen card needs "Aportes inversiones" as a separate line, but `totalExpenses` only sums Expense[] records, not investment movements. Current `availableMoney` (arsBalance) already includes investment deductions, but there's no separate `aportesInversiones` value exposed.
**Why it happens:** Investment movement impact is computed inline inside `calculateDualBalances()` but not returned as a separate value.
**How to avoid:** Either (a) extend `calculateDualBalances()` to also return `arsInvestmentContributions` and `arsInvestmentWithdrawals`, or (b) compute it separately in `expense-tracker.tsx` using the same filter logic. Option (a) is cleaner.
**Warning signs:** Disponible tooltip formula doesn't add up to the displayed Disponible number.

### Pitfall 2: Tooltip Content Overflow
**What goes wrong:** Long formula tooltips (especially Patrimonio with USD conversion) overflow the viewport or get cut off.
**Why it happens:** Radix Tooltip default positioning doesn't account for long content.
**How to avoid:** Use `className="max-w-sm"` on TooltipContent and break formulas into multiple `<p>` lines. Use `side="left"` or `side="bottom"` when needed.
**Warning signs:** Tooltip text wraps unreadably or clips on small screens.

### Pitfall 3: Props Explosion on Config Card
**What goes wrong:** Config card needs ~15 props (all the edit handlers from salary-card.tsx), making the interface unwieldy.
**Why it happens:** All salary history, employment config, and cotizacion USD editing lives in one card.
**How to avoid:** Group related props into objects: `salaryHistoryProps: { entries, onAdd, onUpdate, onDelete }`, `incomeConfigProps: { config, onUpdate }`, `rateProps: { globalUsdRate, onSet }`.
**Warning signs:** Config card props interface exceeds 20 individual props.

### Pitfall 4: Breaking Pendiente de Cobro Logic
**What goes wrong:** Pendiente de cobro banner currently depends on `viewMode`, `selectedMonth`, `incomeConfig.payDay` — computed inside salary-card.tsx. If extracted incorrectly, it stops showing.
**Why it happens:** The banner condition uses `new Date()` for current day comparison.
**How to avoid:** Keep the computation in the Resumen card (it's display logic, not data), or compute `isPendiente` in the parent and pass as boolean prop.
**Warning signs:** Banner doesn't appear when viewing current month before pay day.

### Pitfall 5: Hydration Mismatch on Badge Colors
**What goes wrong:** Badge colors using dark mode classes may flash on initial render if theme is applied client-side.
**Why it happens:** next-themes applies the theme class client-side, causing hydration mismatch.
**How to avoid:** Use the same approach as existing components — `dark:` prefix classes are fine because next-themes handles this via `<html class="dark">`. No special hydration guard needed for colors (only for locale-dependent number formatting, already handled by FormattedAmount).
**Warning signs:** Brief flash of wrong badge color on page load.

## Code Examples

### Resumen Card Props Interface
```typescript
interface ResumenCardProps {
  // Line items (pre-computed by parent)
  ingresoFijo: number;
  ingresoFijoIsOverride: boolean;
  otrosIngresos: number;
  aguinaldoAmount: number | null;
  aguinaldoInfo: { bestSalary: number; isOverride: boolean } | null;
  totalGastos: number;
  aportesInversiones: number;
  disponible: number;
  // Pendiente de cobro
  isPendiente: boolean;
  payDay: number;
  // Aguinaldo preview (May/November)
  aguinaldoPreview: { estimatedAmount: number; bestSalary: number; targetMonth: string } | null;
  // Aguinaldo edit callbacks
  onSetAguinaldoOverride: (monthKey: string, amount: number) => void;
  onClearAguinaldoOverride: (monthKey: string) => void;
  selectedMonth: string;
}
```

### Patrimonio Card Props Interface
```typescript
interface PatrimonioCardProps {
  arsBalance: number;      // Liquid ARS
  usdBalance: number;      // Liquid USD (native)
  arsInvestments: number;  // Active ARS investment current values
  usdInvestments: number;  // Active USD investment current values
  globalUsdRate: number;   // For conversion display
}
```

### Config Card Props Interface
```typescript
interface ConfigCardProps {
  // Employment config
  incomeConfig: IncomeConfig;
  onUpdateIncomeConfig: (config: IncomeConfig) => void;
  // Cotizacion USD
  globalUsdRate: number;
  onSetGlobalUsdRate: (rate: number) => void;
  // Salary history
  salaryHistory: SalaryEntry[];
  onAddSalaryEntry: (entry: Omit<SalaryEntry, "id">) => void;
  onUpdateSalaryEntry: (id: string, updates: Partial<SalaryEntry>) => void;
  onDeleteSalaryEntry: (id: string) => void;
  selectedMonth: string;
}
```

### Tooltip Desglose Pattern (extending existing)
```tsx
// Existing pattern from salary-card.tsx line 438-451:
<Tooltip>
  <TooltipTrigger className="w-full">
    <div className="flex justify-between w-full">
      <span>Disponible:</span>
      <span className="font-medium text-green-500">
        <FormattedAmount value={disponible} currency="ARS" />
      </span>
    </div>
  </TooltipTrigger>
  <TooltipContent className="max-w-xs">
    <p className="font-bold mb-1">Disponible = Ingresos - Egresos</p>
    <p>Ingreso fijo: <FormattedAmount value={ingresoFijo} currency="$" /></p>
    <p>+ Otros ingresos: <FormattedAmount value={otrosIngresos} currency="$" /></p>
    {aguinaldoAmount != null && (
      <p>+ Aguinaldo: <FormattedAmount value={aguinaldoAmount} currency="$" /></p>
    )}
    <p>- Gastos: <FormattedAmount value={totalGastos} currency="$" /></p>
    <p>- Aportes inv.: <FormattedAmount value={aportesInversiones} currency="$" /></p>
    <hr className="my-1 border-border" />
    <p className="font-bold">= <FormattedAmount value={disponible} currency="$" /></p>
  </TooltipContent>
</Tooltip>
```

### Patrimonio Tooltip with USD Conversion Math
```tsx
<TooltipContent className="max-w-sm">
  <p className="font-bold mb-1">Patrimonio Total</p>
  <p>Liquido ARS: <FormattedAmount value={arsBalance} currency="$" /></p>
  <p>Liquido USD: US$ {usdBalance.toLocaleString()} x ${globalUsdRate.toLocaleString()} = <FormattedAmount value={usdBalance * globalUsdRate} currency="$" /></p>
  <p className="text-blue-400">Inv. ARS: <FormattedAmount value={arsInvestments} currency="$" /></p>
  <p className="text-blue-400">Inv. USD: US$ {usdInvestments.toLocaleString()} x ${globalUsdRate.toLocaleString()} = <FormattedAmount value={usdInvestments * globalUsdRate} currency="$" /></p>
  <hr className="my-1 border-border" />
  <p className="font-bold">= <FormattedAmount value={patrimonio} currency="$" /></p>
</TooltipContent>
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Single monolithic salary-card.tsx (670 lines) | 3 focused cards (~150 lines each) | Phase 5 | Better maintainability, clearer mental model |
| TotalAmounts as CardContent only (no own Card wrapper) | Patrimonio as standalone Card with badge | Phase 5 | Consistent card structure, visual identity |
| Disponible-only tooltip | Every number has formula tooltip | Phase 5 | Full transparency — user can verify any number |
| USD amounts always green | Semantic colors by financial category | Phase 5 | Blue for investments, green for income, red for expenses |

## Open Questions

1. **Month-over-month patrimonio change indicator**
   - What we know: User left this as Claude's Discretion. Could show arrow + delta amount vs previous month.
   - What's unclear: Need access to previous month's patrimonio. Currently `calculateDualBalances()` only computes current selected month. Would need to call it twice (current + previous) or cache results.
   - Recommendation: Include a subtle "+$X vs mes anterior" line below Patrimonio Total if computation is simple. Otherwise defer — not a requirement.

2. **Aportes inversiones value not currently exposed**
   - What we know: Investment movement impact is computed inside `calculateDualBalances()` (lines 332-348 of useMoneyTracker.ts) but not returned as a separate value.
   - What's unclear: Whether to extend the return type of `calculateDualBalances()` or compute separately.
   - Recommendation: Extend `calculateDualBalances()` to return `{ arsBalance, usdBalance, arsInvestments, usdInvestments, arsInvestmentContributions }` — minimal change, clean separation.

3. **Otros ingresos total not currently a separate value**
   - What we know: `filteredIncomes` (ExtraIncome[]) is available from `useIncomes` hook but the ARS-only sum is not pre-computed.
   - What's unclear: Where to compute it — parent or Resumen card.
   - Recommendation: Compute in parent (`expense-tracker.tsx`) and pass as prop. Simple reduce on `filteredIncomes`.

## Sources

### Primary (HIGH confidence)
- Direct codebase analysis: `components/salary-card.tsx` (670 lines), `components/total-amounts.tsx` (77 lines), `components/expense-tracker.tsx` (rendering layout), `hooks/useMoneyTracker.ts` (data computation)
- `components/ui/badge.tsx` — existing Badge component with CVA variants
- `components/ui/tooltip.tsx` — existing Radix tooltip wrapper
- `package.json` — confirmed all dependencies already installed

### Secondary (MEDIUM confidence)
- Radix UI Tooltip API — based on project usage patterns and @radix-ui/react-tooltip ^1.1.3

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - all libraries already in project, no new dependencies
- Architecture: HIGH - pure component decomposition of existing code, clear data flow
- Pitfalls: HIGH - identified from direct code analysis of current implementation

**Research date:** 2026-04-02
**Valid until:** 2026-05-02 (stable — presentation layer only, no external API dependencies)
