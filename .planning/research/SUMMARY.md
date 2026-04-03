# Project Research Summary

**Project:** Expense Tracker v1.2 — Graficos Predictivos
**Domain:** Predictive financial charts for a localStorage-based personal finance app (ARS/USD, investments, income, expenses)
**Researched:** 2026-04-03
**Confidence:** HIGH

## Executive Summary

This milestone adds projection charts to an existing Next.js expense tracker. The app is already well-equipped: Recharts 2.13.3 + shadcn ChartContainer are installed and working; date-fns with Spanish locale is in use; hooks expose investments, salary history, recurring expenses, and monthly data. The recommended approach is surgical — upgrade Recharts to 3.x (minimal breaking changes), write 4 small projection utility functions in plain TypeScript (~100 lines total), add one orchestrator hook (`useProjections`), and build two chart components. Zero new library dependencies beyond the Recharts upgrade.

The core challenge is not visualization (Recharts handles it) but data wrangling: historical patrimony must be reconstructed from `monthlyData` since it was never stored, investment growth rates must come from field data or sensible defaults (not from movements), and ARS/USD mixing requires a deliberate currency strategy. The recommended approach keeps every chart read-only — no localStorage schema changes — and uses current `globalUsdRate` for all currency conversions with a visible disclaimer.

The primary risk is false precision: projections that look authoritative but rest on rough assumptions. Mitigation is baked into the visual language — dashed lines for all projections, a "Hoy" reference line, scenario labels that show the assumed rate (e.g., "Base (10% anual)"), and a disclaimer note on each chart. A secondary risk is deriving growth rates from investment movements, which conflate user deposits with market returns. This is solved by using `currentValue` as the starting point and configurable default rates per investment type.

## Key Findings

### Recommended Stack

Recharts 3.x is a worthwhile upgrade over the currently installed 2.13.3. The 3.x rewrite removed two external dependencies (`react-smooth`, `recharts-scale`), rewrote internal state management with 3500+ tests, and the official migration guide states "most applications should not require any changes." The project uses only stable public API (`BarChart`, `Bar`, `XAxis`, `YAxis`, `ChartTooltip`) so migration should be seamless. All visualization needs (ComposedChart, Area, Line, ReferenceLine, dashed lines) are native to Recharts — nothing else required.

For projection math, no library is justified. Compound interest is one formula (`FV = PV × (1 + r/n)^(n×t)`) and linear regression is ~25 lines. Adding `simple-statistics` (37KB) for two functions is wasteful; `financejs` is unmaintained since 2017.

**Core technologies:**
- `recharts` ^3.8.1: Chart rendering — upgrade from 2.13.3 for smaller bundle and better perf; minimal migration cost
- `date-fns` ^4.1.0 (already installed): Date axis labels — reuse existing `format(date, "MMM yy", { locale: es })` pattern
- `shadcn ChartContainer` (already installed): Responsive wrapper — already handles `ResponsiveContainer`, theming, and tooltip helpers
- Plain TypeScript math: Projection engine — compound interest + linear regression fit in ~100 lines, no library needed

**New custom modules to write:**
- `lib/projections/compound-interest.ts` — FV calculation (~15 lines)
- `lib/projections/linear-projection.ts` — slope/intercept linear regression (~25 lines)
- `lib/projections/patrimony-projection.ts` — combines all projections
- `lib/projections/historical-reconstruction.ts` — derives past patrimony from `monthlyData`
- `lib/projections/scenarios.ts` — optimista/base/pesimista config object

### Expected Features

**Must have (table stakes):**
- Historical patrimony timeline — every finance app shows "where you've been"
- Future patrimony projection (dashed line) — the core ask; solid = real, dashed = projected
- Investment projection with compound interest — compound growth per investment type
- "Hoy" reference line — universal visual separator between real and projected data
- Hover tooltip with values — basic chart interactivity already established
- Configurable horizon — 3, 6, 12, 24 months; segmented control or select
- Scenario bands (optimista/base/pesimista) — shows uncertainty honestly; essential for Argentina's volatile context

**Should have (differentiators):**
- Shaded area under historical data — visual weight distinguishing past from future
- Per-investment type grouping — stacked area with color-coded FCI/Crypto/PF/Acciones breakdown
- Expense deduction in patrimony projection — more realistic: grows by (salary - expenses), not just salary
- Interactive legend (toggle lines on/off) — user controls which scenarios are visible

**Defer to v2+:**
- Per-investment individual projection charts — added complexity, charts tab is already busy
- Drill-down tooltips with full desglose — nice-to-have, not blocking
- Animation on chart load — Recharts handles basic animations; custom animation is premature

**Anti-features (never build):**
- Monte Carlo simulation — overkill; users won't interpret probability distributions
- Custom scenario parameter editor — predefined optimista/base/pesimista with sensible defaults is sufficient
- Real-time market data — app is offline/localStorage only
- Inflation-adjusted projections — speculative without reliable IPC source; misleading precision
- AI/ML prediction — massively over-engineered for a localStorage app

### Architecture Approach

