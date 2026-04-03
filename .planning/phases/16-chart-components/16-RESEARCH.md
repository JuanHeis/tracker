# Phase 16: Chart Components - Research

**Researched:** 2026-04-03
**Domain:** Recharts 3.x chart composition, projection data visualization, interactive controls
**Confidence:** HIGH

## Summary

Phase 16 transforms the projection engine output (Phase 15) into interactive chart components. The foundation is solid: Recharts 3.8.1 is already installed and proven working (Phase 14), the `useProjectionEngine` hook returns a fully structured `ProjectionDataPoint[]` with historical patrimony and three scenario projections (optimista/base/pesimista), and a `ProjectionSkeleton` component already demonstrates the exact `ComposedChart` + `ReferenceLine` + dashed `Line` pattern needed.

The phase requires two chart components: (1) a patrimony evolution chart combining historical solid lines with dashed projection lines and a "Hoy" reference line, and (2) an investment portfolio chart showing projected growth with breakdown by investment type. Both need scenario toggling (3 lines with different visual styles), a horizon selector (3/6/12/24 months), and a disclaimer showing the current USD exchange rate used. The `useProjectionEngine` hook already accepts `horizonMonths` as a parameter, so the horizon selector simply re-calls the hook with a different value.

The `ProjectionSkeleton` component (`components/charts/projection-skeleton.tsx`) is the Phase 14 proof-of-concept that should be replaced with the real patrimony chart. The `ChartsContainer` (`components/charts-container.tsx`) currently renders `ProjectionSkeleton` with no props -- it will need to receive projection engine data and pass it to the real chart components.

**Primary recommendation:** Replace `ProjectionSkeleton` with a real `PatrimonyChart` component that consumes `useProjectionEngine` output directly. Build the `InvestmentChart` as a new sibling component. Add shared controls (horizon selector + scenario toggles) at the `ChartsContainer` level. Keep all chart components read-only -- zero localStorage writes.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| CHART-01 | User sees patrimony chart: solid line (historical) + dashed line (projection) + vertical "Hoy" reference line | `ProjectionDataPoint[]` from `useProjectionEngine` already has `historicalPatrimony` (solid), `proyeccionBase` (dashed), and `currentMonthIndex` for "Hoy" placement. `ProjectionSkeleton` proves the pattern with `ComposedChart`, `Line` (solid + `strokeDasharray`), `ReferenceLine`. |
| CHART-02 | User sees investment portfolio chart with projected growth and breakdown by type | `useProjectionEngine` returns `investmentProjections: InvestmentProjection[]` where each has `type`, `investmentName`, and `projectedValues[]`. Group by `type` and sum projected values per month for an `AreaChart` or stacked `Line` chart. |
| CHART-03 | User sees 3 scenario lines (optimista/base/pesimista) with different visual styles, toggleable on/off | `patrimonyData` already contains `proyeccionOptimista`, `proyeccionBase`, `proyeccionPesimista` fields. Use different `strokeDasharray` and `opacity` for each scenario. Toggle via local `useState` controlling which `Line` components render. |
| CHART-04 | User can select projection horizon (3, 6, 12, 24 months) and charts update immediately | `useProjectionEngine` accepts `options.horizonMonths`. A `Select` or segmented control at the `ChartsContainer` level passes the selected horizon down. The hook recomputes via `useMemo` on change. |
| CHART-05 | All charts show disclaimer combining ARS+USD at current exchange rate | `globalUsdRate` is available in the parent `expense-tracker.tsx`. Render a `<p>` or `<Alert>` below each chart: "Proyeccion a cotizacion actual: $X ARS/USD. Tasas de crecimiento estimadas, no garantizadas." |
</phase_requirements>

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `recharts` | 3.8.1 | Chart rendering (ComposedChart, Line, Area, ReferenceLine, XAxis, YAxis, CartesianGrid, Legend) | Already installed and proven in Phase 14. ComposedChart allows mixing solid/dashed lines in one chart. |
| `components/ui/chart.tsx` | shadcn wrapper | ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend | Already used by existing charts. Provides responsive sizing, theming, and dark mode via CSS variables. |

### Already Installed (No Changes Needed)

