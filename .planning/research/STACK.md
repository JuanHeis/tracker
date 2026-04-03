# Technology Stack: Predictive Financial Charts

**Project:** Expense Tracker v1.2 --- Graficos Predictivos
**Researched:** 2026-04-03
**Mode:** Ecosystem (focused on new capabilities only)

## Recommendation: Upgrade Recharts to 3.x, No Math Libraries Needed

The project already has Recharts 2.13.3 installed. Recharts 3.x (current: 3.8.1) is a worthwhile upgrade -- it rewrote state management, dropped external dependencies (react-smooth, recharts-scale), and the migration from 2.x is minimal. For compound interest and linear regression, plain TypeScript math is sufficient -- no library needed.

**Verdict:** Upgrade Recharts 2.13.3 to 3.x. Keep date-fns (already installed). Write projection math as utility functions. Zero new dependencies beyond the Recharts upgrade.

## Recommended Stack

### Upgrade

| Technology | From | To | Purpose | Why |
|---|---|---|---|---|
| `recharts` | 2.13.3 | ^3.8.1 | Chart rendering | 3.x removed react-smooth and recharts-scale dependencies (smaller bundle), rewrote state management with 3500+ tests, better performance. Migration is minimal -- the team states "most applications should not require any changes." |

### Already Installed (Use As-Is)

| Technology | Version | Purpose | Why Relevant |
|---|---|---|---|
| `date-fns` | ^4.1.0 | Date axis formatting, month labels | Already used in existing charts for `format(date, "MMM", { locale: es })`. Reuse for projection date axis labels. |
| `date-fns/locale/es` | (included) | Spanish month names on axes | Already imported in salary-by-month chart. |
| shadcn/ui `ChartContainer` | (custom) | Responsive wrapper around Recharts | Already in `components/ui/chart.tsx`. Wraps `ResponsiveContainer` with config context, theming, and tooltip helpers. |
| `tailwindcss` | ^3.4.1 | Chart card layouts, legend styling | Already used for all UI. Chart containers and legends should use Tailwind, not inline styles. |

### New Custom Code to Write (No Libraries)

| Module | Purpose | Complexity |
|---|---|---|
| `lib/projections/compound-interest.ts` | `FV = PV * (1 + r/n)^(n*t)` for investment projections | Low -- single function, ~15 lines |
| `lib/projections/linear-trend.ts` | Simple linear regression for patrimony trend line | Low -- ~25 lines, slope + intercept from data points |
| `lib/projections/scenarios.ts` | Generate optimistic/base/pessimistic rate multipliers | Low -- configuration object, no math library needed |
| `lib/projections/generate-series.ts` | Transform real data + projection into Recharts data array | Medium -- data shaping logic, ~50 lines |

## Recharts 3.x Migration Details

### Breaking Changes That Affect This Project

Based on the existing chart code in `salary-by-month.tsx` and `expenses-by-month.tsx`:

| Change | Impact | Action Needed |
|---|---|---|
| `accessibilityLayer` defaults to `true` | No impact -- this is a good default | None |
| `CategoricalChartState` removed | Not used in project code | None |
| `react-smooth` removed (animations built-in) | Positive -- smaller bundle | None |
| `recharts-scale` removed (built-in) | Positive -- smaller bundle | None |

The project's existing charts use only standard components (`BarChart`, `Bar`, `XAxis`, `YAxis`, `ChartTooltip`) with no internal state access. Migration should be seamless.

### shadcn/ui ChartContainer Compatibility

The `components/ui/chart.tsx` wrapper imports `* as RechartsPrimitive from "recharts"` and uses `ResponsiveContainer`. This pattern works with Recharts 3.x unchanged since `ResponsiveContainer` API is stable.

## Recharts Components for Predictive Charts

All of these are built into Recharts -- no additional packages:

| Component | Use Case | Key Props |
|---|---|---|
| `ComposedChart` | Mix Area (historical) + Line (projection) in one chart | `data`, `margin` |
| `Area` | Shaded region for historical data | `type="monotone"`, `fill`, `fillOpacity={0.3}`, `stroke` |
| `Line` | Projection lines (dashed for future) | `type="monotone"`, `strokeDasharray="5 5"` for dashed, `strokeDasharray="3 3"` for dotted |
| `XAxis` | Date axis with month labels | `dataKey="date"`, `tickFormatter` with date-fns |
| `YAxis` | Currency axis | `tickFormatter` for ARS/USD formatting |
| `Tooltip` | Hover data display | Use shadcn `ChartTooltip` + `ChartTooltipContent` (already in project) |
| `Legend` | Scenario labels (optimista/base/pesimista) | `wrapperStyle` for positioning |
| `ReferenceLine` | "Today" divider between real and projected data | `x={todayDate}`, `strokeDasharray="3 3"`, `label="Hoy"` |
| `CartesianGrid` | Subtle grid background | `strokeDasharray="3 3"`, `opacity={0.3}` |
| `ResponsiveContainer` | Auto-resize (via ChartContainer wrapper) | Already handled by shadcn wrapper |

