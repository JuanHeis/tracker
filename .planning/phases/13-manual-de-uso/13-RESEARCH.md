# Phase 13: Manual de Uso - Research

**Researched:** 2026-04-02
**Domain:** Documentation / User Manual
**Confidence:** HIGH

## Summary

Phase 13 is a pure documentation task: create a MANUAL.md file that explains how to use every feature of the app. No code changes, no libraries, no architecture decisions. The challenge is completeness and accuracy -- the manual must cover every feature using the exact terminology from the UI.

The app ("Contador Personal") is a personal finance tracker with 8 main tabs (Gastos, Ingresos, Inversiones, Charts, Movimientos, Recurrentes, Presupuestos, Prestamos), a setup wizard, a config section, and dual ARS/USD currency support. All data lives in localStorage with JSON export/import.

**Primary recommendation:** Write MANUAL.md in Spanish (matching the app's UI language), organized by feature area, using the exact UI labels and terminology found in the codebase.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| MAN-01 | Existe un MANUAL.md con guia paso a paso de como usar cada feature de la app | Complete feature inventory below with exact terminology, tab structure, and wizard flow documented |
</phase_requirements>

## App Feature Inventory

This is the core research: a complete inventory of every feature the manual must document, with the exact terminology used in the UI.

### App Structure

The app uses a floating bottom taskbar with 8 tabs, plus top-level cards (Resumen, Patrimonio, Configuracion). Month/year selectors and view mode toggles are in the taskbar area.

**Main Tabs (from expense-tracker.tsx):**
1. **Gastos** (value="table") - Expense tracking with categories, installments (cuotas)
2. **Ingresos** (value="incomes") - Income tracking, otros ingresos
3. **Inversiones** (value="investments") - Investment accounts with movements
4. **Charts** (value="charts") - Visual charts and analytics
5. **Movimientos** (value="movements") - Transfers, USD purchases, balance adjustments
6. **Recurrentes** (value="recurrentes") - Recurring expenses
7. **Presupuestos** (value="budgets") - Budget limits per category
8. **Prestamos** (value="loans") - Loans given and debts owed

**Top Cards:**
- **Resumen del Mes** (ResumenCard) - Monthly summary: Ingreso fijo, Otros ingresos, Aguinaldo, Total gastos, Aportes inversiones, Disponible
- **Patrimonio Total** (PatrimonioCard) - Liquido ARS + Liquido USD (converted) + Inversiones activas
- **Configuracion** (ConfigCard) - Employment type, pay day, USD rate, salary history, export/import, re-ejecutar wizard

### Key Terminology (from codebase - MUST use these exact terms)

| UI Term | Meaning |
|---------|---------|
| Ingreso fijo | Fixed income / salary |
| Otros ingresos | Other income (extras) |
| Aguinaldo | Bonus (auto-calculated for dependiente) |
| Patrimonio Total | Total net worth |
| Liquido ARS | Liquid cash in ARS |
| Liquido USD | Liquid cash in USD |
| Disponible | Available money this month |
| Pendiente de cobro | Pending payment (before pay day) |
| Gastos | Expenses |
| Cuotas | Installments |
| Aportes | Investment contributions |
| Retiros | Investment withdrawals |
| Valor actual | Current value (of investment) |
| Ganancia/perdida | Profit/loss |
| Rendimiento % | Return percentage |
| Cotizacion USD | USD exchange rate |
| Dependiente / Independiente | Employee / Self-employed |
| Dia de cobro | Pay day |
| Periodo / Mes | Period view / Calendar month view |
| Recurrentes | Recurring expenses |
| Presupuestos | Budgets |
| Prestamos | Loans |
| Transferencia | Transfer between own accounts |
| Ajustar saldo real | Adjust real balance |
| Re-ejecutar wizard | Re-run setup wizard |

### Setup Wizard Flow (from setup-wizard/ components)

1. **WizardStepWelcome** (step 0): "Bienvenido a Contador Personal" with two options:
   - "Configurar desde cero" (start wizard)
   - "Importar backup existente" (import JSON)
2. **WizardStepBalance** (step 1): Enter saldo liquido ARS
3. **WizardStepUsd** (step 2): Enter USD balance + cotizacion (skippable)
4. **WizardStepIncome** (step 3): Enter ingreso fijo, employment type, dia de cobro (skippable)
5. **WizardStepInvestments** (step 4): Add investments one by one with tipo, nombre, monto, moneda (skippable)
6. **WizardStepSummary** (step 5): Review all data and confirm

**Wizard behaviors:**
- Auto-shows on first visit (no data in localStorage)
- Steps 2-4 are skippable
- Data saved atomically on confirm
- Draft persisted in sessionStorage
- Can re-run from Configuracion (resets all data + runs wizard)

### Feature Details for Manual Sections

**Gastos (Expenses):**
- Add expense with description, amount, category, date
- Installments (cuotas): split expense across months
- Edit/delete expenses
- Categories for grouping

**Ingresos (Income):**
- Ingreso fijo configured in Configuracion
- Otros ingresos: add extra income entries per month
- Aguinaldo auto-calculated for dependiente (50% best salary of semester, June/December)
- Two view modes: Periodo (pay day to pay day) vs Mes (calendar month)

**Inversiones (Investments):**
- Create investment account: nombre, tipo (FCI, Plazo Fijo, Crypto, Acciones), moneda base
- Register aportes (positive movements) - reduces liquid balance
- Register retiros (negative movements) - increases liquid balance
- Update valor actual inline
- Finalizar investment (auto-retiro total)
- Rendimiento % and ganancia/perdida displayed
- "Valor desactualizado" warning if lastUpdated > 7 days
- Currency enforcement: Crypto always USD, Plazo Fijo always ARS

**Movimientos (Movements/Transfers):**
- Transfer between own accounts (no net change to patrimonio)
- USD purchases from ARS balance
- USD from untracked cash (with explicit origin)
- Ajustar saldo real (creates automatic adjustment entry)

**Recurrentes (Recurring):**
- Define recurring expense: name, amount, category, monthly frequency
- Auto-generated each month
- Pause or cancel
- Mark as paid each month

**Presupuestos (Budgets):**
- Set monthly limit per expense category
- Visual progress bar (spent vs budget)
- Alert when approaching limit

**Prestamos (Loans):**
- "Le preste $X a [persona]" (loan given = asset)
- "Debo $X a [persona]" (debt = liability)
- Mark as cobrado (returns to liquid) or pagada (leaves liquid)
- Affects patrimonio calculation

**Configuracion:**
- Employment type: dependiente/independiente
- Dia de cobro
- Cotizacion USD global
- Salary history timeline (add/edit/delete entries)
- Export JSON
- Import JSON
- Re-ejecutar wizard (full reset + wizard)

**Dual Currency (ARS/USD):**
- Separate real balances in ARS and USD
- Each transaction stores cotizacion at time of entry
- Global cotizacion for patrimonio calculation
- Compra USD: converts ARS to USD
- Ganancia/perdida cambiaria (purchase rate vs current rate)
- Can edit cotizacion retroactively

## Architecture Patterns

### Manual File Structure

The manual should be a single MANUAL.md at project root, written in Spanish, organized by feature area matching the app's tab structure.

**Recommended structure:**
```
MANUAL.md
├── Introduccion (what the app does, core value)
├── Primer Uso: Setup Wizard
│   ├── Configurar desde cero (each step)
│   ├── Importar backup existente
│   └── Saltar pasos opcionales
├── Pantalla Principal
│   ├── Resumen del Mes
│   ├── Patrimonio Total
│   └── Navegacion (tabs, month/year selector, view modes)
├── Gastos
├── Ingresos
├── Inversiones
├── Charts
├── Movimientos y Transferencias
├── Gastos Recurrentes
├── Presupuestos
├── Prestamos
├── Configuracion
│   ├── Tipo de empleo y dia de cobro
│   ├── Cotizacion USD
│   ├── Historial de sueldo
│   ├── Exportar / Importar datos
│   └── Re-ejecutar wizard
└── Glosario de Terminos
```

### Writing Style

- Use imperative/instructional Spanish ("Presiona", "Ingresa", "Selecciona")
- Reference UI elements by their exact label in the app
- Keep instructions step-by-step with numbered lists
- Include notes/tips where behavior might be non-obvious (e.g., cuotas date handling, aguinaldo calculation)

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| N/A | N/A | N/A | This is a documentation-only phase, no code needed |

## Common Pitfalls

### Pitfall 1: Terminology Mismatch
**What goes wrong:** Manual uses different terms than the UI (e.g., "salario" instead of "ingreso fijo")
**Why it happens:** Natural language variation when writing documentation
**How to avoid:** Use the terminology table above as reference. Cross-check every term against the actual component code.
**Warning signs:** Any financial term not in the terminology table above

### Pitfall 2: Missing Feature Coverage
**What goes wrong:** Manual skips a feature or sub-feature
**Why it happens:** Easy to forget less visible features like balance adjustment, retroactive cotizacion editing, investment finalization
**How to avoid:** Use the feature inventory above as a checklist. Verify each requirement ID is covered.
**Warning signs:** Any tab or card not mentioned in the manual

### Pitfall 3: Stale Instructions
**What goes wrong:** Manual describes wizard or feature flow that doesn't match current implementation
**Why it happens:** Features evolved across phases 1-12
**How to avoid:** Reference the actual component code for current UI flow, not historical plans
**Warning signs:** Step counts or option names that don't match component props

### Pitfall 4: Forgetting Skip/Optional Flows
**What goes wrong:** Only documents the "happy path" without mentioning skip options, alternative flows
**Why it happens:** Focus on primary flow
**How to avoid:** Success criteria explicitly requires covering skip options, import alternative, and re-run from config
**Warning signs:** No mention of "saltar" or "omitir" in wizard section

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| N/A | N/A | N/A | Documentation phase - no technology evolution applies |

## Open Questions

1. **Manual location: project root or .planning/?**
   - What we know: Success criteria says "A MANUAL.md file exists" without specifying location
   - Recommendation: Place at project root (`MANUAL.md`) for discoverability, consistent with README.md convention

2. **Charts tab coverage depth**
   - What we know: Charts tab exists but specifics of what charts are shown were not deeply investigated
   - What's unclear: Exact chart types and what data they visualize
   - Recommendation: Planner should read `components/charts/` and `components/charts-container.tsx` during planning to document chart features accurately

## Sources

### Primary (HIGH confidence)
- Direct codebase inspection of all components in `components/` directory
- `components/expense-tracker.tsx` — main app structure, all tabs
- `components/setup-wizard/` — all 6 wizard step components
- `components/resumen-card.tsx` — monthly summary terminology
- `components/patrimonio-card.tsx` — patrimonio terminology
- `components/config-card.tsx` — configuration features
- `.planning/REQUIREMENTS.md` — complete requirements list
- `.planning/STATE.md` — project decisions and history

## Metadata

**Confidence breakdown:**
- Feature inventory: HIGH - sourced directly from codebase components
- Terminology: HIGH - extracted from actual UI component code
- Manual structure: HIGH - follows natural app organization
- Wizard flow: HIGH - verified from wizard step components

**Research date:** 2026-04-02
**Valid until:** 2026-05-02 (stable - documentation of existing features)
