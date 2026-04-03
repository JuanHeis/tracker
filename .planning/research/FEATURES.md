# Feature Landscape: Predictive Financial Charts

**Domain:** Predictive charts for a personal finance tracker (dual ARS/USD, investments, income, expenses)
**Researched:** 2026-04-03

## Table Stakes

Features users expect in financial projection charts. Missing = chart feels incomplete or misleading.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Historical patrimonio timeline | Every finance app with charts shows "where you've been." Personal Capital, Mint, YNAB all have net worth over time. | Medium | Reconstruct from monthlyData — need to calculate patrimonio per past month |
| Future patrimonio projection (dashed line) | The core ask. "Where am I headed?" Fintual shows projected growth. Personal Capital has retirement projections. | Medium | Linear salary + compound investments + recurring expense deduction |
| Investment projection with compound interest | Fintual projects each fund's growth. Standard in any investment tracker. | Medium | Use current gain% or explicit rate (Plazo Fijo) as annualized rate |
| "Today" reference line | Visual separator between real data and projections. Universal pattern in financial charts. | Low | Recharts ReferenceLine component |
| Solid vs dashed line distinction | Universally understood: solid = real, dashed = projected. No legend needed. | Low | strokeDasharray on projection Line components |
| Hover tooltip with values | Basic chart interactivity. Every Recharts chart has this. | Low | Native Recharts tooltip, already have shadcn ChartTooltip |
| Configurable horizon | User needs to choose how far to project. 3, 6, 12, 24 months. | Low | Segmented control or select |
| Responsive chart sizing | Must work on different screen sizes. | Low | ResponsiveContainer already in project |

## Differentiators

Features that would make the charts notably better than basic projections. Not expected, but valued.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Scenario bands (optimista/base/pesimista) | Shows uncertainty honestly. Personal Capital does this for retirement. 3 lines with different opacity. | Medium | ±X% around base rate. Area between optimist/pessimist for visual band. |
| Per-investment projection chart | See how each investment grows independently. Fintual shows per-fund projections. | Medium | Individual chart or stacked area within portfolio chart |
| Investment type grouping (FCI, Crypto, PF, Acciones) | Color-coded breakdown of portfolio composition over time | Low | Stacked Area chart by investment type |
| Expense deduction in patrimonio projection | More realistic projection: patrimonio grows by (salary - expenses), not just salary | Medium | Subtract average monthly expenses or recurring expense total |
| Interactive legend (toggle lines on/off) | User can show/hide scenarios or individual investments | Low | Recharts Legend with onClick handler |
| Shaded area under historical data | Visual weight distinguishing past (filled) from future (line only) | Low | Area with fillOpacity for historical portion |

## Anti-Features

Features to explicitly NOT build.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Monte Carlo simulation | Overkill for personal tracker. Users won't understand probability distributions. | Simple ±% scenarios with clear labels |
| Custom scenario parameter editor | Too complex. Most users won't tweak growth rates. | Predefined optimista/base/pesimista with sensible defaults |
| Real-time market data integration | Offline app, no API, manual updates only | Use historical observed rates from user's own data |
| Inflation-adjusted projections | Speculative without reliable IPC source. Misleading precision. | Show nominal values. Add disclaimer "valores nominales" |
| Per-month manual projection overrides | Defeats automation. Users won't maintain manual forecasts. | Auto-calculate from current data |
| AI/ML prediction models | Massively over-engineered for localStorage app | Simple compound interest + linear projection |

## Feature Dependencies

```
Projection Engine (pure math, no UI)
  ├── Investment projection (compound interest per investment)
  ├── Salary projection (linear, from salaryHistory)
  └── Expense projection (recurring expenses deduction)
  |
  v
Historical Data Reconstruction
  ├── Past patrimonio per month (from monthlyData + investments)
  └── Past investment values per month (from movements)
  |
  v
Chart Components (Recharts UI)
  ├── Investment Projection Chart (per-investment or aggregated)
  ├── Patrimonio Projection Chart (combined projection)
  ├── Scenario System (optimista/base/pesimista overlays)
  └── Shared: horizon selector, today line, tooltip, legend
```

**Key dependency insight:** The projection engine is pure math with no UI dependencies. It can be built and tested first. Historical data reconstruction is the hardest part — deriving past patrimonio from existing monthlyData structure. Chart components are the easiest once data is ready.

## MVP Recommendation

**Prioritize (must-have for v1.2):**

1. **Projection engine** — Pure functions: compound interest, linear salary, expense deduction
2. **Historical patrimonio reconstruction** — Calculate past months' patrimonio from monthlyData
3. **Patrimonio chart (historical + projected)** — The hero chart. Solid past, dashed future.
4. **Investment chart (aggregated projection)** — Show total investment portfolio growth
5. **Today reference line** — Clear past/future separator
6. **Horizon selector** — 3, 6, 12, 24 months
7. **Scenario bands** — Optimista/base/pesimista with shaded area

**Defer (nice-to-have, post-MVP):**

- Per-investment individual projection charts
- Drill-down tooltips with full desglose
- Animation on chart load

## Scenario Defaults (Suggested)

| Scenario | Investments | Patrimonio |
|----------|------------|------------|
| Optimista | Current rate × 1.5 | Savings rate × 1.2 |
| Base | Current observed rate | Current savings rate |
| Pesimista | Current rate × 0.5 | Savings rate × 0.8 |

For Plazo Fijo: use actual TNA rate (no scenario variation — it's contractual).
For Crypto/Acciones: wider bands (×2 / ×0.3) due to higher volatility.

## Sources

- Fintual (Chile) — Per-fund projection with "if it keeps growing at X%"
- Personal Capital — Net worth timeline + retirement planner with scenarios
- YNAB — Net worth chart (historical only, no projections)
- Mint — Net worth historical chart, no projections
- Compound interest formula: FV = PV × (1 + r/n)^(n×t)

---
*Research completed: 2026-04-03*
