---
phase: 19-projection-engine-refactor
verified: 2026-04-10T15:30:00Z
status: passed
score: 4/4 must-haves verified
overrides_applied: 0
---

# Phase 19: Projection Engine Refactor Verification Report

**Phase Goal:** All projection consumers (Charts tab and Simulator) use the configured savings rate instead of the old estimateMonthlyNetSavings() calculation
**Verified:** 2026-04-10T15:30:00Z
**Status:** passed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Charts tab patrimony projections use savingsRate.estimate (the configured savings rate) not estimateMonthlyNetSavings() | VERIFIED | `expense-tracker.tsx:609` passes `monthlyNetSavings={savingsRate.estimate}` to `ChartsContainer`; `charts-container.tsx:42-48` forwards it directly to `useProjectionEngine` |
| 2 | Simulator baseline projection uses the same savingsRate.estimate as Charts tab | VERIFIED | `expense-tracker.tsx:1022` passes `monthlyNetFlow={savingsRate.estimate}` to `SimulatorDialog` — same source as Charts |
| 3 | Changing savings rate mode/value updates both Charts and Simulator projections consistently | VERIFIED | Both consumers receive `savingsRate.estimate` from the same `useSavingsRate` call in `expense-tracker.tsx:267`; any change to the hook output propagates to both |
| 4 | estimateMonthlyNetSavings() no longer exists anywhere in the codebase | VERIFIED | Full codebase grep over `*.ts`/`*.tsx` returns zero matches; `lib/projection/income-projection.ts` contains only `projectIncome` (11 lines) |

**Score:** 4/4 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `hooks/useProjectionEngine.ts` | Projection engine accepting monthlyNetSavings parameter directly | VERIFIED | Signature: `useProjectionEngine(monthlyData, salaryEntries, monthlyNetSavings: number, globalUsdRate, options?)` at line 114; `const netSavings = monthlyNetSavings` at line 160; no `RecurringExpense` import, no `estimateMonthlyNetSavings` reference |
| `components/charts-container.tsx` | Charts container passing monthlyNetSavings to projection engine | VERIFIED | Interface `ChartsContainerProps` contains `monthlyNetSavings: number` at line 20; forwarded to `useProjectionEngine` at line 45 |
| `components/expense-tracker.tsx` | Orchestrator passing savingsRate.estimate to both ChartsContainer and SimulatorDialog | VERIFIED | Line 609: `monthlyNetSavings={savingsRate.estimate}`; Line 1022: `monthlyNetFlow={savingsRate.estimate}` |
| `lib/projection/income-projection.ts` | Clean income projection with only projectIncome function | VERIFIED | 11-line file, exports only `projectIncome`; no `estimateMonthlyNetSavings`, no `RecurringExpense`, no `CurrencyType` imports |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `components/expense-tracker.tsx` | `components/charts-container.tsx` | `monthlyNetSavings={savingsRate.estimate}` prop | WIRED | Confirmed at line 609 |
| `components/expense-tracker.tsx` | `components/simulator-dialog.tsx` | `monthlyNetFlow={savingsRate.estimate}` prop | WIRED | Confirmed at line 1022 |
| `components/charts-container.tsx` | `hooks/useProjectionEngine.ts` | `monthlyNetSavings` parameter in hook call | WIRED | `useProjectionEngine(monthlyData, salaryEntries, monthlyNetSavings, globalUsdRate, {...})` at line 42-48 |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|--------------------|--------|
| `charts-container.tsx` | `monthlyNetSavings` | `savingsRate.estimate` from `useSavingsRate` hook in `expense-tracker.tsx` | Yes — `useSavingsRate` computes from real `currentMonthSalary.amount` and `historicalNetFlow`; config persisted in localStorage | FLOWING |
| `simulator-dialog.tsx` | `monthlyNetFlow` | Same `savingsRate.estimate` | Yes — same source as above | FLOWING |
| `hooks/useProjectionEngine.ts` | `netSavings` | `monthlyNetSavings` parameter (inline: `const netSavings = monthlyNetSavings`) | Yes — direct passthrough to `projectPatrimonyScenarios` at line 206 | FLOWING |

### Behavioral Spot-Checks

Step 7b: SKIPPED (no runnable server entry points — Next.js app requires `next dev` to serve endpoints; TypeScript compilation used as proxy build check instead)

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| TypeScript compiles with no type errors | `npx tsc --noEmit` | Exit 0, no output | PASS |
| No remaining estimateMonthlyNetSavings references | `grep -rn estimateMonthlyNetSavings --include=*.ts --include=*.tsx` | Exit 1, no matches | PASS |
| useMemo deps array uses monthlyNetSavings not recurringExpenses | Read `hooks/useProjectionEngine.ts` lines 291-301 | `monthlyNetSavings` present, `recurringExpenses` absent | PASS |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| REF-02 | 19-01-PLAN.md | Charts tab uses the configured savings rate instead of old calculation | SATISFIED | `ChartsContainer` receives `monthlyNetSavings={savingsRate.estimate}`; forwards to `useProjectionEngine` |
| REF-03 | 19-01-PLAN.md | SimulatorDialog also uses the configured savings rate | SATISFIED | `SimulatorDialog` receives `monthlyNetFlow={savingsRate.estimate}` |

Both requirements declared in plan frontmatter `requirements: [REF-02, REF-03]`. Both marked "Pending" in REQUIREMENTS.md traceability table (Phase 19). Both now satisfied by implementation. No orphaned requirements.

### Anti-Patterns Found

No anti-patterns detected across all four modified files. No TODO/FIXME/HACK comments, no placeholder returns, no stub handlers.

### Human Verification Required

The following behaviors can only be confirmed by a human testing the live UI:

**1. Charts tab visual projection matches savings rate configuration**

**Test:** Open the app, go to Settings/Savings Rate panel and set a specific mode (e.g., fixed amount of $50,000). Navigate to Charts tab and observe the patrimony projection lines.
**Expected:** The base projection line reflects the configured $50,000/month savings rate — not the old auto-calculated estimate.
**Why human:** Rendering correctness and visual accuracy of chart lines cannot be verified without a running browser session.

**2. Simulator baseline matches Charts tab baseline**

**Test:** With the same savings rate configured, open the Simulator dialog and note its baseline projection numbers. Compare to the Charts tab base scenario.
**Expected:** Both show identical baseline numbers at the same horizon (both sourced from `savingsRate.estimate`).
**Why human:** Requires side-by-side comparison of two UI surfaces with a live app.

**3. Savings rate mode change propagates to both consumers**

**Test:** Switch savings rate mode from "auto" to "percentage" (e.g., 30%) while observing Charts and Simulator.
**Expected:** Both Charts and Simulator projections update simultaneously and consistently.
**Why human:** Real-time reactivity to state changes requires live interaction.

---

## Gaps Summary

No gaps found. All four must-have truths verified, all artifacts substantive and wired, all key links confirmed, both requirement IDs satisfied, TypeScript compiles without errors, and `estimateMonthlyNetSavings` is fully eliminated from the codebase.

Phase goal is achieved: both Charts tab and Simulator now use the configured `savingsRate.estimate` as their shared single source of truth for monthly net savings.

Three human verification items remain for visual/behavioral confirmation in a live browser session.

---

_Verified: 2026-04-10T15:30:00Z_
_Verifier: Claude (gsd-verifier)_