### Dashed/Dotted Line Patterns

```typescript
// Solid line = historical real data
<Line dataKey="real" stroke="#10b981" strokeDasharray="0" />

// Dashed line = base projection
<Line dataKey="base" stroke="#10b981" strokeDasharray="5 5" />

// Dotted line = optimistic/pessimistic scenarios
<Line dataKey="optimista" stroke="#22c55e" strokeDasharray="2 2" />
<Line dataKey="pesimista" stroke="#ef4444" strokeDasharray="2 2" />
```

### Area Fill for Historical Data

```typescript
// Shaded area under historical line
<Area
  type="monotone"
  dataKey="real"
  fill="#10b981"
  fillOpacity={0.15}
  stroke="#10b981"
  strokeWidth={2}
/>
```

### Date Axis Formatting with date-fns

```typescript
// Reuse existing project pattern from salary-by-month.tsx
import { format } from "date-fns";
import { es } from "date-fns/locale";

<XAxis
  dataKey="date"
  tickFormatter={(dateStr) => format(new Date(dateStr), "MMM yy", { locale: es })}
/>
```

## Projection Math: No Library Needed

### Compound Interest (Investment Projection)

```typescript
// lib/projections/compound-interest.ts
export function projectCompoundGrowth(
  principal: number,
  annualRate: number,      // e.g. 0.08 for 8%
  months: number,
  compoundingPerYear = 12
): number[] {
  const points: number[] = [];
  for (let m = 0; m <= months; m++) {
    const years = m / 12;
    const value = principal * Math.pow(1 + annualRate / compoundingPerYear, compoundingPerYear * years);
    points.push(Math.round(value * 100) / 100);
  }
  return points;
}
```

### Linear Regression (Patrimony Trend)

```typescript
// lib/projections/linear-trend.ts
export function linearRegression(points: [number, number][]): { slope: number; intercept: number } {
  const n = points.length;
  const sumX = points.reduce((s, p) => s + p[0], 0);
  const sumY = points.reduce((s, p) => s + p[1], 0);
  const sumXY = points.reduce((s, p) => s + p[0] * p[1], 0);
  const sumX2 = points.reduce((s, p) => s + p[0] * p[0], 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  return { slope, intercept };
}

export function predict(model: { slope: number; intercept: number }, x: number): number {
  return model.slope * x + model.intercept;
}
```

These are 20-30 line utility functions. Adding `simple-statistics` (37KB) for two functions is overkill.

### Scenario Multipliers

```typescript
// lib/projections/scenarios.ts
export interface ScenarioConfig {
  label: string;
  rateMultiplier: number;  // applied to base rate
  color: string;
  dashPattern: string;     // strokeDasharray value
}

export const DEFAULT_SCENARIOS: ScenarioConfig[] = [
  { label: "Optimista", rateMultiplier: 1.5, color: "#22c55e", dashPattern: "2 2" },
  { label: "Base",      rateMultiplier: 1.0, color: "#10b981", dashPattern: "5 5" },
  { label: "Pesimista", rateMultiplier: 0.5, color: "#ef4444", dashPattern: "2 2" },
];
```

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|---|---|---|---|
| Chart library | Recharts 3.x (upgrade) | Keep Recharts 2.x | 3.x has fewer deps, better perf, easy migration. No reason to stay on 2.x. |
| Chart library | Recharts 3.x | Nivo / Victory / Chart.js | Project already uses Recharts with shadcn wrapper. Switching libraries for this milestone is unnecessary churn. |
| Math: compound interest | Plain TypeScript | financejs / simple-statistics | `Math.pow(1 + r/n, n*t)` is one line. A library dependency for one formula is absurd. |
| Math: linear regression | Plain TypeScript (~25 lines) | simple-statistics (37KB) | Two functions (slope, intercept) don't justify 37KB. If we needed 10+ statistical functions, then yes. |
| Math: linear regression | Plain TypeScript | ml-regression | Even heavier. Designed for ML workloads, not a trend line. |
| Date formatting | date-fns (already installed) | dayjs / moment | date-fns is already in the project and used in existing charts. No reason to switch. |
| Responsive charts | shadcn ChartContainer (already built) | Raw ResponsiveContainer | The shadcn wrapper adds theming, config context, and tooltip helpers. Already in the project. |

