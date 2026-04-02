# Architecture Patterns

**Domain:** Setup wizard integration into existing expense tracker
**Researched:** 2026-04-02

## Recommended Architecture

The wizard is a **gateway layer** between app entry and the existing ExpenseTracker component. It does NOT replace or refactor existing hooks. It collects initial data, writes it to the same localStorage keys the hooks already read, then gets out of the way.

### High-Level Flow

```
app/page.tsx
  |
  v
ExpenseTracker (existing)
  |-- checks: isFirstTime?
  |     YES --> render <SetupWizard onComplete={handleWizardComplete} />
  |     NO  --> render normal tabbed UI
```

### Component Boundaries

| Component | Responsibility | New/Modified | Communicates With |
|-----------|---------------|--------------|-------------------|
| `ExpenseTracker` | Gate wizard vs normal UI based on first-time detection | MODIFIED (minimal) | SetupWizard, useMoneyTracker |
| `SetupWizard` | Multi-step wizard container, step navigation, progress | NEW | WizardStep*, wizard completion callback |
| `WizardStepCurrency` | Collect globalUsdRate | NEW | SetupWizard (parent) |
| `WizardStepBalance` | Collect initial ARS liquid balance | NEW | SetupWizard (parent) |
| `WizardStepUsd` | Collect USD holdings (amount) | NEW | SetupWizard (parent) |
| `WizardStepInvestments` | Collect existing investments (name, type, currency, value) | NEW | SetupWizard (parent) |
| `WizardStepIncome` | Collect employment type, pay day, salary amount | NEW | SetupWizard (parent) |
| `WizardStepSummary` | Review all entered data before committing | NEW | SetupWizard (parent) |
| `useSetupWizard` | Wizard state machine, accumulates data, commits on finish | NEW | localStorage (direct), useMoneyTracker (re-init) |

## First-Time Detection

### Where: inside `ExpenseTracker` component, NOT in a hook

**Detection logic:**
```typescript
const isFirstTime = !localStorage.getItem("monthlyData") 
                 && !localStorage.getItem("salaryHistory");
```

**Why this approach:**
- The `useMoneyTracker` hook already initializes with empty `initialData` when `monthlyData` is absent, so checking for the raw localStorage key is the cleanest signal
- Checking BOTH `monthlyData` AND `salaryHistory` avoids false positives: if either exists, the user has used the app before (or imported data)
- No need for a separate `wizardCompleted` flag -- the presence of data IS the completion signal

**Alternative considered and rejected:** A dedicated `setupCompleted: boolean` localStorage key. This adds a state to maintain, can get out of sync (user clears data but flag persists), and provides no benefit over checking for actual data presence.

### Re-run from Config

The ConfigCard already has export/import buttons. Add a "Re-ejecutar wizard inicial" button that:
1. Opens the wizard as a dialog/overlay (NOT full-page, since data exists)
2. Pre-fills steps with current values where possible
3. On complete, MERGES data (does not wipe existing transactions)

This is a secondary concern. The first-time flow is the priority.

## Data Flow: Wizard Output to Existing Hooks

### The Critical Decision: Write directly to localStorage, then reload hooks

The wizard should **write directly to localStorage** and then trigger a state refresh. Here is why:

**Option A (rejected): Wizard calls hook methods (addSalaryEntry, handleAddInvestment, etc.)**
- Problem: Hooks are instantiated inside `useMoneyTracker`, which is called in `ExpenseTracker`. The wizard renders INSTEAD of the normal UI, so these hooks are either not mounted or would need to be lifted up.
- Problem: Calling multiple hook methods sequentially causes multiple re-renders and intermediate invalid states.
- Problem: The hooks have UI-focused extras (dialog state, editing state, date defaults) that the wizard does not need.

**Option B (recommended): Wizard accumulates all data in local state, then writes to localStorage in one batch**
- The wizard manages its own React state for each step's form data.
- On final "Confirmar", it constructs the exact data shapes that hooks expect and writes them to localStorage.
- After writing, it sets a local state flag or calls a callback that causes ExpenseTracker to re-mount (or at minimum, re-read from localStorage).
- The hooks' `useLocalStorage` initializer picks up the new data on next mount.

### Exact localStorage Writes

The wizard needs to write to these keys (and ONLY these keys):

| localStorage Key | What Wizard Writes | Existing Hook That Reads It |
|------------------|-------------------|----------------------------|
| `monthlyData` | `MonthlyData` with initial investments and optionally an initial ARS adjustment transfer | `useMoneyTracker` via `useLocalStorage` |
| `salaryHistory` | `{ entries: [{ id, effectiveDate: currentMonth, amount, usdRate }] }` | `useSalaryHistory` via `useLocalStorage` |
| `incomeConfig` | `{ employmentType: "dependiente"|"independiente", payDay: number }` | `useSalaryHistory` via `useLocalStorage` |
| `globalUsdRate` | Numeric string (e.g., `"1250"`) | `useCurrencyEngine` via raw `localStorage.getItem` |

