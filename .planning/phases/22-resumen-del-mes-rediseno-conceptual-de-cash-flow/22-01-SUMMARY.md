---
phase: 22
plan: 01
subsystem: resumen-del-mes
tags: [types, localStorage, config, foundation]
status: complete
requirements: [D3, D10, D13]
dependency_graph:
  requires: []
  provides:
    - "InvestmentPurpose type (union of 4 string literals)"
    - "Investment.purpose optional field"
    - "getInvestmentPurpose helper (read-time default 'ahorro')"
    - "ResumenConfig interface, RESUMEN_CONFIG_KEY, DEFAULT_RESUMEN_CONFIG"
  affects:
    - "hooks/useMoneyTracker.ts (Investment interface extended)"
    - "lib/resumen/ (new directory + module)"
tech_stack:
  added: []
  patterns:
    - "localStorage config module pattern (mirrors lib/projection/savings-rate.ts)"
    - "Optional field with read-time accessor (no schema migration needed)"
key_files:
  created:
    - "lib/resumen/resumen-config.ts"
  modified:
    - "hooks/useMoneyTracker.ts"
decisions:
  - "InvestmentPurpose modelled as TS string-literal union (compile-time exhaustive checking)"
  - "Default 'ahorro' applied via getInvestmentPurpose helper at read time — no localStorage migration"
  - "DEFAULT_RESUMEN_CONFIG omits wizardCompletedAt (undefined means wizard pending)"
  - "Default deficitThresholdPercent = 25 (per CONTEXT D6)"
metrics:
  duration: "~5 min"
  completed: "2026-06-01"
  tasks: 2
  files_changed: 2
  commits:
    - "d349c63: feat(22-01): add InvestmentPurpose type and getInvestmentPurpose helper"
    - "4554c88: feat(22-01): add resumen-config localStorage schema module"
---

# Phase 22 Plan 01: Investment Purpose Types and Resumen Config Schema Summary

**One-liner:** Foundation layer for the Resumen del Mes redesign — extends the Investment data model with an optional `purpose` field (4-label union for monthly-flow classification) and introduces the `resumenConfig` localStorage schema module that downstream plans will consume for deficit-threshold settings and migration-wizard gating.

## What Was Done

### Task 1 — Investment data model extension (`hooks/useMoneyTracker.ts`)

Added three exported declarations adjacent to the existing `Investment` interface:

1. `InvestmentPurpose` type alias — string literal union of exactly `"ahorro" | "objetivo" | "tarjeta" | "especulacion"`.
2. `Investment.purpose?: InvestmentPurpose` — appended as the last optional field, keeping all existing fields untouched. Optional by design so existing localStorage data hydrates without migration.
3. `getInvestmentPurpose(inv)` — read-time accessor returning `inv.purpose ?? "ahorro"`. Downstream code MUST use this helper rather than reading `inv.purpose` directly so legacy unclassified investments default to `"ahorro"` consistently.

Commit: `d349c63`.

### Task 2 — Resumen config module (`lib/resumen/resumen-config.ts`)

Created the new `lib/resumen/` directory and its first module containing three named exports:

1. `ResumenConfig` — interface with required `deficitThresholdPercent: number` and optional `wizardCompletedAt?: string`.
2. `RESUMEN_CONFIG_KEY` — string constant `"resumenConfig"` (the localStorage key).
3. `DEFAULT_RESUMEN_CONFIG` — seed value with `deficitThresholdPercent: 25` (per CONTEXT D6 default), `wizardCompletedAt` omitted so the wizard renders on first load.

Pure TypeScript module — no React, no hooks, no imports. Mirrors `lib/projection/savings-rate.ts`. Commit: `4554c88`.

## Decisions Made

- **No schema migration.** Per the `[JSON structure safety]` memory rule, `Investment.purpose` was added as an optional field. Existing user data hydrates unchanged; the `getInvestmentPurpose` helper handles the undefined case at read time. This is the safest possible change for an actively-used app.
- **`resumenConfig` is a brand-new localStorage key.** No coupling to `monthlyData` shape, no impact on existing import/export envelope. Default seeded by `useLocalStorage` on first access.
- **Helper-based defaulting over write-back.** Rather than writing `"ahorro"` to every investment on first load (which would mutate the JSON envelope), the default is computed every read via `getInvestmentPurpose`. This keeps the `monthlyData` snapshot stable and import/export round-trips lossless.
- **`wizardCompletedAt` left undefined in default.** Plan 22-04 will check `if (!resumenConfig.wizardCompletedAt && hasUnclassifiedInvestments)` to gate the migration wizard. The undefined sentinel avoids needing a separate "wizardSeen" boolean.

## Deviations from Plan

None — plan executed exactly as written. Both tasks landed verbatim per the `<action>` blocks. No bugs found, no missing critical functionality detected, no architectural blockers.

## Verification Performed

- `npx tsc --noEmit` exits 0 after each task (no type errors introduced).
- Per-task acceptance grep commands all match the expected pattern counts.
- `git diff --stat` shows insertion-only diff on `hooks/useMoneyTracker.ts` (no existing lines changed).
- `lib/resumen/resumen-config.ts` confirmed to contain zero `import` statements (pure TS).
- All six acceptance-criteria grep patterns for Task 2 match in a single composite check.

## Self-Check: PASSED

- File `hooks/useMoneyTracker.ts` modified — contains `InvestmentPurpose`, `purpose?: InvestmentPurpose`, and `getInvestmentPurpose` (verified via grep at lines 73, 90, 94).
- File `lib/resumen/resumen-config.ts` created with all three named exports.
- Commit `d349c63` present in `git log` (Task 1).
- Commit `4554c88` present in `git log` (Task 2).
- `npx tsc --noEmit` exits 0 after both tasks.

## Downstream Impact

Plans 22-02 through 22-04 (and any future plan in this phase) can now:

- Import `InvestmentPurpose`, `Investment`, and `getInvestmentPurpose` from `@/hooks/useMoneyTracker` for purpose-aware filtering of investment movements.
- Import `ResumenConfig`, `RESUMEN_CONFIG_KEY`, and `DEFAULT_RESUMEN_CONFIG` from `@/lib/resumen/resumen-config` and consume via `useLocalStorage(RESUMEN_CONFIG_KEY, DEFAULT_RESUMEN_CONFIG)`.
- Add the inline purpose `<Select>` cell in `components/investment-row.tsx` (next plan).
- Compute `resultadoDelMes` using `getInvestmentPurpose(inv) === "ahorro" || === "especulacion"` to filter non-neutral aportes.

No behavior change is visible to the user yet — this plan ships pure contracts.

## Known Stubs

None. This plan does not render any UI, so there are no placeholder values or unwired data sources.