The feature is layered cleanly on top of the existing architecture without modifying it. Existing hooks (`useInvestmentsTracker`, `useSalaryHistory`, `useRecurringExpenses`, `useCurrencyEngine`, `useMoneyTracker`) are consumed read-only by a new `useProjections` orchestrator hook, which calls pure projection functions and returns chart-ready data arrays. Chart components consume only that hook. The only existing files that change are `charts-container.tsx` (adds new chart components) and potentially `expense-tracker.tsx` (passes additional hook data down).

**Major components:**
1. `lib/projections/` (5 files) — pure TypeScript math functions; no React dependency; testable in isolation
2. `hooks/useProjections.ts` — orchestrator that reads existing hooks, calls projection functions, memoizes results with `useMemo`
3. `components/charts/patrimony-projection-chart.tsx` — hero chart: ComposedChart with Area (historical, filled) + Line (projected, dashed)
4. `components/charts/investment-projection-chart.tsx` — investment portfolio ComposedChart, stacked areas by type
5. `components/charts/projection-controls.tsx` — horizon selector + scenario toggles shared by both charts

**Key design constraints:**
- All chart components must be `"use client"` (Recharts uses DOM APIs)
- Use existing `useHydration()` guard before rendering chart content
- Chart preferences (horizon, selected scenarios) live in component state, NOT localStorage
- Projections are pure derivations — zero mutations to any existing data structure

### Critical Pitfalls

1. **Deriving growth rates from movements (P1 — HIGH RISK)** — Investment `movements[]` mix user deposits with market returns; calculating a rate from them is mathematically wrong. Fix: use `currentValue` as projection start; use explicit `rate` field for Plazo Fijo; use configurable defaults per type (FCI 10%, Crypto 15%, Acciones 12%) for others.

2. **ARS/USD mixing without exchange rate projection (P2 — HIGH RISK)** — Projecting combined ARS+USD patrimony requires projecting the future exchange rate, which is unreliable for Argentina. Fix: use current `globalUsdRate` for all future points (consistent with existing PatrimonioCard), add visible disclaimer "Proyeccion a cotizacion actual (${rate} ARS/USD)".

3. **localStorage schema safety (P7 — CRITICAL)** — User is actively using the app with real financial data. Fix: treat as absolute invariant — charts are read-only, projection functions never mutate inputs, chart config never touches existing localStorage keys. Run JSON export/import test after each phase.

4. **Overpromising projection accuracy (P6 — UX RISK)** — Projections that look authoritative create false confidence. Fix: dashed lines for all projected data, clear "Hoy" divider, scenario labels showing assumed rates, disclaimer text on each chart.

5. **Recharts SSR / hydration (P3 — MEDIUM RISK)** — Recharts uses DOM APIs; Next.js renders on server first. Fix: all chart components must be `"use client"`; use existing `useHydration()` guard; copy the pattern from `salary-by-month.tsx` exactly.

6. **Edge cases with sparse data (P5 — MEDIUM RISK)** — 8 distinct scenarios where data is missing or minimal (no investments, no salary, globalUsdRate = 0, only 1 month of data, etc.). Fix: build empty states alongside each chart component, not deferred to a cleanup phase.

## Implications for Roadmap

Based on combined research, 4 phases are suggested. The ordering follows the dependency chain identified in both ARCHITECTURE.md and FEATURES.md: pure math before orchestration before visualization before polish.

### Phase 1: Projection Engine + Historical Reconstruction

**Rationale:** The projection functions are the foundation everything else depends on. They have no UI dependencies and can be verified in isolation. Historical reconstruction is the single hardest algorithmic problem in this milestone — doing it first prevents it from becoming a hidden risk inside a chart phase.

**Delivers:** `lib/projections/` with all 5 utility modules (compound interest, linear projection, patrimony projection, historical reconstruction, scenario config). No UI, but the math is testable.

**Addresses:** Investment projection math, patrimony projection math, scenario config.

**Avoids:** P1 (growth rate from movements), P7 (schema safety — pure functions with no side effects).

**Research flag:** Standard patterns. Compound interest and linear regression are well-documented. No further research needed.

### Phase 2: useProjections Hook

**Rationale:** The orchestrator hook wires existing data hooks to the projection engine and shapes data for Recharts. Separating this from the chart components allows data correctness to be verified before visual concerns are introduced.

**Delivers:** `hooks/useProjections.ts` returning `{ historicalData[], projectionData[], scenarios }` — memoized, chart-ready.

**Uses:** All existing hooks (read-only) + projection engine from Phase 1.

**Implements:** The data flow from ARCHITECTURE.md. Resolves the ARS/USD currency strategy (P2) before it reaches the UI.

**Avoids:** P2 (currency mixing — apply globalUsdRate disclaimer logic here), performance traps (useMemo with proper deps).

**Research flag:** Standard patterns. Hook composition and useMemo are well-established. No research needed.

### Phase 3: Chart Components

**Rationale:** With data ready and shaped for Recharts, chart components become straightforward assembly of known Recharts primitives. Patrimony chart first (hero chart, highest user value), then investments chart, then controls.

