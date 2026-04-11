---
phase: 20-waterfall-chart
verified: 2026-04-11T13:20:00Z
status: human_needed
score: 5/5 must-haves verified (computation layer), 1 deferred to Phase 21 (user-visible rendering)
overrides_applied: 0
deferred:
  - truth: "User sees a waterfall chart showing total income bar, then subtractive bars for gastos fijos, gastos variables, inversiones, ending with libre remainder"
    addressed_in: "Phase 21"
    evidence: "Phase 21 goal: 'User has a complete Monthly Flow panel that combines waterfall, savings rate selector, mini-projection, and inline simulation into a single cohesive view'. Phase 20 plan explicitly states WaterfallChart is props-only, ready for Phase 21 MonthlyFlowPanel consumption."
human_verification:
  - test: "Render WaterfallChart in a page or storybook with sample data to confirm 5 floating bars appear with correct colors"
    expected: "5 bars labeled Ingresos (green), Gastos Fijos (red), Gastos Variables (orange), Inversiones (blue), Libre (emerald) rendered with correct heights proportional to amounts"
    why_human: "WaterfallChart is currently orphaned (no consumer page yet — Phase 21 creates MonthlyFlowPanel). Visual rendering, Recharts range-value [start,end] float behavior, and Cell per-bar coloring cannot be verified programmatically without a running browser."
  - test: "Hover over a bar in WaterfallChart to verify tooltip appears with segment name, ARS-formatted total, and subcategory breakdown"
    expected: "Tooltip shows segment name (e.g. 'Gastos Variables'), total formatted as '$170.000' (es-AR locale), and list of subcategories with their ARS amounts"
    why_human: "Tooltip rendering and interaction requires a live browser; tooltip content correctness at display time cannot be verified from static code analysis."
---

# Phase 20: Waterfall Chart Verification Report

**Phase Goal:** User sees a visual breakdown of how their monthly income flows through expense categories to arrive at free cash
**Verified:** 2026-04-11T13:20:00Z
**Status:** human_needed
**Re-verification:** No — initial verification

## Goal Achievement

Phase 20 built the complete computation and rendering layer for the waterfall chart. The data engine (`computeWaterfallData`) is fully correct per 18 passing unit tests. The chart component (`WaterfallChart`) and hook (`useMonthlyFlowData`) are implemented and follow established patterns. The components are deliberately orphaned — awaiting Phase 21 MonthlyFlowPanel integration, which is the planned consumer.

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|---------|
| 1 | User sees waterfall chart with 5-bar income-flow breakdown | DEFERRED | Chart built and correct; not wired to any page. Phase 21 goal explicitly covers MonthlyFlowPanel assembly. |
| 2 | Fixed expenses classified automatically by `recurringId` presence | VERIFIED | `classifyExpenses()` in waterfall.ts lines 67-81; FLOW-02 test suite passes (2 tests covering classification) |
| 3 | Each waterfall segment shows subcategory breakdown | VERIFIED | `buildSubcategories()` in waterfall.ts lines 92-118; top-5+Otros logic confirmed; FLOW-03 tests pass (3 tests) |
| 4 | Waterfall updates when user adds a new expense | VERIFIED | `useMonthlyFlowData` uses `useMemo` with `[expenses, investments, salaryAmount, extraIncomes, selectedMonth, viewMode, payDay]` dependency array — any new expense triggers recomputation. Reactive wiring correct. |
| 5 | USD expenses converted using each transaction's own `usdRate` | VERIFIED | `toArs()` helper lines 55-59 uses `expense.usdRate`; `toArsIncome()` lines 61-64 likewise; FLOW-05 tests pass (2 tests including `50000 + 100*1200 = 170000`) |

**Score:** 5/5 truths verified (Truth 1 deferred to Phase 21, not a Phase 20 gap)

### Deferred Items

Items not yet met but explicitly addressed in later milestone phases.

