# Architecture Patterns: Predictive Financial Charts

**Domain:** Predictive chart integration into existing expense tracker
**Researched:** 2026-04-03

## Existing Architecture Summary

### Hooks (data layer)
- `useInvestmentsTracker` — investments[], CRUD, currentValue, movements, gain/loss
- `useCurrencyEngine` — globalUsdRate, ARS/USD balances, exchange calculations
- `useSalaryHistory` — salary entries, employment config, pay date
- `useRecurringExpenses` — recurring expense definitions, instances, payment tracking
- `useLoans` — loans given/owed, payments
- `useMoneyTracker` — monthlyData (the master data structure), expenses, incomes

### Chart Infrastructure (already exists)
- `components/ui/chart.tsx` — shadcn ChartContainer, ChartConfig, ChartTooltip, ChartTooltipContent
- `components/charts-container.tsx` — Wraps existing charts (ExpensesByMonth, SalaryByMonth)
- `components/charts/salary-by-month.tsx` — BarChart with Recharts, uses ChartContainer pattern
- `components/charts/expenses-by-month.tsx` — BarChart with Recharts
- Already using: ResponsiveContainer, XAxis, YAxis, Tooltip, Bar, BarChart
- Already imported: date-fns with `es` locale, lucide icons

### Data Structures
- `monthlyData` — keyed by "yyyy-MM", contains expenses, incomes, salaries per month
- `investments[]` — each has movements[], currentValue, type, currency, rate (PF)
- `salaryHistory` — entries with amount, effectiveDate
- `recurringExpenses[]` — definitions with amount, frequency
- `patrimonio` calculated in PatrimonioCard from: arsBalance + usdBalance*rate + investments + loans

## Recommended Architecture for v1.2

### New Files

```
lib/
  projections/
    compound-interest.ts    — FV = PV × (1 + r/n)^(n×t)
    linear-projection.ts    — salary income over time
    patrimonio-projection.ts — combines investment + salary + expense projections
    historical-reconstruction.ts — derives past patrimonio from monthlyData
    types.ts                — ProjectionPoint, Scenario, ProjectionConfig

hooks/
  useProjections.ts         — orchestrator hook that reads from existing hooks
                              and returns chart-ready data arrays

components/
  charts/
    patrimonio-projection-chart.tsx  — hero chart: historical + projected patrimonio
    investment-projection-chart.tsx  — investment portfolio projection
    projection-controls.tsx          — horizon selector, scenario toggles
```

### Data Flow

```
localStorage
  ↓
Existing hooks (useInvestmentsTracker, useSalaryHistory, useRecurringExpenses, useCurrencyEngine)
  ↓
useProjections (new orchestrator hook)
  ├── reads: investments, salary, recurringExpenses, monthlyData, globalUsdRate
  ├── calls: historical-reconstruction (past patrimonio per month)
  ├── calls: compound-interest (per investment)
  ├── calls: linear-projection (salary income)
  ├── calls: patrimonio-projection (combined)
  └── returns: { historicalData[], projectionData[], scenarios: { optimista, base, pesimista } }
  ↓
Chart Components (Recharts)
  ├── patrimonio-projection-chart.tsx — ComposedChart with Area (historical) + Line (projected)
  ├── investment-projection-chart.tsx — ComposedChart with stacked areas
  └── projection-controls.tsx — horizon selector + scenario toggles
```

### Integration Points

| Existing Component | Integration | Change Type |
|-------------------|-------------|-------------|
| `charts-container.tsx` | Add new projection charts alongside existing bar charts | Modified |
| `expense-tracker.tsx` | Pass additional hook data to charts container | Modified |
| `patrimonio-card.tsx` | No changes — charts live separately | Unchanged |
| `components/ui/chart.tsx` | Reuse ChartContainer, ChartTooltip pattern | Unchanged |
| All existing hooks | Read-only consumption — no modifications | Unchanged |

### Key Design Decisions

**1. Projection logic as pure functions in `lib/projections/`**
- Why: Testable, no React dependency, can be used in hooks or directly
- Pattern: `(config: ProjectionConfig) => ProjectionPoint[]`

**2. Single orchestrator hook `useProjections`**
- Why: Centralizes data gathering from multiple hooks, memoizes expensive calculations
- Uses `useMemo` to avoid recalculating on every render
- Dependencies: only recalculates when underlying data changes

**3. Charts in existing `charts-container.tsx`**
- Why: Charts already live there. Adding new ones is natural extension.
- Alternative considered: New tab — rejected because charts complement existing data views

**4. ComposedChart for mixed historical + projection**
- Why: Need Area (filled, historical) + Line (dashed, projection) on same axes
- Recharts ComposedChart supports mixing Area, Line, Bar in single chart

**5. No localStorage changes**
- Why: Projections are computed from existing data. CRITICAL: user is actively using the app.
- All projection config (horizon, scenarios) can live in component state or URL params

### Historical Reconstruction Strategy

The hardest part: calculating patrimonio for each past month.

**Approach:** Walk through monthlyData chronologically:
1. For each month, sum: salary income - expenses + other incomes
2. Track running ARS and USD liquid balances
3. For investments: reconstruct value at each month from movements (sum of movements up to that month, plus appreciation if rate known)
4. patrimonio_month = liquid_ars + liquid_usd * rate_at_month + investment_values_at_month

**Simplification:** Use current globalUsdRate for all months (user doesn't have historical rates). Add a note "USD convertido a cotización actual" in tooltip.

### Performance Considerations

- **Memoize aggressively:** Projection calculations can be expensive with many investments × many months. Use `useMemo` with proper dependency arrays.
- **Lazy computation:** Only calculate when chart is visible (the charts tab).
- **Data point density:** Monthly granularity is sufficient. No need for daily points.
- **Recharts performance:** ~100 data points (24 months × a few lines) is trivial for Recharts.

### Build Order (Suggested Phases)

1. **Projection engine** — Pure functions in `lib/projections/`, no UI. Can be unit tested.
2. **Historical reconstruction** — Derives past data from monthlyData. Most complex logic.
3. **useProjections hook** — Wires existing hooks to projection engine. Returns chart-ready data.
4. **Chart components** — Recharts UI consuming hook data. Visual polish.
5. **Controls & scenarios** — Horizon selector, scenario toggles.

This order minimizes risk: each layer can be verified before the next depends on it.

## Sources

- Existing codebase analysis (hooks, components, chart patterns)
- Recharts ComposedChart documentation
- shadcn/ui chart component patterns

---
*Research completed: 2026-04-03*
