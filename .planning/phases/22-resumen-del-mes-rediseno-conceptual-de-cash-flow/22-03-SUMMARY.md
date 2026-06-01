---
phase: 22
plan: 03
subsystem: resumen-card
tags: [ui, orchestrator, resumen-card, deficit-banners, currency-toggle]
dependency_graph:
  requires:
    - 22-01  # InvestmentPurpose type, ResumenConfig, RESUMEN_CONFIG_KEY
    - 22-02  # computeMonthMetrics, evaluateDeficitState, MonthMetrics interfaces
  provides:
    - ResumenCard redesigned with new props: sobranteRaw, resultadoDelMes, deficitState, usdMetrics, currency toggle
    - expense-tracker.tsx wired to computeMonthMetrics (ARS + USD), evaluateDeficitState, per-session dismiss state
  affects:
    - components/resumen-card.tsx
    - components/expense-tracker.tsx
tech_stack:
  added: []
  patterns:
    - Props-only ResumenCard (no hooks, no localStorage inside component)
    - Dual-currency parallel metric blocks (ARS/USD) wired from orchestrator
    - Per-session useState for deficit dismiss (survives RemounCard remounts)
    - useMemo for 6-month resultadoHistory without excessive recomputation
key_files:
  created: []
  modified:
    - components/resumen-card.tsx
    - components/expense-tracker.tsx
decisions:
  - "sobrante prop replaced by sobranteRaw (signed) — component derives displaySobrantePositive internally"
  - "aportesInversiones prop replaced by aportesNoNeutros + aportesAll — tooltip shows full breakdown"
  - "deficitState computed in orchestrator (expense-tracker.tsx) per active currency, single DeficitState passed to ResumenCard"
  - "resumenCurrency toggle reset fires setDeficitRecurrenteDismissed(false) via useEffect — banner re-evaluates on currency flip"
  - "computeUsdAvailableForMonth implemented inline in expense-tracker.tsx (no new hook) — mirrors calculateAvailableForMonth for USD"
  - "resultadoHistoryArs + resultadoHistoryUsd capped at 6 months, memoized on monthlyData + prevMonthKey"
metrics:
  duration_minutes: 25
  completed_date: "2026-06-01"
  tasks_completed: 2
  tasks_total: 2
  files_modified: 2
---

# Phase 22 Plan 03: ResumenCard Redesign + expense-tracker.tsx Orchestration Summary

ResumenCard redesigned as a cash-flow thermometer with signed Disponible formula (sobrante + ingresos - egresos), always-visible Resultado del mes line, ARS/USD header toggle, and two conditional deficit banners — all computed by expense-tracker.tsx via Plan 02 pure helpers.

## What Was Built

### Task 1: ResumenCard extended with new prop set and visual elements (commit 961a0b8)

**File:** `components/resumen-card.tsx`

- **Props interface rewritten**: removed `sobrante` and `aportesInversiones`; added `sobranteRaw` (signed), `resultadoDelMes`, `aportesNoNeutros`, `aportesAll`, `deficitState`, `deficitRecurrenteDismissed`, `onDismissDeficitRecurrente`, `currency`, `onCurrencyToggle`, `usdMetrics?`
- **Active block pattern**: `const active = isUsd && usdMetrics ? { USD block } : { ARS block }` — single render path
- **Header**: `Badge` for "Este mes" + `Button` with `DollarSign` icon showing current currency (ARS/USD), clicking calls `onCurrencyToggle`
- **Banner 1 (deficit recurrente)**: red background, `AlertTriangle` icon, shows consecutive months text when ≥2 or threshold text otherwise, dismissable with X button
- **Banner 2 (deficit anterior)**: amber background, shows absolute value of negative sobrante
- **Ingresos section**: salary line hidden in USD mode; sobrante anterior shows only when positive; aguinaldo hidden in USD mode
- **Egresos section**: aportes line gated on `active.aportesNoNeutros > 0`, tooltip breaks down aportesAll vs neutral vs non-neutral
- **Disponible tooltip**: updated to show full formula: "Sobrante anterior + Ingreso fijo + Otros ingresos + Aguinaldo - Gastos - Aportes inv. (no neutros)"
- **Resultado del mes line**: always rendered below Disponible, muted style, explicit +/- prefix, no color coding (D2, D12)

