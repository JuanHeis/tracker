# Phase 12: Investments Step & Re-run - Research

**Researched:** 2026-04-02
**Domain:** Wizard extension (investments step) + factory reset + re-run
**Confidence:** HIGH

## Summary

Phase 12 adds two features to the existing setup wizard: (1) an investments step where users can add existing investments one-by-one with currency enforcement, and (2) a "Re-ejecutar wizard" button in the ConfigCard that clears all data and launches the wizard fresh.

The codebase already has all the building blocks: `Investment` interface, `CURRENCY_ENFORCEMENT` map, `InvestmentType` constants, `STORAGE_KEYS` array for localStorage management, and the wizard hook with step navigation and atomic commit. The work is primarily wiring these together -- extending `WizardData` with an investments array, adding a new wizard step component with an "add another" loop, updating `commitWizardData` to write investments into `monthlyData.investments`, updating step numbering (investments becomes step 4, summary becomes step 5), and adding a reset+reload button to ConfigCard.

**Primary recommendation:** Extend the existing wizard infrastructure (hook + UI) with a new investments step between income and summary. For re-run, clear all 7 localStorage keys via `STORAGE_KEYS` constant from `useDataPersistence.ts`, then `window.location.reload()` to trigger first-time detection.

<phase_requirements>

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| WIZ-05 | User puede cargar inversiones existentes una por una (tipo, nombre, monto, moneda) con loop "agregar otra" | Investment type system exists in `constants/investments.ts` with `CURRENCY_ENFORCEMENT` map. `Investment` interface in `useMoneyTracker.ts` defines the target shape. Wizard hook needs `investments: WizardInvestment[]` added to `WizardData`. New step component renders inline form with type/name/amount/currency fields, enforces currency per type, and provides "Agregar otra" button to loop. |
| WIZ-10 | User puede re-ejecutar wizard desde Configuracion (reset de fabrica + wizard) | `STORAGE_KEYS` in `useDataPersistence.ts` lists all 7 localStorage keys. ConfigCard already has a "Herramientas" section with export/import. Add "Re-ejecutar wizard" button that confirms, clears all keys, then `window.location.reload()`. ExpenseTracker's existing first-time detection (`!hasMonthlyData && !hasSalaryHistory`) will show the wizard automatically. |

</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React | existing | Component rendering, state management | Already in project |
| Next.js | existing | App framework | Already in project |
| shadcn/ui | existing | UI components (Card, Button, Input, Select) | Already used for all wizard steps |
| lucide-react | existing | Icons (Plus, Trash2, RotateCcw) | Already in project |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| date-fns | existing | Date formatting for investment createdAt | Already used in wizard hook |
| crypto.randomUUID() | native | Generate investment/movement IDs | Already used throughout codebase |

### Alternatives Considered
None -- no new libraries needed. All building blocks exist in the project.

**Installation:**
No new packages required.

## Architecture Patterns

### Recommended Project Structure
```
hooks/
  useSetupWizard.ts           # MODIFY: extend WizardData, add step 4 validation, update commitWizardData
components/setup-wizard/
  setup-wizard.tsx            # MODIFY: add step 4 rendering, update TOTAL_STEPS to 5, update step numbering
  wizard-step-investments.tsx # CREATE: new investment step with inline add/remove loop
  wizard-step-summary.tsx     # MODIFY: show investments in summary, update edit step number
components/
  config-card.tsx             # MODIFY: add "Re-ejecutar wizard" button in Herramientas section
```

### Pattern 1: WizardData Extension for Investments
**What:** Add `investments: WizardInvestment[]` to WizardData with a simplified type (no movements, no currentValue -- those are derived at commit time)
**When to use:** For the wizard-specific investment data before commit
**Example:**
```typescript
// In hooks/useSetupWizard.ts
export interface WizardInvestment {
  name: string;
  type: InvestmentType;
  currencyType: CurrencyType;
  amount: number;
  tna?: number;         // Plazo Fijo only
  plazoDias?: number;   // Plazo Fijo only
}

export interface WizardData {
  // ... existing fields ...
  investments: WizardInvestment[];
}
```

