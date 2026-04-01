# Phase 3: Dual Currency Engine - Research

**Researched:** 2026-04-01
**Domain:** Dual-currency financial tracking (ARS/USD) with real separated balances
**Confidence:** HIGH

## Summary

Phase 3 transforms the app from "everything stored as ARS with a visual USD conversion" to "real separated ARS and USD balances that reflect actual currency holdings." Currently, all amounts (even USD-denominated ones) are converted to ARS at input time via `amount * usdRate`, losing the original USD amount. The usdRate field exists on transactions but is only used for display/conversion -- it does not drive any real balance separation.

The core change is architectural: introduce a **global USD exchange rate** setting, maintain **separate ARS and USD liquid balances** computed from transaction history, support **USD purchase operations** (ARS->USD conversion that preserves total patrimonio), and calculate **exchange gain/loss** per USD purchase by comparing purchase rate vs current global rate. Every transaction must record the exchange rate at creation time, and that rate must be retroactively editable.

**Primary recommendation:** Add a `globalUsdRate` field to localStorage (top-level, not per-month), refactor balance calculations to split ARS vs USD flows, add a "Comprar USD" operation as a new transaction type, and build exchange gain/loss as a derived calculation from USD purchase history.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| MON-01 | User tiene saldos reales separados en ARS y USD (no solo conversion visual) | Balance calculation refactor: stop converting USD->ARS at input, maintain parallel balance accumulators |
| MON-02 | Cada transaccion guarda la cotizacion USD del momento en que se registro | Already partially implemented (usdRate field exists on Expense, ExtraIncome, salary). Needs enforcement on ALL transactions and storage of original amount in original currency |
| MON-03 | User puede configurar cotizacion global actual para calcular patrimonio total en ARS | New `globalUsdRate` field in localStorage + Settings UI to edit it |
| MON-04 | User puede comprar USD desde saldo ARS (resta ARS, suma USD, patrimonio no cambia) | New "USD Purchase" transaction type: records ARS spent, USD received, rate used |
| MON-05 | User puede registrar USD de efectivo no trackeado (suma USD sin restar ARS, con origen explicito) | New "Untracked USD" income type: adds to USD balance with mandatory origin/description field |
| MON-06 | User ve ganancia/perdida cambiaria automatica (cotizacion de compra vs global actual) | Derived calculation: for each USD purchase, `(currentGlobalRate - purchaseRate) * usdAmount` |
| MON-07 | User puede editar cotizacion USD retroactivamente si la cargo mal | Edit capability on existing usdRate field for all transaction types |
| MON-08 | Validacion: cotizacion USD siempre > 0, monto siempre > 0 | Form validation already partially exists (Phase 1 added validateField). Extend to all currency forms |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React (hooks) | ^18 | State management for dual balances | Already in use, no new dependency needed |
| localStorage | Browser API | Persist globalUsdRate and USD purchases | Already the persistence layer |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @number-flow/react | ^0.6.0 | Animated number display for balances | Already installed, use for currency displays |
| date-fns | ^4.1.0 | Date handling for transaction timestamps | Already installed |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Manual balance calculation | Dedicated accounting library (e.g., dinero.js) | Overkill for this app -- simple arithmetic with rounding is sufficient for personal tracker |
| Floating point arithmetic | Integer cents representation | Would require migrating all existing data; not worth it for personal use. Use `Math.round(x * 100) / 100` for display |

**Installation:**
No new packages needed. All required dependencies already installed.

## Architecture Patterns

### Current Data Model (What Exists)

```typescript
// Current: amounts converted to ARS at input
interface Expense {
  amount: number;       // ALWAYS in ARS (USD * usdRate)
  usdRate: number;      // Exchange rate at time of entry
  currencyType: CurrencyType; // ARS or USD (but amount is always ARS)
}

// Salary: always ARS
salaries: { [monthKey]: { amount: number; usdRate: number } }

// Investments: amount in native currency (ARS or USD depending on type)
// Already correctly separated by currencyType
```

