---
quick: 12
title: Make default annual rates configurable + toggle real vs default rates
completed: "2026-04-03T17:51:00Z"
duration: ~6min
tasks_completed: 2
tasks_total: 2
key-files:
  created: []
  modified:
    - lib/projection/types.ts
    - lib/projection/compound-interest.ts
    - hooks/useProjectionEngine.ts
    - hooks/useDataPersistence.ts
    - components/charts-container.tsx
    - components/charts/investment-chart.tsx
    - components/settings-panel.tsx
    - components/expense-tracker.tsx
decisions:
  - "useLocalStorage for customAnnualRates in both expense-tracker and charts-container (same key, stays in sync)"
  - "Optional keys pattern in validateEnvelope for backward-compatible imports"
---

# Quick Task 12: Make Default Annual Rates Configurable Summary

Configurable projection rates per investment type via Settings, with real-rate toggle in InvestmentChart using actual TNA values.

## Task Commits

| Task | Name | Commit | Key Changes |
|------|------|--------|-------------|
| 1 | Configurable rates + engine plumbing | 6250a78 | CustomAnnualRates type, customRates param in getDefaultMonthlyRate/projectInvestment, useRealRates in engine, STORAGE_KEYS + backward-compat import |
| 2 | Settings UI + chart toggle | 335f29a | "Tasas de proyeccion" settings section with inline edit, reset-to-default buttons, "Tasas reales/por defecto" toggle in chart header |

## What Was Built

1. **CustomAnnualRates type** - `Partial<Record<InvestmentType, number>>` allowing per-type overrides
2. **Projection engine support** - `getDefaultMonthlyRate` and `projectInvestment` accept optional custom rates; `useProjectionEngine` accepts `customAnnualRates` and `useRealRates` options
3. **Real rates mode** - When `useRealRates=true`, investments with `tna != null` use their actual TNA for projection (regardless of type)
4. **Settings UI** - "Tasas de proyeccion" section between Cotizacion USD and Historial de ingresos with inline-editable percentage rates per type, reset button for customized rates, and Plazo Fijo shown as non-editable
5. **Chart toggle** - "Tasas por defecto" / "Tasas reales" button next to "Con/Sin aportes", only visible when at least one investment has TNA set
6. **Export/import** - `customAnnualRates` added to STORAGE_KEYS and JSON_KEYS; older exports without this key import gracefully (defaults to `{}`)

## Deviations from Plan

None - plan executed exactly as written.

## Self-Check: PASSED