### Data Shape Construction

**Step: ARS Balance**
The user enters their current liquid ARS. This becomes an `adjustment_ars` transfer in `monthlyData.transfers`:
```typescript
{
  id: crypto.randomUUID(),
  date: format(new Date(), "yyyy-MM-dd"),
  type: "adjustment_ars",
  amount: arsBalance,  // user input
  description: "Saldo inicial ARS (wizard)",
  createdAt: new Date().toISOString(),
}
```
This is the correct pattern because the app calculates ARS balance from income minus expenses plus adjustments. An initial balance is literally an adjustment.

**Step: USD Holdings**
Register as an untracked USD purchase in `monthlyData.usdPurchases`:
```typescript
{
  id: crypto.randomUUID(),
  date: format(new Date(), "yyyy-MM-dd"),
  arsAmount: 0,
  usdAmount: usdHoldings,  // user input
  purchaseRate: 0,
  origin: "untracked",
  description: "Saldo inicial USD (wizard)",
}
```
This matches the existing `handleRegisterUntrackedUsd` pattern exactly -- untracked USD enters the system without reducing ARS.

**Step: USD Rate**
```typescript
localStorage.setItem("globalUsdRate", String(usdRate));
```
Direct numeric storage matching `useCurrencyEngine` expectations.

**Step: Investments**
Each investment the user adds becomes an `Investment` object:
```typescript
{
  id: crypto.randomUUID(),
  name: investmentName,
  type: investmentType,  // "FCI" | "Crypto" | "Plazo fijo" | "Acciones" | "Otro"
  currencyType: currency,
  status: "Activa",
  movements: [{
    id: crypto.randomUUID(),
    date: format(new Date(), "yyyy-MM-dd"),
    type: "aporte",
    amount: currentValue,  // simplified: single movement = current value
  }],
  currentValue: currentValue,
  lastUpdated: format(new Date(), "yyyy-MM-dd"),
  createdAt: format(new Date(), "yyyy-MM-dd"),
}
```

**Step: Income config**
```typescript
// salaryHistory key
{ entries: [{ id: crypto.randomUUID(), effectiveDate: format(new Date(), "yyyy-MM"), amount: salaryAmount, usdRate: globalUsdRate }] }

// incomeConfig key
{ employmentType: "dependiente" | "independiente", payDay: payDayNumber }
```

### Triggering Hook Re-initialization

After writing all keys to localStorage, the wizard needs to force hooks to re-read. Two approaches:

**Approach A (simplest): `window.location.reload()`**
- This is what `importData` already does. It works. It is ugly but pragmatic.
- The entire app re-mounts, all `useLocalStorage` hooks re-initialize from the now-populated localStorage.

**Approach B (recommended): Callback + key remount**
- The wizard calls `onComplete()` which sets a state in ExpenseTracker.
- ExpenseTracker uses a `key` prop on its main content to force remount:
  ```typescript
  const [mountKey, setMountKey] = useState(0);
  // After wizard completes:
  setMountKey(k => k + 1);
  ```
- This is cleaner than a full page reload and feels instant.
- However: `useCurrencyEngine` reads `globalUsdRate` from localStorage in a `useEffect`, so it will pick it up on mount. `useSalaryHistory` uses `useLocalStorage`, so it will also pick up from the fresh mount.

**Problem with Approach B:** `useMoneyTracker` is called unconditionally at the top of ExpenseTracker. When the wizard is shown, the hook still runs and initializes empty state. After wizard writes to localStorage, we need the hook to re-read.

**Solution:** The wizard writes to localStorage, then calls a callback. The callback triggers a **full component remount** by changing a React key on the entire ExpenseTracker subtree. This means the parent (`page.tsx`) holds the remount key:

```typescript
// app/page.tsx
export default function Home() {
  const [appKey, setAppKey] = useState(0);
  return <ExpenseTracker key={appKey} onWizardComplete={() => setAppKey(k => k + 1)} />;
}
```

This is clean, no page reload, and all hooks re-initialize from localStorage.

## Wizard State Machine

```
Step 1: Income Config    (employment type, pay day, salary)
Step 2: Currency         (USD rate)  
Step 3: ARS Balance      (current liquid ARS)
Step 4: USD Holdings     (current USD amount)
Step 5: Investments      (0..N investments with name, type, currency, value)
Step 6: Summary          (review all, confirm)
```

**Step ordering rationale:**
1. Income first because it is the most universally applicable (everyone has income)
2. USD rate second because steps 3-5 may reference it for display
3. ARS/USD balances next as the core financial snapshot
4. Investments last before summary because they are optional and more complex
5. Summary always last

