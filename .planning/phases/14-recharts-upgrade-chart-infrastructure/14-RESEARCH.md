# Phase 14: Recharts Upgrade & Chart Infrastructure - Research

**Researched:** 2026-04-03
**Domain:** Recharts 2.x to 3.x migration, Next.js chart hydration patterns
**Confidence:** HIGH

## Summary

Phase 14 is a focused infrastructure phase: upgrade Recharts from 2.13.3 to 3.8.1, verify that the two existing charts (salary-by-month and expenses-by-month) still render correctly, and create a projection chart skeleton that proves the "use client" + useHydration + ChartContainer pattern works with Recharts 3.x.

The project currently has two BarChart components (`salary-by-month.tsx`, `expenses-by-month.tsx`) wrapped in the shadcn `ChartContainer` from `components/ui/chart.tsx`. These charts use only stable public API (`BarChart`, `Bar`, `XAxis`, `YAxis`, `ChartTooltip`). The shadcn wrapper imports `* as RechartsPrimitive from "recharts"` and wraps `ResponsiveContainer` -- both are stable across the 2.x to 3.x transition. The migration should be seamless with zero code changes to existing chart files.

The skeleton projection chart will use `ComposedChart` with `Line` (dashed for projection) and `ReferenceLine` (for "Hoy" marker), establishing the pattern that Phase 15 and 16 will use for real data.

**Primary recommendation:** Upgrade `recharts` to `^3.8.1` via `npm install recharts@^3.8.1`, visually verify both existing charts, then create a minimal skeleton chart component that demonstrates the projection pattern.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| INFRA-01 | Recharts actualizado a v3.x con charts existentes verificados post-upgrade | Recharts 3.8.1 is current latest. Migration from 2.x is minimal -- official guide states "most applications should not require any changes." Project uses only stable public API (BarChart, Bar, XAxis, YAxis). See Standard Stack and Migration Details sections. |
| INFRA-02 | Todos los charts usan patron "use client" + useHydration + ChartContainer existente | Current charts lack `"use client"` directive -- they inherit client context from parent `expense-tracker.tsx` which has both `"use client"` and `useHydration()`. The skeleton projection chart should follow the same pattern, adding `"use client"` + `useHydration` guard directly in the chart component for self-contained usage. See Architecture Patterns section. |
| INFRA-03 | Cero cambios a interfaces existentes de localStorage (MonthlyData, Investment, etc.) -- charts son read-only | This phase touches ZERO localStorage interfaces. The upgrade is a dependency swap. The skeleton chart uses hardcoded mock data. JSON export/import regression test confirms no schema changes. |
</phase_requirements>

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `recharts` | 3.8.1 (upgrade from 2.13.3) | Chart rendering | 3.x removed `react-smooth` and `recharts-scale` dependencies (smaller bundle), rewrote state management with 3500+ tests, better performance. Official migration: "most applications should not require any changes." |

### Already Installed (No Changes)

| Library | Version | Purpose | Why Relevant |
|---------|---------|---------|--------------|
| `react` | ^18 | UI framework | Recharts 3.x supports React 17, 18, 19 |
| `next` | 14.2.16 | App framework | Charts must handle SSR via "use client" + useHydration |
| `date-fns` | ^4.1.0 | Date formatting on axes | Already used in existing charts |
| shadcn `ChartContainer` | (custom component) | Responsive wrapper | `components/ui/chart.tsx` -- wraps ResponsiveContainer with config/theming |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Recharts 3.x upgrade | Stay on Recharts 2.x | No benefit to staying. 3.x is smaller bundle, fewer deps, same API surface for our usage |
| Recharts 3.x upgrade | Switch to Nivo/Victory/Chart.js | Would require rewriting existing charts and the shadcn wrapper. Massive churn for zero benefit |

**Installation:**
```bash
npm install recharts@^3.8.1
```

## Architecture Patterns

### Current Chart Rendering Chain