### Pattern 2: Inline Add Loop (No Dialog)
**What:** The investments step renders a list of added investments with an inline form to add more, rather than using InvestmentDialog
**When to use:** Wizard steps should be self-contained within the Card, not spawn dialogs
**Why:** The existing InvestmentDialog has editing/update concerns and expects callbacks from useMoneyTracker. A simpler inline form within the step Card is more appropriate for the wizard flow.
**Example:**
```typescript
// wizard-step-investments.tsx pattern
// 1. Show list of already-added investments with remove button
// 2. Show inline form: type select, name input, amount input, currency select (auto-enforced)
// 3. "Agregar" button adds to list, clears form, keeps step open
// 4. "Continuar" / "Omitir" buttons to proceed to summary
```

### Pattern 3: Currency Enforcement (Reuse Existing Logic)
**What:** When user selects investment type, currency is auto-set per `CURRENCY_ENFORCEMENT` map
**When to use:** In the wizard investment form
**Example:**
```typescript
// From constants/investments.ts -- already exists
const CURRENCY_ENFORCEMENT: Record<InvestmentType, CurrencyType | null> = {
  "Crypto": CurrencyType.USD,
  "Plazo Fijo": CurrencyType.ARS,
  "FCI": null,       // User choice
  "Acciones": null,   // User choice
};
// When type changes and enforcement is not null, auto-set currency and disable the select
```

### Pattern 4: Atomic Commit with Investments
**What:** `commitWizardData` already writes `monthlyData.investments: []`. Extend to populate with full `Investment` objects derived from `WizardInvestment[]`
**When to use:** When user confirms wizard
**Example:**
```typescript
// In commitWizardData, map WizardInvestment[] to Investment[]
const investments: Investment[] = data.investments.map(wi => ({
  id: crypto.randomUUID(),
  name: wi.name,
  type: wi.type,
  currencyType: wi.currencyType,
  status: "Activa" as const,
  movements: [{
    id: crypto.randomUUID(),
    date: today,
    type: "aporte" as const,
    amount: wi.amount,
  }],
  currentValue: wi.amount,
  lastUpdated: today,
  createdAt: today,
  ...(wi.tna !== undefined && { tna: wi.tna }),
  ...(wi.plazoDias !== undefined && { plazoDias: wi.plazoDias }),
  ...(wi.type === "Plazo Fijo" && { startDate: today }),
}));
// Then set monthlyData.investments = investments
```

### Pattern 5: Factory Reset via STORAGE_KEYS
**What:** Clear all localStorage keys using the `STORAGE_KEYS` constant, then reload
**When to use:** For "Re-ejecutar wizard" button
**Example:**
```typescript
// STORAGE_KEYS from useDataPersistence.ts
const STORAGE_KEYS = [
  "monthlyData", "globalUsdRate", "salaryHistory",
  "incomeConfig", "recurringExpenses", "budgetData", "lastUsedUsdRate",
];
// Clear all, then window.location.reload()
// ExpenseTracker's useEffect checks !localStorage.getItem("monthlyData") && !localStorage.getItem("salaryHistory")
// → sets showWizard = true → wizard appears
```

### Anti-Patterns to Avoid
- **Reusing InvestmentDialog in wizard:** The dialog has editing concerns, onUpdate callbacks, and expects the full Investment type. Build a simpler inline form instead.
- **Storing wizard investments with IDs:** Don't generate UUIDs until commit time. Keep WizardInvestment simple (no id field).
- **Merge semantics for re-run:** STATE.md explicitly says "Re-run is reset+wizard (not merge)". Do NOT try to preserve existing data during re-run.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Currency enforcement | Custom logic | `CURRENCY_ENFORCEMENT` map from `constants/investments.ts` | Already handles all 4 types correctly |
| Investment object creation | Manual field mapping | Follow `handleAddInvestment` pattern from `useInvestmentsTracker.ts` | Ensures correct shape with movements array |
| localStorage key management | Hardcoded key list | `STORAGE_KEYS` from `useDataPersistence.ts` | Single source of truth, stays in sync |
| Step validation pattern | New pattern | Existing `Record<string, string>` errors pattern | Already used by all other steps |