**State management inside wizard:**
```typescript
interface WizardData {
  // Step 1
  employmentType: "dependiente" | "independiente";
  payDay: number;
  salaryAmount: number;
  // Step 2
  globalUsdRate: number;
  // Step 3
  arsBalance: number;
  // Step 4
  usdHoldings: number;
  // Step 5
  investments: Array<{
    name: string;
    type: InvestmentType;
    currencyType: CurrencyType;
    currentValue: number;
  }>;
}
```

Simple `useState` for this -- no need for useReducer or external state management. The wizard is linear and ephemeral.

## Patterns to Follow

### Pattern 1: Batch Write to localStorage
**What:** Accumulate all wizard data in React state, write ALL localStorage keys in a single synchronous block on "Confirmar".
**When:** Wizard completion.
**Why:** Avoids intermediate states where some keys are written but not others. Mirrors how `importData` works.
**Example:**
```typescript
function commitWizardData(data: WizardData) {
  const today = format(new Date(), "yyyy-MM-dd");
  const currentMonth = format(new Date(), "yyyy-MM");

  // 1. Build monthlyData
  const monthlyData: MonthlyData = {
    salaries: {},
    expenses: [],
    extraIncomes: [],
    investments: data.investments.map(inv => ({
      id: crypto.randomUUID(),
      name: inv.name,
      type: inv.type,
      currencyType: inv.currencyType,
      status: "Activa" as const,
      movements: [{ id: crypto.randomUUID(), date: today, type: "aporte" as const, amount: inv.currentValue }],
      currentValue: inv.currentValue,
      lastUpdated: today,
      createdAt: today,
    })),
    usdPurchases: data.usdHoldings > 0 ? [{
      id: crypto.randomUUID(),
      date: today,
      arsAmount: 0,
      usdAmount: data.usdHoldings,
      purchaseRate: 0,
      origin: "untracked" as const,
      description: "Saldo inicial USD (wizard)",
    }] : [],
    transfers: data.arsBalance !== 0 ? [{
      id: crypto.randomUUID(),
      date: today,
      type: "adjustment_ars" as const,
      amount: data.arsBalance,
      description: "Saldo inicial ARS (wizard)",
      createdAt: new Date().toISOString(),
    }] : [],
    loans: [],
    _migrationVersion: 7,  // Current version, skip all migrations
  };

  // 2. Write all keys
  localStorage.setItem("monthlyData", JSON.stringify(monthlyData));
  localStorage.setItem("globalUsdRate", String(data.globalUsdRate));
  localStorage.setItem("salaryHistory", JSON.stringify({
    entries: data.salaryAmount > 0 ? [{
      id: crypto.randomUUID(),
      effectiveDate: currentMonth,
      amount: data.salaryAmount,
      usdRate: data.globalUsdRate,
    }] : [],
  }));
  localStorage.setItem("incomeConfig", JSON.stringify({
    employmentType: data.employmentType,
    payDay: data.payDay,
  }));
}
```

### Pattern 2: Wizard as Conditional Render in ExpenseTracker
**What:** ExpenseTracker checks for first-time state and renders either SetupWizard or normal UI.
**When:** Component mount.
**Why:** Minimal changes to existing architecture. No new routes, no new layout nesting. The wizard is a view mode of the same page.
**Example:**
```typescript
// Inside ExpenseTracker
const [showWizard, setShowWizard] = useState(() => {
  if (typeof window === "undefined") return false;
  return !localStorage.getItem("monthlyData") && !localStorage.getItem("salaryHistory");
});

if (showWizard) {
  return <SetupWizard onComplete={() => onWizardComplete()} />;
}
// ... normal UI
```

### Pattern 3: Step Components as Controlled Forms
**What:** Each wizard step is a component receiving current values and an `onChange` callback.
**When:** Every step.
**Why:** Parent (SetupWizard) owns all state. Steps are pure presentation + form logic.
**Example:**
```typescript
interface WizardStepProps<T> {
  value: T;
  onChange: (value: T) => void;
  onNext: () => void;
  onBack?: () => void;
}
```

## Anti-Patterns to Avoid

### Anti-Pattern 1: Lifting useMoneyTracker Above the Wizard
**What:** Moving the hook call to a parent so both wizard and normal UI can share it.
**Why bad:** `useMoneyTracker` returns 80+ values, initializes 8 sub-hooks, manages dialog states. The wizard needs none of this. Lifting it means running all that logic while the wizard is showing.
**Instead:** Let the wizard write to localStorage directly. The hook initializes correctly on next mount.

### Anti-Pattern 2: Creating a Separate `wizardCompleted` localStorage Key
**What:** Storing a boolean flag to track whether wizard has run.
**Why bad:** Gets out of sync if user clears data or imports. Now you have two sources of truth for "has user onboarded."
**Instead:** Detect first-time from absence of actual data keys.