### Task 2: expense-tracker.tsx orchestration (commit d845962)

**File:** `components/expense-tracker.tsx`

New imports added:
- `useCallback` added to React import
- `computeMonthMetrics`, `MonthMetrics` from `@/lib/resumen/month-metrics`
- `evaluateDeficitState`, `DeficitState` from `@/lib/resumen/deficit-detector`
- `RESUMEN_CONFIG_KEY`, `DEFAULT_RESUMEN_CONFIG`, `ResumenConfig` from `@/lib/resumen/resumen-config`
- `getFilterDateRange` from `@/hooks/usePayPeriod`
- `calculateAguinaldo` from `@/hooks/useSalaryHistory`

New state and computations:
- `sobranteAnteriorRawArs`: signed (no clamping) — replaces the clamped-only version for ResumenCard
- `soranteDelMesAnterior`: kept as `Math.max(0, sobranteAnteriorRawArs)` for legacy consumers (MonthlyFlowPanel)
- `computeUsdAvailableForMonth`: useCallback that iterates extraIncomes/expenses/investments/usdPurchases/transfers for USD per pay period
- `sobranteAnteriorRawUsd`: previous month USD signed sobrante
- `arsIsInRange`: shared pay-period predicate for both currency metric calls
- `arsMetrics`, `usdMetrics`: MonthMetrics from `computeMonthMetrics` for each currency
- `resultadoHistoryArs`, `resultadoHistoryUsd`: 6-month history arrays (most recent first) for deficit detection
- `resumenConfig`: `useLocalStorage<ResumenConfig>` — reads `deficitThresholdPercent`
- `resumenCurrency`, `setResumenCurrency`: `useState<"ARS" | "USD">` defaulting to "ARS"
- `deficitRecurrenteDismissed`, `setDeficitRecurrenteDismissed`: per-session dismiss state
- `useEffect` resets dismiss on currency flip
- `deficitState`: `evaluateDeficitState` called with active currency's history + sobrante

ResumenCard JSX updated to use all new props; old `sobrante=` and `aportesInversiones=` removed.

## Success Criteria Verification

- D1: Disponible = sobranteAnteriorRaw + ingresos - egresos (via `computeMonthMetrics`) — done
- D2: Resultado del mes always visible in muted style, no color coding — done
- D5: "Déficit anterior" amber banner when sobranteRaw < 0 — done
- D6: "Déficit recurrente" red banner, dismissable per session — done
- D7: ARS/USD header toggle, default ARS, swaps all displayed numbers — done
- D11: Aguinaldo counted in ingresos_mes for both Disponible and Resultado — done
- D12: Resultado del mes always rendered — done
- ResumenCard props-only (no localStorage reads, no data hooks) — confirmed
- `tsc --noEmit` exits 0 — confirmed
- `npm run build` exits 0 — confirmed

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Ordering] `deficitState` useMemo referenced `resumenCurrency`/`resumenConfig` before their declarations**

- **Found during:** Task 2 TypeScript check — error TS2448/TS2454 "Block-scoped variable used before its declaration"
- **Issue:** The plan placed `deficitState` computation between the metrics useMemos and the `simCurrentPatrimony` block, but `resumenCurrency` and `resumenConfig` are declared after `savingsRate` hook (later in the file)
- **Fix:** Removed `deficitState` useMemo from its original location and inserted it immediately after the Phase 22 state declarations (`useEffect` for currency reset), ensuring all referenced variables are in scope
- **Files modified:** `components/expense-tracker.tsx`
- **Commit:** d845962

None — plan executed otherwise exactly as written.

## Known Stubs

None. All data flows are wired end-to-end from expense-tracker.tsx through the Plan 02 pure helpers to ResumenCard.

## Threat Flags

No new network endpoints, auth paths, or schema changes at trust boundaries were introduced. This is a UI-only change consuming existing localStorage keys.

## Self-Check: PASSED

- FOUND: components/resumen-card.tsx
- FOUND: components/expense-tracker.tsx
- FOUND commit: 961a0b8 (Task 1 — ResumenCard)
- FOUND commit: d845962 (Task 2 — expense-tracker.tsx)
