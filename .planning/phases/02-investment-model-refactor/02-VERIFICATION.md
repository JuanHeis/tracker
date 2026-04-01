---
phase: 02-investment-model-refactor
verified: 2026-04-01T18:00:00Z
status: human_needed
score: 10/10 must-haves verified
re_verification: false
human_verification:
  - test: "Create a Plazo Fijo and verify auto-calculated value grows over time"
    expected: "PF row shows value > initial amount based on TNA and elapsed days; Valor Actual cell is read-only"
    why_human: "Auto-calculation depends on real elapsed days from startDate vs today — cannot simulate time passage in static analysis"
  - test: "Create a Crypto investment and verify currency is locked to USD"
    expected: "Currency select shows USD and is disabled; amounts display with US$ prefix"
    why_human: "Currency enforcement UI behavior requires rendering the dialog and observing disabled state"
  - test: "Expand an investment row, add a movement, verify Capital Invested column updates"
    expected: "Clicking row reveals movement history and inline add form; after aporte, Capital Invested increases"
    why_human: "Expand/collapse and real-time column update requires browser interaction"
  - test: "Click Valor Actual cell on a non-PF investment, change value, press Enter, verify gain/loss updates"
    expected: "Cell becomes an input on click; on save gain/loss row updates to reflect new value vs capital"
    why_human: "Click-to-edit interaction and gain/loss recalculation requires live rendering"
  - test: "Finalize an investment via the Finalizar button — confirm dialog, then confirm finalization"
    expected: "Dialog shows investment name and current value; on confirm row becomes dimmed with Finalizada badge; auto-retiro appears in movements"
    why_human: "Multi-step dialog interaction requires human testing"
  - test: "Switch to a different month — verify investments still appear in the table"
    expected: "All investments remain visible regardless of selected month (not filtered by month)"
    why_human: "Month-switching behavior and persistence of investment display requires browser interaction"
  - test: "Verify 'Desactualizado' badge does NOT appear on a freshly created investment"
    expected: "No amber badge on an investment updated today; badge would only appear after 7+ days without update"
    why_human: "Badge timing depends on real dates and lastUpdated field; edge case verification needs visual confirmation"
  - test: "Verify Vencido badge appears on a Plazo Fijo past its maturity date"
    expected: "Orange Vencido badge next to the investment name when today > startDate + plazoDias"
    why_human: "Requires creating a PF with a past startDate or manually manipulating date — visual confirmation needed"
---

# Phase 2: Investment Model Refactor — Verification Report

**Phase Goal:** Investments behave as accounts with movements, real-time value, and performance metrics — not as one-off transactions
**Verified:** 2026-04-01T18:00:00Z
**Status:** human_needed
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| #  | Truth | Status | Evidence |
|----|-------|--------|----------|
| T1 | Investment interface has movements[], currentValue, lastUpdated, status, and PF-specific optional fields (tna, plazoDias, startDate) | VERIFIED | `hooks/useMoneyTracker.ts` lines 42-63: full interface with all required fields |
| T2 | Existing localStorage data migrates without data loss — old flat investments get a single aporte movement from their amount | VERIFIED | `migrateData()` lines 99-119: `movements: investment.movements \|\| [{ type: "aporte", amount: investment.amount \|\| 0 }]` |
| T3 | Currency enforcement map exists: Crypto=USD, Plazo Fijo=ARS, FCI=null, Acciones=null | VERIFIED | `constants/investments.ts` lines 9-14: `CURRENCY_ENFORCEMENT` map fully defined |
| T4 | All active investments display regardless of creation month (not filtered by selected month) | VERIFIED | `useInvestmentsTracker.ts` line 130: `filteredInvestments` returns all investments sorted, no month predicate |
| T5 | useInvestmentsTracker exposes CRUD operations: addMovement, deleteMovement, updateValue, finalizeInvestment, updatePFFields | VERIFIED | `useInvestmentsTracker.ts` lines 174-192: all five operations in return object |
| T6 | Investment creation dialog shows name, type, currency, and initial amount fields; PF shows TNA + Plazo; currency enforced per type | VERIFIED | `components/investment-dialog.tsx` lines 81-202: conditional `isPlazoFijo` block, `isCurrencyEnforced` disables currency Select |
| T7 | Investment table displays 8 columns: expand icon, Name, Type, Capital Invested, Valor Actual, Ganancia/%, Ult. Actualizacion, Acciones | VERIFIED | `components/investments-table.tsx` lines 70-78 and 96-104: 8 TableHead columns |
| T8 | Clicking a row expands it to show movement history + inline add form; only one row expanded at a time | VERIFIED | `investments-table.tsx` line 48: `expandedId` state; line 119: toggle logic; `investment-row.tsx` lines 154-167: expanded TableRow with InvestmentMovements |
| T9 | Finalization confirmation dialog shows investment name + current value; on confirm creates auto-retiro and marks Finalizada | VERIFIED | `investments-table.tsx` lines 134-163: Dialog with name/value in description; `useInvestmentsTracker.ts` lines 100-114: creates retiro movement, sets status "Finalizada", currentValue=0 |
| T10 | Gain/loss amount and percentage display; Desactualizado badge for >7 days (not PF or Finalizada); PF auto-calculates value | VERIFIED | `investment-value-cell.tsx` lines 43-61: `calculateGainLoss` and `isValueOutdated` functions; lines 18-31: `calculatePFValue` using TNA formula |

