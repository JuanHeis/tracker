---
phase: 03-dual-currency-engine
verified: 2026-04-02T12:00:00Z
status: passed
score: 13/13 must-haves verified
re_verification: false
---

# Phase 3: Dual Currency Engine — Verification Report

**Phase Goal:** User has real separated ARS and USD balances with accurate exchange tracking — not just visual conversion
**Verified:** 2026-04-02
**Status:** PASSED
**Re-verification:** No — initial verification

---

## Goal Achievement

The phase goal requires *real* currency separation, not display tricks. Verification confirms all three
layers of the goal are genuinely implemented: data model stores native amounts, balance calculation
accumulates ARS and USD independently, and the UI surfaces both balances plus exchange gain/loss.

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | USD expenses store original USD amount (not multiplied by usdRate) | VERIFIED | `handleAddExpense` and `handleUpdateExpense` in `useExpensesTracker.ts` contain no `amount * usdRate` multiplication. Grep confirms zero matches. |
| 2 | USD extra incomes store original USD amount (not multiplied by usdRate) | VERIFIED | `handleAddExtraIncome` and `handleUpdateIncome` in `useIncomes.ts` contain no `amount * usdRate` multiplication. Grep confirms zero matches. |
| 3 | Existing USD data is migrated back to original USD amounts via division | VERIFIED | `migrateData()` in `useMoneyTracker.ts` lines 101–126 reverse `amount / usdRate` for expenses and incomes where `currencyType === USD && usdRate > 0`, guarded by `_migrationVersion >= 3` check. |
| 4 | globalUsdRate persists in localStorage and can be read/set | VERIFIED | `useCurrencyEngine.ts` reads from `localStorage.getItem("globalUsdRate")` on mount and writes via `localStorage.setItem` on `setGlobalUsdRate`. Rate change rejected if `<= 0`. |
| 5 | UsdPurchase type and usdPurchases array exist in MonthlyData | VERIFIED | `UsdPurchase` interface exported at line 75 of `useMoneyTracker.ts`. `MonthlyData.usdPurchases: UsdPurchase[]` at line 95. `initialData.usdPurchases: []` at line 169. |
| 6 | User sees separate ARS and USD liquid balance numbers in the sidebar | VERIFIED | `TotalAmounts` component renders "Liquido ARS" and "Liquido USD" rows (lines 43–51). Receives `arsBalance` and `usdBalance` from `calculateDualBalances()`. |
| 7 | Total patrimonio correctly sums ARS liquid + USD liquid * globalRate + investments | VERIFIED | `total-amounts.tsx` line 31–37: `arsBalance + usdBalance * globalUsdRate + arsInvestments + usdInvestments * globalUsdRate`. Warning shown when globalUsdRate is 0. |
| 8 | Global USD rate is editable from the settings area in the sidebar | VERIFIED | `SalaryCard` has inline pencil-icon editor for "Cotizacion USD" (lines 136–188). Calls `onSetGlobalUsdRate` on submit; validates `> 0`. |
| 9 | User can buy USD from ARS balance via a dialog | VERIFIED | `UsdPurchaseDialog` buy mode collects arsAmount, usdAmount, date; validates both `> 0`; calls `onBuyUsd`. Auto-calculates USD from ARS using `globalUsdRate`. |
| 10 | User can register untracked USD cash with mandatory origin description | VERIFIED | `UsdPurchaseDialog` register mode collects usdAmount, description, date; validates amount `> 0` and description non-empty; calls `onRegisterUntracked`. Informational text confirms "No restan de tu saldo en pesos." |
| 11 | User sees exchange gain/loss for tracked USD purchases comparing purchase rate to global rate | VERIFIED | `ExchangeSummary` displays per-purchase gainLoss with green/red coloring and total gainLoss. Formula in `useCurrencyEngine.ts` line 68: `(globalUsdRate - purchase.purchaseRate) * purchase.usdAmount`. Only "tracked" purchases included. |
| 12 | User can edit the usdRate on any existing expense or income retroactively | VERIFIED | `handleUpdateUsdRate` in `useExpensesTracker.ts` lines 147–155. `handleUpdateIncomeUsdRate` in `useIncomes.ts` lines 131–139. Both reject `<= 0`. `InlineRateEditor` component wired in both tables with pencil icon. |
| 13 | All currency-related forms reject zero or negative amounts and exchange rates | VERIFIED | `UsdPurchaseDialog` validates amounts `> 0` with red border. `useCurrencyEngine.setGlobalUsdRate` rejects `<= 0`. `validateField` in `expense-tracker.tsx` covers "amount" and "usdRate" with red borders and disabled submit. `handleUpdateUsdRate` / `handleUpdateIncomeUsdRate` reject `<= 0`. |

