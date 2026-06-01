---
phase: 22-resumen-del-mes-rediseno-conceptual-de-cash-flow
verified: 2026-06-01T00:00:00Z
status: human_needed
score: 8/8 must-haves verified
overrides_applied: 0
human_verification:
  - test: "Render ResumenCard with a month where ARS resultadoDelMes < 0 for 2+ consecutive months"
    expected: "Red 'Déficit recurrente' banner appears at top of card with consecutive-months text and a dismiss X button. After clicking X the banner disappears for the session but returns on page reload."
    why_human: "Requires real localStorage data with negative resultadoDelMes in prior months; cannot be grepped from code."
  - test: "Render ResumenCard with sobranteAnteriorRaw < 0"
    expected: "Amber 'Déficit anterior: ARS X' banner appears with absolute value shown via FormattedAmount. No banner when sobrante >= 0."
    why_human: "Banner trigger is runtime conditional; need real previous-month data with negative result."
  - test: "Toggle the ARS/USD button in ResumenCard header"
    expected: "Ingreso fijo line disappears in USD mode. Aguinaldo line disappears. Numbers switch to usdMetrics block values. Toggling back to ARS restores all lines."
    why_human: "Visual and conditional rendering behavior requires manual UI inspection."
  - test: "Open app with investments in localStorage having no purpose field and no resumenConfig.wizardCompletedAt"
    expected: "InvestmentPurposeWizard modal opens automatically. 'Aceptar sugerencias' populates all rows with heuristic defaults. 'Confirmar' writes purpose to investments and stamps wizardCompletedAt so wizard does not reopen on next load."
    why_human: "Wizard auto-mount depends on runtime localStorage state; dismiss/confirm side effects need live session verification."
  - test: "Settings panel: adjust the Deficit threshold slider"
    expected: "Slider moves in steps of 10 between 10 and 100. Label updates live to show 'Umbral: X% del último sueldo'. Value persists in localStorage under 'resumenConfig' key after page reload."
    why_human: "Interactive Slider behavior and localStorage persistence require live session inspection."
  - test: "Factory reset via Settings panel 'Re-ejecutar wizard' path"
    expected: "resumenConfig key is removed from localStorage (verified via DevTools). After reload, wizard reappears for users with existing investments."
    why_human: "Requires DevTools localStorage inspection after clicking the reset button."
---

# Phase 22: Resumen del Mes — Rediseño conceptual de cash flow Verification Report