**Score:** 10/10 truths verified

---

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `hooks/useMoneyTracker.ts` | New Investment/InvestmentMovement interfaces, updated migrateData | VERIFIED | Lines 42-63: interfaces; lines 88-121: migrateData with movement conversion; lines 195-210: movement-based liquidity |
| `hooks/useInvestmentsTracker.ts` | Refactored hook with movement operations, value update, finalization | VERIFIED | 193 lines, all 5 new operations implemented and returned |
| `constants/investments.ts` | CURRENCY_ENFORCEMENT map and CurrencyType enum | VERIFIED | CurrencyType enum lines 4-7; CURRENCY_ENFORCEMENT lines 9-14; currencySymbol helper line 16-18 |
| `components/investment-dialog.tsx` | Updated dialog with conditional PF fields and currency enforcement | VERIFIED | 211 lines; CURRENCY_ENFORCEMENT imported and used; isPlazoFijo conditional fields |
| `components/investment-value-cell.tsx` | Click-to-edit cell with NumberFlow, gain/loss, outdated badge | VERIFIED | 168 lines; NumberFlow used; calculatePFValue, calculateGainLoss, isValueOutdated exported |
| `components/investment-movements.tsx` | Movement list + inline add form | VERIFIED | 190 lines; shows last 5 movements with "Ver todo" expand; add form hides when Finalizada |
| `components/investment-row.tsx` | Expandable row with badges and action buttons | VERIFIED | 288 lines; Finalizada/Vencido badges; PFFieldsEditor for TNA/Plazo/startDate inline editing |
| `components/investments-table.tsx` | Rewritten table with expandable rows and finalization dialog | VERIFIED | 168 lines; expandedId state; finalizingInvestment dialog; InvestmentRow composition |
| `components/expense-tracker.tsx` | Full wiring of all investment operations through to table | VERIFIED | Lines 121-126: destructures all 5 new ops; lines 364-372: all ops passed to InvestmentsTable |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `hooks/useInvestmentsTracker.ts` | `hooks/useMoneyTracker.ts` | imports Investment, InvestmentMovement, MonthlyData | WIRED | Line 4: `import { type Investment, type InvestmentMovement, type MonthlyData }` |
| `hooks/useMoneyTracker.ts` | `hooks/useInvestmentsTracker.ts` | forwards all investment operations | WIRED | Lines 286-302: all 5 new ops forwarded from investmentsTracker |
| `hooks/useMoneyTracker.ts` | localStorage (migrateData) | converts flat investments to movements | WIRED | migrateData lines 99-119: `movements: investment.movements \|\| [{ type: "aporte", amount: ... }]` |
| `components/investment-dialog.tsx` | `constants/investments.ts` | CURRENCY_ENFORCEMENT for type-to-currency mapping | WIRED | Line 15: `CURRENCY_ENFORCEMENT` imported and used in useEffect line 74 |
| `components/expense-tracker.tsx` | `hooks/useMoneyTracker.ts` | destructures new investment operations | WIRED | Lines 121-126: `handleAddMovement`, `handleDeleteMovement`, `handleUpdateValue`, `handleFinalizeInvestment`, `handleUpdatePFFields` |
| `components/investments-table.tsx` | `components/investment-row.tsx` | renders InvestmentRow for each investment | WIRED | Line 24: import; line 115: `<InvestmentRow>` in map |
| `components/investments-table.tsx` | Finalization dialog (Radix) | Dialog with Finalizar confirmation | WIRED | Lines 134-163: Dialog with `finalizingInvestment` state |
| `components/investment-row.tsx` | `components/investment-movements.tsx` | renders InvestmentMovements when expanded | WIRED | Line 11: import; line 159: `<InvestmentMovements>` in expanded TableRow |
| `components/investment-row.tsx` | `components/investment-value-cell.tsx` | renders InvestmentValueCell in value column | WIRED | Line 10: import; line 97: `<InvestmentValueCell>` |
| `components/investment-value-cell.tsx` | `@number-flow/react` | NumberFlow for animated number display | WIRED | Line 4: `import NumberFlow from "@number-flow/react"` — package confirmed in package.json `"@number-flow/react": "^0.6.0"` |

