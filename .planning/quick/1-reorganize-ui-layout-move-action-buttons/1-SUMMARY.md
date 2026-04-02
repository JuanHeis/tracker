---
phase: quick
plan: 1
subsystem: ui-layout
tags: [ui, reorganization, layout]
dependency_graph:
  requires: []
  provides: [per-section-cta-buttons, clean-sidebar]
  affects: [expense-tracker-component]
tech_stack:
  added: []
  patterns: [per-tab-cta-header-buttons, standalone-dialog-renders]
key_files:
  modified:
    - components/expense-tracker.tsx
decisions:
  - Expense and income Dialog components rendered as standalone (no DialogTrigger) matching InvestmentDialog/UsdPurchaseDialog pattern
  - Inversiones tab gets two buttons in a flex container (Inversion + Comprar/Registrar USD)
metrics:
  duration: 2min
  completed: "2026-04-02"
  tasks: 1
  files: 1
---

# Quick Task 1: Reorganize UI Layout - Move Action Buttons Summary

Per-tab CTA buttons in CardHeaders replacing disconnected sidebar button stack.

## What Changed

### Task 1: Move CTA buttons into tab CardHeaders and clean up sidebar

**Commit:** `1ba9cc7`

Relocated all action buttons from the bottom of the right sidebar column into their respective tab section CardHeaders:

- **Gastos tab**: Added "+ Gasto" button in CardHeader that calls `handleOpenModal` to open expense dialog
- **Ingresos tab**: Added "+ Ingreso" button in CardHeader that calls `handleOpenIncomeModal` to open income dialog
- **Inversiones tab**: Added two buttons -- "+ Inversion" (calls `handleOpenInvestmentModal`) and "Comprar/Registrar USD" (outline variant, calls `setUsdPurchaseOpen(true)`)
- **Sidebar cleanup**: Removed the entire `<div className="flex flex-col gap-2">` block containing 3 buttons and 2 inline Dialog components
- **Dialog relocation**: Moved expense Dialog and income Dialog to render as standalone components (no DialogTrigger wrappers) at the bottom of the JSX, alongside InvestmentDialog, UsdPurchaseDialog, TransferDialog, and AdjustmentDialog

All CardHeaders now follow the established pattern from Movimientos tab: `flex flex-row items-center justify-between space-y-0 pb-2`.

## Deviations from Plan

None -- plan executed exactly as written.

## Verification

- `npx next build` completed successfully with no errors
- Sidebar only contains: ResumenCard, PatrimonioCard, ConfigCard, ExchangeSummary
- Each tab header has its relevant CTA button(s)
- All dialog functionality preserved (no logic, handlers, state, or props changed)

## Self-Check: PASSED
