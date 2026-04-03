---
phase: 15-projection-engine
plan: 01
subsystem: projection
tags: [typescript, compound-interest, financial-math, projection-engine]

requires:
  - phase: 14-recharts-upgrade
    provides: Chart infrastructure and Recharts 3.x compatibility
provides:
  - All projection types (InvestmentProjection, HistoricalPoint, ProjectionDataPoint, ScenarioConfig, ProjectionSummary, UseProjectionEngineReturn)
  - DEFAULT_ANNUAL_RATES and SCENARIOS constants
  - Compound interest functions (pfMonthlyRate, getDefaultMonthlyRate, projectInvestment)
  - Income projection functions (projectIncome, estimateMonthlyNetSavings)
  - Historical patrimony reconstruction (reconstructHistoricalPatrimony)
  - Scenario engine (projectPatrimonyScenarios)
affects: [15-02-projection-hook, 16-chart-ui]

tech-stack:
  added: []
  patterns: [pure-function-modules, projection-math-layer]

key-files:
  created:
    - lib/projection/types.ts
    - lib/projection/compound-interest.ts
    - lib/projection/income-projection.ts
    - lib/projection/patrimony-history.ts
    - lib/projection/scenario-engine.ts
  modified: []

key-decisions:
  - "All projection functions are pure TypeScript with zero React dependencies"
  - "Historical patrimony uses cumulative running totals (simplified vs calculateDualBalances)"
  - "Scenario engine outputs savings-only projections; investment growth layered by hook"

patterns-established:
  - "Pure math layer pattern: lib/projection/ contains only pure functions, no hooks or React"
  - "Scenario multiplier pattern: SCENARIOS constant drives optimista/base/pesimista variants"

requirements-completed: [PROJ-01, PROJ-02, PROJ-03, PROJ-04, PROJ-05]

duration: 3min
completed: 2026-04-03
---

# Phase 15 Plan 01: Projection Math Foundation Summary

**Pure TypeScript projection engine with compound interest, income projection, historical patrimony reconstruction, and three-scenario patrimony projections**

## Performance

- **Duration:** 3 min
- **Started:** 2026-04-03T15:45:17Z
- **Completed:** 2026-04-03T15:48:23Z
- **Tasks:** 3
- **Files created:** 5

## Accomplishments
- Created complete type system for projection engine (6 interfaces, 2 constants)
- Implemented compound interest math with Argentine Plazo Fijo TNA conversion and default rates for all investment types
- Built historical patrimony reconstruction from monthlyData with cumulative running totals
- Three-scenario engine with optimista/base/pesimista savings multipliers

## Task Commits

Each task was committed atomically:

1. **Task 1: Create projection types and constants** - `0650425` (feat)
2. **Task 2: Create compound interest and investment projection functions** - `665b584` (feat)
3. **Task 3: Create income projection, patrimony history, and scenario engine** - `2c9490c` (feat)

## Files Created/Modified
- `lib/projection/types.ts` - All shared types (InvestmentProjection, HistoricalPoint, ProjectionDataPoint, ScenarioConfig, ProjectionSummary, UseProjectionEngineReturn) and constants (DEFAULT_ANNUAL_RATES, SCENARIOS)
- `lib/projection/compound-interest.ts` - pfMonthlyRate, getDefaultMonthlyRate, projectInvestment functions
- `lib/projection/income-projection.ts` - projectIncome (flat-line) and estimateMonthlyNetSavings
- `lib/projection/patrimony-history.ts` - reconstructHistoricalPatrimony from MonthlyData
- `lib/projection/scenario-engine.ts` - projectPatrimonyScenarios with three variants

## Decisions Made
- All functions are pure TypeScript with zero React imports -- importable from anywhere without circular deps
- Historical patrimony uses simplified cumulative approach (not full calculateDualBalances logic) -- acceptable for projection charts with ARS/USD single-rate limitation
- Scenario engine only handles savings multipliers; investment growth with rateMultiplier will be layered by the hook in Plan 15-02

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- All pure math functions ready for useProjectionEngine hook (Plan 15-02)
- Types exported for chart UI consumption (Phase 16)
- INFRA-03 invariant maintained: zero changes to existing files

---
*Phase: 15-projection-engine*
*Completed: 2026-04-03*
