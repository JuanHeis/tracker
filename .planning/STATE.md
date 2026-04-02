---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: unknown
last_updated: "2026-04-02T15:49:19.450Z"
progress:
  total_phases: 6
  completed_phases: 5
  total_plans: 19
  completed_plans: 18
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-04-01)

**Core value:** Reflejar la realidad financiera exacta del usuario en todo momento — nunca perderse un peso ni un dolar.
**Current focus:** Phase 9: Transfers & Adjustments

## Current Position

Phase: 9 of 10 (Transfers & Adjustments)
Plan: 1 of 3 in current phase (09-01 complete)
Status: Executing Phase 9
Last activity: 2026-04-02 -- Completed 09-01 (Transfer Data Model & Domain Hook)

Progress: [████████████████████] 58%

## Performance Metrics

**Velocity:**
- Total plans completed: 12
- Average duration: ~2.7 min
- Total execution time: ~30 min

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01-critical-bug-fixes | 01-01, 01-02, 01-03 | 7min | 2.3min |
| 02-investment-model-refactor | 02-01, 02-02, 02-03, 02-04, 02-05 | 15min | 3.0min |
| 03-dual-currency-engine | 03-01, 03-02, 03-03, 03-04 | 12min | 3.0min |

**Recent Trend:**
- Last 5 plans: -
- Trend: -

*Updated after each plan completion*
| Phase 02 P02 | 3min | 2 tasks | 4 files |
| Phase 03 P01 | 3min | 2 tasks | 4 files |
| Phase 03 P02 | 3min | 2 tasks | 6 files |
| Phase 03 P03 | 2min | 2 tasks | 3 files |
| Phase 03 P04 | 4min | 2 tasks | 6 files |
| Phase 04 P01 | 3min | 2 tasks | 6 files |
| Phase 04 P02 | 2min | 2 tasks | 2 files |
| Phase 04 P03 | 3min | 2 tasks | 4 files |
| Phase 04 P04 | 4min | 2 tasks | 6 files |
| Phase 05 P01 | 3min | 2 tasks | 4 files |
| Phase 05 P02 | 3min | 2 tasks | 3 files |
| Phase 09 P01 | 2min | 2 tasks | 2 files |

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- Roadmap: Investment model refactored before currency work (currency depends on correct investment accounts)
- Roadmap: Phases 6, 7, 8 are independent features that only depend on Phase 5 (monthly card) being correct
- Roadmap: Persistence and UX polish deferred to final phase as cross-cutting concerns
- 01-01: Canonical investment types: Plazo Fijo, FCI, Crypto, Acciones (dropped Bonos, Otros)
- 01-01: Used editingInvestment prop directly for edit defaults instead of separate defaultValues prop
- 01-02: Use date-fns addMonths with end-of-month clamping instead of raw Date.setMonth
- 01-02: Force form remount via React key prop rather than switching to controlled inputs
- 01-03: Total field formula changed - investments not added to total (blocked money, not income)
- 01-03: Validation on expense/income forms only; investment dialog has own component
- 01-03: Reset clears both monthlyData and lastUsedUsdRate from localStorage
- 02-01: CurrencyType enum moved to constants/investments.ts to avoid circular imports, re-exported from useMoneyTracker
- 02-01: handleUpdateInvestment changed from form-based to data-based API (investmentId + partial updates)
- 02-01: Investment dialog refactored to handle form data extraction internally
- 02-03: NumberFlow used with hydration guard - plain toLocaleString fallback during SSR
- 02-03: PF fields editor uses click-to-edit pattern inside expanded row for consistent UX
- [Phase 02]: 02-02: Edit mode locks type and currency (immutable after creation); only name and PF fields editable
- [Phase 02]: 02-02: onUpdate accepts name/tna/plazoDias instead of type/currencyType (locked after creation)
- 02-04: Finalization uses intermediary state + confirmation dialog before calling onFinalize
- 02-04: Added Ganancia/% column to InvestmentRow for 8-column table layout
- 02-05: Pencil icon always visible (not hover-only) for click-to-edit discoverability
- 02-05: PF auto-calculated value shown directly in Valor Actual column
- 03-01: Migration v3 uses _migrationVersion field to prevent double-reversal of USD amounts
- 03-01: globalUsdRate stored in separate localStorage key (not per-month) for global availability
- 03-01: Exchange gain/loss only calculated for tracked purchases (untracked have no purchase rate)
- 03-02: USD balance is cumulative across all time (running wallet), ARS balance is month-scoped
- 03-02: Removed dual Monto/USD table columns — single column with native currency symbol
- 03-02: Patrimonio = arsLiquid + (usdLiquid * globalRate) + arsInvestments + (usdInvestments * globalRate)
- 03-03: UsdPurchaseDialog uses mode toggle (buy/register) instead of separate dialogs
- 03-03: ExchangeSummary placed in sidebar below Balance card
- 03-03: Effective rate computed live as user types ARS and USD amounts
- 03-04: Pencil icon always visible with muted color + hover:blue for rate editing discoverability
- 03-04: USD purchase auto-calc uses globalUsdRate but user can freely override either field
- 04-01: Dual-write to salaryHistory and legacy salaries map for backward compat during transition
- 04-01: Migration v4 deduplicates entries — only creates new SalaryEntry when amount/rate changes
- 04-01: getSalaryForMonth uses string comparison for yyyy-MM ordering
- 04-02: Employment type uses two-button toggle (not dropdown) for quick switching
- 04-02: Pencil icons always visible with muted+hover:blue, delete icons muted+hover:red
- 04-02: Salary timeline shows "Desde {MMM yyyy}" format using date-fns/es locale
- 04-03: Aguinaldo override management in useMoneyTracker (not useSalaryHistory) since overrides live in monthlyData
- 04-03: Aguinaldo preview uses partial semester data (Jan-May for June, Jul-Nov for December)
- 04-04: Segmented control placed alongside month/year selectors using existing Tabs component
- 04-04: Balance calculation uses getFilterDateRange for ARS scoping; USD remains cumulative
- 04-04: Pendiente de cobro banner only in mes view, current month, before pay date
- 05-01: Resumen card income amounts colored green matching INGRESOS section header semantics
- 05-01: Patrimonio card Liquido USD uses neutral color (not green) per CARD-05 semantic decision
- 05-01: Aportes inversiones displayed as negative with blue text in Resumen card
- 05-02: Disponible tooltip shows full formula with all line items and actual values
- 05-02: Patrimonio Total tooltip shows per-line USD conversion math (US$ X x $rate = $result)
- 05-02: calculateDualBalances called once in parent, result stored in variable (was 3 calls)
- 09-01: Transfer type uses discriminated union with 6 types: currency conversions, cash in/out, adjustments
- 09-01: handleCreateAdjustment takes trackedBalance at confirm time (avoids stale balance pitfall)
- 09-01: Currency conversions are patrimonio-neutral (ARS down = USD up or vice versa)

### Pending Todos

None yet.

### Blockers/Concerns

- Brownfield project: data migration from current localStorage schema must preserve existing user data at each refactor phase

## Session Continuity

Last session: 2026-04-02
Stopped at: Completed 09-01-PLAN.md (Transfer Data Model & Domain Hook)
Resume file: Phase 9 in progress, ready for 09-02
