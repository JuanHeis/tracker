# Roadmap: Expense Tracker — Contador Personal

## Milestones

- ✅ **v1.0 MVP** - Phases 1-10 (shipped 2026-04-02)
- ✅ **v1.1 Setup Wizard & Manual** - Phases 11-13 (shipped 2026-04-03)
- 🚧 **v1.2 Graficos Predictivos** - Phases 14-16 (in progress)

## Phases

<details>
<summary>v1.0 MVP (Phases 1-10) - SHIPPED 2026-04-02</summary>

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Critical Bug Fixes** - Fix 7 confirmed bugs that produce wrong calculations, broken forms, and corrupted data (completed 2026-04-01)
- [x] **Phase 2: Investment Model Refactor** - Replace transactional investment model with account-based model (movements, value tracking, finalization)
- [x] **Phase 3: Dual Currency Engine** - Implement real ARS/USD separation with per-transaction rates, currency purchases, and exchange gain/loss (completed 2026-04-02)
- [x] **Phase 4: Income & Pay Date** - Rename terminology, add configurable pay date with dual calendar views, and auto-calculated aguinaldo
- [x] **Phase 5: Monthly Card Redesign** - Rebuild the monthly summary card with correct formulas, clear desglose, and patrimonio calculation
- [x] **Phase 6: Recurring Expenses** - Define, auto-generate, pause/cancel, and track payment of recurring expenses (completed 2026-04-02)
- [x] **Phase 7: Loans** - Register loans given and debts owed, track as assets/liabilities, mark as collected/paid (completed 2026-04-02)
- [x] **Phase 8: Budgets** - Set category spending limits with progress bars and proximity alerts (completed 2026-04-02)
- [x] **Phase 9: Transfers & Adjustments** - Register inter-account transfers and manual balance adjustments
- [x] **Phase 10: Persistence & UX Polish** - JSON export/import with validation, consistent financial terminology, and form validations (completed 2026-04-02)

</details>

<details>
<summary>v1.1 Setup Wizard & Manual (Phases 11-13) - SHIPPED 2026-04-03</summary>

- [x] **Phase 11: Core Setup Wizard** - First-time detection, multi-step wizard (ARS, USD, income, summary), atomic save, skip options, and import alternative (completed 2026-04-02)
- [x] **Phase 12: Investments Step & Re-run** - Add investments quick-add step to wizard and re-run capability from config (reset + wizard) (completed 2026-04-03)
- [x] **Phase 13: Manual de Uso** - Comprehensive user guide documenting every feature of the app (completed 2026-04-03)

</details>

### 🚧 v1.2 Graficos Predictivos (In Progress)

**Milestone Goal:** Visualizar la evolucion financiera pasada y proyectar el futuro con graficos interactivos usando datos reales del usuario.

**Cross-cutting constraint:** INFRA-03 — All phases treat localStorage as read-only. Zero mutations to MonthlyData, Investment, or any existing interface. Charts derive data; they never write it.

- [ ] **Phase 14: Recharts Upgrade & Chart Infrastructure** - Upgrade Recharts to 3.x, verify existing charts, establish projection chart patterns
- [ ] **Phase 15: Projection Engine** - Pure math functions for compound interest, linear projection, historical reconstruction, scenarios, and orchestrator hook
- [ ] **Phase 16: Chart Components** - Patrimony and investment projection charts with scenarios, horizon selector, and disclaimers

## Phase Details

<details>
<summary>v1.0 MVP Phase Details (Phases 1-10)</summary>

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
- [x] 01-01-PLAN.md — Investment type constants + currency fix (BUG-01, BUG-02)
- [x] 01-02-PLAN.md — Form fixes: installment dates, edit, salary pre-load (BUG-05, BUG-06, BUG-07)
- [x] 01-03-PLAN.md — Month-filtered calculations, validation, settings reset (BUG-03, BUG-04)

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
- [x] 02-01-PLAN.md — Data model redesign, migration, hook refactor (INV-01, INV-09)
- [x] 02-02-PLAN.md — Investment dialog with PF fields and currency enforcement (INV-01, INV-08, INV-09)
- [x] 02-03-PLAN.md — Sub-components: expandable row, movements, value cell with NumberFlow (INV-02, INV-03, INV-04, INV-06, INV-07, INV-08)
- [x] 02-04-PLAN.md — Rewrite investments table, finalization dialog, full wiring (INV-02, INV-03, INV-04, INV-05, INV-10)
- [x] 02-05-PLAN.md — Integration fixes and human verification (INV-05, INV-06, INV-07, INV-08, INV-10)

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
- [x] 03-01-PLAN.md — Data model, migration, stop USD->ARS conversion, useCurrencyEngine hook (MON-01, MON-02, MON-03, MON-08)
- [x] 03-02-PLAN.md — Dual balance calculation, sidebar UI refactor, table currency display (MON-01, MON-03)
- [x] 03-03-PLAN.md — USD purchase dialog, untracked USD, exchange gain/loss UI (MON-04, MON-05, MON-06)
- [x] 03-04-PLAN.md — Retroactive rate editing, validation hardening, verification (MON-07, MON-08)

