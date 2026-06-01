---
phase: quick
plan: 260601-m3e
subsystem: investments / resumen-del-mes
tags: [purpose, buckets, month-metrics, investments, tdd]
requires:
  - hooks/useMoneyTracker.ts (InvestmentMovement, Investment, InvestmentPurpose)
  - lib/resumen/month-metrics.ts (sumAportes, computeMonthMetrics)
provides:
  - constants/investment-purpose.ts (INVESTMENT_PURPOSE_ORDER/LABELS, getMovementPurpose)
  - lib/investments/buckets.ts (computeBuckets, BucketBreakdown, PurposeBucket)
  - per-movement purpose resolution in month-metrics
  - purpose UX (editor select, list chip, buckets view, change-default guard)
affects:
  - components/investment-movements.tsx
  - components/investment-row.tsx
tech-stack:
  added: []
  patterns:
    - Per-movement effective-purpose resolution (movement -> investment -> "ahorro")
    - Pure buckets engine separate from UI
key-files:
  created:
    - constants/investment-purpose.ts
    - lib/investments/buckets.ts
    - lib/investments/buckets.test.ts
    - lib/resumen/month-metrics.test.ts
  modified:
    - hooks/useMoneyTracker.ts
    - hooks/useInvestmentsTracker.ts
    - lib/resumen/month-metrics.ts
    - components/investment-movements.tsx
    - components/investment-row.tsx
decisions:
  - "Purpose resolved per-movement at read time; no destructive migration (D20)"
  - "isInitial aportes count toward buckets (patrimony composition) but stay neutral in monthly flow (D15 vs D18)"
  - "Pending retiros excluded from buckets (money not yet out)"
  - "Aporte edit Dialog shows ONLY the purpose select; retiro Dialog keeps amount/pending/received"
metrics:
  duration: ~6 min
  completed: 2026-06-01
  tasks: 4
  files: 9
---

# Quick Task 260601-m3e: Purpose por Movement Summary

Moved investment `purpose` classification down to each `InvestmentMovement` (inheriting from the Investment, then "ahorro"), refined the Resumen del Mes engine to read purpose per-movement (fixing the SBS double-deduction), added a pure buckets-by-purpose engine, and surfaced purpose across the movement UX (editor select, list chip, buckets view with negative-bucket warning, change-default confirmation).

## What Was Built

- **Task 1 (`6f1b999`)**: Added optional `purpose?` to `InvestmentMovement`; created `constants/investment-purpose.ts` (order, labels, `getMovementPurpose` resolver); threaded `purpose` through `handleAddMovement` and `handleEditMovement`. Relaxed `handleEditMovement` so a purpose-only update applies to aportes too, while the amount/pending/received/currentValue logic stays guarded behind the retiro path.
- **Task 2 (`f4251ec`, TDD)**: Refined `sumAportes` to drop the Investment-level purpose skip and instead resolve purpose per-movement via `getMovementPurpose`. Added `month-metrics.test.ts` covering the SBS validation case (`resultadoDelMes === -314093`, `aportesNoNeutros === 0`), D15/D16 neutrality, D14 override + inheritance, especulacion counting, and an `aportesAll` regression.
- **Task 3 (`6e1ad91`, TDD)**: Added `lib/investments/buckets.ts` `computeBuckets` (bucket[p] = Σaportes − Σretiros per effective purpose, plus `total`, `sinAsignar`, per-bucket `negative` flag). isInitial aportes count; pending retiros excluded. Tests cover SBS buckets, negative detection, inheritance, `sinAsignar`, and pending-retiro exclusion.
- **Task 4 (`3b7df88`)**: Added pre-filled "Propósito" select to the add form; per-row purpose chip; purpose-editable Dialog for both aportes (purpose-only) and retiros; collapsible buckets-by-purpose view with amber negative-bucket warning (AlertTriangle + tooltip); and an AlertDialog confirmation before changing the Investment default when uncategorized movements exist. Purpose options are DRY via the shared constant.

## Verification Results

- `npx tsc --noEmit` — clean.
- `npx vitest run lib/resumen/month-metrics.test.ts lib/investments/buckets.test.ts` — 11 passed.
- `npm run build` — succeeds (no type/import regressions).
- SBS validation: Resultado del mes = -314093; tarjeta bucket = 30630; ahorro bucket = 200977.
- Legacy movements without `purpose` compute and render via inheritance; no migration ran (D20).

## Deviations from Plan

None — plan executed exactly as written. The plan's optional percentage bar in the buckets view was implemented as the lightweight numeric breakdown (the plan explicitly allowed "numeric is sufficient").

## Self-Check: PASSED

- FOUND: constants/investment-purpose.ts
- FOUND: lib/investments/buckets.ts
- FOUND: lib/investments/buckets.test.ts
- FOUND: lib/resumen/month-metrics.test.ts
- FOUND commit 6f1b999, f4251ec, 6e1ad91, 3b7df88
