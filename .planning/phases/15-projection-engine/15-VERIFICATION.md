---
phase: 15-projection-engine
verified: 2026-04-03T16:10:00Z
status: passed
score: 10/10 must-haves verified
re_verification: false
---

# Phase 15: Projection Engine Verification Report

**Phase Goal:** All projection math and data orchestration is complete — investment compound interest, income linear projection, historical patrimony reconstruction, and scenario configuration are available via a single hook
**Verified:** 2026-04-03T16:10:00Z
**Status:** passed
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Compound interest function produces correct future values for Plazo Fijo using TNA and for other types using default annual rates | VERIFIED | `pfMonthlyRate` uses `Math.pow(1 + tnaPercent/100/365, 30) - 1`; `getDefaultMonthlyRate` branches on PF vs others using `DEFAULT_ANNUAL_RATES`; `projectInvestment` iterates `(balance + contribution) * (1 + monthlyRate)` with `Math.round()` |
| 2 | Income projection returns flat-line array repeating current salary for N months | VERIFIED | `projectIncome` returns `Array.from({ length: horizonMonths + 1 }, () => currentSalary)` — pure flat-line, length = horizonMonths + 1 |
| 3 | Historical patrimony reconstruction iterates existing monthlyData and produces per-month totals in ARS | VERIFIED | `reconstructHistoricalPatrimony` collects all unique month keys, accumulates running liquid ARS/USD, processes expenses/incomes/transfers/loans/investments per month, converts USD via `globalUsdRate`, returns `HistoricalPoint[]` sorted chronologically |
| 4 | Scenario engine produces three variants (optimista/base/pesimista) with different rate multipliers | VERIFIED | `SCENARIOS` constant defines multipliers: optimista (rateMultiplier 1.5, savingsMultiplier 1.1), base (1.0/1.0), pesimista (0.5/0.8); `projectPatrimonyScenarios` iterates SCENARIOS; `useProjectionEngine` calls `computeInvestmentGrowth` separately per scenario with the correct multipliers |
| 5 | Projection results are identical across repeated calls with the same inputs | VERIFIED | All lib/projection functions are pure with no side effects; `useProjectionEngine` wraps everything in a single `useMemo` with declared dependencies — deterministic |
| 6 | Hook returns investment projections for each active non-liquid investment using compound interest with correct rates per type | VERIFIED | Hook filters `i.status === "Activa" && !i.isLiquid`, applies `pfMonthlyRate(inv.tna)` for PF, `getDefaultMonthlyRate(inv.type, rateMultiplier)` for others, returns `investmentProjections` array |
| 7 | Hook returns historical patrimony data series reconstructed from monthlyData | VERIFIED | Hook calls `reconstructHistoricalPatrimony(monthlyData, salaryEntries, globalUsdRate)` and integrates result into `patrimonyData` array with `historicalPatrimony` fields set |
| 8 | Hook returns three scenario projection series (optimista/base/pesimista) including investment growth and net savings | VERIFIED | `projectPatrimonyScenarios` produces savings-only base; then per-scenario `computeInvestmentGrowth` (1.5x/1.0x/0.5x) is added via `.map((v, m) => v + growth[m])`; final arrays wired into `ProjectionDataPoint` objects |
| 9 | Hook output is directly consumable by Recharts ComposedChart (array of objects with named keys) | VERIFIED | Returns `ProjectionDataPoint[]` with named fields `month`, `monthKey`, `historicalPatrimony`, `proyeccionOptimista`, `proyeccionBase`, `proyeccionPesimista` — standard Recharts dataKey pattern; months labeled in Spanish with capitalized first letter |
| 10 | Projection data updates automatically when monthlyData, salary, or recurring expenses change | VERIFIED | `useMemo` dependency array includes `[monthlyData, salaryEntries, recurringExpenses, globalUsdRate, horizonMonths, includeContributions]` — all relevant inputs declared |

**Score:** 10/10 truths verified

---

### Required Artifacts

| Artifact | Status | Details |
|----------|--------|---------|
| `lib/projection/types.ts` | VERIFIED | 67 lines; exports 6 interfaces (InvestmentProjection, HistoricalPoint, ProjectionDataPoint, ScenarioConfig, ProjectionSummary, UseProjectionEngineReturn), 2 constants (DEFAULT_ANNUAL_RATES, SCENARIOS); zero React imports |
| `lib/projection/compound-interest.ts` | VERIFIED | 72 lines; exports pfMonthlyRate, getDefaultMonthlyRate, projectInvestment; imports from `./types` and `@/hooks/useMoneyTracker` (type-only); no React |
| `lib/projection/income-projection.ts` | VERIFIED | 35 lines; exports projectIncome (flat array), estimateMonthlyNetSavings (salary minus active recurring); no React |
| `lib/projection/patrimony-history.ts` | VERIFIED | 265 lines; exports reconstructHistoricalPatrimony; handles expenses, incomes, transfers (all 6 types), loans (preste/debo + payments), USD purchases, investment movements; no React |
| `lib/projection/scenario-engine.ts` | VERIFIED | 38 lines; exports projectPatrimonyScenarios; imports SCENARIOS from `./types`; produces three arrays indexed by month |
| `hooks/useProjectionEngine.ts` | VERIFIED | 278 lines (exceeds 80-line minimum); exports useProjectionEngine; accepts (monthlyData, salaryEntries, recurringExpenses, globalUsdRate, options?); wraps all computation in useMemo; no useState; no localStorage writes |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `compound-interest.ts` | `types.ts` | `import.*from.*types` | WIRED | Imports `InvestmentProjection`, `DEFAULT_ANNUAL_RATES` from `./types` |
| `scenario-engine.ts` | `types.ts` | `import.*SCENARIOS.*from.*types` | WIRED | Imports `SCENARIOS` from `./types` |
| `useProjectionEngine.ts` | `compound-interest.ts` | `import.*from.*projection/compound-interest` | WIRED | Imports pfMonthlyRate, getDefaultMonthlyRate, projectInvestment — all three called in computeInvestmentGrowth |
| `useProjectionEngine.ts` | `patrimony-history.ts` | `import.*from.*projection/patrimony-history` | WIRED | Imports reconstructHistoricalPatrimony — called in useMemo body |
| `useProjectionEngine.ts` | `scenario-engine.ts` | `import.*from.*projection/scenario-engine` | WIRED | Imports projectPatrimonyScenarios — called in useMemo body |
| `useProjectionEngine.ts` | `income-projection.ts` | `import.*from.*projection/income-projection` | WIRED | Imports estimateMonthlyNetSavings and projectIncome — both called in useMemo body |
| `useProjectionEngine.ts` | `useMoneyTracker.ts` | `MonthlyData\|Investment` | WIRED | Imports MonthlyData and Investment types; monthlyData used as primary data source |