```
app/page.tsx (server component)
  -> ExpenseTracker (components/expense-tracker.tsx)
       "use client" + useHydration() guard
         -> ChartsContainer (components/charts-container.tsx)
              NO "use client" (inherits from parent)
              -> ExpensesByMonth (components/charts/expenses-by-month.tsx)
              -> SalaryByMonth (components/charts/salary-by-month.tsx)
                   Both use: ChartContainer > BarChart > Bar, XAxis, YAxis, ChartTooltip
```

### Existing Files Inventory

| File | Role | Recharts Imports |
|------|------|-----------------|
| `components/ui/chart.tsx` | shadcn wrapper -- `ChartContainer`, `ChartTooltip`, `ChartTooltipContent`, `ChartLegend` | `* as RechartsPrimitive from "recharts"` (uses `ResponsiveContainer`, `Tooltip`, `Legend`) |
| `components/charts/salary-by-month.tsx` | Salary BarChart with ARS/USD tabs | `Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip` |
| `components/charts/expenses-by-month.tsx` | Expenses BarChart | `Bar, BarChart, XAxis, YAxis` |
| `components/charts-container.tsx` | Renders both charts | No recharts imports |
| `hooks/useHydration.ts` | SSR hydration guard | N/A |

### Pattern 1: Projection Chart Skeleton

**What:** A minimal chart component that demonstrates the projection chart pattern for Phase 15/16 consumption.
**When to use:** This is the skeleton that proves the pattern works with Recharts 3.x before real projection data exists.

```typescript
// components/charts/projection-skeleton.tsx
"use client";

import { useHydration } from "@/hooks/useHydration";
import {
  ChartContainer,
  ChartConfig,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ReferenceLine,
} from "recharts";

const chartConfig = {
  real: { label: "Historico", color: "#10b981" },
  proyeccion: { label: "Proyeccion", color: "#10b981" },
} satisfies ChartConfig;

// Mock data -- will be replaced by real projection engine in Phase 15
const MOCK_DATA = [
  { month: "Ene", real: 100000, proyeccion: null },
  { month: "Feb", real: 120000, proyeccion: null },
  { month: "Mar", real: 115000, proyeccion: null },
  { month: "Abr", real: 130000, proyeccion: 130000 },  // "today"
  { month: "May", real: null, proyeccion: 140000 },
  { month: "Jun", real: null, proyeccion: 152000 },
];

export function ProjectionSkeleton() {
  const isHydrated = useHydration();

  if (!isHydrated) {
    return <div className="aspect-video animate-pulse bg-muted rounded-lg" />;
  }

  return (
    <ChartContainer config={chartConfig}>
      <ComposedChart data={MOCK_DATA}>
        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
        <XAxis dataKey="month" />
        <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
        <ReferenceLine
          x="Abr"
          stroke="#888"
          strokeDasharray="3 3"
          label={{ value: "Hoy", position: "top" }}
        />
        <Line
          type="monotone"
          dataKey="real"
          stroke="#10b981"
          strokeWidth={2}
          dot={false}
          connectNulls={false}
        />
        <Line
          type="monotone"
          dataKey="proyeccion"
          stroke="#10b981"
          strokeWidth={2}
          strokeDasharray="5 5"
          dot={false}
          connectNulls={false}
        />
        <ChartTooltip content={<ChartTooltipContent />} />
      </ComposedChart>
    </ChartContainer>
  );
}
```

### Pattern 2: Hydration Loading State

**What:** Show a placeholder while chart hydrates to prevent layout shift.
**When to use:** Every chart component that needs "use client" + useHydration.

```typescript
if (!isHydrated) {
  return <div className="aspect-video animate-pulse bg-muted rounded-lg" />;
}
```

### Anti-Patterns to Avoid

