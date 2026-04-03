---
phase: quick
plan: 4
status: complete
started: "2026-04-03T01:13:22.943Z"
completed: "2026-04-03T01:20:00.000Z"
commit: 1382d82
---

# Quick Task 4: Fix resumen mensual — inversiones wizard + sueldo

## Problem

When using the setup wizard to load:
1. Past investments (patrimony from previous months)
2. Current month salary
3. Liquid cash balance

The monthly summary showed investments as "Aportes inversiones" reducing disponible (negative balance), and salary doubled with liquid cash (already received and distributed).

## Changes

### 1. `hooks/useMoneyTracker.ts`
- Added `isInitial?: boolean` to `InvestmentMovement` interface
- `calculateDualBalances()` now skips `isInitial` movements for both ARS and USD balance calculations
- Initial patrimony no longer affects monthly disponible or "Aportes inversiones" line

### 2. `hooks/useSetupWizard.ts`
- Wizard investment movements now set `isInitial: true`
- Salary `effectiveDate` changed from current month to next month (`addMonths(new Date(), 1)`)
- Rationale: liquid cash entered in wizard already represents current financial state (salary already received and distributed)

## Result

- **This month**: Resumen shows only liquid cash as disponible (no salary income, no investment outflows)
- **Next month onwards**: Salary kicks in as monthly income, new investment aportes work normally
- Investment table still shows all investments with correct values