**Score:** 13/13 truths verified

---

## Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `hooks/useCurrencyEngine.ts` | Currency engine hook with globalUsdRate, USD purchase handlers, exchange gain/loss | VERIFIED | 84 lines, exports `useCurrencyEngine`. All 6 functions present and substantive: `setGlobalUsdRate`, `handleBuyUsd`, `handleRegisterUntrackedUsd`, `handleDeleteUsdPurchase`, `calculateExchangeGainLoss`. |
| `hooks/useMoneyTracker.ts` | Updated MonthlyData with usdPurchases, migration v3, calculateDualBalances | VERIFIED | 383 lines. `UsdPurchase` interface exported. `usdPurchases` in MonthlyData. `_migrationVersion` guard. `calculateDualBalances` returns 4 values. All currencyEngine functions re-exported. |
| `hooks/useExpensesTracker.ts` | No USD conversion at input; handleUpdateUsdRate | VERIFIED | No `amount * usdRate` present. `handleUpdateUsdRate` at line 147 with `<= 0` guard. Returned in hook return object. |
| `hooks/useIncomes.ts` | No USD conversion at input; handleUpdateIncomeUsdRate | VERIFIED | No `amount * usdRate` present. `handleUpdateIncomeUsdRate` at line 131 with `<= 0` guard. Returned in hook return object. |
| `components/total-amounts.tsx` | Dual balance display (ARS liquid, USD liquid, patrimonio) | VERIFIED | 76 lines. Props: `arsBalance`, `usdBalance`, `arsInvestments`, `usdInvestments`, `globalUsdRate`. Renders all 4 balance rows plus patrimonio total or warning. |
| `components/salary-card.tsx` | Global USD rate display and quick-edit | VERIFIED | Inline pencil-icon editor for "Cotizacion USD". Validates `> 0` before calling `onSetGlobalUsdRate`. |
| `components/usd-purchase-dialog.tsx` | Dialog for buying USD (tracked) and registering untracked USD | VERIFIED | 250 lines. Two modes (buy/register) via toggle buttons. Auto-calculation using globalUsdRate. Red border validation on invalid fields. Exports `UsdPurchaseDialog`. |
| `components/exchange-summary.tsx` | Exchange gain/loss display card for USD holdings | VERIFIED | 134 lines. Shows total USD, total gain/loss, per-purchase gain/loss with color coding, origin badges, delete buttons. Exports `ExchangeSummary`. |
| `components/expenses-table.tsx` | Native currency display; inline usdRate edit per row | VERIFIED | Uses `currencySymbol(expense.currencyType)` for display. `InlineRateEditor` component with pencil icon for rows with `usdRate > 0`. Prop `onUpdateUsdRate` wired through. |
| `components/income-table.tsx` | Native currency display; inline usdRate edit per row | VERIFIED | Uses `currencySymbol(income.currencyType)` for display. `InlineRateEditor` component with pencil icon. Prop `onUpdateUsdRate` wired through. |

---

## Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `hooks/useMoneyTracker.ts` | `hooks/useCurrencyEngine.ts` | `import useCurrencyEngine` + `const currencyEngine = useCurrencyEngine(monthlyData, setMonthlyData)` at line 295 | WIRED | All 6 engine functions spread into return object (lines 374–381). |
| `hooks/useMoneyTracker.ts` | `localStorage` | `migrateData` reverses USD amounts; `useCurrencyEngine` reads/writes `globalUsdRate` key | WIRED | `_migrationVersion: 3` written on migration. `localStorage.getItem/setItem("globalUsdRate")` in `useCurrencyEngine.ts`. |
| `hooks/useMoneyTracker.ts` | `components/total-amounts.tsx` | `arsBalance` and `usdBalance` props | WIRED | `expense-tracker.tsx` lines 430–435 call `calculateDualBalances()` and spread all 4 values as props. |
| `components/expense-tracker.tsx` | `components/usd-purchase-dialog.tsx` | Renders `<UsdPurchaseDialog>` with `handleBuyUsd`, `handleRegisterUntrackedUsd`, `globalUsdRate` | WIRED | Lines 721–728. State `usdPurchaseOpen` drives open/close. |
| `components/expense-tracker.tsx` | `components/exchange-summary.tsx` | Renders `<ExchangeSummary>` with `usdPurchases`, `calculateExchangeGainLoss()`, `globalUsdRate`, `onDelete` | WIRED | Lines 438–443. Passes `monthlyData.usdPurchases || []` and live `calculateExchangeGainLoss()` call. |
| `components/expenses-table.tsx` | `hooks/useExpensesTracker.ts` | `onUpdateUsdRate` prop calls `handleUpdateUsdRate` | WIRED | `expense-tracker.tsx` line 355 passes `handleUpdateUsdRate` to `onUpdateUsdRate`. Table invokes it on save. |
| `components/income-table.tsx` | `hooks/useIncomes.ts` | `onUpdateUsdRate` prop calls `handleUpdateIncomeUsdRate` | WIRED | `expense-tracker.tsx` line 370 passes `handleUpdateIncomeUsdRate` to `onUpdateUsdRate`. Table invokes it on save. |

---

## Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| MON-01 | 03-01, 03-02 | User has real separated ARS and USD balances | SATISFIED | `calculateDualBalances()` returns independent `arsBalance` and `usdBalance`. Sidebar renders both. No ARS/USD conflation in storage. |
| MON-02 | 03-01 | Each transaction stores the USD rate at registration time | SATISFIED | `usdRate` field retained on `Expense` and `ExtraIncome`. Handlers still assign it. Historical rate persists per transaction. |
| MON-03 | 03-01, 03-02 | User can configure current global rate to calculate total patrimonio in ARS | SATISFIED | `globalUsdRate` persisted in localStorage via `useCurrencyEngine`. SalaryCard inline editor. Patrimonio formula uses it. |
| MON-04 | 03-03 | User can buy USD from ARS balance (subtract ARS, add USD, patrimonio unchanged) | SATISFIED | `handleBuyUsd` records `UsdPurchase` with `origin: "tracked"`. `calculateDualBalances` deducts `arsAmount` and adds `usdAmount`. Net patrimonio unchanged. |
| MON-05 | 03-03 | User can register untracked USD cash with explicit origin | SATISFIED | `handleRegisterUntrackedUsd` records `UsdPurchase` with `origin: "untracked"`, `arsAmount: 0`. Dialog requires non-empty description. Adds to USD balance only. |
| MON-06 | 03-03 | User sees automatic exchange gain/loss (purchase rate vs current global rate) | SATISFIED | `calculateExchangeGainLoss()` computes `(globalUsdRate - purchaseRate) * usdAmount` for each tracked purchase. `ExchangeSummary` renders per-purchase and total with green/red coloring. |
| MON-07 | 03-04 | User can retroactively edit USD rate if entered incorrectly | SATISFIED | `handleUpdateUsdRate` and `handleUpdateIncomeUsdRate` in respective hooks. `InlineRateEditor` in both tables with pencil icon and Enter/Escape keyboard support. |
| MON-08 | 03-01, 03-04 | Validation: USD rate always > 0, amount always > 0 | SATISFIED | `setGlobalUsdRate` rejects `<= 0`. `handleBuyUsd` rejects amounts `<= 0`. `handleRegisterUntrackedUsd` rejects `<= 0`. `handleUpdateUsdRate` / `handleUpdateIncomeUsdRate` reject `<= 0`. `UsdPurchaseDialog` shows red borders. `validateField` in expense-tracker covers amount and usdRate with disabled submit. |

All 8 requirements (MON-01 through MON-08) are SATISFIED. No orphaned requirements found — REQUIREMENTS.md traceability table maps all 8 to Phase 3 and marks them Complete.

---

## Anti-Patterns Found

No blockers or warnings found.

| File | Pattern | Severity | Finding |
|------|---------|----------|---------|
| All phase files | TODO / FIXME / PLACEHOLDER | Info | Only HTML input `placeholder` attributes found — no code stubs. |
| `useExpensesTracker.ts`, `useIncomes.ts` | `amount * usdRate` | Check | Confirmed absent. Zero matches on grep. |
| `components/` | `amount / usdRate` display division | Check | Confirmed absent. No division-for-display in any component. |
| `useMoneyTracker.ts` | `calculateTotalAvailable` (old function) | Check | Confirmed fully removed. Zero matches on grep. |