**Phase Goal:** Redesign the "Resumen del mes" card with a conceptually correct cash-flow view — Disponible (includes sobrante anterior), always-visible Resultado del mes, deficit banners, USD parallel toggle, and investment-purpose classification UX (inline select, migration wizard, settings slider).
**Verified:** 2026-06-01
**Status:** human_needed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|---------|
| 1 | Disponible suma sobrante anterior (signed) y el tooltip refleja la fórmula real | VERIFIED | `computeMonthMetrics` formula: `disponible = sobranteAnteriorRaw + ingresosMes - egresosMes` (month-metrics.ts:117). Tooltip in resumen-card.tsx:430-431 explicitly lists "Sobrante anterior + Ingreso fijo + Otros ingresos + Aguinaldo - Gastos - Aportes inv. (no neutros)". sobranteAnteriorRawArs passed signed (no clamping) from expense-tracker.tsx. |
| 2 | Línea "Resultado del mes" siempre visible en muted, con +/- explícito, sin color por signo | VERIFIED | resumen-card.tsx:444-450: rendered outside any conditional block, `text-sm text-muted-foreground`, `{active.resultadoDelMes >= 0 ? "+" : ""}` explicit sign, no color classes. |
| 3 | Inversiones tienen campo purpose con 4 etiquetas; aportes a tarjeta/objetivo son neutros para Resultado y Disponible | VERIFIED | `InvestmentPurpose = "ahorro" | "objetivo" | "tarjeta" | "especulacion"` at useMoneyTracker.ts:73. `isNonNeutroPurpose` in month-metrics.ts:53-55 returns true only for ahorro/especulacion. `aportesNoNeutros` used in egresosMes formula. |
| 4 | Wizard one-shot al primer load para clasificar inversiones existentes (con heurísticas y override individual) | VERIFIED | `needsPurposeWizard` useMemo in expense-tracker.tsx:477-482 gates on `!wizardCompletedAt && list.some(inv => inv.purpose === undefined)`. `<InvestmentPurposeWizard>` mounted at expense-tracker.tsx:1301. `suggestPurpose` heuristic used in wizard's `initialAssignments()`. |
| 5 | Banner "Déficit anterior" cuando sobrante_anterior < 0; banner "Déficit recurrente" cuando 2 meses negativos consecutivos O cumulative > N% sueldo | VERIFIED | `showDeficitAnterior = active.sobranteRaw < 0` (resumen-card.tsx:154). `showDeficitRecurrente = deficitState.recurrente && !deficitRecurrenteDismissed` (line 155). `evaluateDeficitState` implements `consecutive >= 2 || cumulative > threshold` (deficit-detector.ts:52). |
| 6 | Toggle USD/ARS en header de la card, default ARS; misma fórmula para ambos | VERIFIED | `resumenCurrency` useState defaults to "ARS" (expense-tracker.tsx:457). DollarSign button with `onCurrencyToggle` in resumen-card.tsx:168-176. `computeMonthMetrics` called for both currencies with identical formula. |
| 7 | Slider de umbral configurable (10-100%, paso 10, default 25%) persistido en localStorage key "resumenConfig" | VERIFIED | settings-panel.tsx:699-705: `value={[resumenConfig.deficitThresholdPercent]}`, `min={10}`, `max={100}`, `step={10}`. `DEFAULT_RESUMEN_CONFIG.deficitThresholdPercent = 25` (resumen-config.ts:17). Persisted via `useLocalStorage<ResumenConfig>(RESUMEN_CONFIG_KEY, ...)`. |
| 8 | Factory reset limpia "resumenConfig"; nuevas inversiones default purpose="ahorro" | VERIFIED | `localStorage.removeItem(RESUMEN_CONFIG_KEY)` in both settings-panel.tsx:726 and expense-tracker.tsx:632. `purpose: "ahorro"` explicit default in useInvestmentsTracker.ts:58. `"resumenConfig"` absent from STORAGE_KEYS (Pitfall 7 preserved). |

