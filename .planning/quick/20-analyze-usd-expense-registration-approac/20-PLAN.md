---
phase: quick-20
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - hooks/useMoneyTracker.ts
  - components/patrimonio-card.tsx
  - components/total-amounts.tsx
  - components/expense-tracker.tsx
autonomous: true
requirements: [BALANCE-VIEW-01]

must_haves:
  truths:
    - "User can toggle between Periodo and Acumulado view on the PatrimonioCard"
    - "In Periodo view, ARS liquid shows period-scoped and USD liquid shows period-scoped"
    - "In Acumulado view, ARS liquid shows all-time accumulated and USD liquid shows all-time accumulated"
    - "The active view mode is clearly labeled so user always knows what they are seeing"
    - "Default view is Periodo (preserving current ARS behavior)"
  artifacts:
    - path: "hooks/useMoneyTracker.ts"
      provides: "calculateDualBalances returns both period and accumulated values for ARS and USD"
      contains: "arsBalanceAccumulated"
    - path: "components/patrimonio-card.tsx"
      provides: "Toggle UI between Periodo and Acumulado views"
      contains: "balanceViewMode"
    - path: "components/total-amounts.tsx"
      provides: "Updated to support both view modes"
      contains: "balanceViewMode"
  key_links:
    - from: "hooks/useMoneyTracker.ts"
      to: "components/expense-tracker.tsx"
      via: "calculateDualBalances() return object with period + accumulated fields"
      pattern: "arsBalanceAccumulated|usdBalancePeriod"
    - from: "components/expense-tracker.tsx"
      to: "components/patrimonio-card.tsx"
      via: "props passing both balance sets + viewMode + setter"
      pattern: "balanceViewMode"
---

<objective>
Homogenize ARS and USD balance tracking so both currencies have period-scoped AND accumulated views, with a UI toggle on PatrimonioCard.

Purpose: Currently ARS liquid is period-only and USD liquid is accumulated-only. This creates a misleading asymmetry. Users need both views for both currencies to understand their finances.
Output: Symmetric balance calculation + toggle UI on patrimonio card.
</objective>

<execution_context>
@C:/Users/Juan/.claude/get-shit-done/workflows/execute-plan.md
@C:/Users/Juan/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md

<interfaces>
<!-- From hooks/useMoneyTracker.ts — current return shape of calculateDualBalances() -->
```typescript
// Currently returns (line 533):
return { arsBalance, usdBalance, arsInvestments, usdInvestments,
         arsInvestmentContributions, arsLoansGiven, usdLoansGiven, arsDebts, usdDebts };
```

<!-- From components/patrimonio-card.tsx — current props -->
```typescript
interface PatrimonioCardProps {
  arsBalance: number;
  usdBalance: number;
  arsInvestments: number;
  usdInvestments: number;
  arsLoansGiven: number;
  usdLoansGiven: number;
  arsDebts: number;
  usdDebts: number;
  globalUsdRate: number;
}
```

<!-- From components/total-amounts.tsx — current props -->
```typescript
interface TotalAmountsProps {
  arsBalance: number;
  usdBalance: number;
  arsInvestments: number;
  usdInvestments: number;
  globalUsdRate: number;
}
```

<!-- Key architectural fact: ALL data lives in a single `monthlyData` localStorage key.
     Month scoping is done by filtering dates in calculateDualBalances, NOT by loading different data.
     So "accumulated ARS" = skip the date filter on ARS items (same logic USD already uses).
     "Period USD" = apply the date filter to USD items (same logic ARS already uses). -->
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Extend calculateDualBalances to return both period and accumulated values</name>
  <files>hooks/useMoneyTracker.ts</files>
  <action>
Modify `calculateDualBalances()` (lines 359-534) to compute FOUR balance values instead of two:

1. **arsBalancePeriod** (current `arsBalance` — already period-scoped, no change needed)
2. **arsBalanceAccumulated** (NEW — same logic as arsBalancePeriod but WITHOUT the `isInArsRange` date filter. Include salary, all ARS extra incomes, all ARS expenses, ARS investment movements, ARS transfers, ARS loans — all without date filtering. This mirrors how USD currently works.)
3. **usdBalancePeriod** (NEW — same logic as current `usdBalance` but WITH date filtering using `isInArsRange`. Only include USD items whose date falls in the current period. Apply the same `isInArsRange` check to: USD extra incomes, USD expenses, USD purchases, USD investment movements, USD transfers, USD loans.)
4. **usdBalanceAccumulated** (current `usdBalance` — already accumulated, no change needed)