**Key insight:** Every building block exists. This phase is assembly, not invention.

## Common Pitfalls

### Pitfall 1: Step Numbering Mismatch After Adding Step 4
**What goes wrong:** Summary was step 4, now becomes step 5. Any hardcoded step references break (onEdit callbacks in summary, progress indicator, validateCurrentStep switch).
**Why it happens:** Step numbers are used in multiple places: wizard hook validation, setup-wizard.tsx rendering, summary onEdit callbacks.
**How to avoid:** Update ALL step references: validateCurrentStep switch case (add case 4 for investments), TOTAL_STEPS from 4 to 5, summary onEdit callbacks (income edit goes to step 3, investments edit goes to step 4), progress indicator uses TOTAL_STEPS.
**Warning signs:** Summary "Editar" buttons navigate to wrong step. Progress bar shows wrong count.

### Pitfall 2: Plazo Fijo Missing Fields in Wizard
**What goes wrong:** Plazo Fijo investments require TNA and plazoDias fields. If wizard doesn't collect these, the investment table's auto-calculation breaks.
**Why it happens:** The existing InvestmentDialog shows TNA/plazoDias fields conditionally when type is "Plazo Fijo". The wizard form must do the same.
**How to avoid:** Show TNA and plazoDias inputs when `type === "Plazo Fijo"`. Include them in WizardInvestment and pass through to commit.
**Warning signs:** Plazo Fijo investments show NaN or $0 in the investments table.

### Pitfall 3: Draft Persistence Breaks with New Field
**What goes wrong:** Existing sessionStorage drafts (from phase 11 wizard use) won't have the `investments` field, causing undefined errors.
**Why it happens:** `loadDraft()` parses old draft JSON which lacks the new `investments` field.
**How to avoid:** When loading draft, default `investments` to `[]` if missing: `data.investments ?? []`.
**Warning signs:** Wizard crashes on refresh when draft exists from before this phase.

### Pitfall 4: Re-run Confirmation UX
**What goes wrong:** User accidentally clicks re-run and loses all data.
**Why it happens:** No confirmation dialog before destructive action.
**How to avoid:** Use `window.confirm()` with a clear warning message (same pattern as import: "Esto reemplazara TODOS los datos actuales. Deseas continuar?"). The import button already uses this pattern in ConfigCard.
**Warning signs:** Accidental data loss complaints.

### Pitfall 5: Investments Not Affecting Patrimonio After Wizard
**What goes wrong:** Investments added via wizard have currentValue set but movements aren't counted in balance calculations.
**Why it happens:** The balance calculator in `useMoneyTracker.ts` processes `movements` array per investment. If movements aren't correct, aportes don't subtract from liquid balance.
**How to avoid:** Each wizard investment MUST have an initial movement of type "aporte" with the investment amount, matching the pattern in `handleAddInvestment` from `useInvestmentsTracker.ts`. The `currentValue` must equal the initial amount.
**Warning signs:** After wizard completion, liquid ARS/USD balance doesn't decrease by investment amounts, but patrimonio includes investment values (double-counting).

## Code Examples

Verified patterns from existing codebase:

### Investment Creation (from useInvestmentsTracker.ts lines 30-64)
```typescript
// This is the EXACT pattern commitWizardData must follow
const newInvestment: Investment = {
  id: crypto.randomUUID(),
  name: investmentData.name,
  type: investmentData.type,
  currencyType: investmentData.currencyType,
  status: "Activa",
  movements: [{
    id: crypto.randomUUID(),
    date: now,
    type: "aporte",
    amount: investmentData.initialAmount,
  }],
  currentValue: investmentData.initialAmount,
  lastUpdated: now,
  createdAt: now,
  ...(investmentData.tna !== undefined && { tna: investmentData.tna }),
  ...(investmentData.plazoDias !== undefined && { plazoDias: investmentData.plazoDias }),
  ...(investmentData.type === "Plazo Fijo" && { startDate: now }),
};
```