### Phase 4: Income & Pay Date
**Goal**: Income system reflects real-world pay timing with flexible calendar views and automatic aguinaldo for employees
**Depends on**: Phase 3
**Requirements**: ING-01, ING-02, ING-03, ING-04, ING-05, ING-06, ING-07, ING-08
**Success Criteria** (what must be TRUE):
  1. App uses "Ingreso fijo" and "Otros ingresos" terminology everywhere (no "Salario" or "Ingresos extras")
  2. User can set their pay date (e.g., day 10) and toggle between a custom-period view (10th to 9th) and a calendar-month view showing "Pendiente de cobro" before pay date
  3. Salary increases apply from the current month forward without affecting past months
  4. User who marks themselves as "dependiente" sees auto-calculated aguinaldo in June and December (50% of best salary in the semester); independiente users see no aguinaldo
**Plans**: 4 plans

Plans:
- [x] 04-01-PLAN.md — Terminology rename + data model migration + salary resolution (ING-01, ING-06)
- [x] 04-02-PLAN.md — Employment config UI + salary history timeline in salary card (ING-02, ING-06, ING-08)
- [x] 04-03-PLAN.md — Aguinaldo auto-calculation + display + override (ING-07, ING-08)
- [x] 04-04-PLAN.md — Pay period views + segmented control + pendiente de cobro (ING-03, ING-04, ING-05)

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
- [x] 05-01-PLAN.md — Create 3 card components (Resumen, Patrimonio, Config) + extend hook (CARD-01, CARD-02, CARD-03, CARD-05)
- [x] 05-02-PLAN.md — Wire cards into layout + add tooltip desgloses to all numbers (CARD-01, CARD-02, CARD-04, CARD-05)

### Phase 6: Recurring Expenses
**Goal**: User defines recurring expenses once and they auto-appear each month with payment tracking
**Depends on**: Phase 5
**Requirements**: REC-01, REC-02, REC-03, REC-04
**Success Criteria** (what must be TRUE):
  1. User can create a recurring expense with name, amount, category, and monthly frequency
  2. Recurring expenses automatically generate entries each month without user intervention
  3. User can pause or cancel a recurring expense, stopping future auto-generation
  4. User can mark each month's recurring expense instance as paid or unpaid
**Plans**: 3 plans

Plans:
- [x] 06-01-PLAN.md — Data model, hook, auto-generation logic (REC-01, REC-02)
- [x] 06-02-PLAN.md — Recurring expense dialog and management UI (REC-01, REC-03)
- [x] 06-03-PLAN.md — Payment tracking and instance management (REC-04)

### Phase 7: Loans
**Goal**: User tracks money lent and owed as real assets and liabilities that affect patrimonio
**Depends on**: Phase 5
**Requirements**: PREST-01, PREST-02, PREST-03, PREST-04
**Success Criteria** (what must be TRUE):
  1. User can register "I lent $X to [person]" and "I owe $X to [person]" with date and amount
  2. Loans given appear as assets and debts appear as liabilities in patrimonio calculation
  3. User can mark a loan as collected (money returns to liquid) or a debt as paid (money leaves liquid)
**Plans**: 3 plans

Plans:
- [x] 07-01-PLAN.md — Data model, hook, patrimonio integration (PREST-01, PREST-02, PREST-03)
- [x] 07-02-PLAN.md — Loan dialog and table UI (PREST-01, PREST-02, PREST-04)
- [x] 07-03-PLAN.md — Payment tracking and status transitions (PREST-04)

### Phase 8: Budgets
**Goal**: User sets spending limits per category and gets visual feedback on progress toward those limits
**Depends on**: Phase 5
**Requirements**: PRES-01, PRES-02, PRES-03
**Success Criteria** (what must be TRUE):
  1. User can define a monthly spending cap for any expense category
  2. User sees a progress bar showing current spending vs budget for each budgeted category
  3. User sees a visual alert when spending approaches or exceeds the category limit
**Plans**: 2 plans

Plans:
- [x] 08-01-PLAN.md — Data model, hook, budget calculation logic (PRES-01)
- [x] 08-02-PLAN.md — Budget UI with progress bars and alerts (PRES-02, PRES-03)