### Target Data Model (What Must Change)

```typescript
// NEW: Global settings stored alongside monthlyData
interface AppSettings {
  globalUsdRate: number;  // Current USD exchange rate for patrimonio calc
  lastUpdated: string;    // When globalUsdRate was last set
}

// NEW: USD purchase transaction
interface UsdPurchase {
  id: string;
  date: string;           // yyyy-MM-dd
  arsAmount: number;      // ARS spent
  usdAmount: number;      // USD received
  purchaseRate: number;   // arsAmount / usdAmount (effective rate)
  origin: "tracked" | "untracked"; // tracked = from ARS balance, untracked = external cash
  description?: string;   // Required for untracked, optional for tracked
}

// MODIFIED: MonthlyData gets usdPurchases array
interface MonthlyData {
  salaries: { ... };
  expenses: Expense[];
  extraIncomes: ExtraIncome[];
  investments: Investment[];
  usdPurchases: UsdPurchase[];  // NEW
}

// Expense/ExtraIncome: STOP converting USD to ARS at input
// Store originalAmount in original currency, keep usdRate for reference
interface Expense {
  amount: number;           // NOW: original amount in currencyType's denomination
  usdRate: number;          // Exchange rate at creation time
  currencyType: CurrencyType;
  // No new fields needed -- interpretation changes
}
```

### Recommended Implementation Structure

```
hooks/
  useMoneyTracker.ts       # Add globalUsdRate, split balance calc, wire new hook
  useCurrencyEngine.ts     # NEW: USD purchases, exchange gain/loss calc, global rate
  useExpensesTracker.ts    # MODIFY: stop converting USD amounts to ARS
  useIncomes.ts            # MODIFY: stop converting USD amounts to ARS
  useInvestmentsTracker.ts # MINOR: already handles currencyType correctly

components/
  expense-tracker.tsx      # Add global rate setting UI, USD purchase button
  total-amounts.tsx        # REWRITE: show ARS balance, USD balance, total patrimonio
  salary-card.tsx          # MODIFY: show separate currency balances
  usd-purchase-dialog.tsx  # NEW: dialog for buying USD / registering untracked USD
  exchange-summary.tsx     # NEW: shows exchange gain/loss for USD holdings

constants/
  investments.ts           # Already has CurrencyType, currencySymbol -- reuse
```

### Pattern 1: Dual Balance Calculation

**What:** Compute ARS and USD liquid balances separately from transaction history
**When to use:** Every time `calculateTotalAvailable` is called

```typescript
// Approach: scan all transactions, accumulate by currency
function calculateDualBalances(monthlyData: MonthlyData, monthKey: string) {
  let arsBalance = 0;
  let usdBalance = 0;

  // Salary: always ARS
  const salary = monthlyData.salaries[monthKey];
  if (salary) arsBalance += salary.amount;

  // Extra incomes: split by currencyType
  monthlyData.extraIncomes
    .filter(i => i.date.startsWith(monthKey))
    .forEach(income => {
      if (income.currencyType === CurrencyType.USD) {
        usdBalance += income.amount; // original USD amount
      } else {
        arsBalance += income.amount;
      }
    });

  // Expenses: split by currencyType
  monthlyData.expenses
    .filter(e => e.date.startsWith(monthKey))
    .forEach(expense => {
      if (expense.currencyType === CurrencyType.USD) {
        usdBalance -= expense.amount; // original USD amount
      } else {
        arsBalance -= expense.amount;
      }
    });

  // USD purchases: reduce ARS, increase USD (tracked only)
  (monthlyData.usdPurchases || [])
    .filter(p => p.date.startsWith(monthKey))
    .forEach(purchase => {
      if (purchase.origin === "tracked") {
        arsBalance -= purchase.arsAmount;
      }
      usdBalance += purchase.usdAmount;
    });

  // Investment movements: split by investment's currencyType
  // (already correct -- investments have currencyType)

  return { arsBalance, usdBalance };
}
```