**Score:** 8/8 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `hooks/useMoneyTracker.ts` | InvestmentPurpose type, Investment.purpose field, getInvestmentPurpose helper | VERIFIED | Lines 73, 90, 94. Union = "ahorro" \| "objetivo" \| "tarjeta" \| "especulacion". Helper returns `inv.purpose ?? "ahorro"`. |
| `lib/resumen/resumen-config.ts` | RESUMEN_CONFIG_KEY, ResumenConfig, DEFAULT_RESUMEN_CONFIG | VERIFIED | All 3 exports present. Key = "resumenConfig". Default threshold = 25. No imports (pure TS). |
| `lib/resumen/month-metrics.ts` | computeMonthMetrics, MonthMetrics, sumAportes | VERIFIED | All 3 exports present. Formula correct. isInitial+pendingIngreso filters preserved. getInvestmentPurpose used. No React. |
| `lib/resumen/deficit-detector.ts` | evaluateDeficitState, DeficitState | VERIFIED | Both exports present. `consecutive >= 2 || cumulative > threshold` logic. CUMULATIVE_LOOKBACK_MONTHS = 6. No imports, no localStorage. |
| `components/investment-purpose-wizard/purpose-suggestion.ts` | suggestPurpose | VERIFIED | 5-rule priority chain. All 4 patterns present. "ahorro" as final fallback. |
| `components/investment-purpose-wizard/investment-purpose-wizard.tsx` | InvestmentPurposeWizard modal | VERIFIED | Named export. All 4 SelectItems. "Aceptar sugerencias" + "Confirmar". suggestPurpose imported from ./purpose-suggestion. No localStorage refs. |
| `components/resumen-card.tsx` | Redesigned with new props, banners, Resultado del mes, USD toggle | VERIFIED | sobranteRaw, resultadoDelMes, deficitState, currency, onCurrencyToggle, usdMetrics all present. aportesInversiones + sobrante old props fully removed. |
| `components/expense-tracker.tsx` | Wires computeMonthMetrics, evaluateDeficitState, resumenConfig, wizard, onUpdatePurpose | VERIFIED | All imports confirmed. arsMetrics + usdMetrics computed. resultadoHistoryArs/Usd built over 6 months. Wizard mounted. |
| `hooks/useInvestmentsTracker.ts` | handleUpdatePurpose + purpose="ahorro" default | VERIFIED | handleUpdatePurpose at line 240, exported at line 314. `purpose: "ahorro"` at line 58. |
| `components/investment-row.tsx` | Inline purpose Select, onUpdatePurpose prop | VERIFIED | onUpdatePurpose in props. Select with 4 options. `disabled={isFinalized}`. colSpan=9. |
| `components/investments-table.tsx` | Propósito column header, onUpdatePurpose forwarded | VERIFIED | "Propósito" TableHead in both table headers. All colSpan={8} → colSpan={9}. onUpdatePurpose forwarded to InvestmentRow. |
| `components/settings-panel.tsx` | Deficit threshold Slider + factory reset | VERIFIED | "Alerta de déficit" section with Slider min=10/max=100/step=10. removeItem(RESUMEN_CONFIG_KEY) in both reset paths. |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `lib/resumen/month-metrics.ts` | `hooks/useMoneyTracker.getInvestmentPurpose` | import + call in sumAportes | WIRED | Line 70: `getInvestmentPurpose(inv)` |
| `components/expense-tracker.tsx` | `lib/resumen/month-metrics.computeMonthMetrics` | import + 4+ calls | WIRED | Confirmed import at line 90, ARS call line 332, USD call line 348, history loops lines 381 + 409. |
| `components/expense-tracker.tsx` | `lib/resumen/deficit-detector.evaluateDeficitState` | import + call | WIRED | Import line 91, call line 468. |
| `components/expense-tracker.tsx` | `lib/resumen/resumen-config.RESUMEN_CONFIG_KEY` | useLocalStorage call at line 454 | WIRED | `useLocalStorage<ResumenConfig>(RESUMEN_CONFIG_KEY, DEFAULT_RESUMEN_CONFIG)` |
| `components/resumen-card.tsx` | props (no hooks, no localStorage reads) | all derived values come from props | WIRED | No useState for data, no useLocalStorage inside component. |
| `components/investment-row.tsx` | onUpdatePurpose callback | Select onValueChange | WIRED | Line 134: `onValueChange={(val) => onUpdatePurpose(investment.id, val as InvestmentPurpose)}` |
| `components/investment-purpose-wizard/investment-purpose-wizard.tsx` | `purpose-suggestion.suggestPurpose` | import from ./purpose-suggestion | WIRED | Line 26 import, used in initialAssignments and handleAcceptSuggestions. |
| `components/settings-panel.tsx` | `lib/resumen/resumen-config` | useLocalStorage + removeItem | WIRED | Import line 24, useLocalStorage at line 74-76, removeItem at line 726. |
| `components/expense-tracker.tsx` | `InvestmentPurposeWizard` | conditional render on needsPurposeWizard | WIRED | `<InvestmentPurposeWizard open={needsPurposeWizard}` at line 1301. |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|--------------------|--------|
| `components/resumen-card.tsx` | `active.disponible`, `active.resultadoDelMes` | `arsMetrics`/`usdMetrics` from `computeMonthMetrics` in expense-tracker.tsx | Yes — computed from real monthlyData.expenses, investments, extraIncomes | FLOWING |
| `components/resumen-card.tsx` | `deficitState.recurrente` | `evaluateDeficitState` in expense-tracker.tsx over 6-month resultadoHistory | Yes — history built from real monthlyData over prior 6 months | FLOWING |
| `components/settings-panel.tsx` | `resumenConfig.deficitThresholdPercent` | `useLocalStorage(RESUMEN_CONFIG_KEY, DEFAULT_RESUMEN_CONFIG)` | Yes — reads from localStorage, defaults to 25 | FLOWING |
| `components/investment-purpose-wizard/investment-purpose-wizard.tsx` | `assignments[inv.id]` | `inv.purpose ?? suggestPurpose(inv)` from props | Yes — initialised from real Investment objects | FLOWING |