Implementation approach:
- Keep the existing loop structure but track four running totals instead of two
- For each transaction block (extraIncomes, expenses, usdPurchases, investments, transfers, loans), compute both the period and accumulated variant for each currency
- The accumulated variants simply skip the `isInArsRange()` check

Update the return type to:
```typescript
return {
  arsBalancePeriod: arsBalance,       // existing, renamed
  arsBalanceAccumulated,              // NEW
  usdBalancePeriod,                   // NEW
  usdBalanceAccumulated: usdBalance,  // existing, renamed
  arsInvestments, usdInvestments, arsInvestmentContributions,
  arsLoansGiven, usdLoansGiven, arsDebts, usdDebts
};
```

ALSO add backward-compatible aliases so nothing breaks:
```typescript
// Backward compat — consumers using old names get period ARS / accumulated USD (current behavior)
arsBalance: arsBalance,      // = arsBalancePeriod
usdBalance: usdBalance,      // = usdBalanceAccumulated
```

For the accumulated ARS salary: use the same `salaryHistoryTracker.getSalaryForMonth()` call since salary is always for the selected month (accumulated still means "this month's full data without pay-period filtering"). The key difference is only for items that have dates — expenses, incomes, movements, transfers, loans. The accumulated mode removes the date-range filter, including ALL items in the current month's data (not just those within the pay-period window).

IMPORTANT: For accumulated mode, do NOT try to load data from other months. The "accumulated" concept here means "full month without pay-period date filtering" for ARS, and for USD it remains the existing behavior (no date filter). The multi-month accumulation for USD already works because USD items are never filtered. ARS accumulated = all ARS items in `monthlyData` without the pay-period date-range restriction.
  </action>
  <verify>
    <automated>cd d:/Documents/Programing/nextjs/expense-tracker && npx tsc --noEmit 2>&1 | head -30</automated>
  </verify>
  <done>calculateDualBalances returns arsBalancePeriod, arsBalanceAccumulated, usdBalancePeriod, usdBalanceAccumulated plus backward-compatible arsBalance/usdBalance aliases. TypeScript compiles without errors.</done>
</task>

<task type="auto">
  <name>Task 2: Add balance view toggle to PatrimonioCard and wire through expense-tracker</name>
  <files>components/patrimonio-card.tsx, components/total-amounts.tsx, components/expense-tracker.tsx</files>
  <action>
**1. PatrimonioCard (patrimonio-card.tsx):**

Add a `balanceViewMode` toggle state managed via props (lifted to expense-tracker.tsx for potential reuse):

New props:
```typescript
interface PatrimonioCardProps {
  // Period values
  arsBalancePeriod: number;
  usdBalancePeriod: number;
  // Accumulated values
  arsBalanceAccumulated: number;
  usdBalanceAccumulated: number;
  // Rest unchanged
  arsInvestments: number;
  usdInvestments: number;
  arsLoansGiven: number;
  usdLoansGiven: number;
  arsDebts: number;
  usdDebts: number;
  globalUsdRate: number;
  // View toggle
  balanceViewMode: "periodo" | "acumulado";
  onBalanceViewModeChange: (mode: "periodo" | "acumulado") => void;
}
```

In the header area (next to the existing "Historico" Badge), replace the Badge with a toggle using two small buttons or a segmented control. Use shadcn `Tabs` or simple `Button` pair:

```tsx
<div className="flex gap-1">
  <Button
    variant={balanceViewMode === "periodo" ? "default" : "outline"}
    size="sm"
    className="h-6 text-xs px-2"
    onClick={() => onBalanceViewModeChange("periodo")}
  >
    Periodo
  </Button>
  <Button
    variant={balanceViewMode === "acumulado" ? "default" : "outline"}
    size="sm"
    className="h-6 text-xs px-2"
    onClick={() => onBalanceViewModeChange("acumulado")}
  >
    Acumulado
  </Button>
</div>
```