**Delivers:** `patrimony-projection-chart.tsx`, `investment-projection-chart.tsx`, `projection-controls.tsx`. Integrated into `charts-container.tsx`. All with proper empty states.

**Uses:** Recharts 3.x (upgraded), shadcn ChartContainer, date-fns, `useProjections` hook.

**Implements:** ComposedChart with Area (historical) + Line (dashed, projected), ReferenceLine for "Hoy", scenario bands, horizon selector.

**Avoids:** P3 (SSR — `"use client"` + `useHydration()` guard), P4 (ResponsiveContainer height — copy existing pattern), P5 (empty states built alongside, not deferred), P6 (dashed lines + disclaimers in design from start).

**Research flag:** Standard patterns. Recharts ComposedChart API is well-documented. shadcn wrapper already in codebase.

### Phase 4: Recharts Upgrade + Polish

**Rationale:** Upgrade Recharts last, after charts are working on 2.x, to isolate any unexpected migration issues. Polish (interactive legend, visual refinements, shaded areas) is deferred until core functionality is confirmed working.

**Delivers:** Recharts upgraded to ^3.8.1. Interactive legend (toggle scenarios on/off). Visual polish: shaded historical area, muted projection colors, refined tooltips. Verified existing charts still work post-upgrade.

**Uses:** Recharts 3.x migration (minimal — project uses only stable public API).

**Avoids:** Migration risk isolated to dedicated phase; existing charts verified as regression check.

**Research flag:** Standard patterns. Migration guide is clear. No research needed — run `npm install recharts@^3.8.1` and verify existing charts.

### Phase Ordering Rationale

- **Engine before UI:** Pure functions can be tested without rendering. Bugs in math are caught before they become visual bugs that are harder to diagnose.
- **Historical reconstruction in Phase 1, not Phase 3:** It's the most complex logic in the milestone. Burying it inside a chart component would hide its complexity and make it hard to test.
- **Recharts upgrade last:** Charts can be built and verified on the existing 2.13.3 installation. Upgrading last isolates migration risk to a single, dedicated step with a clear regression check.
- **All phases treat localStorage as immutable:** P7 is an invariant, not a phase-specific concern. Every phase enforces read-only access.

### Research Flags

Phases with standard patterns (skip research-phase for all):
- **Phase 1:** Compound interest and linear regression are solved math, documented across multiple sources.
- **Phase 2:** Hook composition and useMemo are standard React patterns.
- **Phase 3:** Recharts ComposedChart, Area, Line, ReferenceLine all have official documentation. shadcn wrapper already in codebase.
- **Phase 4:** Recharts 3.x migration guide is explicit and comprehensive.

No phase requires a `/gsd:research-phase` deep dive. All patterns are well-documented or already proven in the existing codebase.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All technology choices verified against official docs. Recharts 3.x migration guide is authoritative. Math utilities are standard formulas. |
| Features | HIGH | Grounded in analysis of real apps (Fintual, Personal Capital, YNAB). Anti-features list is opinionated and justified. |
| Architecture | HIGH | Based on actual codebase analysis — existing hooks, components, and patterns verified. No speculative components. |
| Pitfalls | HIGH | P1 and P2 are Argentina-specific and well-reasoned. P3/P4 are documented Recharts gotchas. P7 is explicit user requirement (MEMORY.md confirms active data). |

**Overall confidence:** HIGH

### Gaps to Address

- **Historical investment values:** `currentValue` is stored but not historical values per month. The proposed workaround (interpolate from movements; accept ~1% estimation error with "estimado" label) needs validation during Phase 1. If the approximation is too rough, the historical portion of the investment chart may need to be omitted or clearly flagged.

- **Plazo Fijo rate field:** Phase 1 assumes PF investments have an explicit `rate` (TNA) field. Confirm this against the actual `Investment` interface before starting Phase 1.

- **Recharts 3.x + shadcn/ui compatibility:** The shadcn `ChartContainer` uses `import * as RechartsPrimitive from "recharts"`. This pattern should work with 3.x but must be verified against the installed shadcn version after upgrade in Phase 4.

## Sources

### Primary (HIGH confidence)
- [Recharts 3.0 Migration Guide](https://github.com/recharts/recharts/wiki/3.0-migration-guide) — breaking changes, migration path
- [Recharts npm page](https://www.npmjs.com/package/recharts) — React 18 compatibility, current version 3.8.1
- [Recharts Line API](https://recharts.github.io/en-US/api/Line/) — strokeDasharray for dashed/dotted lines
- Existing codebase — hooks API, chart patterns, data structures, shadcn wrapper

### Secondary (MEDIUM confidence)
- Fintual (Chile) — per-fund projection patterns, scenario display
- Personal Capital — net worth timeline + retirement planner with scenario bands
- YNAB — net worth chart (historical only), tooltip patterns
- [Compound Interest in JavaScript](https://megafauna.dev/posts/javascript-compound-interest) — confirms plain math approach

### Tertiary (LOW confidence)
- Mint — net worth historical chart patterns (service discontinued 2024; patterns inferred from archived docs)

---
*Research completed: 2026-04-03*
*Ready for roadmap: yes*