### Phase 9: Transfers & Adjustments
**Goal**: User can move money between accounts and reconcile balances with reality without creating fake income/expenses
**Depends on**: Phase 3
**Requirements**: TRANS-01, TRANS-02, AJUST-01
**Success Criteria** (what must be TRUE):
  1. User can register a transfer between own accounts (or ARS to USD) and patrimonio remains unchanged
  2. User can click "Adjust real balance" and the system creates an automatic adjustment entry to match the declared amount
**Plans**: 3 plans

Plans:
- [x] 09-01-PLAN.md — Transfer data model and hook logic (TRANS-01, TRANS-02, AJUST-01)
- [x] 09-02-PLAN.md — Transfer dialog and movements table integration (TRANS-01, TRANS-02)
- [x] 09-03-PLAN.md — Adjustment dialog and config card integration (AJUST-01)

### Phase 10: Persistence & UX Polish
**Goal**: User can back up and restore all data, and the entire app uses consistent, professional financial terminology with solid form validation
**Depends on**: Phase 9
**Requirements**: PERS-01, PERS-02, UX-01, UX-02
**Success Criteria** (what must be TRUE):
  1. User can export all app data to a single JSON file and import it back with validation that rejects corrupt or incompatible data
  2. All labels, headers, and descriptions across the app use standard personal finance terminology (patrimonio, liquido, activo, pasivo, etc.)
  3. Every form in the app validates that monetary amounts are > 0 and USD exchange rates are > 0 before submission
**Plans**: 3 plans

Plans:
- [x] 10-01-PLAN.md — JSON export/import with validation and confirmation (PERS-01, PERS-02)
- [x] 10-02-PLAN.md — Form validation hardening across all dialogs (UX-02)
- [x] 10-03-PLAN.md — Terminology audit and standardization (UX-01)

</details>

<details>
<summary>v1.1 Setup Wizard & Manual Phase Details (Phases 11-13)</summary>

### Phase 11: Core Setup Wizard
**Goal**: A first-time user can configure their initial financial situation through a guided wizard without needing to understand the app's individual features
**Depends on**: Phase 10 (v1.0 complete)
**Requirements**: WIZ-01, WIZ-02, WIZ-03, WIZ-04, WIZ-06, WIZ-07, WIZ-08, WIZ-09
**Success Criteria** (what must be TRUE):
  1. User opening the app with no data sees the wizard automatically instead of the empty main UI
  2. User can enter ARS liquid balance, USD holdings with exchange rate, and income config (salary, employment type, pay day) across distinct wizard steps
  3. User can skip optional steps (USD, income) and still complete the wizard with only ARS balance
  4. User sees a summary of everything entered and confirms before any data is saved — canceling or closing the wizard mid-way leaves localStorage untouched
  5. User on the welcome screen can choose to import a JSON backup instead of going through the wizard steps
**Plans**: 2 plans

Plans:
- [x] 11-01-PLAN.md — useSetupWizard hook with WizardData type, atomic commit, validation, and draft persistence (WIZ-02, WIZ-03, WIZ-04, WIZ-07, WIZ-08)
- [x] 11-02-PLAN.md — Wizard step components, container, and ExpenseTracker wizard gate (WIZ-01, WIZ-06, WIZ-08, WIZ-09)

### Phase 12: Investments Step & Re-run
**Goal**: User can declare existing investments during setup and re-run the wizard later to start fresh
**Depends on**: Phase 11
**Requirements**: WIZ-05, WIZ-10
**Success Criteria** (what must be TRUE):
  1. User can add existing investments one by one in the wizard (type, name, amount, currency) with correct currency enforcement per investment type, and loop to add more
  2. Investments added in the wizard appear correctly in the investments table after wizard completion with accurate patrimonio calculation
  3. User can trigger "Re-ejecutar wizard" from the config section, which resets all data and launches the wizard as if first-time
**Plans**: 2 plans

Plans:
- [x] 12-01-PLAN.md — Investments wizard step: WizardData extension, inline add/remove loop, currency enforcement, commit with Investment objects, updated step numbering (WIZ-05)
- [x] 12-02-PLAN.md — Re-run wizard button: export STORAGE_KEYS, ConfigCard reset button with confirmation, factory reset + reload (WIZ-10)

### Phase 13: Manual de Uso
**Goal**: A reference document exists that explains how to use every feature of the app
**Depends on**: Phase 12 (all features including wizard finalized)
**Requirements**: MAN-01
**Success Criteria** (what must be TRUE):
  1. A MANUAL.md file exists with step-by-step instructions for every major feature (wizard, income, expenses, investments, loans, budgets, transfers, export/import)
  2. The manual covers the setup wizard flow including skip options, import alternative, and re-run from config
  3. The manual uses the same terminology as the app (ingreso fijo, patrimonio, liquido, etc.)