| # | Item | Addressed In | Evidence |
|---|------|-------------|---------|
| 1 | User sees the waterfall chart in the UI (SC1 / FLOW-01 visual rendering) | Phase 21 | Phase 21 goal: "User has a complete Monthly Flow panel that combines waterfall..." — MonthlyFlowPanel is Phase 21's primary deliverable. Phase 20 plan explicitly: "WaterfallChart is props-only (ready for Phase 21 MonthlyFlowPanel consumption)" |

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `lib/projection/waterfall.ts` | `computeWaterfallData` pure function with types | VERIFIED | 282 lines; exports `computeWaterfallData`, `WaterfallBar`, `WaterfallInput`, `SubcategoryItem`, `WATERFALL_COLORS`; all 5 required exports present |
| `lib/projection/waterfall.test.ts` | Comprehensive unit tests (min 80 lines) | VERIFIED | 425 lines; 18 tests across 6 describe blocks covering all 5 FLOW requirements plus edge cases |
| `hooks/useMonthlyFlowData.ts` | Thin useMemo hook wrapping `computeWaterfallData` | VERIFIED | 29 lines; exports `useMonthlyFlowData`; 7-parameter dependency array correct |
| `components/charts/waterfall-chart.tsx` | WaterfallChart component with range-value bars | VERIFIED | 93 lines; "use client", useHydration, ChartContainer, range accessor `(d) => [d.barBottom, d.barTop]`, Cell per-bar coloring, `animationDuration={600}` |
| `components/charts/waterfall-tooltip.tsx` | Custom tooltip with subcategory breakdown | VERIFIED | 44 lines; exports `WaterfallTooltipContent`; `Intl.NumberFormat("es-AR"` for ARS formatting; typed payload access via custom interface |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `lib/projection/waterfall.ts` | `hooks/usePayPeriod.ts` | `getFilterDateRange` import | WIRED | Line 1: `import { getFilterDateRange } from "@/hooks/usePayPeriod"` — used at line 135 to scope date range |
| `lib/projection/waterfall.ts` | `hooks/useMoneyTracker.ts` | `Expense, ExtraIncome, Investment` type imports | WIRED | Lines 3-7: `import type { Expense, ExtraIncome, Investment } from "@/hooks/useMoneyTracker"` — used throughout `classifyExpenses`, `toArs`, and main function |
| `hooks/useMonthlyFlowData.ts` | `lib/projection/waterfall.ts` | `computeWaterfallData` import | WIRED | Lines 2-3: imported and called inside `useMemo` |
| `components/charts/waterfall-chart.tsx` | `hooks/useHydration.ts` | `useHydration` import for SSR guard | WIRED | Line 3: imported; called line 22; guards render at line 24 |
| `components/charts/waterfall-chart.tsx` | `components/charts/waterfall-tooltip.tsx` | `WaterfallTooltipContent` in ChartTooltip | WIRED | Line 9: imported; used at line 85 `content={<WaterfallTooltipContent />}` |
| `WaterfallChart` | any consumer page/panel | Phase 21 MonthlyFlowPanel | ORPHANED (deferred) | No consumer exists yet; Phase 21 will create MonthlyFlowPanel that consumes WaterfallChart |
| `useMonthlyFlowData` | any consumer component | Phase 21 MonthlyFlowPanel | ORPHANED (deferred) | No consumer exists yet; Phase 21 will wire hook to MonthlyFlowPanel |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|--------------------|--------|
| `WaterfallChart` | `data: WaterfallBar[]` | Props from parent (Phase 21 MonthlyFlowPanel) | N/A — component is props-only by design | DEFERRED (Phase 21 wires real data) |
| `useMonthlyFlowData` | `expenses, investments, salaryAmount, extraIncomes` | Parameters from caller | Yes — passes through to `computeWaterfallData` which filters and aggregates real expense data | FLOWING |
| `computeWaterfallData` | Filtered expenses, extraIncomes, investments | `getFilterDateRange` date filtering of input arrays | Yes — real data filtered by date range, classified, converted, aggregated | FLOWING |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| 18 unit tests pass | `npx vitest run lib/projection/waterfall.test.ts` | `18 passed (18)` | PASS |
| TypeScript compiles clean | `npx tsc --noEmit` | Exit 0, no errors | PASS |
| computeWaterfallData exports correct | Node module inspection | All 5 exports present in waterfall.ts | PASS |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|---------|
| FLOW-01 | 20-01, 20-02 | User sees waterfall chart: income -> gastos fijos -> gastos variables -> inversiones -> libre | PARTIAL — computation correct, rendering deferred | 5-bar structure verified in code and 18 tests; WaterfallChart component built but not integrated into any page (Phase 21 responsibility) |
| FLOW-02 | 20-01 | Fixed expenses classified by `recurringId` | SATISFIED | `classifyExpenses()` function; FLOW-02 test: expenses with recurringId go to fixed, others to variable |
| FLOW-03 | 20-01, 20-02 | Each segment shows subcategory breakdown | SATISFIED | `buildSubcategories()` with top-5+Otros; WaterfallTooltipContent renders subcategories; FLOW-03 tests pass |
| FLOW-04 | 20-02 | Waterfall updates when user adds expense | SATISFIED | `useMonthlyFlowData` wraps in `useMemo` with 7-dep array; any new expense triggers recompute |
| FLOW-05 | 20-01 | USD converted using `expense.usdRate` per transaction | SATISFIED | `toArs(expense)` uses `expense.usdRate`; test: `50000 + 100*1200 = 170000` passes |