Select which values to display based on `balanceViewMode`:
```typescript
const arsBalance = balanceViewMode === "periodo" ? arsBalancePeriod : arsBalanceAccumulated;
const usdBalance = balanceViewMode === "periodo" ? usdBalancePeriod : usdBalanceAccumulated;
```

Update the tooltip text for each liquid line:
- Periodo ARS: "Saldo liquido en pesos del periodo actual"
- Periodo USD: "Saldo en dolares del periodo actual"
- Acumulado ARS: "Saldo liquido acumulado en pesos (todos los meses)"
- Acumulado USD: "Saldo acumulado en dolares (todos los meses)"

The patrimonio total calculation, investments, loans, debts — all stay the same. Only the liquid ARS/USD lines switch based on the toggle.

**2. TotalAmounts (total-amounts.tsx):**

Update props similarly — accept period + accumulated for both currencies, plus the viewMode. Select the correct values based on viewMode. If total-amounts is used elsewhere without the toggle, keep it simple: just accept the 4 values + viewMode and pick the right ones internally.

**3. expense-tracker.tsx:**

Add state for balanceViewMode:
```typescript
const [balanceViewMode, setBalanceViewMode] = useState<"periodo" | "acumulado">("periodo");
```

Update where `dualBalancesForCards` is used. Pass the new fields:
```typescript
const dualBalancesForCards = calculateDualBalances();

// PatrimonioCard gets all 4 liquid values + toggle
<PatrimonioCard
  arsBalancePeriod={dualBalancesForCards.arsBalancePeriod}
  arsBalanceAccumulated={dualBalancesForCards.arsBalanceAccumulated}
  usdBalancePeriod={dualBalancesForCards.usdBalancePeriod}
  usdBalanceAccumulated={dualBalancesForCards.usdBalanceAccumulated}
  arsInvestments={dualBalancesForCards.arsInvestments}
  usdInvestments={dualBalancesForCards.usdInvestments}
  arsLoansGiven={dualBalancesForCards.arsLoansGiven}
  usdLoansGiven={dualBalancesForCards.usdLoansGiven}
  arsDebts={dualBalancesForCards.arsDebts}
  usdDebts={dualBalancesForCards.usdDebts}
  globalUsdRate={globalUsdRate}
  balanceViewMode={balanceViewMode}
  onBalanceViewModeChange={setBalanceViewMode}
/>
```

Keep `availableMoney` using `arsBalancePeriod` (backward compat — ResumenCard always shows period).

For any other consumer of `dualBalancesForCards.arsBalance` or `.usdBalance`, verify the backward-compat aliases work. The ResumenCard's "Disponible" stays period-scoped (uses `availableMoney` which already comes from arsBalance = arsBalancePeriod).
  </action>
  <verify>
    <automated>cd d:/Documents/Programing/nextjs/expense-tracker && npx tsc --noEmit 2>&1 | head -30 && npm run build 2>&1 | tail -10</automated>
  </verify>
  <done>PatrimonioCard shows a Periodo/Acumulado toggle. In Periodo mode, both ARS and USD show period-scoped values. In Acumulado mode, both show accumulated values. Tooltips update to explain the current view. Build succeeds with zero errors.</done>
</task>

</tasks>

<verification>
- `npx tsc --noEmit` passes — no type errors
- `npm run build` succeeds — no build errors
- PatrimonioCard renders toggle buttons for Periodo / Acumulado
- Periodo mode: ARS shows period-scoped (same as before), USD shows period-scoped (NEW)
- Acumulado mode: ARS shows accumulated (NEW), USD shows accumulated (same as before)
- ResumenCard "Disponible" remains period-scoped ARS (unchanged behavior)
- No localStorage schema changes — zero migration risk
</verification>

<success_criteria>
- Both currencies have symmetric period AND accumulated views
- Toggle clearly labeled and easy to understand
- Default is "Periodo" preserving existing UX for returning users
- No breaking changes to ResumenCard, budgets, or projections
- Tooltips explain what each number means in each mode
</success_criteria>

<output>
After completion, create `.planning/quick/20-analyze-usd-expense-registration-approac/20-SUMMARY.md`
</output>
