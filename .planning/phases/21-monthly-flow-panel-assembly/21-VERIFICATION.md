---
phase: 21-monthly-flow-panel-assembly
verified: 2026-04-11T22:45:00Z
status: human_needed
score: 5/5 must-haves verified (automated)
overrides_applied: 0
re_verification: false
human_verification:
  - test: "Open app and confirm MonthlyFlowPanel is visible in sidebar replacing ResumenCard"
    expected: "Sidebar shows waterfall chart, savings rate selector, mini-projection chart titled 'Patrimonio estimado (12 meses)', and inline simulation input — ResumenCard is gone"
    why_human: "Visual layout and component placement cannot be verified programmatically"
  - test: "Change savings rate mode or value; observe mini-projection"
    expected: "Mini-projection chart lines shift in real time when savings rate config changes (MPROJ-02)"
    why_human: "Real-time reactive UI update requires running app and user interaction"
  - test: "Type a number (e.g., 50000) in the 'Gasto hipotetico mensual' input"
    expected: "Waterfall 'Libre' bar shrinks, mini-projection lines shift downward, and 'Libre baja de $X a $Y' text appears (ISIM-01)"
    why_human: "Interactive simulation effect requires running app"
  - test: "Refresh the page after entering a hypothetical amount"
    expected: "The hypothetical amount input is empty — simulation is ephemeral (ISIM-02)"
    why_human: "Page refresh behavior requires browser interaction"
  - test: "Verify SimulatorDialog (calculator icon) and Charts tab still function"
    expected: "No regressions — SimulatorDialog opens and shows projections; Charts tab projection charts render correctly"
    why_human: "Regression testing requires visual inspection of app after integration"
---

# Phase 21: Monthly Flow Panel Assembly — Verification Report

**Phase Goal:** User has a complete Monthly Flow panel that combines waterfall, savings rate selector, mini-projection, and inline simulation into a single cohesive view
**Verified:** 2026-04-11T22:45:00Z
**Status:** human_needed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

Roadmap success criteria verified against codebase:

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Below the waterfall, user sees estimated patrimony at 12 months with three scenario lines (pesimista/base/optimista) | VERIFIED | `components/charts/mini-projection-chart.tsx` exists with 3 `<Line>` components (dataKey "optimista", "base", "pesimista"), 150px ChartContainer, title "Patrimonio estimado (12 meses)", and final-value legend below chart. Wired into `MonthlyFlowPanel` section 3. |
| 2 | When user changes the savings rate, the mini-projection updates in real time to reflect the new estimate | VERIFIED (human pending) | Data flows: `useSavingsRate` in `expense-tracker.tsx` → `savingsRate.estimate` → `useProjectionEngine(horizonMonths:12)` → `miniProjectionChartData` → `MonthlyFlowPanel.projectedPatrimony` → `MiniProjectionChart`. Prop drilling is complete. Reactivity depends on `useSavingsRate` state updating. Confirmed via code trace; runtime behavior needs human verification. |
| 3 | User can enter a hypothetical monthly expense in an inline input and see both the waterfall and mini-projection adjust immediately | VERIFIED (human pending) | `MonthlyFlowPanel` contains `useState(0)` for `simulatedAmount`. `adjustedWaterfallData` useMemo subtracts `simulatedAmount` from "Libre" bar. `adjustedProjectionData` useMemo calls `projectPatrimonyScenarios(currentPatrimony, savingsEstimate - simulatedAmount, 12)`. Both adjusted datasets flow to `WaterfallChart` and `MiniProjectionChart`. Runtime visual effect needs human verification. |
| 4 | The inline simulation is ephemeral — refreshing the page or navigating away discards the hypothetical expense | VERIFIED | `simulatedAmount` is `useState(0)` — pure React component state with no localStorage persistence, no hook persistence. Resets on unmount/refresh by definition. `MonthlyFlowPanel` explicitly does NOT import useMoneyTracker, useSavingsRate, or any persistence hook. |
| 5 | MonthlyFlowPanel is a props-only component that can be placed in any tab without internal hook dependencies | VERIFIED | Import analysis of `components/monthly-flow-panel.tsx` confirms: only `useState`, `useMemo` (React built-ins), and UI imports. Zero calls to useMoneyTracker, useSavingsRate, useMonthlyFlowData, useProjectionEngine, or useDataPersistence. All data arrives via `MonthlyFlowPanelProps`. |