---

### Requirements Coverage

| Requirement | Description | Plan | Status | Evidence |
|-------------|-------------|------|--------|----------|
| PROJ-01 | User ve proyeccion de cada inversion activa con interes compuesto (PF usa TNA, otras usan rendimiento observado) | 15-01, 15-02 | SATISFIED | `projectInvestment` + `pfMonthlyRate` + `getDefaultMonthlyRate` in compound-interest.ts; hook filters active non-liquid investments and applies correct rate per type |
| PROJ-02 | User puede activar "aportes futuros" por inversion — proyecta aportes mensuales recurrentes (por default: monto del ultimo aporte) | 15-01, 15-02 | SATISFIED | `includeContributions` parameter in `projectInvestment`; when true, finds last non-initial aporte via `.filter(m => m.type === "aporte" && !m.isInitial).at(-1)?.amount ?? 0`; hook exposes `options.includeContributions` |
| PROJ-03 | User ve proyeccion lineal de ingresos futuros basada en su ingreso fijo actual | 15-01, 15-02 | SATISFIED | `projectIncome(currentSalary, horizonMonths)` returns flat array; hook calls it and exposes `incomeProjection` in return value |
| PROJ-04 | Proyeccion de patrimonio deduce gastos recurrentes del ahorro mensual neto | 15-01, 15-02 | SATISFIED | `estimateMonthlyNetSavings` subtracts active recurring expenses (ARS + USD*rate) from salary, never returns negative; result `netSavings` passed to `projectPatrimonyScenarios` |
| PROJ-05 | User ve patrimonio historico reconstruido mes a mes desde monthlyData en linea solida | 15-01, 15-02 | SATISFIED | `reconstructHistoricalPatrimony` produces per-month HistoricalPoint[]; hook maps these into `patrimonyData` with `historicalPatrimony` set and projections null (chart renders solid line) |

All 5 PROJ requirements: SATISFIED. No orphaned requirements found.

---

### Anti-Patterns Found

| File | Pattern | Severity | Impact |
|------|---------|----------|--------|
| None | — | — | — |

No TODO/FIXME/placeholder comments, no empty implementations, no `return null`/`return {}`, no console.log stubs, no useState in the hook.

---

### Human Verification Required

#### 1. Historical Patrimony Accuracy

**Test:** Load the app with existing monthlyData and navigate to the Projection chart (Phase 16). Compare the historical series line against values shown in the Resumen/Patrimonio cards.
**Expected:** Historical patrimony reconstruction should trend consistently with existing card values — exact match is not required (known ARS/USD rate simplification), but the shape should be plausible.
**Why human:** The cumulative running approach is a documented simplification of `calculateDualBalances`. Correctness of the approximation requires visual review with real data.

#### 2. Spanish Month Labels

**Test:** Observe the X-axis labels on the projection chart.
**Expected:** Month labels appear as "Abr 26", "May 26", etc. — correctly capitalized Spanish abbreviations.
**Why human:** Locale formatting correctness requires visual inspection; date-fns `es` locale behavior in production build.

#### 3. Chart Overlap Point Continuity

**Test:** Look at the point where the historical line and the three scenario lines meet.
**Expected:** The current month shows both a historical value and the three projection starting values, creating a smooth visual handoff with no gap.
**Why human:** The overlap behavior (current month present in both historical and projection data) requires visual chart inspection to confirm Recharts renders it correctly.

---

### Gaps Summary

No gaps found. All phase artifacts exist, are substantive, and are properly wired.

---

## Build Verification

`npm run build` passed with zero errors. All 6 files compile cleanly.

## Commit Verification

All four commits exist in git history:
- `0650425` — feat(15-01): create projection types and constants
- `665b584` — feat(15-01): create compound interest investment projection functions
- `2c9490c` — feat(15-01): create income projection, patrimony history, and scenario engine
- `0228cd8` — feat(15-02): create useProjectionEngine orchestrator hook

## INFRA-03 Invariant

Zero changes to any existing file during phase 15. All new files created in `lib/projection/` and `hooks/useProjectionEngine.ts` only.

---

_Verified: 2026-04-03T16:10:00Z_
_Verifier: Claude (gsd-verifier)_