### Pattern 2: Exchange Gain/Loss Calculation

**What:** For each USD purchase, calculate unrealized gain/loss vs current global rate
**When to use:** Display in exchange summary component

```typescript
function calculateExchangeGainLoss(
  usdPurchases: UsdPurchase[],
  currentGlobalRate: number
): { totalGainLoss: number; perPurchase: Array<{ id: string; gainLoss: number }> } {
  let totalGainLoss = 0;
  const perPurchase = usdPurchases
    .filter(p => p.origin === "tracked") // only tracked purchases have a meaningful rate
    .map(purchase => {
      // Gain = (currentRate - purchaseRate) * usdAmount
      const gainLoss = (currentGlobalRate - purchase.purchaseRate) * purchase.usdAmount;
      totalGainLoss += gainLoss;
      return { id: purchase.id, gainLoss };
    });
  return { totalGainLoss, perPurchase };
}
```

### Pattern 3: Data Migration (Critical)

**What:** Migrate existing data where USD amounts were stored as ARS (amount * usdRate)
**When to use:** In migrateData() function on app load

```typescript
// CRITICAL migration: existing USD expenses/incomes have amount = originalUSD * usdRate
// We need to convert back: originalUSD = amount / usdRate
function migrateToRealCurrencyAmounts(data: MonthlyData): MonthlyData {
  return {
    ...data,
    expenses: data.expenses.map(expense => {
      if (expense.currencyType === CurrencyType.USD && expense.usdRate > 0) {
        // Reverse the multiplication that was done at input time
        return { ...expense, amount: expense.amount / expense.usdRate };
      }
      return expense;
    }),
    extraIncomes: data.extraIncomes.map(income => {
      if (income.currencyType === CurrencyType.USD && income.usdRate > 0) {
        return { ...income, amount: income.amount / income.usdRate };
      }
      return income;
    }),
    usdPurchases: data.usdPurchases || [],
  };
}
```

### Anti-Patterns to Avoid

- **Converting USD to ARS at input time:** This is the current bug. The amount field must store the value in its native currency. Conversion only happens at display time for totals.
- **Single balance accumulator:** Never sum ARS and USD amounts directly. Always maintain two separate accumulators.
- **Hardcoding exchange rate:** The global rate must be user-configurable, not fetched from an API (app is offline-first).
- **Mutating usdRate on existing transactions:** When user edits the global rate, existing transaction rates must NOT change. Only the global display rate changes.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Currency formatting | Custom format functions | Existing `currencySymbol()` + `toLocaleString()` | Already works, just needs consistent usage |
| UUID generation | Custom ID generator | `crypto.randomUUID()` | Already used everywhere in codebase |
| Date manipulation | Manual date math | `date-fns` | Already installed, handles edge cases |
| Form validation | Custom validation framework | Existing `validateField` pattern + HTML5 | Already established in Phase 1, just extend |

**Key insight:** This phase is about data model changes and calculation logic, not new UI libraries. The existing component patterns (Dialog, Form, Table) are sufficient.

## Common Pitfalls

### Pitfall 1: Data Migration Breaks Existing Amounts
**What goes wrong:** Existing USD expenses have `amount = originalUSD * usdRate`. If migration divides by usdRate but some records have usdRate=0, you get Infinity/NaN.
**Why it happens:** Phase 1 fixed the division-by-zero display bug but old data may still have usdRate=0.
**How to avoid:** Guard migration with `if (usdRate > 0)` check. For records with usdRate=0, leave amount as-is and flag for manual review.
**Warning signs:** NaN or Infinity appearing in balance displays after migration.

