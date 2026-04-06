---
phase: quick-21
plan: 01
subsystem: simulator
tags: [projection, investments, simulator]
dependency_graph:
  requires: [useProjectionEngine, simulator-dialog]
  provides: [investment-aware-simulator]
  affects: [expense-tracker]
tech_stack:
  patterns: [compound-interest-layering]
key_files:
  modified:
    - hooks/useProjectionEngine.ts
    - components/simulator-dialog.tsx
    - components/expense-tracker.tsx
decisions:
  - Conservative estimate: includeContributions=false for simulator investment growth
  - Base scenario only (rateMultiplier=1.0) for simulator, matching patrimony chart base line
metrics:
  duration: ~1min
  completed: "2026-04-05"
---

# Quick Task 21: Investment-Aware Simulator Projections Summary

Exported computeInvestmentGrowth and layered compound investment returns onto simulator base projection so "Sin simulacion" matches the patrimony chart's base scenario.

## What Was Done

### Task 1: Export computeInvestmentGrowth and wire investment data to SimulatorDialog

**Commit:** ea3cac8

1. **hooks/useProjectionEngine.ts**: Exported the previously-private `computeInvestmentGrowth` function (added `export` keyword).

2. **components/simulator-dialog.tsx**: 
   - Added `investments` and `customAnnualRates` props to `SimulatorDialogProps`
   - Imported `computeInvestmentGrowth`, `Investment`, and `CustomAnnualRates`
   - In the `useMemo` block, after computing `scenarios.base`, compute investment growth with `rateMultiplier=1.0` and layer it onto the base projection
   - Updated dependency array to include `investments` and `customAnnualRates`

3. **components/expense-tracker.tsx**: Passed filtered active non-liquid investments and `customAnnualRates` to `<SimulatorDialog>`.

## Deviations from Plan

None - plan executed exactly as written.

## Verification

- TypeScript compiles with zero errors (`npx tsc --noEmit` passes)
- SimulatorDialog accepts investments prop and uses computeInvestmentGrowth
- Base projection now includes compound investment growth
- Simulated expenses are subtracted from the investment-aware baseline

## Self-Check: PASSED
