---
phase: 07-loans
verified: 2026-04-02T17:15:00Z
status: passed
score: 14/14 must-haves verified
re_verification: false
human_verification:
  - test: "Open Prestamos tab and register a Preste loan then verify Disponible drops"
    expected: "ARS balance decreases by the lent amount; patrimonio shows green Prestamos dados line"
    why_human: "Liquid balance visual change requires runtime state — can't verify in static analysis"
  - test: "Register partial payment on a loan and verify remaining updates; pay fully and verify status auto-changes"
    expected: "Remaining balance decreases; when reaching 0 status changes to Cobrado (preste) or Pagado (debo)"
    why_human: "State transitions require runtime interaction"
  - test: "Click Perdonar on a pending preste loan and confirm"
    expected: "Confirmation dialog appears; after confirming, status changes to Perdonado and patrimonio drops"
    why_human: "UI interaction flow requires runtime"
  - test: "Delete a loan with confirmation and verify financial impact is reversed"
    expected: "AlertDialog asks for confirmation; after confirming, loan disappears and balances restore"
    why_human: "Requires runtime to confirm dialog and balance recalculation"
---

# Phase 07: Loans Verification Report

**Phase Goal:** Complete loan (Preste/Debo) management system with CRUD, payments, forgiveness, and patrimonio integration.
**Verified:** 2026-04-02T17:15:00Z
**Status:** PASSED
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| #  | Truth | Status | Evidence |
|----|-------|--------|----------|
| 1  | Loan and LoanPayment types exist with type discriminator (preste/debo), status (Pendiente/Cobrado/Pagado/Perdonado), persona, amount, currencyType, payments array | ✓ VERIFIED | `hooks/useMoneyTracker.ts` lines 121–142: LoanType, LoanStatus, LoanPayment, Loan all exported with correct fields |
| 2  | MonthlyData includes optional loans array and migration v7 initializes it to empty array | ✓ VERIFIED | `useMoneyTracker.ts` line 159: `loans?: Loan[]`; line 216: `_migrationVersion: 7`; lines 219–221: migration block initializes `migrated.loans = (migrated as any).loans \|\| []` |
| 3  | calculateDualBalances processes loans: lending reduces liquid, collecting restores it; borrowing does NOT change liquid, paying a debt reduces liquid | ✓ VERIFIED | Lines 469–494: preste/debo logic with correct liquid impact; debo borrowing is absent from liquid impact (payments only reduce arsBalance/usdBalance) |
| 4  | ARS loan impacts use isInArsRange scoping; USD loan impacts are cumulative (all time) | ✓ VERIFIED | Lines 479–491: ARS uses `isInArsRange(loan.date)` / `isInArsRange(p.date)`; USD paths have no date filter |
| 5  | calculateDualBalances returns arsLoansGiven, usdLoansGiven, arsDebts, usdDebts for patrimonio | ✓ VERIFIED | Line 512: return statement includes all four fields |
| 6  | useLoans hook provides add loan, add payment, edit loan, delete loan, forgive loan, and filtered loans | ✓ VERIFIED | `hooks/useLoans.ts`: all 6 functions implemented and returned; edit function exists in hook even though UI edit button is a placeholder (see Warning) |
| 7  | User can open a dialog and register a Preste or Debo loan with persona, amount, currency, date, and optional note | ✓ VERIFIED | `components/loan-dialog.tsx` 228 lines: full form with Preste/Debo toggle, all fields, form validation, resets on close |
| 8  | Loans table shows all loans with columns: Persona, Tipo (badge), Monto, Resta, Moneda, Fecha, Estado, Acciones | ✓ VERIFIED | `loans-table.tsx`: 9 column headers (chevron + 8 data columns); `loan-row.tsx` renders TypeBadge, StatusBadge, computed Resta |
| 9  | Completed loans (Cobrado/Pagado/Perdonado) show with dimmed style and status badge | ✓ VERIFIED | `loan-row.tsx` line 24: `COMPLETED_STATUSES` constant; row gets `opacity-60` class for completed status via `cn()` usage |
| 10 | User can click a loan row to expand and see payment history plus inline payment form | ✓ VERIFIED | `loan-row.tsx` lines 141–147: `isExpanded` toggles LoanPayments rendering; `loan-payments.tsx`: history list + inline form |
| 11 | User can register a partial payment; when remaining reaches 0 status auto-changes | ✓ VERIFIED | `useLoans.ts` lines 67–73: auto-transition logic; `loan-payments.tsx` line 45: amount > remaining validation |
| 12 | User can delete a loan with confirmation dialog and forgive a preste-type loan | ✓ VERIFIED | `loans-table.tsx`: AlertDialog for delete (red) and forgive (amber) both implemented; forgive routes through `setForgiveTarget` to confirmation |
| 13 | Prestamos tab appears in main tabbed interface with LoansTable and LoanDialog wired | ✓ VERIFIED | `expense-tracker.tsx` line 355: TabsTrigger value="loans"; lines 563–584: TabsContent with LoansTable + LoanDialog; all 5 callbacks passed |
| 14 | Patrimonio card shows Prestamos dados (green asset) and Deudas (red liability) with correct formula and tooltip | ✓ VERIFIED | `patrimonio-card.tsx` lines 23–26: 4 new props; lines 59–62: formula adds loans, subtracts debts; lines 124–181: conditional green/red rows with tooltips |

