# Phase 11: Core Setup Wizard - Research

**Researched:** 2026-04-02
**Domain:** Multi-step first-time setup wizard for localStorage-based personal finance SPA
**Confidence:** HIGH

## Summary

Phase 11 implements a first-time setup wizard that detects new users (no data in localStorage) and guides them through configuring their initial financial situation. The wizard collects ARS balance, USD holdings with exchange rate, and income configuration (salary, employment type, pay day) across distinct steps, shows a summary for confirmation, then writes all data atomically to localStorage in a single batch. Users can skip optional steps (USD, income) and complete with only ARS balance. An import-from-JSON alternative is offered on the welcome screen.

The wizard requires zero new npm packages. All UI is built with existing shadcn/ui components (Dialog, Button, Input, Select, Card) plus a custom `useSetupWizard` hook. The architecture follows the "gateway layer" pattern: `ExpenseTracker` checks for first-time state, renders `<SetupWizard />` instead of the normal tabbed UI, and the wizard writes directly to localStorage before triggering a component remount via a React key change in `app/page.tsx`. No existing hooks are modified.

The primary risks are: (1) partial localStorage writes if the wizard crashes mid-commit, (2) missing `_migrationVersion: 7` causing data corruption on next load, and (3) SSR hydration mismatch when checking localStorage for first-time detection. All three have established mitigation patterns documented in the v1.1 pre-research.

**Primary recommendation:** Build the wizard as a conditional render inside ExpenseTracker with an atomic `commitWizardData()` function that writes all localStorage keys in one synchronous block, then remount the app via a key change on the ExpenseTracker component.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| WIZ-01 | User sees wizard automatically on first open (no localStorage data) | First-time detection via checking absence of both `monthlyData` AND `salaryHistory` keys. Conditional render in ExpenseTracker. useHydration pattern prevents SSR mismatch. |
| WIZ-02 | User can enter ARS liquid balance in wizard | Single Input field. Saved as `adjustment_ars` transfer in monthlyData.transfers with description "Saldo inicial ARS (wizard)". Value >= 0. |
| WIZ-03 | User can enter USD holdings + exchange rate in wizard | Two Input fields (USD amount + cotizacion). USD saved as untracked purchase in monthlyData.usdPurchases. Rate saved to `globalUsdRate` localStorage key. |
| WIZ-04 | User can enter income config (salary, employment type, pay day) in wizard | Three fields: amount (Input), employment type (Select: dependiente/independiente), pay day (Input 1-31). Saved to `salaryHistory` and `incomeConfig` localStorage keys. |
| WIZ-06 | User sees summary and confirms before data is saved | Summary step renders all entered data read-only. "Confirmar" button triggers `commitWizardData()`. "Editar" links navigate back to each step. |
| WIZ-07 | Wizard saves all data atomically (todo o nada) | `commitWizardData()` writes all localStorage keys in one synchronous block. No hook methods called during wizard steps. Draft state in React useState only. |
| WIZ-08 | User can skip optional steps (USD, income) | ARS balance is the only required step. USD and income steps have "Omitir" button that advances to next step with default/zero values. |
| WIZ-09 | Welcome screen offers import JSON as alternative | Welcome step shows two paths: "Configurar desde cero" (start wizard) and "Importar backup" (triggers existing `importData` function from useDataPersistence). Import reuses existing validation and triggers `window.location.reload()`. |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| shadcn/ui Dialog | installed | Wizard container (modal overlay) | Already used for 8 other dialogs in the project |
| shadcn/ui Button | installed | Navigation (next/back/skip/confirm) | Project standard for all interactive buttons |
| shadcn/ui Input | installed | Numeric fields (balance, salary, rate) | Project standard for all form inputs |
| shadcn/ui Select | installed | Employment type dropdown | Project standard for selection fields |
| shadcn/ui Card | installed | Summary step layout | Project standard for card sections |
| useState | React built-in | Wizard step state, draft data | Project pattern for all form state management |
| sessionStorage | Web API | Draft persistence across page refresh | Survives refresh within tab, clears on tab close |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| date-fns format | ^4.1.0 (installed) | Date formatting for wizard-created entries | When constructing date strings for transfers, purchases, salary entries |
| lucide-react | ^0.454.0 (installed) | Icons for wizard UI (ArrowRight, Check, Upload, etc.) | Step indicators and navigation buttons |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Custom useWizard hook | react-hook-form + zod | Would create a second form pattern (8 existing dialogs use useState). Not worth it for 4 steps. |
| Custom StepIndicator | shadcn-stepper (community) | External dependency for ~20 lines of Tailwind. Not in official registry. |
| CSS transitions | framer-motion | 32KB+ for cosmetic step transitions. Disproportionate. |
| useState | useReducer / Zustand | 4 linear steps with simple state. useState is sufficient. |