### Anti-Pattern 3: Wizard Writing Through Hook Methods
**What:** Making the wizard call `handleAddInvestment`, `setGlobalUsdRate`, `addSalaryEntry` etc.
**Why bad:** These methods trigger individual state updates with re-renders, manage UI state (dialogs), and assume the component tree is fully mounted. The wizard is a different lifecycle.
**Instead:** Batch write to localStorage, then remount.

### Anti-Pattern 4: New Route for Wizard (`/setup`)
**What:** Creating `app/setup/page.tsx` with its own layout.
**Why bad:** This is a single-page app by design. Adding routes means dealing with navigation, back button, route guards. Overkill for a one-time wizard.
**Instead:** Conditional render inside ExpenseTracker.

## File Organization

```
components/
  setup-wizard/
    setup-wizard.tsx          # Container: step navigation, progress bar, state
    wizard-step-income.tsx    # Employment type, pay day, salary
    wizard-step-currency.tsx  # USD exchange rate
    wizard-step-balance.tsx   # ARS liquid balance
    wizard-step-usd.tsx       # USD holdings
    wizard-step-investments.tsx  # Investment list builder
    wizard-step-summary.tsx   # Review and confirm
hooks/
  useSetupWizard.ts           # Wizard state, localStorage commit logic
```

## Build Order (Dependency-Aware)

| Order | Component | Depends On | Rationale |
|-------|-----------|------------|-----------|
| 1 | `useSetupWizard` hook | Nothing new | Core logic: WizardData type, commitWizardData function, step validation. Build and test in isolation. |
| 2 | `SetupWizard` container | useSetupWizard | Step navigation, progress indicator. Can use stub steps initially. |
| 3 | `WizardStepIncome` | SetupWizard (interface) | Simple form, tests salary/employment data shape. |
| 4 | `WizardStepCurrency` | SetupWizard (interface) | Single input, validates USD rate. |
| 5 | `WizardStepBalance` | SetupWizard (interface) | Single input, validates ARS amount. |
| 6 | `WizardStepUsd` | SetupWizard (interface) | Single input, validates USD amount. |
| 7 | `WizardStepInvestments` | SetupWizard (interface) | Most complex step: dynamic list of investments. Build last among steps. |
| 8 | `WizardStepSummary` | All step data shapes | Reads all accumulated data, shows formatted review. |
| 9 | Integration into ExpenseTracker | All above | Wire up first-time detection, conditional render, remount callback. |
| 10 | Re-run from ConfigCard | SetupWizard, existing ConfigCard | Secondary: add button, open wizard as overlay with pre-fill. |

## Migration Version Compatibility

**Critical detail:** The wizard must write `_migrationVersion: 7` (current version) into the monthlyData object. Without this, `migrateData()` will attempt to run all migrations on wizard-generated data, which could corrupt it (e.g., the v3 USD reversal migration would incorrectly modify amounts).

## Integration Points Summary

| Existing Code | Change Type | What Changes |
|---------------|-------------|--------------|
| `app/page.tsx` | MODIFIED | Add `appKey` state + `onWizardComplete` prop for remounting |
| `components/expense-tracker.tsx` | MODIFIED | Add first-time detection, conditional wizard render, accept `onWizardComplete` prop |
| `components/config-card.tsx` | MODIFIED | Add "Re-ejecutar wizard" button (phase 2) |
| `hooks/useLocalStorage.ts` | NO CHANGE | Already works as-is |
| `hooks/useMoneyTracker.ts` | NO CHANGE | Already initializes from localStorage correctly |
| `hooks/useSalaryHistory.ts` | NO CHANGE | Already reads from localStorage on mount |
| `hooks/useCurrencyEngine.ts` | NO CHANGE | Already reads globalUsdRate from localStorage on mount |
| `hooks/useDataPersistence.ts` | NO CHANGE | Export/import unaffected |
| All other hooks | NO CHANGE | Fed by useMoneyTracker, unaffected |

**Zero hooks modified.** The wizard writes data in the same format hooks expect, then the app remounts and hooks pick up the data. This is the least invasive integration possible.

## Sources

- Codebase analysis: `hooks/useMoneyTracker.ts` (lines 164-296 for migration and init)
- Codebase analysis: `hooks/useLocalStorage.ts` (full file, 36 lines)
- Codebase analysis: `hooks/useSalaryHistory.ts` (lines 136-190 for hook interface)
- Codebase analysis: `hooks/useCurrencyEngine.ts` (lines 9-21 for globalUsdRate storage)
- Codebase analysis: `hooks/useDataPersistence.ts` (full file, storage keys and import pattern)
- Codebase analysis: `.planning/codebase/ARCHITECTURE.md` (existing architecture documentation)
- Confidence: HIGH -- all findings verified directly from source code

---

*Architecture analysis: 2026-04-02*
