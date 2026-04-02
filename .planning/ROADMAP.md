# Roadmap: Expense Tracker — Contador Personal

## Overview

This brownfield project starts by fixing 7 critical bugs that make current calculations unreliable, then refactors the investment model from transactional to account-based, builds proper dual ARS/USD currency support, redesigns the income and monthly summary systems, and layers on new features (recurring expenses, loans, budgets, transfers) before a final persistence and UX polish pass. Every phase delivers verifiable improvements to the user's financial picture accuracy.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Critical Bug Fixes** - Fix 7 confirmed bugs that produce wrong calculations, broken forms, and corrupted data (completed 2026-04-01)
- [ ] **Phase 2: Investment Model Refactor** - Replace transactional investment model with account-based model (movements, value tracking, finalization)
- [x] **Phase 3: Dual Currency Engine** - Implement real ARS/USD separation with per-transaction rates, currency purchases, and exchange gain/loss (completed 2026-04-02)
- [ ] **Phase 4: Income & Pay Date** - Rename terminology, add configurable pay date with dual calendar views, and auto-calculated aguinaldo
- [ ] **Phase 5: Monthly Card Redesign** - Rebuild the monthly summary card with correct formulas, clear desglose, and patrimonio calculation
- [x] **Phase 6: Recurring Expenses** - Define, auto-generate, pause/cancel, and track payment of recurring expenses (completed 2026-04-02)
- [x] **Phase 7: Loans** - Register loans given and debts owed, track as assets/liabilities, mark as collected/paid (completed 2026-04-02)
- [x] **Phase 8: Budgets** - Set category spending limits with progress bars and proximity alerts (completed 2026-04-02)
- [ ] **Phase 9: Transfers & Adjustments** - Register inter-account transfers and manual balance adjustments
- [x] **Phase 10: Persistence & UX Polish** - JSON export/import with validation, consistent financial terminology, and form validations (completed 2026-04-02)

## Phase Details

### Phase 1: Critical Bug Fixes
**Goal**: Every existing calculation produces correct results and every form works as expected
**Depends on**: Nothing (first phase)
**Requirements**: BUG-01, BUG-02, BUG-03, BUG-04, BUG-05, BUG-06, BUG-07
**Success Criteria** (what must be TRUE):
  1. User creates an investment in USD and it persists in USD (not silently converted to ARS)
  2. User sees consistent investment type options across all dialogs and data matches the type system
  3. User viewing "Total disponible" sees a figure filtered to the selected month, excluding finalized investments
  4. User entering a transaction with USD rate of 0 sees a validation error instead of Infinity/NaN
  5. User creating a 3-installment expense on Jan 31 sees correct end-of-month dates for all installments, can edit installments on existing expenses, and can edit salary with pre-loaded current values
**Plans**: 3 plans

Plans:
- [ ] 01-01-PLAN.md — Investment type constants + currency fix (BUG-01, BUG-02)
- [x] 01-02-PLAN.md — Form fixes: installment dates, edit, salary pre-load (BUG-05, BUG-06, BUG-07)
- [ ] 01-03-PLAN.md — Month-filtered calculations, validation, settings reset (BUG-03, BUG-04)

### Phase 2: Investment Model Refactor
**Goal**: Investments behave as accounts with movements, real-time value, and performance metrics — not as one-off transactions
**Depends on**: Phase 1
**Requirements**: INV-01, INV-02, INV-03, INV-04, INV-05, INV-06, INV-07, INV-08, INV-09, INV-10
**Success Criteria** (what must be TRUE):
  1. User can create an investment account (name, type, currency) and add/remove money via movements that affect monthly liquidity
  2. User can update an investment's current value inline in the table and finalize it (auto-retiro + status change + value zeroed)
  3. User sees per-investment gain/loss amount and percentage, plus a "value outdated" warning when last updated over 7 days ago
  4. User creating a Plazo Fijo sees auto-calculated current value based on rate and elapsed days; Crypto forces USD, FCI allows ARS/USD, Acciones follow market currency
  5. Investment table displays: name, type, capital invested, current value, gain/loss, percentage, last updated, and action buttons
**Plans**: 5 plans