**Installation:**
```bash
# No new packages needed. All dependencies already installed.
```

## Architecture Patterns

### Recommended Project Structure
```
components/
  setup-wizard/
    setup-wizard.tsx           # Container: step nav, progress, state
    wizard-step-welcome.tsx    # Welcome + import alternative (WIZ-09)
    wizard-step-balance.tsx    # ARS liquid balance (WIZ-02)
    wizard-step-usd.tsx        # USD holdings + rate (WIZ-03)
    wizard-step-income.tsx     # Employment, salary, pay day (WIZ-04)
    wizard-step-summary.tsx    # Review + confirm (WIZ-06)
hooks/
  useSetupWizard.ts            # WizardData type, commitWizardData(), step validation
```

### Pattern 1: Conditional Wizard Gate
**What:** ExpenseTracker checks first-time state and renders SetupWizard or normal UI
**When to use:** On every component mount
**Example:**
```typescript
// Inside ExpenseTracker
const isHydrated = useHydration();
const [showWizard, setShowWizard] = useState(false);

useEffect(() => {
  if (isHydrated) {
    const hasData = localStorage.getItem("monthlyData") || localStorage.getItem("salaryHistory");
    setShowWizard(!hasData);
  }
}, [isHydrated]);

if (!isHydrated) return null; // Prevent SSR mismatch
if (showWizard) {
  return <SetupWizard onComplete={() => onWizardComplete()} onImport={handleImport} />;
}
// ... normal tabbed UI
```

### Pattern 2: Atomic Batch Write
**What:** All localStorage writes happen in one synchronous block on final confirmation
**When to use:** Only when user clicks "Confirmar" on summary step
**Example:**
```typescript
function commitWizardData(data: WizardData) {
  const today = format(new Date(), "yyyy-MM-dd");
  const currentMonth = format(new Date(), "yyyy-MM");

  // Build monthlyData
  const monthlyData = {
    salaries: {},
    expenses: [],
    extraIncomes: [],
    investments: [],
    usdPurchases: data.usdAmount > 0 ? [{
      id: crypto.randomUUID(),
      date: today,
      arsAmount: 0,
      usdAmount: data.usdAmount,
      purchaseRate: 0,
      origin: "untracked" as const,
      description: "Saldo inicial USD (wizard)",
    }] : [],
    transfers: data.arsBalance > 0 ? [{
      id: crypto.randomUUID(),
      date: today,
      type: "adjustment_ars" as const,
      amount: data.arsBalance,
      description: "Saldo inicial ARS (wizard)",
      createdAt: new Date().toISOString(),
    }] : [],
    loans: [],
    salaryOverrides: {},
    aguinaldoOverrides: {},
    _migrationVersion: 7,
  };

  // Write ALL keys in one synchronous block
  localStorage.setItem("monthlyData", JSON.stringify(monthlyData));
  localStorage.setItem("globalUsdRate", String(data.globalUsdRate || 0));
  localStorage.setItem("salaryHistory", JSON.stringify({
    entries: data.salaryAmount > 0 ? [{
      id: crypto.randomUUID(),
      effectiveDate: currentMonth,
      amount: data.salaryAmount,
      usdRate: data.globalUsdRate || 0,
    }] : [],
  }));
  localStorage.setItem("incomeConfig", JSON.stringify({
    employmentType: data.employmentType || "dependiente",
    payDay: data.payDay || 1,
  }));
  localStorage.setItem("recurringExpenses", JSON.stringify([]));
  localStorage.setItem("budgetData", JSON.stringify({}));
  localStorage.setItem("lastUsedUsdRate", String(data.globalUsdRate || 0));
}
```