---

### Requirements Coverage

| Requirement | Source Plan(s) | Description | Status | Evidence |
|-------------|---------------|-------------|--------|----------|
| INV-01 | 02-01, 02-02 | User puede crear inversion como cuenta con nombre, tipo, moneda base y status | SATISFIED | `handleAddInvestment` creates account entity; dialog collects name/type/currency/initialAmount |
| INV-02 | 02-03, 02-04 | User puede registrar aportes que restan del liquido del mes | SATISFIED | `handleAddMovement` adds aporte movement; `calculateTotalAvailable` filters movements by month — aporte adds to `monthlyInvestmentImpact` |
| INV-03 | 02-03, 02-04 | User puede registrar retiros que vuelven al liquido del mes | SATISFIED | `handleAddMovement` adds retiro movement; `calculateTotalAvailable` subtracts retiro from `monthlyInvestmentImpact` (line 199: `mov.type === "aporte" ? sum + mov.amount : sum - mov.amount`) |
| INV-04 | 02-03, 02-04 | User puede actualizar el valor actual inline (sin modal) | SATISFIED | `InvestmentValueCell` click-to-edit input; calls `onUpdateValue`; PF is read-only auto-calculated |
| INV-05 | 02-04, 02-05 | User puede finalizar inversion (retiro total automatico + status Finalizada + currentValue 0) | SATISFIED | `handleFinalizeInvestment` creates retiro with currentValue amount, sets status="Finalizada", currentValue=0; confirmation dialog in InvestmentsTable |
| INV-06 | 02-03, 02-05 | User ve ganancia/perdida y rendimiento % | SATISFIED | `calculateGainLoss` in investment-value-cell.tsx exported; used in investment-row.tsx Ganancia/% column |
| INV-07 | 02-03, 02-05 | User ve aviso "valor desactualizado" si lastUpdated > 7 dias | SATISFIED | `isValueOutdated` function returns false for PF/Finalizada; Badge shown when `differenceInDays > 7` |
| INV-08 | 02-02, 02-03, 02-05 | Plazo Fijo auto-calcula valor segun tasa y dias (solo ARS) | SATISFIED | `calculatePFValue`: `totalInvested * (1 + (tna/100)/365 * daysToUse)`; PF cell is read-only; TNA/plazo/startDate editable in expanded PF row |
| INV-09 | 02-01, 02-02 | Crypto=USD, FCI=ARS/USD eleccion, Acciones segun mercado | SATISFIED | `CURRENCY_ENFORCEMENT` map; dialog enforces via `isCurrencyEnforced` disabling Select; CurrencyType stored on Investment |
| INV-10 | 02-04, 02-05 | Tabla muestra: nombre, tipo, capital invertido, valor actual, ganancia, %, ultima actualizacion, acciones | SATISFIED | investments-table.tsx 8-column header matches exactly; investment-row.tsx renders all columns |

**All 10 INV requirements: SATISFIED**

No orphaned requirements — INV-01 through INV-10 are all mapped to Phase 2 and all accounted for across the five plans.

---

### Anti-Patterns Found

| File | Pattern | Severity | Impact |
|------|---------|----------|--------|
| None | — | — | — |

Scan result: No TODO/FIXME/HACK/PLACEHOLDER comments found in phase-modified files. No `return null` stubs. No `as any` casts remain. All `placeholder` occurrences are HTML input `placeholder` attributes — expected form UI.

---

### TypeScript Compilation

`npx tsc --noEmit` exits with no output (no errors). All type contracts across the new interfaces resolve correctly.

---

### Commit Verification

