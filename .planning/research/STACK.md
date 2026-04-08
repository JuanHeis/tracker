# Technology Stack: Monthly Flow Panel (v1.3)

**Project:** Expense Tracker — Flujo Mensual Panel Unificado
**Researched:** 2026-04-07
**Confidence:** HIGH — all findings verified against existing codebase, official Recharts examples, and Radix UI docs

---

## Context: What Already Exists (Do Not Re-Research)

| Technology | Version | Status |
|------------|---------|--------|
| Next.js | 14.2.16 | Installed, working |
| React | 18.x | Installed, working |
| TypeScript | 5.x | Installed, working |
| Recharts | **3.8.1** | Installed, working — note: `.planning/codebase/STACK.md` says 2.13.3 but `package.json` confirms 3.8.1 |
| shadcn/ui (ChartContainer, Chart, Input, Button, Dialog, Select, Tabs, Card) | current | Installed, working |
| Radix UI (@radix-ui/react-dialog, select, tabs, tooltip, alert-dialog, icons, slot) | current | Installed |
| Tailwind CSS | 3.4.1 | Installed, working |
| date-fns | 4.1.0 | Installed, working |
| `useLocalStorage<T>(key, initialValue, migrateFn?)` | custom hook | Working — all config persistence uses this |

---

## New Stack Requirements for v1.3

Three new UI capabilities are needed. All other logic is pure TypeScript in `lib/projection/`.

### Summary

| Capability | New Package Needed? | Action |
|------------|---------------------|--------|
| Waterfall chart (ingresos → fijos → variables → inversiones → libre) | **No** | Implement with existing Recharts 3.8.1 `BarChart` + stacked `Bar` + `Cell` |
| Savings rate selector (Slider for %) | **Yes** — `@radix-ui/react-slider` | Install + add shadcn Slider component |
| Mini-projection inline (12-month line) | **No** | Reuse existing `ComposedChart` + `Line` pattern from `patrimony-chart.tsx` |
| `SavingsRateConfig` localStorage persistence | **No** | New `useSavingsRateConfig` hook using existing `useLocalStorage` |
| `computeSavingsEstimate()` refactor | **No** | Pure TS change in `lib/projection/income-projection.ts` |

**Net new installs: 1 package** (`@radix-ui/react-slider`)

---

## Recommended Stack Additions

### New Dependency

| Library | Version | Purpose | Why |
|---------|---------|---------|-----|
| `@radix-ui/react-slider` | ^1.3.6 | Savings rate percentage input (0–100 drag slider) | Consistent with existing Radix UI suite; accessible keyboard navigation built-in; shadcn wraps it cleanly into the app's Tailwind theme |

### New shadcn/ui Component

| Component | Install Command | Purpose |
|-----------|-----------------|---------|
| `Slider` | `npx shadcn@latest add slider` | Renders `@radix-ui/react-slider` with app's CSS variable theming; generates `components/ui/slider.tsx` |

No other installs. The waterfall chart, mini-projection, mode toggles for savings selector, and all business logic are implemented using existing packages.

---

## Waterfall Chart: Pattern to Implement

