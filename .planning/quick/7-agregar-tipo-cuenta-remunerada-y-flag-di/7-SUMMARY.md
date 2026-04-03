---
phase: quick-7
plan: 1
subsystem: investments
tags: [cuenta-remunerada, isLiquid, patrimonio, migration]

requires:
  - phase: none
    provides: n/a
provides:
  - "Cuenta remunerada investment type with ARS enforcement"
  - "isLiquid flag on investments for liquid patrimonio classification"
  - "Migration v8 defaulting isLiquid=false on existing data"
  - "Disponibilidad inmediata checkbox in investment dialog and wizard"
affects: [patrimonio-card, investment-dialog, wizard-step-investments]

tech-stack:
  added: []
  patterns:
    - "isLiquid sparse storage: only store when true to save space"

key-files:
  created: []
  modified:
    - constants/investments.ts
    - hooks/useMoneyTracker.ts
    - hooks/useInvestmentsTracker.ts
    - hooks/useSetupWizard.ts
    - components/investment-dialog.tsx
    - components/setup-wizard/wizard-step-investments.tsx

key-decisions:
  - "isLiquid stored as sparse boolean (only when true) to minimize localStorage footprint"
  - "Liquid investments add currentValue to arsBalance/usdBalance instead of arsInvestments/usdInvestments"

patterns-established:
  - "Sparse boolean pattern: ...(field && { field: true }) for optional boolean fields"

requirements-completed: [QUICK-7]

duration: 4min
completed: 2026-04-03
---

# Quick 7: Cuenta Remunerada Type and isLiquid Flag Summary

**New "Cuenta remunerada" investment type (ARS-enforced) with isLiquid flag routing liquid investments to cash balance in patrimonio**

## Performance

- **Duration:** ~4 min
- **Started:** 2026-04-03T14:22:02Z
- **Completed:** 2026-04-03T14:25:40Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments
- Added "Cuenta remunerada" to investment types with ARS currency enforcement
- Added isLiquid boolean field to Investment interface with migration v8
- Updated calculateDualBalances to route liquid investment values to arsBalance/usdBalance
- Added "Disponibilidad inmediata" checkbox in both investment dialog and setup wizard
- Wizard investment list shows "(liquida)" badge for liquid investments

## Task Commits

Each task was committed atomically:

1. **Task 1: Add Cuenta remunerada type, isLiquid field, migration, and patrimonio logic** - `8794663` (feat)
2. **Task 2: Add isLiquid checkbox to investment dialog and wizard** - `c8d3782` (feat)

## Files Created/Modified
- `constants/investments.ts` - Added "Cuenta remunerada" type and ARS enforcement
- `hooks/useMoneyTracker.ts` - isLiquid on Investment, migration v8, patrimonio split logic
- `hooks/useInvestmentsTracker.ts` - handleAddInvestment and handleUpdateInvestment accept isLiquid
- `hooks/useSetupWizard.ts` - WizardInvestment supports isLiquid, commitWizardData passes it through
- `components/investment-dialog.tsx` - "Disponibilidad inmediata" checkbox (new + edit modes)
- `components/setup-wizard/wizard-step-investments.tsx` - isLiquid checkbox and "(liquida)" badge

## Decisions Made
- isLiquid stored sparsely (only when true) to minimize localStorage size
- Liquid investments route currentValue to arsBalance/usdBalance instead of arsInvestments/usdInvestments in patrimonio

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Investment system now supports liquid classification
- Patrimonio card will automatically show liquid investments under "Liquido" sections

---
*Phase: quick-7*
*Completed: 2026-04-03*