**Score:** 14/14 truths verified

---

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `hooks/useLoans.ts` | Loan CRUD hook with payment management, forgiveness, and period filtering | ✓ VERIFIED (119 lines, substantive, wired) | Imported by useMoneyTracker.ts line 10; instantiated at line 571; all 6 functions exposed in return at lines 757–763 |
| `hooks/useMoneyTracker.ts` | Loan type definitions, MonthlyData with loans, calculateDualBalances with loan processing, migration v7, useLoans wired | ✓ VERIFIED | All additions confirmed: types lines 121–142, MonthlyData.loans line 159, migration v7 lines 216–221, loan processing lines 469–512, useLoans wired lines 10/571/757–763 |
| `components/loan-dialog.tsx` | Loan creation dialog with Preste/Debo toggle, persona, amount, currency, date, note fields | ✓ VERIFIED (228 lines, substantive, wired) | Imported and rendered in expense-tracker.tsx lines 69/578–584 |
| `components/loans-table.tsx` | Main loans table with expandable rows, empty state, delete/forgive confirmation dialogs | ✓ VERIFIED (173 lines, substantive, wired) | Imported at expense-tracker.tsx line 68; rendered lines 570–577 |
| `components/loan-row.tsx` | Single loan row with expand/collapse, dimmed completed style, action buttons | ✓ VERIFIED (150 lines, substantive, wired) | Imported and rendered in loans-table.tsx lines 24/106 |
| `components/loan-payments.tsx` | Expandable payment history list with inline add payment form | ✓ VERIFIED (152 lines, substantive, wired) | Imported and rendered in loan-row.tsx lines 8/144 |
| `components/expense-tracker.tsx` | Prestamos tab with LoansTable and LoanDialog wired to useMoneyTracker | ✓ VERIFIED | Tab trigger line 355; tab content lines 563–584; all loan callbacks destructured lines 186–191 |
| `components/patrimonio-card.tsx` | Updated patrimonio with loan/debt lines, updated formula, updated tooltip | ✓ VERIFIED | Props updated lines 23–26; formula lines 59–62; conditional rows lines 124–181 |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `hooks/useLoans.ts` | `hooks/useMoneyTracker.ts` | Loan type import | ✓ WIRED | `import type { MonthlyData, Loan, LoanPayment, LoanType, LoanStatus } from "./useMoneyTracker"` — line 4 |
| `hooks/useMoneyTracker.ts` | `hooks/useLoans.ts` | useLoans instantiation | ✓ WIRED | `import { useLoans }` line 10; `const loansTracker = useLoans(...)` line 571 |
| `components/loan-dialog.tsx` | `hooks/useMoneyTracker.ts` | LoanType import + onAddLoan callback | ✓ WIRED | `import type { LoanType } from "@/hooks/useMoneyTracker"` line 13; onAddLoan prop called on submit |
| `components/loans-table.tsx` | `components/loan-row.tsx` | Renders LoanRow for each loan | ✓ WIRED | Import line 24; `<LoanRow ...>` rendered in `.map()` at line 106 |
| `components/loan-row.tsx` | `components/loan-payments.tsx` | Renders LoanPayments in expanded state | ✓ WIRED | Import line 8; `<LoanPayments loan={loan} onAddPayment={onAddPayment} />` at line 144, guarded by `isExpanded` |
| `components/expense-tracker.tsx` | `components/loans-table.tsx` | Renders LoansTable in Prestamos TabsContent | ✓ WIRED | Import line 68; `<LoansTable loans={filteredLoans} ...>` at line 570 |
| `components/expense-tracker.tsx` | `components/loan-dialog.tsx` | Renders LoanDialog with open state | ✓ WIRED | Import line 69; `<LoanDialog open={openLoanDialog} ...>` at line 578 |
| `components/patrimonio-card.tsx` | `hooks/useMoneyTracker.ts` | Receives arsLoansGiven, usdLoansGiven, arsDebts, usdDebts as props | ✓ WIRED | Props defined lines 23–26; passed from expense-tracker.tsx lines 613–616 from `dualBalancesForCards` |