## What NOT to Add

| Package | Why Avoid |
|---|---|
| `simple-statistics` | 37KB for two functions (compound interest + linear regression) that are trivial to write inline. |
| `financejs` | Unmaintained since 2017. The compound interest formula is one line of math. |
| `chart.js` / `react-chartjs-2` | Would add a second charting library alongside Recharts. |
| `d3` (directly) | Recharts is built on D3 internally. Using D3 directly adds complexity with no benefit for standard chart types. |
| `victory` / `nivo` | Same issue -- switching charting libraries mid-project for no gain. |
| `framer-motion` | Chart animations are handled by Recharts internally (now built-in since 3.x removed react-smooth). |
| `@tanstack/react-query` | No API calls. All data is from localStorage. |

## Installation

```bash
# Upgrade Recharts to 3.x
npm install recharts@^3.8.1

# That's it. No other packages needed.
```

### Post-Upgrade Verification

After upgrading, verify existing charts still work:

1. Check `salary-by-month.tsx` -- BarChart renders correctly
2. Check `expenses-by-month.tsx` -- BarChart renders correctly
3. Check `components/ui/chart.tsx` -- shadcn wrapper imports work

The existing charts use only stable public API (`BarChart`, `Bar`, `XAxis`, `YAxis`, `ChartTooltip`) so no changes should be needed.

## Integration Points

### Where new chart code connects to existing app

| Integration | Existing Code | How |
|---|---|---|
| Investment data for projections | `useInvestmentsTracker` hook | Read `investments[]` with `currentValue`, `movements[]`, `type`, `currency` |
| Patrimony data | `useMoneyTracker` hook | Read `monthlyData.salaries`, expenses, balances |
| Currency conversion | `useCurrencyEngine` hook | Convert USD investments to ARS for unified patrimony chart |
| Date formatting | `date-fns` + `es` locale | Reuse exact pattern from `salary-by-month.tsx` |
| Chart container | `ChartContainer` from `components/ui/chart.tsx` | Wrap new charts same as existing ones |
| Tooltip styling | `ChartTooltip` + `ChartTooltipContent` | Reuse existing tooltip pattern for consistent look |

### New files to create

```
lib/projections/
  compound-interest.ts    -- FV calculation
  linear-trend.ts         -- Linear regression
  scenarios.ts            -- Scenario configs
  generate-series.ts      -- Data shaping for Recharts

components/charts/
  investment-projection.tsx   -- Investment growth chart
  patrimony-projection.tsx    -- Net worth chart
  chart-horizon-selector.tsx  -- 3/6/12/24 month selector
```

## Confidence Assessment

| Claim | Confidence | Basis |
|---|---|---|
| Recharts 3.x works with React 18 | HIGH | Official npm page states compatibility with React 17, 18, 19. Multiple sources confirm. |
| Migration from 2.x to 3.x is minimal | HIGH | Official migration guide: "most applications should not require any changes." Project uses only standard public API. |
| shadcn ChartContainer works with Recharts 3.x | HIGH | Wrapper uses `ResponsiveContainer` which is stable API. No internal state access. |
| Compound interest needs no library | HIGH | `Math.pow(1 + r/n, n*t)` -- verified across multiple sources and standard financial math. |
| Linear regression needs no library | HIGH | Standard least-squares formula, ~25 lines. Verified implementation pattern. |
| `strokeDasharray` for dashed/dotted lines | HIGH | Official Recharts API, verified in docs and examples. |
| `ComposedChart` for mixing Area + Line | HIGH | Standard Recharts component for mixed chart types. |
| date-fns 4.x works for axis formatting | HIGH | Already working in project's existing charts. |

## Sources

- [Recharts 3.0 Migration Guide](https://github.com/recharts/recharts/wiki/3.0-migration-guide) -- official wiki
- [Recharts GitHub Releases](https://github.com/recharts/recharts/releases) -- version history, 3.8.1 latest
- [Recharts Line API](https://recharts.github.io/en-US/api/Line/) -- strokeDasharray documentation
- [Recharts npm page](https://www.npmjs.com/package/recharts) -- React 18 compatibility confirmed
- [simple-statistics GitHub](https://github.com/simple-statistics/simple-statistics) -- evaluated and rejected (overkill)
- [Compound Interest in JavaScript](https://megafauna.dev/posts/javascript-compound-interest) -- confirms plain math approach