---

## TypeScript Compilation

`npx tsc --noEmit` — Passes with zero errors across all phase files.

---

## Commits Verified

All 8 documented commit hashes exist in git history:

| Commit | Plan | Description |
|--------|------|-------------|
| `97d57f8` | 03-01 | feat: add UsdPurchase model, useCurrencyEngine hook, and USD migration |
| `de477a4` | 03-01 | fix: stop USD-to-ARS conversion in expense and income handlers |
| `25ce3fc` | 03-02 | feat: refactor balance calculation to dual-currency |
| `0c46730` | 03-02 | feat: update sidebar UI for dual balances and native currency display |
| `6562573` | 03-03 | feat: create UsdPurchaseDialog with buy and register modes |
| `70ca08e` | 03-03 | feat: create ExchangeSummary and wire USD components into main layout |
| `699044c` | 03-04 | feat: add retroactive USD rate editing and inline rate edit UI |
| `1d9aa5d` | 03-04 | fix: auto-calculate USD in purchase dialog and improve rate edit visibility |

---

## Human Verification Required

The following behaviors cannot be confirmed programmatically and require runtime testing:

### 1. Data Migration on First Load

**Test:** Open the app with existing data that has USD expenses stored as ARS-converted values (pre-phase 3 data). Check that amounts shown for USD expenses are now the original USD values (not the ARS-multiplied values).
**Expected:** A USD expense that was stored as 120000 ARS (100 USD * 1200 rate) should now display as 100 USD.
**Why human:** Migration is conditional on localStorage state from before this phase. Can't reproduce without pre-migration data.

### 2. Buying USD Changes Balances Correctly

**Test:** Note current ARS and USD balances. Open the Comprar/Registrar USD dialog. Enter 120000 ARS and 100 USD. Submit. Check sidebar balances.
**Expected:** ARS balance decreases by 120000. USD balance increases by 100. Patrimonio total remains unchanged (buying USD is a transfer, not a gain or loss).
**Why human:** Balance correctness depends on live state and rendering, which can't be validated statically.

### 3. Untracked USD Does Not Reduce ARS Balance

**Test:** Note ARS balance. Register 50 untracked USD with description "Efectivo". Check sidebar balances.
**Expected:** USD balance increases by 50. ARS balance is unchanged. Patrimonio total increases (new money entering).
**Why human:** Requires live state interaction.

### 4. Exchange Gain/Loss Updates When Global Rate Changes

**Test:** Buy 100 USD at rate 1200. Set global rate to 1300. Check ExchangeSummary.
**Expected:** Gain = (1300 - 1200) * 100 = 10000 ARS shown in green.
**Why human:** Requires live interaction with two separate actions.

### 5. Retroactive Rate Edit Propagates to Balance

**Test:** Find a USD expense. Click pencil on its rate. Change from 1200 to 1100. Check balances.
**Expected:** usdRate on that expense record is updated to 1100. Exchange gain/loss summary updates accordingly.
**Why human:** Balance recalculation from rate change is a live state dependency.

---

## Overall Assessment

Phase 3 goal is achieved. The codebase implements genuine dual-currency separation at every layer:

- **Data model:** `UsdPurchase` type, `usdPurchases` array in `MonthlyData`, migration v3 reversing old ARS-converted USD amounts
- **Logic:** `calculateDualBalances()` accumulates ARS (month-scoped) and USD (cumulative) independently. No interconversion at input time.
- **Engine:** `useCurrencyEngine` owns `globalUsdRate` persistence, USD purchase CRUD, and exchange gain/loss calculation
- **UI:** Separate sidebar balance rows, inline global rate editor, USD purchase dialog (buy + untracked modes), exchange summary card, native currency symbols in tables, inline rate editing per row
- **Validation:** All currency forms reject zero/negative values with visual feedback

This is not a visual conversion pattern. Amounts are stored in their native currency and balances are computed separately. The phase goal — *real* separated ARS and USD balances — is verified.

---

_Verified: 2026-04-02_
_Verifier: Claude (gsd-verifier)_