- **Modifying chart.tsx wrapper during upgrade:** The shadcn `ChartContainer` uses `ResponsiveContainer` which is stable API. Do NOT touch this file unless something actually breaks.
- **Removing "use client" from existing components:** The `expense-tracker.tsx` parent provides the client boundary. Do not change this architecture.
- **Importing ResponsiveContainer directly in new charts:** Use `ChartContainer` wrapper instead -- it handles ResponsiveContainer internally plus theming.
- **Writing projection logic in this phase:** Phase 14 is infrastructure only. The skeleton uses mock data. Real projection math is Phase 15.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Responsive chart sizing | Manual resize observers | `ChartContainer` (shadcn wrapper around `ResponsiveContainer`) | Already built and working in the project |
| Chart theming/dark mode | Custom CSS per chart | `ChartStyle` in `components/ui/chart.tsx` | Already handles light/dark via CSS variables |
| Tooltip rendering | Custom tooltip divs | `ChartTooltip` + `ChartTooltipContent` | Consistent with existing charts, handles positioning |

**Key insight:** The project already has a well-built chart infrastructure via shadcn. Phase 14 is about upgrading the underlying library and proving the pattern extends to ComposedChart (mixed line types), not building new infrastructure.

## Common Pitfalls

### Pitfall 1: salary-by-month.tsx Imports Unused ResponsiveContainer

**What goes wrong:** `salary-by-month.tsx` imports `ResponsiveContainer` and `Tooltip` from recharts but does not use them directly (it uses `ChartContainer` and `ChartTooltip` from shadcn instead). If Recharts 3.x changes these exports, the import could break even though the component does not need them.
**Why it happens:** Leftover imports from initial development.
**How to avoid:** Clean up unused imports during upgrade verification. Remove `ResponsiveContainer` and `Tooltip` from the recharts import in `salary-by-month.tsx`.
**Warning signs:** TypeScript or build warnings about unused imports.

### Pitfall 2: Recharts 3.x accessibilityLayer Default Change

**What goes wrong:** Recharts 3.x defaults `accessibilityLayer` to `true` on chart components. This adds keyboard navigation and ARIA roles. While positive, it can cause unexpected focus outlines or keyboard behavior.
**Why it happens:** New default in 3.x. Not a breaking change but a behavior change.
**How to avoid:** Test keyboard interaction after upgrade. If focus outlines are unwanted, the shadcn wrapper already has `[&_.recharts-surface]:outline-none` CSS selector.
**Warning signs:** Visible focus rings on chart elements when tabbing.

### Pitfall 3: connectNulls Behavior in Mixed Real/Projection Data

**What goes wrong:** Projection charts have `null` values in the "real" series for future months and `null` in "proyeccion" for past months. Without `connectNulls={false}`, Recharts will draw a line through the nulls, connecting historical to projection data.
**Why it happens:** Default `connectNulls` is `false` for Line, but worth being explicit since the skeleton pattern relies on this behavior.
**How to avoid:** Always set `connectNulls={false}` explicitly on projection chart Lines.
**Warning signs:** A single continuous line instead of two separate segments.

### Pitfall 4: JSON Export/Import Regression

**What goes wrong:** A dependency upgrade could theoretically affect how data serializes or deserializes if intermediate code paths change.
**Why it happens:** Recharts upgrade should NOT affect this, but INFRA-03 requires explicit verification.
**How to avoid:** After upgrade, export JSON from the running app and re-import it. Verify data integrity.
**Warning signs:** Import fails, data is missing, or amounts change after round-trip.

## Code Examples

### Existing Chart Pattern (salary-by-month.tsx -- Current Working Code)

```typescript
// Source: components/charts/salary-by-month.tsx (existing)
import { Bar, BarChart, XAxis, YAxis } from "recharts";
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "../ui/chart";

const chartConfig = { label: "Ingreso fijo", icon: Coins } as ChartConfig;

// Inside component:
<ChartContainer config={chartConfig}>
  <BarChart data={data}>
    <XAxis dataKey="month" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
    <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false}
           tickFormatter={(value) => `$${value.toLocaleString()}`} />
    <Bar dataKey="total" fill="currentColor" radius={[4, 4, 0, 0]} className="fill-primary" />
    <ChartTooltip content={<ChartTooltipContent />} cursor={false} />
  </BarChart>
</ChartContainer>
```

### Post-Upgrade: Clean Import for salary-by-month.tsx