### Pattern 3: Key-Based Remount
**What:** Parent changes a React key to force full component remount after wizard completion
**When to use:** After commitWizardData() writes to localStorage
**Example:**
```typescript
// app/page.tsx
export default function Home() {
  const [appKey, setAppKey] = useState(0);
  return (
    <div className="relative w-full">
      <div className="z-[20] relative">
        <ExpenseTracker
          key={appKey}
          onWizardComplete={() => setAppKey(k => k + 1)}
        />
      </div>
      {/* background gradient */}
    </div>
  );
}
```

### Pattern 4: Controlled Step Forms
**What:** Each wizard step receives current values and reports changes upward
**When to use:** Every wizard step component
**Example:**
```typescript
interface WizardStepProps<T> {
  value: T;
  onChange: (value: T) => void;
  onNext: () => void;
  onBack?: () => void;
  onSkip?: () => void;
}
```

### Anti-Patterns to Avoid
- **Calling hook methods from wizard steps:** Never call `handleAddInvestment`, `setGlobalUsdRate`, `addSalaryEntry` etc. from wizard steps. These trigger individual state updates and assume the full component tree is mounted.
- **Writing to localStorage per-step:** Creates partial state if user abandons wizard. Only write on final "Confirmar".
- **Dedicated `wizardCompleted` flag:** Gets out of sync when user clears data or imports a backup. Detecting actual data presence is the correct signal.
- **Creating a new route (`/setup`):** This is a single-page app. Adding routes means navigation, back button, route guards. Overkill.
- **Lifting useMoneyTracker above the wizard:** The hook returns 80+ values and initializes 8 sub-hooks. The wizard needs none of this.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Initial ARS balance | Custom `initialBalance` field in monthlyData | `adjustment_ars` transfer | The balance calculation engine already sums adjustments. Adding a new field means modifying calculation logic. Use the existing pattern. |
| Initial USD balance | Custom `initialUsdBalance` field | Untracked USD purchase (`origin: "untracked"`) | Matches existing `handleRegisterUntrackedUsd` pattern exactly. Appears correctly in exchange summary. |
| Data import in wizard | New import logic | Existing `importData` from `useDataPersistence` | Already validates envelope, writes all keys, triggers reload. Just expose it on the welcome screen. |
| Step validation | Complex validation framework | Inline `useState<Record<string, string>>` errors | Project pattern used by all 8 existing dialogs. Consistent and sufficient for 1-3 fields per step. |

**Key insight:** The wizard creates data using existing data patterns (adjustment transfers, untracked purchases, salary history entries). It does NOT introduce new data structures. This means zero changes to calculation logic, export/import, or any existing hook.

## Common Pitfalls

### Pitfall 1: SSR Hydration Mismatch
**What goes wrong:** Wizard visibility depends on localStorage (client-only). Server renders "no wizard", client detects first-time and renders wizard. React throws hydration error.
**Why it happens:** Next.js App Router renders on server first where localStorage is unavailable.
**How to avoid:** Use existing `useHydration` hook. Set `showWizard` state in a `useEffect` after hydration, not in `useState` initializer. Return `null` until hydrated.
**Warning signs:** Console hydration mismatch warnings. Wizard flash on first load.

### Pitfall 2: Missing `_migrationVersion` on Wizard Data
**What goes wrong:** Wizard creates monthlyData without `_migrationVersion: 7`. On next load, `migrateData()` runs all migrations on wizard data, potentially corrupting USD amounts (v3 migration reverses USD-to-ARS conversion).
**Why it happens:** Developer constructs monthlyData object but forgets the migration version field.
**How to avoid:** Always include `_migrationVersion: 7` in the monthlyData object built by `commitWizardData()`. Test by checking localStorage after wizard completion.
**Warning signs:** Amounts change after page reload. USD investments show wrong values.

### Pitfall 3: Wizard Abandonment Leaves Partial State
**What goes wrong:** User starts wizard, enters ARS balance, then closes the tab or navigates away. If data was written per-step, localStorage now has partial state.
**Why it happens:** Wizard steps call localStorage methods directly instead of accumulating in a draft.
**How to avoid:** Never write to localStorage until the final "Confirmar" click. All intermediate state lives in React useState only. sessionStorage draft is optional insurance for refresh resilience.
**Warning signs:** Wizard steps call `setMonthlyData` or `localStorage.setItem` directly.