### Currency Enforcement (from investment-dialog.tsx lines 75-82)
```typescript
// Enforce currency when type changes
useEffect(() => {
  if (selectedType) {
    const enforced = CURRENCY_ENFORCEMENT[selectedType as InvestmentType];
    if (enforced !== null) {
      setSelectedCurrency(enforced);
    }
  }
}, [selectedType]);
```

### First-Time Detection Gate (from expense-tracker.tsx lines 94-99)
```typescript
// This is what triggers wizard display -- re-run relies on this
useEffect(() => {
  if (isHydrated) {
    const hasMonthlyData = localStorage.getItem("monthlyData");
    const hasSalaryHistory = localStorage.getItem("salaryHistory");
    // showWizard = true when both are absent
  }
}, [isHydrated]);
```

### Confirm Before Destructive Action (from config-card.tsx lines 483-487)
```typescript
// Pattern for re-run confirmation
const confirmed = window.confirm(
  "Esto reemplazara TODOS los datos actuales. Deseas continuar?"
);
if (!confirmed) return;
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Merge semantics for re-run | Reset+wizard (not merge) | v1.1 roadmap decision | Simplifies re-run to just clear + reload |

**Deprecated/outdated:**
- Early research suggested re-run with merge semantics (pre-populate, merge data). STATE.md decision explicitly chose reset approach instead.

## Open Questions

1. **Should wizard investments subtract from ARS/USD liquid balance entered in earlier steps?**
   - What we know: In normal app flow, adding an investment creates an "aporte" movement that subtracts from liquid balance. The wizard sets ARS balance via an adjustment transfer.
   - What's unclear: If user enters ARS 100,000 in step 1 and then adds a Plazo Fijo for ARS 50,000 in step 4, should the effective liquid ARS be 50,000?
   - Recommendation: YES -- the wizard should create investment aportes that naturally subtract from liquid balance through the existing calculation engine. The user's ARS balance in step 1 represents their TOTAL liquid cash, and investments come out of that. No special handling needed since the balance calculator already processes investment movements. The summary step should show the net effect.

2. **Should the investments step show Plazo Fijo auto-calculation fields (TNA, plazoDias)?**
   - What we know: InvestmentDialog conditionally shows TNA/plazoDias for Plazo Fijo. The Investment interface has optional tna/plazoDias/startDate fields.
   - What's unclear: Whether this complexity is worth it in the wizard vs. letting users edit after setup.
   - Recommendation: YES, include TNA and plazoDias fields when type is "Plazo Fijo". The requirement says "tipo, nombre, monto, moneda" but Plazo Fijo without TNA is broken (the table tries to auto-calculate value). Keep it consistent with the existing dialog.

## Sources

### Primary (HIGH confidence)
- `hooks/useSetupWizard.ts` - Current wizard hook with WizardData, commitWizardData, step validation
- `hooks/useInvestmentsTracker.ts` - handleAddInvestment pattern (lines 30-64)
- `constants/investments.ts` - INVESTMENT_TYPES, CURRENCY_ENFORCEMENT, CurrencyType
- `hooks/useMoneyTracker.ts` - Investment interface (lines 62-76), MonthlyData (line 154)
- `hooks/useDataPersistence.ts` - STORAGE_KEYS constant (lines 3-11)
- `components/config-card.tsx` - Current Herramientas section, confirm pattern
- `components/expense-tracker.tsx` - First-time detection gate (lines 94-99)
- `components/investment-dialog.tsx` - Currency enforcement UI pattern
- `.planning/STATE.md` - "Re-run is reset+wizard (not merge)" decision

### Secondary (MEDIUM confidence)
- `.planning/research/ARCHITECTURE.md` - Original wizard architecture research
- `.planning/research/PITFALLS.md` - Wizard pitfalls documented

### Tertiary (LOW confidence)
None -- all findings are from direct codebase inspection.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - No new libraries, all patterns exist in codebase
- Architecture: HIGH - Extending well-understood wizard pattern with existing investment infrastructure
- Pitfalls: HIGH - Identified from direct code inspection of step numbering, draft persistence, and balance calculation

**Research date:** 2026-04-02
**Valid until:** 2026-05-02 (stable -- no external dependencies)