| Library | Version | Purpose | Why Relevant |
|---------|---------|---------|--------------|
| `date-fns` | ^4.1.0 | Month label formatting | Already used in existing charts and projection engine |
| `lucide-react` | latest | Icons for controls | Already used throughout the app |
| shadcn `Select`, `Tabs`, `Button` | latest | UI controls for horizon selector, scenario toggles | Already used throughout the app |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Multiple `Line` components for scenarios | `Area` with fill for scenario bands | Area fill between optimista/pesimista could show "cone of uncertainty" but adds visual complexity. Lines are cleaner for this use case. |
| Stacked `AreaChart` for investment types | Stacked `BarChart` for investment types | BarChart better shows discrete monthly values, but AreaChart better shows growth trend over time. Use Area for smooth projection. |
| `useState` for scenario toggles | URL params or context | Overkill for local UI state. `useState` is correct here. |

**Installation:**
```bash
# No new packages needed -- all dependencies already installed
```

## Architecture Patterns

### Recommended Project Structure
```
components/
  charts/
    patrimony-chart.tsx          # CHART-01, CHART-03, CHART-05 (replaces projection-skeleton.tsx)
    investment-chart.tsx         # CHART-02, CHART-03, CHART-05
    chart-controls.tsx           # CHART-04: horizon selector + scenario toggles (shared between charts)
    chart-disclaimer.tsx         # CHART-05: reusable disclaimer component
    expenses-by-month.tsx        # Existing (no changes)
    salary-by-month.tsx          # Existing (no changes)
  charts-container.tsx           # Updated: wires useProjectionEngine, passes data + controls
hooks/
  useProjectionEngine.ts         # Existing (no changes -- read-only consumer)
lib/
  projection/                    # Existing (no changes)
```

### Pattern 1: Patrimony Chart Data Flow

**What:** The patrimony chart receives `ProjectionDataPoint[]` from `useProjectionEngine` and renders solid historical + dashed projection lines.
**When to use:** This is the primary chart (CHART-01).

```typescript
// Data shape already provided by useProjectionEngine:
interface ProjectionDataPoint {
  month: string;           // "Ene 26"
  monthKey: string;        // "2026-01"
  historicalPatrimony: number | null;
  proyeccionOptimista: number | null;
  proyeccionBase: number | null;
  proyeccionPesimista: number | null;
}

// Chart uses ComposedChart with 4 Lines:
// 1. historicalPatrimony - solid green, strokeWidth 2
// 2. proyeccionOptimista - dashed, opacity 0.5 or lighter color
// 3. proyeccionBase - dashed, same green, strokeWidth 2
// 4. proyeccionPesimista - dashed, opacity 0.5 or lighter color
// + ReferenceLine at currentMonthIndex labeled "Hoy"
```

### Pattern 2: Investment Chart Data Transformation

**What:** Transform `InvestmentProjection[]` into chart-friendly data grouped by investment type.
**When to use:** CHART-02 -- investment portfolio projection.

```typescript
// useProjectionEngine returns:
interface InvestmentProjection {
  investmentId: string;
  investmentName: string;
  type: InvestmentType; // "Plazo Fijo" | "FCI" | "Crypto" | "Acciones" | "Cuenta remunerada"
  currencyType: CurrencyType;
  currentValue: number;
  projectedValues: number[]; // indexed by month
}

// Transform to chart data:
// Group projections by type, sum projectedValues per month
// Result: { month: string, "Plazo Fijo": number, "FCI": number, ... }[]
function buildInvestmentChartData(
  projections: InvestmentProjection[],
  horizonMonths: number,
  globalUsdRate: number
): InvestmentChartPoint[] {
  // For each month 0..horizonMonths:
  //   For each type: sum all projections of that type (converting USD to ARS)
  //   Return { month: label, [type]: total }
}
```

### Pattern 3: Scenario Toggle State

**What:** Local state controlling which scenario lines are visible.
**When to use:** CHART-03 -- user toggles scenarios on/off.

```typescript
// In ChartsContainer or chart-controls.tsx:
const [visibleScenarios, setVisibleScenarios] = useState({
  optimista: true,
  base: true,
  pesimista: true,
});

// Pass to chart component:
// Chart conditionally renders Line components:
{visibleScenarios.optimista && (
  <Line dataKey="proyeccionOptimista" ... />
)}
```