Plans:
- [ ] 02-01-PLAN.md — Data model redesign, migration, hook refactor (INV-01, INV-09)
- [ ] 02-02-PLAN.md — Investment dialog with PF fields and currency enforcement (INV-01, INV-08, INV-09)
- [ ] 02-03-PLAN.md — Sub-components: expandable row, movements, value cell with NumberFlow (INV-02, INV-03, INV-04, INV-06, INV-07, INV-08)
- [ ] 02-04-PLAN.md — Rewrite investments table, finalization dialog, full wiring (INV-02, INV-03, INV-04, INV-05, INV-10)
- [ ] 02-05-PLAN.md — Integration fixes and human verification (INV-05, INV-06, INV-07, INV-08, INV-10)

### Phase 3: Dual Currency Engine
**Goal**: User has real separated ARS and USD balances with accurate exchange tracking — not just visual conversion
**Depends on**: Phase 2
**Requirements**: MON-01, MON-02, MON-03, MON-04, MON-05, MON-06, MON-07, MON-08
**Success Criteria** (what must be TRUE):
  1. User sees separate ARS and USD liquid balances that reflect actual holdings in each currency
  2. Every transaction records the USD exchange rate at creation time, and user can edit that rate retroactively
  3. User can buy USD from ARS balance (ARS decreases, USD increases, total patrimonio unchanged) or register untracked cash USD with explicit origin
  4. User sees automatic exchange gain/loss calculation comparing purchase rate vs current global rate
  5. All currency-related forms reject zero or negative values for amounts and exchange rates
**Plans**: 4 plans

Plans:
- [ ] 03-01-PLAN.md — Data model, migration, stop USD->ARS conversion, useCurrencyEngine hook (MON-01, MON-02, MON-03, MON-08)
- [ ] 03-02-PLAN.md — Dual balance calculation, sidebar UI refactor, table currency display (MON-01, MON-03)
- [ ] 03-03-PLAN.md — USD purchase dialog, untracked USD, exchange gain/loss UI (MON-04, MON-05, MON-06)
- [ ] 03-04-PLAN.md — Retroactive rate editing, validation hardening, verification (MON-07, MON-08)

### Phase 4: Income & Pay Date
**Goal**: Income system reflects real-world pay timing with flexible calendar views and automatic aguinaldo for employees
**Depends on**: Phase 3
**Requirements**: ING-01, ING-02, ING-03, ING-04, ING-05, ING-06, ING-07, ING-08
**Success Criteria** (what must be TRUE):
  1. App uses "Ingreso fijo" and "Otros ingresos" terminology everywhere (no "Salario" or "Ingresos extras")
  2. User can set their pay date (e.g., day 10) and toggle between a custom-period view (10th to 9th) and a calendar-month view showing "Pendiente de cobro" before pay date
  3. Salary increases apply from the current month forward without affecting past months
  4. User who marks themselves as "dependiente" sees auto-calculated aguinaldo in June and December (50% of best salary in the semester); independiente users see no aguinaldo
**Plans**: TBD

Plans:
- [ ] 04-01-PLAN.md — Terminology rename + data model migration + salary resolution (ING-01, ING-06)
- [ ] 04-02-PLAN.md — Employment config UI + salary history timeline in salary card (ING-02, ING-06, ING-08)
- [ ] 04-03-PLAN.md — Aguinaldo auto-calculation + display + override (ING-07, ING-08)
- [ ] 04-04-PLAN.md — Pay period views + segmented control + pendiente de cobro (ING-03, ING-04, ING-05)

### Phase 5: Monthly Card Redesign
**Goal**: The monthly summary card gives the user an accurate, understandable snapshot of their financial situation
**Depends on**: Phase 4
**Requirements**: CARD-01, CARD-02, CARD-03, CARD-04, CARD-05
**Success Criteria** (what must be TRUE):
  1. Monthly card shows clear breakdown: Ingresos (fijo + otros) / Egresos (gastos + investment contributions) / Disponible
  2. User can distinguish "Este mes" data from "Historico" data through visual separation with distinct labels and colors
  3. Patrimonio total correctly sums liquid ARS + liquid USD (converted) + active investment current values
  4. Every number in the card has a tooltip or expandable desglose showing the exact formula behind it
  5. Colors follow semantic convention: green for income, red for expenses, blue for investments
**Plans**: 2 plans

