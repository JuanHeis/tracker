# Quick Task 260414-eqc: Pending Retiro Workflow

**Status:** Complete
**Commit:** 600c0cd
**Date:** 2026-04-14

## What Changed

### Data Model (`hooks/useMoneyTracker.ts`)
- Added `pendingIngreso?: boolean` and `receivedAmount?: number` to `InvestmentMovement` interface
- Both fields optional — backward compatible with existing localStorage data

### Handler (`hooks/useInvestmentsTracker.ts`)
- `handleAddMovement` now accepts optional `pendingIngreso` parameter
- Added `handleConfirmRetiro(investmentId, movementId, receivedAmount?)` handler
- Exported through `useMoneyTracker` facade

### UI (`components/investment-movements.tsx`)
- "Pendiente de ingreso" checkbox appears when movement type is "retiro"
- Amber "Pendiente" badge on pending retiro movements
- Green check button to confirm receipt
- Confirm dialog with `CurrencyInput` to adjust received amount
- Shows "(recibido: $X)" inline when receivedAmount differs from amount

### Row Badge (`components/investment-row.tsx`)
- Amber "Pendiente" badge on investment row when any movement has `pendingIngreso`

### Calculations
- **Waterfall** (`lib/projection/waterfall.ts`): Retiro flow uses `receivedAmount ?? amount` for cash flow accuracy
- **Finalized gain/loss** (`components/investments-table.tsx`): Uses `receivedAmount ?? amount` for actual return calculation
- **Active investment tracking**: Keeps using `amount` (investment-side value)

### Prop Threading
- `onConfirmRetiro` threaded: `expense-tracker.tsx` → `investments-table.tsx` → `investment-row.tsx` → `investment-movements.tsx`

## Deviations from Plan
- Added `receivedAmount` usage in waterfall and finalized gain/loss calculations (not in original plan, added to correctly reflect actual cash flow)
- Used `onValueChange` instead of `onChange` for CurrencyInput (matches actual component API)
- Worktree merge failed due to Windows base-commit bug; changes applied manually