### Behavioral Spot-Checks

Step 7b: SKIPPED — no runnable API endpoints to test without starting the dev server. All behavioral verification deferred to human verification section.

### Requirements Coverage

Phase 22 PLAN documents reference D1-D13 from the SPEC (not from REQUIREMENTS.md, which uses a separate ID scheme). The REQUIREMENTS.md traceability table has no Phase 22 entries — Phase 22 is a quick-spec phase driven by 260601-rdm-SPEC.md. No REQUIREMENTS.md orphaned items apply to this phase.

| Requirement (SPEC) | Plans | Status | Evidence |
|---|---|---|---|
| D1 — Disponible = Sobrante + Ingresos - Egresos | 22-02, 22-03 | SATISFIED | computeMonthMetrics formula + expense-tracker wiring |
| D2 — Resultado del mes (secondary metric, retiros excluded) | 22-02, 22-03 | SATISFIED | resultadoDelMes = ingresosMes - egresosMes; always-visible muted line |
| D3 — Investment purpose 4-label classification | 22-01, 22-04 | SATISFIED | InvestmentPurpose type, inline Select per row |
| D4 — Cash "liquido" = digital accounts only | 22-02 | SATISFIED | Conceptual boundary enforced by existing calculateAvailableForMonth; month-metrics does not change this. |
| D5 — Sobrante anterior < 0 → amber banner | 22-03 | SATISFIED | showDeficitAnterior = active.sobranteRaw < 0 |
| D6 — Deficit recurrente banner (2 consecutive OR cumulative > threshold) | 22-02, 22-03 | SATISFIED | evaluateDeficitState + showDeficitRecurrente logic |
| D7 — USD parallel toggle in header | 22-03 | SATISFIED | resumenCurrency state + DollarSign button |
| D8 — Future month sobrante = projected prior month disponible | 22-03 | SATISFIED | calculateAvailableForMonth(prevMonthKey) is already dynamic; sobranteAnteriorRawArs uses it directly (no clamping) |
| D9 — First month sobrante = 0 | 22-03 | SATISFIED | calculateAvailableForMonth returns 0 when no prior data; sobranteAnteriorRawArs inherits this |
| D10 — Wizard dismiss stamps wizardCompletedAt (no red de seguridad) | 22-04 | SATISFIED | onDismiss in expense-tracker.tsx:1313-1315 stamps wizardCompletedAt without modifying investments |
| D11 — Aguinaldo counted in ingresosMes | 22-02, 22-03 | SATISFIED | `aguinaldo = currency === ARS ? aguinaldoAmount : 0` in computeMonthMetrics; passed as aguinaldoAmount prop |
| D12 — Resultado del mes always visible | 22-03 | SATISFIED | Rendered outside any conditional block |
| D13 — Deficit slider threshold applies read-time only | 22-02, 22-04 | SATISFIED | evaluateDeficitState is pure; slider writes resumenConfig.deficitThresholdPercent; no historical re-evaluation |

### Anti-Patterns Found