### Pattern 4: Horizon Selector Wiring

**What:** A control that changes `horizonMonths` which re-triggers `useProjectionEngine`.
**When to use:** CHART-04 -- horizon control.

```typescript
// In ChartsContainer:
const [horizonMonths, setHorizonMonths] = useState(12);

// useProjectionEngine is called in the parent with horizonMonths:
const projection = useProjectionEngine(
  monthlyData,
  salaryHistory.entries,
  recurringExpenses,
  globalUsdRate,
  { horizonMonths }
);

// Selector UI: shadcn Select with 4 options
<Select value={String(horizonMonths)} onValueChange={(v) => setHorizonMonths(Number(v))}>
  <SelectItem value="3">3 meses</SelectItem>
  <SelectItem value="6">6 meses</SelectItem>
  <SelectItem value="12">12 meses</SelectItem>
  <SelectItem value="24">24 meses</SelectItem>
</Select>
```

### Pattern 5: Chart Component Hydration

**What:** Every chart uses "use client" + useHydration + placeholder.
**When to use:** All new chart components (established in Phase 14).

```typescript
"use client";
import { useHydration } from "@/hooks/useHydration";

export function PatrimonyChart({ ... }) {
  const isHydrated = useHydration();
  if (!isHydrated) {
    return <div className="aspect-video animate-pulse bg-muted rounded-lg" />;
  }
  return (
    <ChartContainer config={chartConfig}>
      <ComposedChart data={patrimonyData}>
        ...
      </ComposedChart>
    </ChartContainer>
  );
}
```

### Anti-Patterns to Avoid

- **Modifying `useProjectionEngine` or `lib/projection/` files:** Phase 16 is UI-only. The projection engine is complete. Charts are pure read-only consumers.
- **Storing chart state in localStorage:** Horizon and scenario toggles are ephemeral UI preferences, not persistent data. Use `useState` only.
- **Using `connectNulls={true}` on historical/projection lines:** This would draw a line connecting past and future data through the "today" point, breaking the visual separation between real and projected data.
- **Building custom responsive containers:** Use `ChartContainer` from shadcn -- it wraps `ResponsiveContainer` and handles theming.
- **Modifying `components/ui/chart.tsx`:** The shadcn chart wrapper is proven stable. No changes needed.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Responsive chart sizing | Manual resize observers | `ChartContainer` (shadcn) | Already built, tested, handles dark mode |
| Tooltip formatting | Custom tooltip divs | `ChartTooltip` + `ChartTooltipContent` | Consistent with existing charts |
| Number formatting | Custom formatter | `Intl.NumberFormat` or `.toLocaleString()` | Already used throughout the app |
| Data transformation from projection types | Ad-hoc inline mapping | A dedicated `buildInvestmentChartData()` function | Keeps chart component clean, testable |
| Scenario visual differentiation | Complex CSS | Recharts `strokeDasharray` + `opacity` props | Built into Recharts Line component |

**Key insight:** The projection engine (Phase 15) already outputs data in almost chart-ready format. The investment chart needs a grouping transformation, but the patrimony chart data (`ProjectionDataPoint[]`) maps 1:1 to Recharts `Line` dataKeys.

## Common Pitfalls

### Pitfall 1: connectNulls Breaking Historical/Projection Separation