**Plans**: 1 plan

Plans:
- [x] 13-01-PLAN.md — Comprehensive user manual in Spanish (MAN-01)

</details>

### Phase 14: Recharts Upgrade & Chart Infrastructure
**Goal**: Recharts 3.x is installed and working, existing charts are verified, and the pattern for projection charts is established
**Depends on**: Phase 13 (v1.1 complete)
**Requirements**: INFRA-01, INFRA-02, INFRA-03
**Success Criteria** (what must be TRUE):
  1. User opens the app and all existing charts (salary-by-month, any others) render correctly after the Recharts 3.x upgrade with no visual regressions
  2. A projection chart skeleton component exists using the "use client" + useHydration + ChartContainer pattern, confirming the pattern works with Recharts 3.x
  3. JSON export/import still works correctly post-upgrade (regression check that no localStorage interfaces were touched)
**Plans**: TBD

### Phase 15: Projection Engine
**Goal**: All projection math and data orchestration is complete — investment compound interest, income linear projection, historical patrimony reconstruction, and scenario configuration are available via a single hook
**Depends on**: Phase 14
**Requirements**: PROJ-01, PROJ-02, PROJ-03, PROJ-04, PROJ-05
**Success Criteria** (what must be TRUE):
  1. User's active investments each have a projected future value using compound interest (Plazo Fijo uses its TNA rate; other types use configurable default rates per type)
  2. User who toggles "aportes futuros" on an investment sees projected monthly contributions included in the compound growth calculation (default amount: last aporte)
  3. User's future income is projected as a flat line based on current ingreso fijo, and projected patrimony deducts active recurring expenses from monthly net savings
  4. User sees historical patrimony reconstructed month-by-month from existing monthlyData as a solid data series, with a clear boundary at the current month
  5. Three scenario variants (optimista/base/pesimista) are computed with different growth rate assumptions, ready for chart consumption
**Plans**: TBD

### Phase 16: Chart Components
**Goal**: User sees interactive projection charts integrated into the app — patrimony evolution and investment growth with scenarios, horizon control, and honest disclaimers
**Depends on**: Phase 15
**Requirements**: CHART-01, CHART-02, CHART-03, CHART-04, CHART-05
**Success Criteria** (what must be TRUE):
  1. User sees a patrimony chart with solid line (historical real data) + dashed line (projection) + vertical "Hoy" reference line separating past from future
  2. User sees an investment portfolio chart showing projected growth with breakdown by investment type (stacked or grouped)
  3. User sees three scenario lines (optimista/base/pesimista) with different visual styles (opacity or dash patterns), and can toggle each scenario on/off
  4. User can switch the projection horizon between 3, 6, 12, and 24 months using a selector control, and charts update immediately
  5. Every chart displays a visible disclaimer noting that projections use current exchange rate and assumed growth rates (e.g., "Proyeccion a cotizacion actual: $X ARS/USD")

**Plans**: TBD

## Progress

**Execution Order:**
- v1.0: 1 -> 2 -> 3 -> 4 -> 5 -> 6 -> 7 -> 8 -> 9 -> 10 (complete)
- v1.1: 11 -> 12 -> 13 (complete)
- v1.2: 14 -> 15 -> 16

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Critical Bug Fixes | v1.0 | 3/3 | Complete | 2026-04-01 |
| 2. Investment Model Refactor | v1.0 | 5/5 | Complete | 2026-04-02 |
| 3. Dual Currency Engine | v1.0 | 4/4 | Complete | 2026-04-02 |
| 4. Income & Pay Date | v1.0 | 4/4 | Complete | 2026-04-02 |
| 5. Monthly Card Redesign | v1.0 | 2/2 | Complete | 2026-04-02 |
| 6. Recurring Expenses | v1.0 | 3/3 | Complete | 2026-04-02 |
| 7. Loans | v1.0 | 3/3 | Complete | 2026-04-02 |
| 8. Budgets | v1.0 | 2/2 | Complete | 2026-04-02 |
| 9. Transfers & Adjustments | v1.0 | 3/3 | Complete | 2026-04-02 |
| 10. Persistence & UX Polish | v1.0 | 3/3 | Complete | 2026-04-02 |
| 11. Core Setup Wizard | v1.1 | 2/2 | Complete | 2026-04-02 |
| 12. Investments Step & Re-run | v1.1 | 2/2 | Complete | 2026-04-03 |
| 13. Manual de Uso | v1.1 | 1/1 | Complete | 2026-04-03 |
| 14. Recharts Upgrade & Chart Infrastructure | v1.2 | 0/? | Not started | - |
| 15. Projection Engine | v1.2 | 0/? | Not started | - |
| 16. Chart Components | v1.2 | 0/? | Not started | - |