All commits documented in summaries are confirmed present in git log:
- `4bc9d22` — feat(02-01): redesign Investment types with movements, currency enforcement, and migration
- `8836e86` — feat(02-01): refactor useInvestmentsTracker for account-based model
- `b1f226f` — feat(02-02): update investment dialog with PF fields and currency enforcement
- `0c68755` — feat(02-02): wire expense-tracker to new investment hook API
- `8f0ffcc` — feat(02-03): add InvestmentValueCell with NumberFlow and click-to-edit
- `8d57644` — feat(02-03): add InvestmentMovements and InvestmentRow components
- `07dc0d4` — feat(02-04): rewrite InvestmentsTable with expandable rows and finalization dialog
- `8238138` — feat(02-04): wire all investment operations from expense-tracker to InvestmentsTable
- `89734bb` — fix(02-05): integration fixes for currency display and liquidity calculation
- `98e0dc6` — fix(02-05): fix PF projection, aporte value tracking, and edit discoverability
- `1fc0b69` — docs(02-05): complete end-to-end verification plan

---

### Human Verification Required

The automated layer is fully verified — all artifacts exist, are substantive, and are wired. The remaining items require a running browser session because they involve:

1. **PF Auto-Calculation Over Time**
   - Test: Create a Plazo Fijo (TNA 75%, 30 days). Verify Valor Actual > initial amount, Valor Actual cell is non-clickable (read-only), "Al vencimiento" projection appears below.
   - Expected: Value shows auto-calculated figure; PF row shows "Auto" in Ult. Actualizacion column
   - Why human: Elapsed days calculation depends on real system clock vs stored startDate

2. **Currency Lock in Dialog**
   - Test: Open "Nueva Inversion" dialog. Select "Crypto" — verify currency select shows USD and is disabled. Select "FCI" — verify currency select is enabled.
   - Expected: CURRENCY_ENFORCEMENT enforces correctly in the rendered form
   - Why human: Disabled state of a Select component requires rendering to verify

3. **Row Expand + Movement Add**
   - Test: Click any investment row — verify expansion shows movement history. Add an aporte — verify Capital Invested column updates immediately.
   - Expected: Chevron toggles, InvestmentMovements renders, Capital reflects new movement
   - Why human: React state toggle and live column recalculation require browser

4. **Inline Value Edit**
   - Test: Click Valor Actual cell on a non-PF investment. Type a new value and press Enter. Verify gain/loss row updates.
   - Expected: Input appears on click, saves on Enter, gain/loss recalculates
   - Why human: Click-to-edit state transition and calculated display update need browser

5. **Finalization Flow**
   - Test: Click "Finalizar" on an active investment. Verify dialog shows name and current value. Click "Confirmar Finalizacion". Verify row becomes dimmed with Finalizada badge.
   - Expected: Multi-step dialog works; status transition reflected in row styling; auto-retiro visible in movements
   - Why human: Multi-step modal interaction and CSS opacity change require visual confirmation

6. **Month Switching Persistence**
   - Test: Switch to a previous month. Verify investment table still shows all investments.
   - Expected: Investments are persistent accounts not filtered by selected month
   - Why human: Month selection interaction requires browser to confirm filteredInvestments is truly not month-gated

7. **Desactualizado Badge Timing**
   - Test: Create a new investment. Verify no Desactualizado badge. Check that a PF also never shows the badge.
   - Expected: Badge absent for fresh investments and all PF/Finalizada investments
   - Why human: Badge depends on live date comparison; edge case verification needs visual

8. **Vencido Badge on Expired PF**
   - Test: Create a PF with a startDate in the past and plazoDias=1 so it is already expired. Verify orange "Vencido" badge appears next to the name.
   - Expected: `isPFExpired` returns true; badge rendered when `isAfter(today, startDate + plazoDias)` and not Finalizada
   - Why human: Requires controlled date setup or past startDate input to trigger the badge

---

### Summary

Phase 2 automated verification passes all checks:

- All 10 observable truths hold against the actual codebase
- All 9 required artifacts exist with substantive implementations (no stubs)
- All 10 key links are wired (imports confirmed, usage confirmed, patterns matched)
- All 10 INV requirements are satisfied with concrete code evidence
- Zero anti-patterns found across all phase-modified files
- TypeScript compiles without errors
- All 11 commits documented in summaries are confirmed in git history

The phase goal — "investments behave as accounts with movements, real-time value, and performance metrics" — is achieved in code. Eight items are flagged for human browser verification covering time-dependent logic (PF auto-calc, Desactualizado badge, Vencido badge) and interactive UI behavior (dialog currency lock, row expand, inline edit, finalization flow, month switching). These were already user-approved during plan 02-05's human checkpoint; this report documents them formally for the record.

---

_Verified: 2026-04-01T18:00:00Z_
_Verifier: Claude (gsd-verifier)_