### Pitfall 4: Import Path Not Triggering Proper Reload
**What goes wrong:** User chooses "Import backup" from the welcome screen. Import succeeds but the wizard still shows because the component did not remount.
**Why it happens:** The existing `importData` function calls `window.location.reload()`, which works. But if the developer adds a new import path without the reload, the wizard state is stale.
**How to avoid:** Reuse the exact existing `importData` function from `useDataPersistence`. It already handles validation, localStorage writes, and page reload. Do not reimplement import logic.
**Warning signs:** After import, wizard is still visible. Or import button does nothing visible.

### Pitfall 5: ARS Balance of Zero Creates No Adjustment
**What goes wrong:** User enters 0 for ARS balance (valid -- maybe they genuinely have $0). The wizard skips creating the adjustment transfer because `arsBalance > 0` is false. Later, user enters income and the balance calculation works correctly (starts from 0). This is actually correct behavior, but must be intentional.
**Why it happens:** Conditional logic that only creates the transfer for positive balances.
**How to avoid:** Use `arsBalance !== 0` (or always create the transfer) rather than `arsBalance > 0`. A user with $0 ARS is valid. However, creating a $0 adjustment transfer is also harmless and makes the wizard completion more explicit in the data.
**Warning signs:** None in the happy path. Edge case: user enters 0, expects to see "Saldo inicial" in movements table -- it may or may not appear depending on filter logic.

### Pitfall 6: page.tsx Needs to Become Client Component for Key State
**What goes wrong:** `app/page.tsx` is currently a Server Component. Adding `useState` for the remount key requires converting it to a client component or creating a wrapper.
**Why it happens:** Next.js App Router pages are Server Components by default.
**How to avoid:** Either: (a) add `"use client"` to `app/page.tsx` (simplest, page is trivial), or (b) create a client wrapper component that holds the key state.
**Warning signs:** Build error: "useState is not allowed in Server Components."

## Code Examples

Verified patterns from existing codebase:

### First-Time Detection (Using Existing Pattern)
```typescript
// Source: hooks/useHydration.ts + hooks/useLocalStorage.ts analysis
const isHydrated = useHydration();
const [showWizard, setShowWizard] = useState(false);

useEffect(() => {
  if (isHydrated) {
    const hasMonthlyData = localStorage.getItem("monthlyData");
    const hasSalaryHistory = localStorage.getItem("salaryHistory");
    setShowWizard(!hasMonthlyData && !hasSalaryHistory);
  }
}, [isHydrated]);
```

### Import Alternative (Reusing Existing Code)
```typescript
// Source: hooks/useDataPersistence.ts (lines 103-147)
// The welcome step can reuse the exact same importData function:
const { importData } = useDataPersistence();
const fileInputRef = useRef<HTMLInputElement>(null);

const handleImportClick = () => fileInputRef.current?.click();
const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (file) {
    const result = await importData(file);
    if (!result.success) alert(result.error);
    // importData already calls window.location.reload() on success
  }
};
```

### WizardData Type
```typescript
// Source: architecture analysis of all localStorage keys
interface WizardData {
  // Step: ARS Balance (required)
  arsBalance: number;
  // Step: USD (optional, skippable)
  usdAmount: number;
  globalUsdRate: number;
  // Step: Income (optional, skippable)
  employmentType: "dependiente" | "independiente";
  payDay: number;
  salaryAmount: number;
}

const INITIAL_WIZARD_DATA: WizardData = {
  arsBalance: 0,
  usdAmount: 0,
  globalUsdRate: 0,
  employmentType: "dependiente",
  payDay: 1,
  salaryAmount: 0,
};
```