### Pitfall 2: Double-Counting Investment Movements
**What goes wrong:** Investment movements affect both the "blocked in investments" calculation AND the liquid balance. If you also count them in the USD balance, money gets counted twice.
**Why it happens:** Investments already subtract from liquid (via movement tracking). Adding them to USD balance would double-subtract.
**How to avoid:** Investment movements should only affect the investment's own balance. Liquid balance for each currency = income - expenses - tracked_usd_purchases (for ARS) + usd_purchases (for USD). Investment impact is separate.
**Warning signs:** Total patrimonio changes when it shouldn't (e.g., after an investment aporte).

### Pitfall 3: Patrimonio Calculation Mismatch
**What goes wrong:** User buys USD at rate 1000, global rate moves to 1100. If patrimonio uses `arsBalance + usdBalance * globalRate + investments`, but some investments are in USD and some in ARS, the conversion gets confused.
**Why it happens:** Multiple entities (liquid USD, USD investments) need conversion at different rates.
**How to avoid:** Clear formula: `patrimonio = arsLiquid + (usdLiquid * globalRate) + sum(arsInvestments.currentValue) + sum(usdInvestments.currentValue * globalRate)`.
**Warning signs:** Patrimonio changes unexpectedly when only the exchange rate changes (should only change by the exchange effect, not by random amounts).

### Pitfall 4: Retroactive Rate Edit Cascading
**What goes wrong:** User edits the usdRate on an old transaction. If the balance calculation is cumulative, all subsequent balances shift.
**Why it happens:** Balances are derived from transaction history; changing any transaction changes all derived values.
**How to avoid:** This is actually correct behavior. The balance should reflect the corrected rate. Just ensure the UI communicates what changed.
**Warning signs:** None -- this is expected. Just make the edit action explicit and confirmable.

### Pitfall 5: Untracked USD Inflating Patrimonio
**What goes wrong:** User registers "untracked" USD cash. This increases USD balance but doesn't decrease ARS balance. Total patrimonio increases, which is correct (this is money that wasn't tracked before), but user might be confused.
**Why it happens:** Untracked USD is genuinely "new money entering the system."
**How to avoid:** Clear UI labeling: "Registrar dolares no trackeados (suma a tu patrimonio)." Require explicit origin description.
**Warning signs:** User complaining that patrimonio went up "for no reason."

## Code Examples

### Global USD Rate Storage and Hook

```typescript
// In useCurrencyEngine.ts (new hook)
export function useCurrencyEngine(monthlyData: MonthlyData, updateMonthlyData: (data: MonthlyData) => void) {
  const [globalUsdRate, setGlobalUsdRateState] = useLocalStorage<number>("globalUsdRate", 0);

  const setGlobalUsdRate = (rate: number) => {
    if (rate <= 0) return; // MON-08 validation
    setGlobalUsdRateState(rate);
  };

  const handleBuyUsd = (arsAmount: number, usdAmount: number, date: string) => {
    if (arsAmount <= 0 || usdAmount <= 0) return; // MON-08
    const purchase: UsdPurchase = {
      id: crypto.randomUUID(),
      date,
      arsAmount,
      usdAmount,
      purchaseRate: arsAmount / usdAmount,
      origin: "tracked",
    };
    updateMonthlyData({
      ...monthlyData,
      usdPurchases: [...(monthlyData.usdPurchases || []), purchase],
    });
  };

  const handleRegisterUntrackedUsd = (usdAmount: number, date: string, description: string) => {
    if (usdAmount <= 0) return; // MON-08
    const purchase: UsdPurchase = {
      id: crypto.randomUUID(),
      date,
      arsAmount: 0,
      usdAmount,
      purchaseRate: 0,
      origin: "untracked",
      description,
    };
    updateMonthlyData({
      ...monthlyData,
      usdPurchases: [...(monthlyData.usdPurchases || []), purchase],
    });
  };

  return { globalUsdRate, setGlobalUsdRate, handleBuyUsd, handleRegisterUntrackedUsd };
}
```

### Retroactive Rate Edit on Existing Transaction