**Score:** 5/5 truths verified (3 require human confirmation for runtime behavior)

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `components/charts/mini-projection-chart.tsx` | Compact 3-scenario line chart for patrimony projection | VERIFIED | Exists, 117 lines, exports `MiniProjectionChart`, `"use client"`, 3 Line components, h-[150px], title text, formatted final values. Substantive, not a stub. |
| `components/monthly-flow-panel.tsx` | Props-only panel composing waterfall, savings rate, mini-projection, and inline simulation | VERIFIED | Exists, 165 lines, exports `MonthlyFlowPanel` and `MonthlyFlowPanelProps`, useState for simulatedAmount, two useMemo adjustments, renders all 4 sections. Substantive, not a stub. |
| `components/expense-tracker.tsx` | Main orchestrator with MonthlyFlowPanel wired in, ResumenCard removed, SavingsRateSelector removed from sidebar | VERIFIED | Confirmed: no `ResumenCard` import or JSX, no `SavingsRateSelector` in sidebar JSX, `MonthlyFlowPanel` rendered at line 732 with all 9 required props. |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `components/monthly-flow-panel.tsx` | `components/charts/waterfall-chart.tsx` | imports and renders WaterfallChart | WIRED | Import at line 10, rendered at line 114 with `data={adjustedWaterfallData}` |
| `components/monthly-flow-panel.tsx` | `components/savings-rate-selector.tsx` | imports and renders SavingsRateSelector | WIRED | Import at line 11, rendered at line 117 with all 5 required props |
| `components/monthly-flow-panel.tsx` | `components/charts/mini-projection-chart.tsx` | imports and renders MiniProjectionChart | WIRED | Import at line 12, rendered at line 128 with `data` and `projectedPatrimony` |
| `components/expense-tracker.tsx` | `components/monthly-flow-panel.tsx` | imports and renders MonthlyFlowPanel with all props | WIRED | Import at line 52, rendered at line 732 with all 9 MonthlyFlowPanelProps satisfied |
| `components/expense-tracker.tsx` | `hooks/useMonthlyFlowData.ts` | calls useMonthlyFlowData for waterfall data | WIRED | Import at line 85, called at line 271 with 7 arguments; result `waterfallData` passed to MonthlyFlowPanel |
| `components/expense-tracker.tsx` | `hooks/useProjectionEngine.ts` | calls useProjectionEngine for mini-projection data | WIRED | Import at line 86, called at line 282 with `horizonMonths: 12`; `patrimonyData` transformed via useMemo at line 291 into `miniProjectionChartData` |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|--------------------|--------|
| `MiniProjectionChart` | `data` (projection data points) | `useProjectionEngine` → `patrimonyData` (real computed scenarios from `projectPatrimonyScenarios`) | Yes — engine computes compound interest per scenario from real salary/investment data | FLOWING |
| `MiniProjectionChart` | `projectedPatrimony` | `miniProjection.projectedPatrimony` (ProjectionSummary from engine) | Yes — populated from actual optimista/base/pesimista scenario endpoints at 12 months | FLOWING |
| `WaterfallChart` (in MonthlyFlowPanel) | `data` | `useMonthlyFlowData` → real expenses, investments, salary for `selectedMonth` | Yes — computes from real monthlyData fields, not static | FLOWING |
| Inline simulation (`Input`) | `simulatedAmount` | `useState(0)` → user interaction | N/A — user input, ephemeral by design | FLOWING (user-driven) |

### Behavioral Spot-Checks

Step 7b: TypeScript spot-check only (no runnable server to test against).

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| TypeScript compiles cleanly | `npx tsc --noEmit` | Zero output (no errors) | PASS |
| MiniProjectionChart exports named function | `grep "export function MiniProjectionChart"` | Found at line 45 | PASS |
| MonthlyFlowPanel exports named function + interface | `grep "export function MonthlyFlowPanel\|export interface MonthlyFlowPanelProps"` | Both found | PASS |
| No data hooks in MonthlyFlowPanel imports | `grep "^import" components/monthly-flow-panel.tsx` | Only React, type imports, UI components — zero hook imports | PASS |
| Commit ec81c82 is real and includes expense-tracker.tsx | `git show --stat ec81c82` | Confirmed real commit with expected file change | PASS |
| ResumenCard fully removed from expense-tracker.tsx | `grep "ResumenCard" components/expense-tracker.tsx` | Zero matches | PASS |
| SavingsRateSelector removed from sidebar | `grep "SavingsRateSelector" components/expense-tracker.tsx` | Zero matches | PASS |
| SimulatorDialog still receives savingsRate.estimate | `grep "monthlyNetFlow.*savingsRate"` | Found at line 1037 | PASS |

