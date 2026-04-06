---
gsd_state_version: 1.0
milestone: v1.2
milestone_name: Graficos Predictivos
status: unknown
last_updated: "2026-04-06T01:10:28.192Z"
progress:
  total_phases: 18
  completed_phases: 17
  total_plans: 45
  completed_plans: 45
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-04-03)

**Core value:** Reflejar la realidad financiera exacta del usuario en todo momento — nunca perderse un peso ni un dolar.
**Current focus:** v1.2 — Graficos Predictivos, Phase 14 ready to plan

## Current Position

Phase: 17 of 17 (Gamification Engine)
Plan: 2 of 2 complete
Status: Phase 17 complete — all plans executed
Last activity: 2026-04-06 — Completed 17-02: Simulator Dialog UI

Progress: [██████████] 100% (2/2 plans in phase 17)

## Performance Metrics

**Velocity:**
- Total plans completed: 35 (v1.0: 32, v1.1: 3 [wizard 2 + manual 1] — but tracked as 5 in v1.1)
- Average duration: ~2.7 min
- Total execution time: ~85 min

**Recent Trend (v1.1 last plans):**
- 11-01: ~3min, 11-02: ~3min, 12-01: ~3min, 12-02: ~2min, 13-01: ~3min
- Trend: Stable (~2.8 min)

*Updated after each plan completion*

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- [v1.2 Roadmap]: INFRA-01 (Recharts upgrade) is Phase 14 — isolate migration risk FIRST before new charts
- [v1.2 Roadmap]: INFRA-03 is cross-cutting invariant — all phases enforce read-only localStorage access
- [v1.2 Roadmap]: Projection engine (Phase 15) before chart UI (Phase 16) — pure math testable without rendering
- [v1.2 Roadmap]: ARS+USD combined at current globalUsdRate with visible disclaimer on every chart
- [v1.2 Roadmap]: Growth rates from configurable defaults per type, NOT derived from movements
- [v1.2 Research]: No external math libraries — compound interest + linear regression in ~100 lines plain TS
- [14-01]: Used Partial<TooltipContentProps> for Recharts 3.x compatibility in chart.tsx
- [14-01]: Inlined LegendPayload[] type — Recharts 3.x removed payload from LegendProps
- [Phase 14]: [14-02]: ComposedChart pattern proven: 'use client' + useHydration + ChartContainer + ComposedChart with dual Lines
- [15-01]: All projection functions are pure TypeScript with zero React dependencies
- [15-01]: Historical patrimony uses simplified cumulative running totals (not full calculateDualBalances)
- [15-01]: Scenario engine outputs savings-only projections; investment growth layered by hook
- [Phase 15]: All projection functions are pure TypeScript with zero React dependencies
- [15-02]: useProjectionEngine accepts data as parameters (not calling hooks) for decoupling and testability
- [15-02]: Investment growth computed per-scenario with different rateMultipliers (1.5/1.0/0.5)
- [16-01]: ChartControls lives outside PatrimonyChart for reuse across future chart types
- [16-01]: Conditional Line rendering via visibleScenarios prop rather than data filtering
- [16-02]: Slugified chart config keys for CSS variable compatibility with space-containing investment type names
- [Phase quick-14]: CurrencyInput with es-AR locale formatting for all money inputs across 21 files
- [17-01]: Installed vitest as project test runner; TDD pattern for pure TS engine functions
- [17-01]: Cumulative subtraction model for simulated expenses (each installment impacts from its month through end)
- [17-01]: maxMonthlyImpact computed by summing per-month installment payments, not by diffing projections
- [17-02]: Derived currentPatrimony from dualBalancesForCards instead of importing useProjectionEngine
- [17-02]: Ephemeral dialog pattern: all state resets on close via useEffect, no localStorage writes

### Pending Todos

None.

### Roadmap Evolution

- Phase 17 added: quiero poder simular gastos futuros de manera sencilla. Gastos puntuales y de cuotas.

### Blockers/Concerns

- Verify Plazo Fijo `rate` (TNA) field exists on Investment interface before Phase 15
- Historical investment values not stored per month — need interpolation strategy in Phase 15
- ~shadcn ChartContainer compatibility with Recharts 3.x must be confirmed in Phase 14~ RESOLVED in 14-01: confirmed compatible with type fixes

### Quick Tasks Completed

| # | Description | Date | Commit | Status | Directory |
|---|-------------|------|--------|--------|-----------|
| 3 | Tab names hidden when inactive | 2026-04-02 | 6f99a61 | quick/3-... |
| 4 | Fix resumen inversiones wizard y sueldo | 2026-04-03 | 1382d82 | quick/4-... |
| 5 | Mejorar empty state Prestamos y Recurrentes | 2026-04-03 | f9cb037 | quick/5-... |
| 6 | Homogeneizar tabs Prestamos y Recurrentes | 2026-04-03 | e614f4f | quick/6-... |
| 7 | Cuenta remunerada type + isLiquid flag | 2026-04-03 | c8d3782 | quick/7-... |
| 8 | Add delete confirmation dialogs to all 9 delete buttons | 2026-04-03 | e858a19 | quick/8-... |
| 9 | Move config settings from card to taskbar dialog | 2026-04-03 | 1736434 | quick/9-... |
| 10 | Investment chart toggle contributions + type visibility | 2026-04-03 | 9e7236a | quick/10-... |
| 11 | Add projection basis info banner to investment chart | 2026-04-03 | 3e3c76a | quick/11-... |
| 12 | Make default annual rates configurable + toggle real vs default | 2026-04-03 | 335f29a | quick/12-... |
| 13 | Per-investment monthly contribution override inputs | 2026-04-03 | b471b6f | quick/13-... |
| 14 | Format all money inputs with CurrencyInput | 2026-04-03 | 94bd76d | Verified | [14-format-all-money-inputs-with-currency-fo](./quick/14-format-all-money-inputs-with-currency-fo/) |
| 15 | Add isInitial checkbox to investment creation dialog | 2026-04-03 | 8bb86b3 | quick/15-... |
| 16 | Add Por pagar category for unpaid recurring expenses | 2026-04-03 | 9aa3ba1 | Verified | [16-add-por-pagar-category-for-unpaid-recurr](./quick/16-add-por-pagar-category-for-unpaid-recurr/) |
| 18 | Highlight current month in month selector dropdown | 2026-04-03 | ebb96e4 | Done | [18-en-el-selector-de-mes-al-mes-actual-pone](./quick/18-en-el-selector-de-mes-al-mes-actual-pone/) |
| 19 | Move theme selector into settings panel | 2026-04-03 | 7fdf6e6 | Done | [19-move-el-selector-de-tema-dentro-de-setti](./quick/19-move-el-selector-de-tema-dentro-de-setti/) |
| 20 | Symmetric ARS/USD balance views with Periodo/Acumulado toggle | 2026-04-03 | 04c9251 | Verified | [20-analyze-usd-expense-registration-approac](./quick/20-analyze-usd-expense-registration-approac/) |
| 21 | Investment-aware simulator projections | 2026-04-05 | ea3cac8 | Done | [21-tene-en-cuenta-patrimonio-y-tene-en-cuen](./quick/21-tene-en-cuenta-patrimonio-y-tene-en-cuen/) |
| Phase 15 P01 | 3min | 3 tasks | 5 files |
| Phase 15 P02 | 3min | 1 task | 1 file |
| Phase 16 P01 | 3min | 2 tasks | 5 files |
| Phase 16 P02 | 2min | 2 tasks | 2 files |

## Session Continuity

Last session: 2026-04-05
Stopped at: Completed quick-21: Investment-aware simulator projections
Resume file: None