```typescript
// In useExpensesTracker.ts -- add method
const handleUpdateUsdRate = (expenseId: string, newRate: number) => {
  if (newRate <= 0) return; // MON-08
  updateMonthlyData({
    ...monthlyData,
    expenses: monthlyData.expenses.map(expense =>
      expense.id === expenseId
        ? { ...expense, usdRate: newRate }
        : expense
    ),
  });
};
```

### Total Patrimonio with Dual Currency

```typescript
function calculatePatrimonio(
  arsLiquid: number,
  usdLiquid: number,
  investments: Investment[],
  globalUsdRate: number
): number {
  const arsInvestments = investments
    .filter(i => i.status === "Activa" && i.currencyType === CurrencyType.ARS)
    .reduce((sum, i) => sum + i.currentValue, 0);

  const usdInvestments = investments
    .filter(i => i.status === "Activa" && i.currencyType === CurrencyType.USD)
    .reduce((sum, i) => sum + i.currentValue, 0);

  return arsLiquid
    + (usdLiquid * globalUsdRate)
    + arsInvestments
    + (usdInvestments * globalUsdRate);
}
```

## State of the Art

| Old Approach (Current) | New Approach (Phase 3) | Impact |
|------------------------|------------------------|--------|
| All amounts stored as ARS | Amounts stored in native currency | USD transactions preserve original value |
| Single balance number | Dual ARS + USD balances | Reflects actual currency holdings |
| usdRate per transaction for display only | usdRate per transaction for rate history + global rate for patrimonio | Enables exchange gain/loss tracking |
| No USD purchase tracking | Explicit USD buy/register operations | ARS->USD flow visible and auditable |
| Visual USD conversion in salary card | Real separated balance display | User sees actual USD they hold |

**Breaking change:** The migration from "amount always in ARS" to "amount in native currency" is a one-time migration that must handle existing data correctly. This is the riskiest part of the phase.

## Open Questions

1. **Cross-month USD balance accumulation**
   - What we know: Monthly balances are currently computed per-month. USD holdings persist across months.
   - What's unclear: Should USD balance be a running total across all months, or reset monthly like ARS?
   - Recommendation: USD balance should be a **running total** across all time (like a real bank account). ARS liquid should remain monthly (income - expenses for that month). This matches how people think about USD holdings in Argentina -- you accumulate them over time.

2. **Where to show globalUsdRate editor**
   - What we know: Needs to be accessible but not cluttering the main UI.
   - What's unclear: Settings dialog vs always-visible widget vs salary-card section.
   - Recommendation: Add it to the **Settings dialog** (already exists) with a prominent display of the current rate in the sidebar card area. The salary card or a new "Moneda" card in the sidebar could show the current rate and provide quick-edit access.

3. **Salary in USD handling**
   - What we know: Salary is currently always in ARS. Some users in Argentina earn in USD.
   - What's unclear: Should salary support dual currency?
   - Recommendation: **Defer to a future phase** (ING phase). For now, salary remains ARS-only. Users earning USD can register it as extra income in USD.

## Sources

### Primary (HIGH confidence)
- Direct codebase analysis of all hooks, components, and data models
- Existing data model in `hooks/useMoneyTracker.ts` (MonthlyData, Expense, ExtraIncome, Investment interfaces)
- Current migration pattern in `migrateData()` function
- Existing validation pattern in `expense-tracker.tsx` validateField function

### Secondary (MEDIUM confidence)
- Phase 1 and Phase 2 decisions documented in `.planning/STATE.md`
- Codebase architecture analysis in `.planning/codebase/ARCHITECTURE.md`
- Known concerns documented in `.planning/codebase/CONCERNS.md`

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - No new libraries needed, all patterns exist in codebase
- Architecture: HIGH - Clear data model transformation from code analysis
- Pitfalls: HIGH - Data migration risk is well-understood from Phase 1/2 experience
- Balance calculation: MEDIUM - Cross-month USD accumulation needs design decision during planning

**Research date:** 2026-04-01
**Valid until:** 2026-05-01 (stable domain, no external dependencies)