Runtime visual/interactive behaviors: SKIPPED (server not running — routed to human verification)

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|---------|
| MPROJ-01 | 21-01, 21-02 | User sees patrimony estimated at 12 months with 3 scenario lines below waterfall | SATISFIED | `MiniProjectionChart` renders 3 Line components in 150px chart; wired into `MonthlyFlowPanel` section 3 |
| MPROJ-02 | 21-01, 21-02 | Mini-projection updates in real time when savings rate changes | SATISFIED (code-level) | `savingsRate.estimate` → `useProjectionEngine` → `miniProjectionChartData` → `MonthlyFlowPanel.projectionData` prop chain is complete; runtime reactivity needs human confirmation |
| ISIM-01 | 21-01, 21-02 | User enters hypothetical monthly expense; sees waterfall + mini-projection adjust in real time | SATISFIED (code-level) | `simulatedAmount` drives two useMemo blocks adjusting both waterfall and projection data fed to child components; runtime behavior needs human confirmation |
| ISIM-02 | 21-01, 21-02 | Simulation is ephemeral — not persisted, does not modify real data | SATISFIED | `simulatedAmount` is pure `useState(0)` — no localStorage writes, no hook persistence, resets on page refresh by React design |

All 4 required requirements are covered. No orphaned requirements.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `components/monthly-flow-panel.tsx` | 146 | `placeholder="0"` on Input | Info | HTML placeholder text, not a stub — legitimate UX label for the numeric input |

No blockers or warnings found. The `placeholder="0"` is a standard HTML input attribute for UX, not a code stub.

### Human Verification Required

#### 1. Visual Layout Confirmation

**Test:** Run `npm run dev`, open app, look at the right sidebar
**Expected:** MonthlyFlowPanel is the first item in the sidebar, containing (top to bottom): waterfall chart, savings rate selector, mini-projection chart with title "Patrimonio estimado (12 meses)" and 3 lines, inline simulation input labeled "Gasto hipotetico mensual". ResumenCard is absent. SavingsRateSelector only appears inside the panel, not as a separate sidebar card.
**Why human:** Visual layout and component placement cannot be verified programmatically

#### 2. MPROJ-02: Savings Rate Updates Mini-Projection in Real Time

**Test:** In the sidebar panel, change the savings rate mode (e.g., switch from Auto to "% del sueldo" and enter 20%)
**Expected:** The mini-projection chart's 3 lines shift to reflect the new savings estimate; the Pesimista/Base/Optimista values below the chart update immediately without page reload
**Why human:** React state propagation chain (useSavingsRate → useProjectionEngine → miniProjectionChartData) requires runtime verification; no automated way to simulate reactive state changes

#### 3. ISIM-01: Inline Simulation Adjusts Both Waterfall and Projection

**Test:** Type a number (e.g., 50000) in the "Gasto hipotetico mensual" input inside the panel
**Expected:** (a) Waterfall "Libre" bar shrinks by ~50000, (b) mini-projection lines shift downward, (c) impact text "Libre baja de $X a $Y" appears below the input
**Why human:** Real-time DOM updates from simulatedAmount state require running app and visual inspection

#### 4. ISIM-02: Simulation Resets on Page Refresh

**Test:** Enter 50000 in the hypothetical expense input, then refresh the browser (F5)
**Expected:** After refresh, the input is empty (shows placeholder "0"), no "Libre baja de" text visible, waterfall and projection show normal (unmodified) values
**Why human:** Page refresh behavior requires browser interaction

#### 5. Regression — SimulatorDialog and Charts Tab

**Test:** Open the calculator icon in the taskbar (SimulatorDialog); also switch to the Charts tab
**Expected:** SimulatorDialog opens and shows projection comparisons (still receives savingsRate.estimate). Charts tab projection charts render correctly with no console errors.
**Why human:** Regression testing of adjacent features requires visual inspection after integration changes

### Gaps Summary

No code-level gaps found. All 5 roadmap success criteria are implemented with real, substantive, wired code:
- `MiniProjectionChart` is a complete 3-scenario line chart (not a stub)
- `MonthlyFlowPanel` is a complete props-only shell composing all 4 sections with working simulation logic
- `expense-tracker.tsx` integration is complete: ResumenCard removed, SavingsRateSelector relocated, all hook data flows wired

5 human verification items remain covering runtime reactivity (MPROJ-02), interactive simulation (ISIM-01, ISIM-02), visual layout, and regression checks for adjacent features.

---

_Verified: 2026-04-11T22:45:00Z_
_Verifier: Claude (gsd-verifier)_