```typescript
// Remove unused ResponsiveContainer and Tooltip imports
import { Bar, BarChart, XAxis, YAxis } from "recharts";
// (ResponsiveContainer is used internally by ChartContainer)
// (Tooltip is re-exported as ChartTooltip from shadcn wrapper)
```

### New: ComposedChart with Dashed Projection Line

```typescript
// Source: Recharts ComposedChart API
import { ComposedChart, Line, ReferenceLine, CartesianGrid } from "recharts";

<ComposedChart data={data}>
  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
  <XAxis dataKey="month" />
  <YAxis />
  {/* Solid line = historical real data */}
  <Line type="monotone" dataKey="real" stroke="#10b981" strokeWidth={2} dot={false} />
  {/* Dashed line = projection */}
  <Line type="monotone" dataKey="proyeccion" stroke="#10b981" strokeDasharray="5 5" strokeWidth={2} dot={false} />
  {/* "Today" vertical marker */}
  <ReferenceLine x="Abr" stroke="#888" strokeDasharray="3 3" label="Hoy" />
</ComposedChart>
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Recharts 2.x with `react-smooth` dependency | Recharts 3.x with built-in animations | v3.0.0 (2024) | Smaller bundle, fewer transitive deps |
| Recharts 2.x with `recharts-scale` dependency | Recharts 3.x with built-in scale | v3.0.0 (2024) | Fewer peer dep conflicts |
| `CategoricalChartState` type export | Removed in 3.x | v3.0.0 (2024) | Not used in this project -- no impact |

**Deprecated/outdated:**
- `react-smooth`: Removed from Recharts 3.x. Animations are now built-in. If any code imports `react-smooth` directly, it will fail after upgrade. (This project does not.)
- `recharts-scale`: Same -- removed from 3.x, built-in now.

## Open Questions

1. **shadcn ChartContainer CSS selectors with Recharts 3.x**
   - What we know: The `chart.tsx` wrapper uses CSS selectors like `[&_.recharts-cartesian-axis-tick_text]` and `[&_.recharts-rectangle.recharts-tooltip-cursor]` that target Recharts internal class names.
   - What's unclear: Whether Recharts 3.x changed any internal CSS class names.
   - Recommendation: Visual verification after upgrade. If tooltip cursor or axis tick styling looks wrong, check class names in browser DevTools. HIGH confidence this is fine since the Recharts team maintains CSS class name compatibility.

2. **ComposedChart within ChartContainer**
   - What we know: `ChartContainer` expects `children` matching `ResponsiveContainer["children"]`, which is any valid Recharts chart. Existing usage is with `BarChart`.
   - What's unclear: Whether `ComposedChart` has any special sizing requirements vs `BarChart`.
   - Recommendation: The skeleton component will confirm this works. If it does, the pattern is proven for Phase 15/16.

## Sources

### Primary (HIGH confidence)
- Recharts npm registry: v3.8.1 confirmed as latest (verified via `npm view recharts version`)
- Project `package.json`: Recharts 2.13.3, React ^18, Next.js 14.2.16 (verified by reading file)
- Project source code: `components/ui/chart.tsx`, `components/charts/salary-by-month.tsx`, `components/charts/expenses-by-month.tsx` (verified by reading files)
- `.planning/research/STACK.md`: Prior v1.2 ecosystem research (verified, authored 2026-04-03)
- `.planning/research/PITFALLS.md`: Prior pitfalls research for predictive charts (verified, authored 2026-04-03)

### Secondary (MEDIUM confidence)
- Recharts 3.0 migration guide (referenced in STACK.md, states "most applications should not require any changes")
- Recharts GitHub releases page (v3.8.1 latest, React 18 compatible)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - single dependency upgrade, version verified on npm registry, prior research confirmed
- Architecture: HIGH - existing chart files read and analyzed, pattern is clear and simple
- Pitfalls: HIGH - prior pitfalls research exists, cross-referenced with actual codebase findings

**Research date:** 2026-04-03
**Valid until:** 2026-05-03 (30 days -- stable domain, single library upgrade)