Plans:
- [ ] 05-01-PLAN.md — Create 3 card components (Resumen, Patrimonio, Config) + extend hook (CARD-01, CARD-02, CARD-03, CARD-05)
- [ ] 05-02-PLAN.md — Wire cards into layout + add tooltip desgloses to all numbers (CARD-01, CARD-02, CARD-04, CARD-05)

### Phase 6: Recurring Expenses
**Goal**: User defines recurring expenses once and they auto-appear each month with payment tracking
**Depends on**: Phase 5
**Requirements**: REC-01, REC-02, REC-03, REC-04
**Success Criteria** (what must be TRUE):
  1. User can create a recurring expense with name, amount, category, and monthly frequency
  2. Recurring expenses automatically generate entries each month without user intervention
  3. User can pause or cancel a recurring expense, stopping future auto-generation
  4. User can mark each month's recurring expense instance as paid or unpaid
**Plans**: TBD

Plans:
- [ ] 06-01: TBD

### Phase 7: Loans
**Goal**: User tracks money lent and owed as real assets and liabilities that affect patrimonio
**Depends on**: Phase 5
**Requirements**: PREST-01, PREST-02, PREST-03, PREST-04
**Success Criteria** (what must be TRUE):
  1. User can register "I lent $X to [person]" and "I owe $X to [person]" with date and amount
  2. Loans given appear as assets and debts appear as liabilities in patrimonio calculation
  3. User can mark a loan as collected (money returns to liquid) or a debt as paid (money leaves liquid)
**Plans**: TBD

Plans:
- [ ] 07-01: TBD

### Phase 8: Budgets
**Goal**: User sets spending limits per category and gets visual feedback on progress toward those limits
**Depends on**: Phase 5
**Requirements**: PRES-01, PRES-02, PRES-03
**Success Criteria** (what must be TRUE):
  1. User can define a monthly spending cap for any expense category
  2. User sees a progress bar showing current spending vs budget for each budgeted category
  3. User sees a visual alert when spending approaches or exceeds the category limit
**Plans**: TBD

Plans:
- [ ] 08-01: TBD

### Phase 9: Transfers & Adjustments
**Goal**: User can move money between accounts and reconcile balances with reality without creating fake income/expenses
**Depends on**: Phase 3
**Requirements**: TRANS-01, TRANS-02, AJUST-01
**Success Criteria** (what must be TRUE):
  1. User can register a transfer between own accounts (or ARS to USD) and patrimonio remains unchanged
  2. User can click "Adjust real balance" and the system creates an automatic adjustment entry to match the declared amount
**Plans**: TBD

Plans:
- [ ] 09-01: TBD

### Phase 10: Persistence & UX Polish
**Goal**: User can back up and restore all data, and the entire app uses consistent, professional financial terminology with solid form validation
**Depends on**: Phase 9
**Requirements**: PERS-01, PERS-02, UX-01, UX-02
**Success Criteria** (what must be TRUE):
  1. User can export all app data to a single JSON file and import it back with validation that rejects corrupt or incompatible data
  2. All labels, headers, and descriptions across the app use standard personal finance terminology (patrimonio, liquido, activo, pasivo, etc.)
  3. Every form in the app validates that monetary amounts are > 0 and USD exchange rates are > 0 before submission
**Plans**: TBD

Plans:
- [ ] 10-01-PLAN.md — JSON export/import with validation and confirmation (PERS-01, PERS-02)
- [ ] 10-02-PLAN.md — Form validation hardening across all dialogs (UX-02)
- [ ] 10-03-PLAN.md — Terminology audit and standardization (UX-01)

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9 → 10

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Critical Bug Fixes | 3/3 | Complete   | 2026-04-01 |
| 2. Investment Model Refactor | 4/5 | In Progress|  |
| 3. Dual Currency Engine | 4/4 | Complete   | 2026-04-02 |
| 4. Income & Pay Date | 0/TBD | Not started | - |
| 5. Monthly Card Redesign | 0/TBD | Not started | - |
| 6. Recurring Expenses | 3/3 | Complete   | 2026-04-02 |
| 7. Loans | 3/3 | Complete   | 2026-04-02 |
| 8. Budgets | 2/2 | Complete   | 2026-04-02 |
| 9. Transfers & Adjustments | 0/TBD | Not started | - |
| 10. Persistence & UX Polish | 3/3 | Complete   | 2026-04-02 |