Recharts has **no native waterfall component** (GitHub issue #7010 opened Feb 2026, not implemented). The official Recharts waterfall example and the widely-used community pattern both use the **stacked BarChart with transparent baseline** approach.

### How it works

Two `Bar` components share the same `stackId`. The first bar is `fill="transparent"` and acts as a floating spacer — its height equals the running cumulative total up to that point. The second bar renders the visible delta with `Cell` coloring per bar.

### Data transformation

```typescript
// lib/monthly-flow/waterfall.ts
export interface WaterfallSegment {
  name: string;      // "Ingresos", "Fijos", "Variables", "Inversiones", "Libre"
  value: number;     // The visible bar height (positive = income, negative = expense)
  baseline: number;  // Transparent spacer height = running total BEFORE this bar
  isTotal: boolean;  // true for "Libre" anchor bar (starts at 0)
}

export function computeWaterfallData(
  ingresos: number,
  gastosFijos: number,
  gastosVariables: number,
  inversiones: number
): WaterfallSegment[] {
  // baseline for each bar = sum of all previous values
  // value for expense bars is negative
  const libre = ingresos - gastosFijos - gastosVariables - inversiones;
  return [
    { name: "Ingresos",   value: ingresos,           baseline: 0,                                                 isTotal: false },
    { name: "Fijos",      value: -gastosFijos,        baseline: ingresos,                                          isTotal: false },
    { name: "Variables",  value: -gastosVariables,    baseline: ingresos - gastosFijos,                            isTotal: false },
    { name: "Inversiones",value: -inversiones,        baseline: ingresos - gastosFijos - gastosVariables,          isTotal: false },
    { name: "Libre",      value: libre,               baseline: 0,                                                 isTotal: true  },
  ];
}
```

### Component pattern

```tsx
// components/charts/monthly-flow-waterfall.tsx
import { BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid } from "recharts";
import { ChartContainer, ChartTooltip } from "@/components/ui/chart";

const COLORS = {
  ingresos:   "#22c55e",  // green
  gasto:      "#ef4444",  // red
  inversion:  "#3b82f6",  // blue
  libre:      "#10b981",  // emerald
  negativo:   "#f97316",  // orange (libre negative = overspent)
};

function getBarColor(entry: WaterfallSegment): string {
  if (entry.name === "Ingresos") return COLORS.ingresos;
  if (entry.name === "Inversiones") return COLORS.inversion;
  if (entry.isTotal) return entry.value >= 0 ? COLORS.libre : COLORS.negativo;
  return COLORS.gasto;
}

// Chart JSX:
<BarChart data={waterfallData}>
  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
  <XAxis dataKey="name" />
  <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
  <Bar dataKey="baseline" stackId="wf" fill="transparent" />
  <Bar dataKey="value" stackId="wf">
    {waterfallData.map((entry, i) => (
      <Cell key={i} fill={getBarColor(entry)} />
    ))}
  </Bar>
  <ChartTooltip ... />
</BarChart>
```

This pattern works in Recharts 3.8.1. The `BarChart` + stacked `Bar` + `Cell` API is unchanged from 2.x. The transparent baseline `Bar` must come before the visible `Bar` in JSX order for correct stacking.

---

## Savings Rate Selector: Component Architecture

Three modes: `auto` (derive from real data) / `percentage` (user sets % with slider) / `fixed` (user sets ARS amount).

### UI components

| Part | Component | Already in project? |
|------|-----------|---------------------|
| Mode toggle (auto / % / fijo) | Three `Button` components styled as segmented control, or existing `Tabs` | Yes — Button in `components/ui/button.tsx` |
| Percentage slider (0–100%) | shadcn `Slider` wrapping `@radix-ui/react-slider` | **No — needs install** |
| Percentage display input | `Input` component | Yes — `components/ui/input.tsx` |
| Fixed ARS amount input | `Input` component | Yes |

### Persistence type

```typescript
// lib/projection/savings-rate.ts  (new file)
export type SavingsRateMode = "auto" | "percentage" | "fixed";

export interface SavingsRateConfig {
  mode: SavingsRateMode;
  percentage: number;    // 0–100, used when mode === "percentage"
  fixedAmount: number;   // ARS amount, used when mode === "fixed"
}

export const DEFAULT_SAVINGS_RATE_CONFIG: SavingsRateConfig = {
  mode: "auto",
  percentage: 20,
  fixedAmount: 0,
};
```

### Hook pattern

```typescript
// hooks/useSavingsRateConfig.ts  (new file)
import { useLocalStorage } from "./useLocalStorage";
import type { SavingsRateConfig } from "@/lib/projection/savings-rate";
import { DEFAULT_SAVINGS_RATE_CONFIG } from "@/lib/projection/savings-rate";

export function useSavingsRateConfig() {
  const [config, setConfig] = useLocalStorage<SavingsRateConfig>(
    "savingsRateConfig",         // separate key — never touches "monthlyData"
    DEFAULT_SAVINGS_RATE_CONFIG
  );
  return { config, setConfig };
}
```

Using a **separate `"savingsRateConfig"` localStorage key** is critical — it does not touch the existing `"monthlyData"` key. The user already has real data in the app and the JSON safety constraint must be respected.

---

## Mini-Projection Inline: Component Architecture

Single `base` scenario line only, 12-month horizon, no user controls, no legend. Displayed below the waterfall chart.

Uses the exact same `ComposedChart` + `Line` pattern already in `components/charts/patrimony-chart.tsx`. The difference is: simplified data (no optimista/pesimista), fixed 12-month horizon, smaller aspect ratio, no `CardHeader`.

**No new Recharts components or patterns needed.** Reuse `ChartContainer` + `ComposedChart` + `Line` + `XAxis` + `YAxis` + `ReferenceLine`.

```typescript
// components/charts/mini-projection-chart.tsx
// Props: data: ProjectionDataPoint[], currentMonthIndex: number
// Renders: base scenario line only, 12-month horizon
```

---

## `computeSavingsEstimate()` Refactor

Pure TypeScript change — no stack implications.

Replace `estimateMonthlyNetSavings()` in `lib/projection/income-projection.ts` with `computeSavingsEstimate()` that reads from `SavingsRateConfig`:

```typescript
export function computeSavingsEstimate(
  currentSalary: number,
  activeRecurringExpenses: RecurringExpense[],
  globalUsdRate: number,
  config: SavingsRateConfig
): number {
  if (config.mode === "fixed") return Math.max(0, config.fixedAmount);
  if (config.mode === "percentage") return Math.max(0, currentSalary * (config.percentage / 100));
  // mode === "auto": original logic
  const totalRecurring = activeRecurringExpenses
    .filter((r) => r.status === "Activa")
    .reduce((sum, r) => {
      return sum + (r.currencyType === "USD" ? r.amount * globalUsdRate : r.amount);
    }, 0);
  return Math.max(0, currentSalary - totalRecurring);
}
```

`useProjectionEngine.ts` passes `SavingsRateConfig` down instead of calling `estimateMonthlyNetSavings` directly.

---

## Installation

```bash
# New dependency
npm install @radix-ui/react-slider

# Add shadcn Slider component (generates components/ui/slider.tsx)
npx shadcn@latest add slider
```

That's all. No other new packages.

---

## Alternatives Considered

| Recommended | Alternative | Why Not |
|-------------|-------------|---------|
| Recharts stacked Bar + Cell (waterfall) | External waterfall library (e.g. `@nivo/bar`) | Would add a second charting library; visual inconsistency with existing charts; Recharts 3.8.1 handles this natively |
| Recharts stacked Bar + Cell (waterfall) | D3 custom SVG | Far more complex for no benefit; Recharts abstracts D3 already |
| `@radix-ui/react-slider` for savings % | HTML `<input type="range">` | No accessible keyboard behavior, no styled thumb, inconsistent with Radix UI component model in the rest of the app |
| Separate `"savingsRateConfig"` key | Adding to `"monthlyData"` key | Keeps schema boundaries clean; zero migration risk for existing user data; matches pattern used by `usePayPeriod`, `useSetupWizard`, `useSalaryHistory` |
| Reuse `ComposedChart` + `Line` (mini-projection) | Separate chart library for sparklines | Overkill; existing pattern works; consistent tooltip/theming |

---

## What NOT to Add

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| Any waterfall-specific npm package | Tiny ecosystem, no maintenance signal, Recharts handles it | Recharts stacked Bar + Cell |
| `@nivo/bar`, `victory`, `chart.js` | Second charting library alongside working Recharts | Recharts BarChart |
| Modifying `"monthlyData"` key for new config | Risks corrupting existing user data; breaks `migrateData` assumption | Separate `"savingsRateConfig"` key |
| Radix `Switch` or `RadioGroup` for mode toggle | More complex than needed for 3 labeled options | Three `Button` styled as segmented group (existing component) |

---

## Version Compatibility

| Package | Version | Compatible With | Notes |
|---------|---------|-----------------|-------|
| `@radix-ui/react-slider` | ^1.3.6 | React 18, Next.js 14, Tailwind 3 | Consistent API with other `@radix-ui/*` packages already installed |
| Recharts | 3.8.1 | React 18 | Already installed and working; stacked Bar + Cell waterfall pattern unchanged since 2.x |

---

## Sources

- [Recharts Waterfall Example](https://recharts.github.io/en-US/examples/Waterfall/) — official pattern: stacked Bar + transparent baseline + Cell coloring (MEDIUM confidence — confirmed to exist; pattern verified via community implementations)
- [How to Create a Waterfall Chart in Recharts — Celia Ong](https://medium.com/2359media/tutorial-how-to-create-a-waterfall-chart-in-recharts-15a0e980d4b) — `pv` transparent baseline + `Cell` coloring walkthrough; matches official example approach (MEDIUM confidence)
- [Recharts Feature Request #7010](https://github.com/recharts/recharts/issues/7010) — confirms no native waterfall component as of Feb 2026 (HIGH confidence — GitHub issue, directly verified)
- [@radix-ui/react-slider npm](https://www.npmjs.com/package/@radix-ui/react-slider) — version 1.3.6 confirmed (HIGH confidence)
- [shadcn Slider docs](https://ui.shadcn.com/docs/components/radix/slider) — `npx shadcn@latest add slider` against `@radix-ui/react-slider` (HIGH confidence)
- Codebase: `package.json`, `hooks/useLocalStorage.ts`, `components/charts/patrimony-chart.tsx`, `lib/projection/income-projection.ts`, `lib/projection/types.ts` — read directly (HIGH confidence)

---
*Stack research for: Monthly Flow Panel v1.3 — waterfall chart, savings rate selector, mini-projection*
*Researched: 2026-04-07*
