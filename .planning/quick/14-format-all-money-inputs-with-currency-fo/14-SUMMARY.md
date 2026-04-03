---
phase: quick-14
plan: 01
subsystem: ui/inputs
tags: [currency-formatting, ux, component]
dependency_graph:
  requires: []
  provides: [CurrencyInput]
  affects: [all-money-inputs]
tech_stack:
  added: []
  patterns: [es-AR locale formatting, controlled+uncontrolled input patterns]
key_files:
  created:
    - components/currency-input.tsx
  modified:
    - components/budget-dialog.tsx
    - components/adjustment-dialog.tsx
    - components/expense-tracker.tsx
    - components/expenses-table.tsx
    - components/income-table.tsx
    - components/investment-dialog.tsx
    - components/investment-value-cell.tsx
    - components/investment-movements.tsx
    - components/transfer-dialog.tsx
    - components/loan-dialog.tsx
    - components/loan-payments.tsx
    - components/recurring-dialog.tsx
    - components/usd-purchase-dialog.tsx
    - components/salary-card.tsx
    - components/settings-panel.tsx
    - components/resumen-card.tsx
    - components/charts/investment-basis-info.tsx
    - components/setup-wizard/wizard-step-balance.tsx
    - components/setup-wizard/wizard-step-income.tsx
    - components/setup-wizard/wizard-step-usd.tsx
    - components/setup-wizard/wizard-step-investments.tsx
decisions:
  - "Use es-AR locale for thousand separators (dot) and decimal (comma)"
  - "Removed onBlur validators from uncontrolled CurrencyInput in expense/income forms (FormData handles validation at submit time)"
  - "Transfer/USD purchase dialog handlers adapted to receive numbers directly instead of strings"
metrics:
  duration: ~4min
  completed: "2026-04-03"
---

# Quick Task 14: Format All Money Inputs with CurrencyInput

CurrencyInput component with es-AR locale formatting (1.500.000,50) replacing all raw number inputs for money fields across 21 files.

## What Was Done

### Task 1: Create CurrencyInput component (429ff5b)

Created `components/currency-input.tsx` with:
- Wraps existing `Input` component with `type="text"` and `inputMode="decimal"`
- Displays formatted values using `toLocaleString('es-AR')` (dot thousands, comma decimal)
- Supports two patterns: controlled (`value` + `onValueChange`) and uncontrolled (`name` + hidden input for FormData)
- Handles typing (strips non-numeric, allows one decimal separator, optional minus)
- Auto-selects text on focus for easy replacement
- Re-formats display on blur
- Forwards ref and passes through all standard Input props

### Task 2: Replace all money inputs (94bd76d)

Replaced `<Input type="number">` with `<CurrencyInput>` across 21 files:

**Controlled inputs (value + onValueChange):** budget-dialog, adjustment-dialog, transfer-dialog (ARS/USD/amount), loan-dialog, salary-card (rate, aguinaldo, entry amounts, new entry), settings-panel (rate, entry amounts, new entry), resumen-card (aguinaldo), expenses-table (InlineRateEditor), income-table (InlineRateEditor), investment-value-cell, usd-purchase-dialog (ARS/USD amounts)

**Uncontrolled inputs (name + FormData):** expense-tracker (amount, usdRate for both expense and income forms), investment-dialog (amount), investment-movements (amount), recurring-dialog (amount), loan-payments (amount)

**Wizard inputs:** wizard-step-balance (arsBalance), wizard-step-income (salaryAmount), wizard-step-usd (usdAmount, globalUsdRate), wizard-step-investments (amount)

**Preserved as Input type="number":** payDay (1-31 integer), TNA % (percentage), plazoDias (integer days), installments/cuotas, projection rate percentages

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Removed incompatible onBlur validators from uncontrolled CurrencyInput**
- **Found during:** Task 2
- **Issue:** `handleExpenseBlur` and `handleIncomeBlur` in expense-tracker.tsx read `e.target.name` and `e.target.value` from the input element. With CurrencyInput, the visible input has no `name` attribute (it's on the hidden input) and `value` contains formatted text (e.g., "1.500.000") which `parseFloat` would misparse as 1.5.
- **Fix:** Removed `onBlur` prop from the 4 uncontrolled CurrencyInput instances in the expense and income forms. Validation already occurs at submit time via FormData.
- **Files modified:** components/expense-tracker.tsx
- **Commit:** 94bd76d

## Verification

- `npx tsc --noEmit` passes with zero errors
- `npx next build` compiles successfully
- Non-money inputs (payDay, TNA, plazoDias, cuotas, projection rates) remain as `Input type="number"`