---

### Requirements Coverage

| Requirement | Source Plans | Description | Status | Evidence |
|-------------|--------------|-------------|--------|----------|
| PREST-01 | 07-01, 07-02 | User puede registrar "le preste $X a [persona]" con fecha y monto | ✓ SATISFIED | LoanDialog with type="preste", persona field, amount, date — wired to handleAddLoan |
| PREST-02 | 07-01, 07-02 | User puede registrar "debo $X a [persona]" con fecha y monto | ✓ SATISFIED | Same dialog with type="debo" toggle — same handleAddLoan call |
| PREST-03 | 07-03 | Prestamo dado cuenta como activo, deuda cuenta como pasivo en patrimonio | ✓ SATISFIED | patrimonio-card.tsx: loans added to formula, debts subtracted; conditional green/red rows |
| PREST-04 | 07-01, 07-02, 07-03 | User puede marcar prestamo como cobrado (vuelve al liquido) o deuda como pagada (sale del liquido) | ✓ SATISFIED | handleAddLoanPayment auto-transitions status to Cobrado/Pagado at remaining=0; payment reduces/restores liquid per calculateDualBalances logic |

All 4 PREST requirements satisfied. No orphaned requirements found.

---

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `components/loan-row.tsx` | 112–115 | Edit button onClick is empty; comment says "For now, edit is a placeholder — actual inline edit could be added" | Warning | Edit button is non-functional; pressing it does nothing. The `handleEditLoan` function exists in the hook and is wired all the way through the component chain (prop is accepted), but is never invoked from the UI. PREST requirements do not call out edit-in-place as a required behavior, so this does not block goal achievement. |

---

### Human Verification Required

#### 1. Liquid Balance Drops When Lending

**Test:** Add a Preste loan in ARS for the current period and observe the "Disponible" balance before and after.
**Expected:** ARS balance decreases by the lent amount immediately upon saving; Prestamos dados line appears in patrimonio card in green.
**Why human:** Static analysis confirms the calculateDualBalances formula subtracts loan.amount for preste ARS — runtime execution required to confirm the reactive update.

#### 2. Partial Payment Flow and Auto-Status Transition

**Test:** Register a loan, then add a partial payment, check remaining. Then add another payment that brings remaining to 0.
**Expected:** Each payment reduces remaining balance shown in loan-payments.tsx. On final payment, loan status changes to Cobrado (preste) or Pagado (debo).
**Why human:** Requires runtime state updates; auto-transition logic is in useLoans.ts lines 70–72 but needs end-to-end exercise.

#### 3. Forgive Confirmation Flow

**Test:** Click "Perdonar" on a pending Preste loan, verify dialog appears with the remaining amount, then confirm.
**Expected:** AlertDialog shows "Se cancela el saldo restante de $X..." text; after confirming, loan status becomes Perdonado and patrimonio drops (green asset line shrinks or disappears).
**Why human:** UI interaction and patrimonio reactive recalculation require runtime.

#### 4. Delete Reversal

**Test:** Create a loan (observe balance impact), then delete it via the confirmation dialog.
**Expected:** AlertDialog asks for confirmation; after confirming, the loan disappears from the table and all balance/patrimonio values return to pre-loan state.
**Why human:** Requires runtime interaction for confirmation dialog and balance recalculation verification.

---

### Gaps Summary

No gaps found. All 14 observable truths are verified. The only non-blocking finding is the edit button placeholder in `components/loan-row.tsx` — the `handleEditLoan` function exists and is wired through the component hierarchy but the Pencil button onClick is empty. Since none of the PREST-01 through PREST-04 requirements explicitly require an edit-in-place UI action, this does not block goal achievement.

---

_Verified: 2026-04-02T17:15:00Z_
_Verifier: Claude (gsd-verifier)_