All 5 FLOW requirements claimed in plans are accounted for. FLOW-01 is partial at Phase 20 boundary — computation layer complete, user-visible rendering requires Phase 21.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| None | — | — | — | — |

No TODO/FIXME/placeholder comments, no stub implementations, no hardcoded empty returns, no empty handlers found in any of the 4 waterfall files.

### Human Verification Required

#### 1. WaterfallChart Visual Rendering

**Test:** Place `<WaterfallChart data={sampleData} />` in a test page or run Phase 21 integration. Load the page and observe the chart.
**Expected:** Five floating waterfall bars appear with correct heights. Colors: Ingresos (green #22c55e), Gastos Fijos (red #ef4444), Gastos Variables (orange #f97316), Inversiones (blue #3b82f6), Libre (emerald #10b981). Bars float above/below each other showing running total flow.
**Why human:** WaterfallChart is currently orphaned — no consumer page exists yet. The Recharts range-value `[barBottom, barTop]` bar rendering pattern requires a browser to verify floating bar behavior. Cell per-bar coloring correctness is visual-only.

#### 2. Tooltip Interaction

**Test:** Hover over any bar in the rendered WaterfallChart.
**Expected:** Tooltip appears showing: (a) bar name in bold (e.g., "Gastos Variables"), (b) ARS-formatted total (e.g., "$170.000" using es-AR locale), (c) subcategory list with name/amount pairs for bars that have subcategories. "Libre" bar shows no subcategory section.
**Why human:** Tooltip display requires live browser interaction. The `WaterfallTooltipContent` component is implemented but the `content={<WaterfallTooltipContent />}` prop pattern requires Recharts to inject `active` and `payload` props at runtime — cannot be verified statically.

### Gaps Summary

No gaps blocking Phase 20's stated deliverables. All computation logic, component implementations, and internal wiring are correct and complete.

The waterfall chart components are intentionally orphaned at Phase 20 boundary per the roadmap design. Phase 21 (MonthlyFlowPanel Assembly) is the explicit consumer. Two human verification items remain to confirm visual rendering once Phase 21 integration exists.

---

_Verified: 2026-04-11T13:20:00Z_
_Verifier: Claude (gsd-verifier)_