| File | Pattern | Severity | Impact |
|------|---------|----------|--------|
| `components/expense-tracker.tsx` | `sobranteAnteriorRaw: 0` in history loop (lines 381+409) | INFO | Intentional — history computation doesn't need sobrante for resultadoDelMes calculation (it's sobrante-independent). Not a stub. |

No blockers or warnings found. The `sobranteAnteriorRaw: 0` in the history loop is intentional per Plan 02 comment: "for history evaluation we only care about resultadoDelMes which is sobrante-independent".

### Human Verification Required

#### 1. Deficit banners conditional render (D5 + D6)

**Test:** Navigate to a month where the previous month had negative disponible. Also set up 2+ consecutive months with negative resultadoDelMes.
**Expected:** Amber "Déficit anterior" banner shows absolute value. Red "Déficit recurrente" banner shows consecutive-months count. X button dismisses recurrente banner for the session. Navigating to a different month and back restores the banner.
**Why human:** Runtime conditional requiring real negative-sobrante data in localStorage.

#### 2. USD/ARS toggle visual correctness (D7)

**Test:** Click the currency toggle button in the ResumenCard header.
**Expected:** Ingreso fijo line disappears. Aguinaldo line disappears. Disponible and Resultado del mes switch to USD values. All FormattedAmount components show correct USD figures. Toggling back restores ARS view.
**Why human:** Visual and conditional rendering; cannot be confirmed by static code inspection alone.

#### 3. Migration wizard auto-mount and completion flow (D3 + D10)

**Test:** Open app with existing investments lacking purpose field and no resumenConfig in localStorage. Confirm wizard opens automatically. Click "Aceptar sugerencias". Verify each row shows heuristic defaults. Click "Confirmar". Reload — wizard should not reopen.
**Expected:** Wizard fires once, persists wizardCompletedAt after confirm or dismiss, does not reopen.
**Why human:** Requires controlled localStorage state and live session interaction.

#### 4. Settings slider persistence (D13)

**Test:** Open Settings panel, move the "Alerta de déficit" slider to 50%. Close and reload. Reopen Settings — slider should show 50%.
**Expected:** Value persists in localStorage under "resumenConfig" key, default is 25%.
**Why human:** Requires DevTools localStorage inspection and live UI interaction.

#### 5. Factory reset clears resumenConfig (D13 behavior + D10 re-trigger)

**Test:** Change slider to 50% and complete the wizard. Open Settings, click "Re-ejecutar wizard". Check localStorage in DevTools.
**Expected:** "resumenConfig" key absent after reset. On next load wizard fires again.
**Why human:** Requires DevTools localStorage inspection.

#### 6. Inline purpose Select per investment row (D3)

**Test:** Open the investments table. Each active investment row should show a "Propósito" Select cell. Changing the Select should immediately update the investment's purpose. Finalized investments should have a disabled Select.
**Expected:** 4 options: Ahorro, Objetivo, Tarjeta, Especulación. Changes persist. Disabled state for finalized.
**Why human:** Requires live UI interaction to confirm the Select renders, changes dispatch correctly, and the change reflects in subsequent metric computations.

### Gaps Summary

No blocking gaps. All 8 roadmap success criteria are satisfied by the codebase. All 13 SPEC decisions (D1-D13) are covered by implemented artifacts.

The 22-02-SUMMARY.md is absent from the phase directory (Plan 02 ran without producing a summary, then its artifacts were committed as part of Plan 04's commit 4dbe5ca). This is a documentation gap only — the actual code artifacts (lib/resumen/month-metrics.ts, lib/resumen/deficit-detector.ts, components/investment-purpose-wizard/purpose-suggestion.ts) are present and verified in the codebase.

6 items require human verification (visual rendering, runtime conditional banners, localStorage inspection after reset) before the phase can be declared fully passed. None of these are coding deficiencies — they are behaviors that cannot be confirmed by static code analysis alone.

---

_Verified: 2026-06-01_
_Verifier: Claude (gsd-verifier)_
