# Research Summary: v1.3 Flujo Mensual Panel Unificado

**Synthesized:** 2026-04-07
**Sources:** STACK.md, FEATURES.md, ARCHITECTURE.md, PITFALLS.md
**Confidence:** HIGH

## Executive Summary

This milestone adds a Monthly Flow Panel (waterfall chart + savings rate selector + inline mini-projection) to a live Next.js 14 expense tracker. The entire implementation builds on the existing stack — the only new dependency is `@radix-ui/react-slider` for the savings rate slider. All other needs are covered by Recharts 3.8.1, the existing `useLocalStorage` hook, `projectPatrimonyScenarios()`, and `averageMonthlyNetFlow()`.

The critical path is: `computeSavingsEstimate()` (pure function) → `useSavingsRate` hook → projection engine refactor → waterfall data hook → leaf UI components → panel shell → integration wiring.

## Stack Additions

| Package | Version | Purpose |
|---------|---------|---------|
| `@radix-ui/react-slider` | ^1.3.6 | Savings rate percentage slider (shadcn Slider wraps it) |

No other new dependencies. Recharts 3.8.1 handles waterfall via stacked BarChart with range-value `[start, end]` pattern. No schema migrations needed — `SavingsRateConfig` uses its own localStorage key.

## Feature Categories

### Table Stakes
- Waterfall chart: Ingresos → Gastos fijos (recurrentes) → Variables (manuales) → Inversiones → Libre
- Savings rate selector: 3 modes (auto/percentage/fixed)
- Mini-projection inline: 12-month patrimony with 3 scenarios
- Projection engine refactor: Replace `estimateMonthlyNetSavings()` with `computeSavingsEstimate()`
- SavingsRateConfig persistence in localStorage (own key)

### Differentiators
- Real-time waterfall update when expenses are added
- Savings rate change instantly updates mini-projection
- Fixed vs variable classification using existing `recurringId` field (no new data model)

### Anti-features (do NOT build)
- Budget-linked waterfall categories — adds complexity, recurringId classification is sufficient
- Historical waterfall comparison (month vs month) — defer to future
- Sparkline in mini-projection — only knowable if useful after panel is running

## Architecture: Key Integration Points

1. **`computeSavingsEstimate()`** — pure function in `lib/projection/savings-rate.ts`, unblocks everything
2. **`useSavingsRate` hook** — thin wrapper over `useLocalStorage<SavingsRateConfig>`
3. **`useProjectionEngine.ts` line 164** — swap `estimateMonthlyNetSavings` for new scalar (3-line change)
4. **`expense-tracker.tsx`** — compute savings scalar once, thread to Charts + Simulator
5. **`useMonthlyFlowData`** — new hook aggregating waterfall data from existing filteredExpenses
6. **`MonthlyFlowPanel`** — props-only (no internal hooks), movable between tabs

## Critical Pitfalls

| # | Pitfall | Severity | Prevention |
|---|---------|----------|------------|
| 1 | Recharts waterfall breaks when "libre" goes negative | HIGH | Use `[start, end]` range-value pattern, NOT transparent-floor stacking |
| 2 | Charts + Simulator diverge after refactor | HIGH | Compute savings scalar at single call site in expense-tracker.tsx |
| 3 | `isInitial` investment movements inflate waterfall | HIGH | Exclude `mov.isInitial` from waterfall aggregation |
| 4 | Recurring instances vs definitions mismatch | MEDIUM | Aggregate from `filteredExpenses` (actual), not `recurringExpenses` (configured) |
| 5 | USD conversion drift | MEDIUM | Use `expense.usdRate` per transaction, not `globalUsdRate` |

## Suggested Build Order

1. **Pure functions** — `computeSavingsEstimate()`, `computeWaterfallData()` + unit tests
2. **Persistence hook** — `useSavingsRate` with `"savingsRateConfig"` key, default `{ mode: "auto" }`
3. **Projection engine refactor** — wire scalar into `useProjectionEngine` + `SimulatorDialog`
4. **Waterfall data hook** — `useMonthlyFlowData` with all edge case guards
5. **Leaf UI components** — `WaterfallChart` (range-value pattern) + `SavingsRateSelector` (3-mode toggle)
6. **Panel shell + mini-projection** — `MonthlyFlowPanel` composing pieces
7. **Integration wiring** — wire into expense-tracker.tsx, ChartsContainer, SimulatorDialog

## Research Flags

No phases require additional research. All patterns are HIGH confidence from direct codebase inspection and official Recharts sources.

---
*Research completed: 2026-04-07*
*Ready for requirements: yes*