**What goes wrong:** If `connectNulls` is not explicitly set to `false`, Recharts will skip null points but the line could still appear connected if both `historicalPatrimony` and a `proyeccion*` field have values on the same data point (the "today" overlap point).
**Why it happens:** The `ProjectionDataPoint` for the current month has BOTH `historicalPatrimony` and `proyeccion*` values set (it's the bridge point). This is by design in `useProjectionEngine` to create visual overlap.
**How to avoid:** Use `connectNulls={false}` on all Lines. The bridge point ensures visual continuity where historical meets projection.
**Warning signs:** A gap between the end of the historical line and start of projection.

### Pitfall 2: Investment Chart Missing USD Conversion

**What goes wrong:** Investment projections store `projectedValues` in their native currency (USD for Crypto, ARS for Plazo Fijo). Without conversion, the chart mixes currencies.
**Why it happens:** `InvestmentProjection` preserves `currencyType`. The `useProjectionEngine` hook does conversion internally for patrimony, but `investmentProjections` array returns raw values.
**How to avoid:** In the investment chart data transformation, multiply USD investment values by `globalUsdRate` before summing by type.
**Warning signs:** USD investments appearing as tiny numbers relative to ARS investments.

### Pitfall 3: Horizon Change Causing Chart Flash

**What goes wrong:** Changing the horizon selector triggers `useMemo` recalculation in `useProjectionEngine`, causing a brief re-render where the chart may flash or reset its animation.
**Why it happens:** Recharts re-animates on data change by default.
**How to avoid:** Set `isAnimationActive={false}` on Line/Area components, or use a short animation duration. For projection charts, instant updates are better than smooth transitions since the data shape changes.
**Warning signs:** Laggy or jumpy chart when switching horizons.

### Pitfall 4: Chart Overflow on Small Screens

**What goes wrong:** With 24-month horizon, XAxis labels overlap and become unreadable on mobile.
**Why it happens:** Too many month labels for the available width.
**How to avoid:** Use `interval="preserveStartEnd"` on XAxis to auto-skip intermediate labels. Or compute interval based on horizon: `interval={horizonMonths <= 6 ? 0 : horizonMonths <= 12 ? 1 : 2}`.
**Warning signs:** Overlapping or rotated XAxis labels.

### Pitfall 5: ChartContainer Props Threading

**What goes wrong:** `ChartsContainer` currently only accepts `monthlyData` and `selectedYear`. It needs additional props to wire the projection engine.
**Why it happens:** The `ChartsContainer` interface was designed for simple expense/salary charts.
**How to avoid:** Expand `ChartsContainerProps` to include `salaryHistory`, `recurringExpenses`, and `globalUsdRate`. Call `useProjectionEngine` inside `ChartsContainer` rather than in the parent to keep the interface minimal. Alternatively, call `useProjectionEngine` inside `ChartsContainer` itself, but this requires threading the raw data through.
**Warning signs:** Prop drilling too many levels deep.

### Pitfall 6: Investment Chart Empty State

**What goes wrong:** If user has no active investments, the investment chart shows nothing.
**Why it happens:** `investmentProjections` returns an empty array when there are no active non-liquid investments.
**How to avoid:** Show a meaningful empty state: "No hay inversiones activas para proyectar" with a subtle illustration or message.
**Warning signs:** Blank chart area with axes but no data.

## Code Examples

### Patrimony Chart Core Structure

```typescript
// Source: Adapted from projection-skeleton.tsx (Phase 14) + useProjectionEngine types
"use client";

import { useHydration } from "@/hooks/useHydration";
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "../ui/chart";
import { ComposedChart, Line, XAxis, YAxis, CartesianGrid, ReferenceLine } from "recharts";
import type { ProjectionDataPoint } from "@/lib/projection/types";

const chartConfig = {
  historicalPatrimony: { label: "Historico", color: "hsl(var(--chart-1))" },
  proyeccionOptimista: { label: "Optimista", color: "hsl(var(--chart-2))" },
  proyeccionBase: { label: "Base", color: "hsl(var(--chart-1))" },
  proyeccionPesimista: { label: "Pesimista", color: "hsl(var(--chart-3))" },
} satisfies ChartConfig;

interface PatrimonyChartProps {
  data: ProjectionDataPoint[];
  currentMonthIndex: number;
  visibleScenarios: { optimista: boolean; base: boolean; pesimista: boolean };
  globalUsdRate: number;
}

export function PatrimonyChart({ data, currentMonthIndex, visibleScenarios, globalUsdRate }: PatrimonyChartProps) {
  const isHydrated = useHydration();
  if (!isHydrated) return <div className="aspect-video animate-pulse bg-muted rounded-lg" />;

  const todayLabel = data[currentMonthIndex]?.month ?? "";

  return (
    <>
      <ChartContainer config={chartConfig}>
        <ComposedChart data={data}>
          <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
          <XAxis dataKey="month" fontSize={12} tickLine={false} axisLine={false} />
          <YAxis fontSize={12} tickLine={false} axisLine={false}
            tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
          <ReferenceLine x={todayLabel} stroke="#888" strokeDasharray="3 3"
            label={{ value: "Hoy", position: "top", fontSize: 12 }} />
          {/* Historical: solid line */}
          <Line type="monotone" dataKey="historicalPatrimony" stroke="var(--color-historicalPatrimony)"
            strokeWidth={2} dot={false} connectNulls={false} isAnimationActive={false} />
          {/* Projections: dashed lines with varying opacity */}
          {visibleScenarios.optimista && (
            <Line type="monotone" dataKey="proyeccionOptimista" stroke="var(--color-proyeccionOptimista)"
              strokeWidth={1.5} strokeDasharray="5 5" strokeOpacity={0.5} dot={false}
              connectNulls={false} isAnimationActive={false} />
          )}
          {visibleScenarios.base && (
            <Line type="monotone" dataKey="proyeccionBase" stroke="var(--color-proyeccionBase)"
              strokeWidth={2} strokeDasharray="5 5" dot={false}
              connectNulls={false} isAnimationActive={false} />
          )}
          {visibleScenarios.pesimista && (
            <Line type="monotone" dataKey="proyeccionPesimista" stroke="var(--color-proyeccionPesimista)"
              strokeWidth={1.5} strokeDasharray="5 5" strokeOpacity={0.5} dot={false}
              connectNulls={false} isAnimationActive={false} />
          )}
          <ChartTooltip content={<ChartTooltipContent />} cursor={false} />
        </ComposedChart>
      </ChartContainer>
      <ChartDisclaimer globalUsdRate={globalUsdRate} />
    </>
  );
}
```

### Investment Chart Data Transformation

```typescript
// Source: Derived from InvestmentProjection type in lib/projection/types.ts
import type { InvestmentProjection } from "@/lib/projection/types";
import { CurrencyType } from "@/constants/investments";

interface InvestmentChartPoint {
  month: string;
  [investmentType: string]: number | string; // type name -> total value in ARS
}

export function buildInvestmentChartData(
  projections: InvestmentProjection[],
  horizonMonths: number,
  globalUsdRate: number,
  monthLabels: string[] // from patrimonyData[].month starting at currentMonthIndex
): InvestmentChartPoint[] {
  // Get unique types
  const types = [...new Set(projections.map(p => p.type))];

  const data: InvestmentChartPoint[] = [];
  for (let m = 0; m <= horizonMonths; m++) {
    const point: InvestmentChartPoint = { month: monthLabels[m] || `M${m}` };
    for (const type of types) {
      const typeProjections = projections.filter(p => p.type === type);
      let total = 0;
      for (const p of typeProjections) {
        const value = p.projectedValues[m] || 0;
        total += p.currencyType === CurrencyType.USD ? value * globalUsdRate : value;
      }
      point[type] = Math.round(total);
    }
    data.push(point);
  }
  return data;
}
```

### Chart Disclaimer Component

```typescript
// Reusable disclaimer for CHART-05
interface ChartDisclaimerProps {
  globalUsdRate: number;
}

export function ChartDisclaimer({ globalUsdRate }: ChartDisclaimerProps) {
  return (
    <p className="text-xs text-muted-foreground mt-2 text-center italic">
      Proyeccion a cotizacion actual: ${globalUsdRate.toLocaleString()} ARS/USD.
      Tasas de crecimiento estimadas, no garantizadas.
    </p>
  );
}
```

### Horizon Selector + Scenario Toggles

```typescript
// Shared controls for both charts
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

interface ChartControlsProps {
  horizonMonths: number;
  onHorizonChange: (months: number) => void;
  visibleScenarios: { optimista: boolean; base: boolean; pesimista: boolean };
  onToggleScenario: (scenario: "optimista" | "base" | "pesimista") => void;
}

export function ChartControls({ horizonMonths, onHorizonChange, visibleScenarios, onToggleScenario }: ChartControlsProps) {
  return (
    <div className="flex items-center justify-between gap-4 flex-wrap">
      <Select value={String(horizonMonths)} onValueChange={(v) => onHorizonChange(Number(v))}>
        <SelectTrigger className="w-[140px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="3">3 meses</SelectItem>
          <SelectItem value="6">6 meses</SelectItem>
          <SelectItem value="12">12 meses</SelectItem>
          <SelectItem value="24">24 meses</SelectItem>
        </SelectContent>
      </Select>
      <div className="flex gap-2">
        {(["optimista", "base", "pesimista"] as const).map((s) => (
          <Button key={s} variant={visibleScenarios[s] ? "default" : "outline"} size="sm"
            onClick={() => onToggleScenario(s)}>
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </Button>
        ))}
      </div>
    </div>
  );
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Mock data in ProjectionSkeleton | Real data from useProjectionEngine | Phase 16 (now) | Replaces skeleton with live projection charts |
| Single scenario line | Three scenarios (optimista/base/pesimista) | Phase 15 engine | Charts need to render 3 lines with toggles |
| Fixed 12-month horizon | Configurable 3/6/12/24 months | Phase 15 engine supports this | Need UI selector to control |

**Deprecated/outdated:**
- `ProjectionSkeleton`: Will be replaced by `PatrimonyChart`. Delete the skeleton file after the real chart is built.

## Open Questions

1. **Where to call `useProjectionEngine` -- ChartsContainer vs expense-tracker.tsx?**
   - What we know: `ChartsContainer` currently only receives `monthlyData` and `selectedYear`. `useProjectionEngine` needs `monthlyData`, `salaryHistory.entries`, `recurringExpenses`, and `globalUsdRate`.
   - What's unclear: Whether to thread all these props through `ChartsContainer` or call the hook higher up.
   - Recommendation: Call `useProjectionEngine` inside `ChartsContainer` by expanding its props to include the additional data. This keeps the hook call close to where its output is consumed and avoids polluting `expense-tracker.tsx` with chart-specific logic. The props expansion is minimal (3 extra props).

2. **Stacked Area vs Grouped Lines for Investment Chart**
   - What we know: Stacked `AreaChart` shows total portfolio growth with breakdown by type. Grouped `Line` components show individual type trends.
   - What's unclear: Which visualization is more intuitive for the user.
   - Recommendation: Use stacked `Area` in an `AreaChart`. This shows both the total portfolio value and the relative contribution of each investment type. More informative than separate lines that are harder to compare.

3. **Investment chart scenarios**
   - What we know: `useProjectionEngine` computes `investmentProjections` using base rate multiplier (1.0) only. The three patrimony scenarios already include investment growth via `computeInvestmentGrowth` internally.
   - What's unclear: Whether the investment chart should also show 3 scenarios, or just the base projection.
   - Recommendation: For the investment chart, show only the base projection with type breakdown. The patrimony chart already shows the 3 scenarios with investment growth folded in. Showing 3x scenarios on the investment chart with type breakdown would be 3 * N_types lines, which is too complex. Keep it simple.

## Sources

### Primary (HIGH confidence)
- Project source: `hooks/useProjectionEngine.ts` -- verified hook interface and return types
- Project source: `lib/projection/types.ts` -- verified `ProjectionDataPoint`, `InvestmentProjection`, `UseProjectionEngineReturn` interfaces
- Project source: `components/charts/projection-skeleton.tsx` -- verified working ComposedChart + ReferenceLine + dashed Line pattern with Recharts 3.8.1
- Project source: `components/ui/chart.tsx` -- verified ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend exports
- Project source: `components/charts-container.tsx` -- verified current interface (only `monthlyData` + `selectedYear`)
- Project source: `components/expense-tracker.tsx` -- verified available data at top level (`monthlyData`, `salaryHistory`, `recurringExpenses`, `globalUsdRate`)
- Project source: `package.json` -- verified `recharts: ^3.8.1` installed
- Phase 14 Research: `.planning/phases/14-recharts-upgrade-chart-infrastructure/14-RESEARCH.md` -- verified patterns and anti-patterns

### Secondary (MEDIUM confidence)
- Recharts `ComposedChart`, `Line`, `Area`, `ReferenceLine` API -- verified available in installed version via Node.js require check
- Recharts `strokeDasharray`, `opacity`, `connectNulls` props -- based on Phase 14 proven skeleton pattern

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - no new dependencies, all libraries already installed and proven in Phase 14
- Architecture: HIGH - data flow is clear, `useProjectionEngine` output maps directly to chart dataKeys, existing patterns proven
- Pitfalls: HIGH - identified from actual codebase analysis (bridge point overlap, USD conversion, responsive labels)

**Research date:** 2026-04-03
**Valid until:** 2026-05-03 (30 days -- stable domain, no new dependencies)