### sessionStorage Draft Persistence
```typescript
// Source: Web Storage API standard pattern
const DRAFT_KEY = "wizardDraft";

function saveDraft(data: WizardData, currentStep: number) {
  sessionStorage.setItem(DRAFT_KEY, JSON.stringify({ data, step: currentStep }));
}

function loadDraft(): { data: WizardData; step: number } | null {
  const raw = sessionStorage.getItem(DRAFT_KEY);
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

function clearDraft() {
  sessionStorage.removeItem(DRAFT_KEY);
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Wizard npm packages (react-wizard, react-multistep) | Custom hook + shadcn/ui components | 2024+ | Community consensus shifted toward lightweight custom implementations for simple linear wizards |
| react-hook-form + zod for all forms | Project uses useState + FormData consistently | Project convention | Adding RHF for wizard alone would create inconsistency. Either migrate all forms or stay consistent. |
| Dedicated `setupCompleted` flag | Detect first-time from data absence | Architecture decision | Avoids sync issues between flag and actual data state |

**Deprecated/outdated:**
- `react-multistep`: Last meaningful update 2023. Not worth a dependency for 4 steps.
- `shadcn-stepper` (community): Not in official shadcn/ui registry. Adds unnecessary external dependency.

## Open Questions

1. **Should ARS balance accept zero or require > 0?**
   - What we know: User may genuinely have $0 ARS. The app supports $0 balance.
   - What's unclear: Should the wizard still create a $0 adjustment transfer, or skip it?
   - Recommendation: Accept 0 as valid. Skip creating the adjustment transfer if arsBalance is 0 (no net effect). The step should still be shown but allow "0" as input.

2. **Should the welcome step be its own step or a pre-wizard screen?**
   - What we know: WIZ-09 requires import alternative on the welcome screen. The wizard has a progress indicator.
   - What's unclear: Does the welcome screen count as "Step 1" in the progress indicator, or is it a pre-step?
   - Recommendation: Make welcome a pre-step (step 0) that does not appear in the progress indicator count. Progress shows "Step 1 of 4" starting from ARS balance. This keeps the progress indicator meaningful.

3. **Step ordering: ARS first or Income first?**
   - What we know: Architecture research suggested income first (most universal). Feature research suggested ARS first (most important datum).
   - What's unclear: Which ordering produces better user flow.
   - Recommendation: Follow the requirement ordering -- ARS balance first (WIZ-02), then USD (WIZ-03), then income (WIZ-04). This follows the data dependency chain (balance establishes context, income is additional detail). Also matches WIZ-08 which says "only ARS balance" is the minimum, making it natural as step 1.

4. **Should `page.tsx` become a client component or use a wrapper?**
   - What we know: The current `page.tsx` is a Server Component. The key-based remount requires `useState`.
   - What's unclear: Whether converting page.tsx to client component has side effects.
   - Recommendation: Convert `page.tsx` to client component with `"use client"`. The page is trivial (renders ExpenseTracker + a background div). No SEO or server-side concerns apply. Alternatively, use `window.location.reload()` like import does -- simpler, avoids changing page.tsx at all.

## Sources

### Primary (HIGH confidence)
- Codebase analysis: `hooks/useMoneyTracker.ts` -- MonthlyData type, migrateData function, _migrationVersion field
- Codebase analysis: `hooks/useLocalStorage.ts` -- useState initializer reads from localStorage on mount
- Codebase analysis: `hooks/useDataPersistence.ts` -- STORAGE_KEYS, importData with window.location.reload()
- Codebase analysis: `hooks/useCurrencyEngine.ts` -- globalUsdRate stored as separate key, read on mount
- Codebase analysis: `hooks/useSalaryHistory.ts` -- salaryHistory and incomeConfig localStorage keys
- Codebase analysis: `hooks/useHydration.ts` -- established SSR hydration pattern
- Codebase analysis: `constants/investments.ts` -- CURRENCY_ENFORCEMENT (not needed in Phase 11 but documented)
- Codebase analysis: `components/expense-tracker.tsx` -- handleResetAllData shows all localStorage keys to clear
- Codebase analysis: `app/page.tsx` -- current Server Component structure

### Secondary (MEDIUM confidence)
- `.planning/research/SUMMARY.md` -- v1.1 pre-research with architecture recommendations
- `.planning/research/ARCHITECTURE.md` -- detailed data flow and component boundary analysis
- `.planning/research/PITFALLS.md` -- 8 identified pitfalls with prevention strategies
- `.planning/research/STACK.md` -- technology decisions and alternatives analysis
- `.planning/research/FEATURES.md` -- feature landscape and anti-features

### Tertiary (LOW confidence)
- None. All findings verified against codebase and existing research.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - verified all components exist in project, zero new dependencies needed
- Architecture: HIGH - integration points verified directly from source code, patterns match existing codebase conventions
- Pitfalls: HIGH - derived from codebase analysis and existing v1.1 pre-research, all prevention strategies tied to actual code paths

**Research date:** 2026-04-02
**Valid until:** 2026-05-02 (stable -- no external dependencies, all patterns internal to project)
