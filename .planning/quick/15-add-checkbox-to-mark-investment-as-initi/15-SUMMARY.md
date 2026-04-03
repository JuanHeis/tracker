---
phase: quick-15
plan: 01
subsystem: investments
tags: [investment-dialog, isInitial, wizard-retroactive]
dependency_graph:
  requires: []
  provides: [isInitial-checkbox-in-creation-dialog]
  affects: [useMoneyTracker-outflow-filtering, projection-contribution-inference]
tech_stack:
  added: []
  patterns: [conditional-spread-for-optional-fields]
key_files:
  created: []
  modified:
    - components/investment-dialog.tsx
    - hooks/useInvestmentsTracker.ts
decisions:
  - Checkbox only shown in creation mode (not edit) — isInitial is a one-time flag on the first movement
  - Reuses identical HTML pattern as isLiquid checkbox for consistency
metrics:
  duration: ~2min
  completed: "2026-04-03"
---

# Quick Task 15: Add Checkbox to Mark Investment as Initial (Wizard)

isInitial checkbox in investment creation dialog so users can retroactively flag an investment as wizard-loaded patrimony, excluding its first movement from monthly outflow calculations.

## What Was Done

### Task 1: Add isInitial checkbox and propagate through handleAddInvestment

**Files modified:**
- `components/investment-dialog.tsx` — Added `isInitial` state, checkbox UI (creation mode only), and spread into onAdd data
- `hooks/useInvestmentsTracker.ts` — Added `isInitial` to parameter type and conditionally spread into first movement

**Commit:** `8bb86b3`

## Deviations from Plan

None — plan executed exactly as written.

## Notes

- Pre-existing type error in `transfer-dialog.tsx` (unrelated to this task) causes `next build` to fail — logged as out-of-scope
- TypeScript compilation confirms zero type errors in modified files
- No schema migration needed: `isInitial` is already an optional field on `InvestmentMovement`

## Verification

- [x] TypeScript: no type errors in modified files
- [x] Checkbox UI only renders in creation mode (guarded by `!editingInvestment`)
- [x] isInitial propagated to first movement via conditional spread
- [x] Existing isInitial filtering logic unchanged (useMoneyTracker, compound-interest, investment-chart, investment-basis-info)

## Self-Check: PASSED
