# Technology Stack: Setup Wizard & Onboarding

**Project:** Expense Tracker v1.1 — Setup Wizard & Manual
**Researched:** 2026-04-02
**Mode:** Ecosystem (focused on new capabilities only)

## Recommendation: Build with Existing Stack, Zero New Dependencies

The wizard is a 4-5 step linear form flow inside a Dialog. The project already has Dialog, Button, Input, Select, Card, and manual useState-based validation. Adding a wizard/stepper library for this single use case is unnecessary overhead.

**Verdict:** Build the wizard with existing shadcn/ui components + a custom `useWizard` hook. No new npm packages needed.

## Rationale

### Why NOT add a stepper/wizard library

| Library Considered | Why Not |
|---|---|
| `shadcn-stepper` (damianricobelli) | Community component, not in official shadcn/ui registry. Adds external dependency for a single-use component. The visual stepper indicator is trivial to build with Tailwind. |
| `react-multistep` | 1.4KB but opinionated layout. Last meaningful update 2023. Not worth a dependency. |
| `react-form-wizard-component` | Heavy for what we need. Designed for complex branching wizards, not a simple linear setup. |
| `react-hook-form` + `zod` | The project uses zero form libraries — every dialog uses native FormData + useState validation. Adding RHF+Zod for one wizard while 8 existing dialogs use manual validation creates inconsistency. Not worth introducing for a 4-step form. |

### Why building custom is the right call

1. **Consistency:** All 8 existing dialogs (investment, loan, budget, transfer, adjustment, recurring, usd-purchase) use the same pattern: `useState` + `FormData` + inline error state. The wizard should follow the same pattern.
2. **Simplicity:** The wizard is linear (no branching), has 4-5 steps, and each step has 1-3 fields. This is not a complex form problem.
3. **Reusability:** A `useWizard` hook is ~30 lines. A `StepIndicator` component is ~20 lines of Tailwind. Both are reusable if future wizards are needed.
4. **Bundle size:** Zero additional JS. The Dialog, Button, Input, Select components already exist.

## Recommended Stack (New Components Only)

### New Custom Components to Build

| Component | Purpose | Built With |
|---|---|---|
| `useWizard` hook | Step state, navigation (next/back/goTo), validation gate per step | `useState` |
| `SetupWizard` | Main wizard container, renders inside Dialog | Dialog + Card |
| `StepIndicator` | Visual progress dots/numbers showing current step | Tailwind CSS (div + conditional classes) |
| `WizardStep` | Wrapper for each step's content | Simple div with transition |

### Existing Components Used As-Is

| Component | Role in Wizard |
|---|---|
| `Dialog` / `DialogContent` | Wizard container (modal overlay) |
| `Button` | Next/Back/Finish navigation |
| `Input` | ARS balance, USD balance, cotizacion, investment amounts |
| `Select` | Investment type, currency selection |
| `Card` | Summary step layout |

### First-Time Detection

No library needed. Detection logic:

```typescript
// In useMoneyTracker or a new useOnboarding hook
const isFirstTime = (): boolean => {
  // Check if any financial data exists in localStorage
  const hasExpenses = localStorage.getItem("expenses");
  const hasInvestments = localStorage.getItem("investments");
  const hasSalary = localStorage.getItem("salaryHistory");
  const hasCompletedSetup = localStorage.getItem("setupCompleted");
  
  // First time = no setup flag AND no existing data
  return !hasCompletedSetup && !hasExpenses && !hasInvestments && !hasSalary;
};
```

**Key detail:** Use a dedicated `setupCompleted` flag rather than just checking for data absence. This prevents the wizard from re-appearing if the user intentionally starts with zero balances.

### Step-Level Validation Pattern

Follow the existing project pattern (see `investment-dialog.tsx` lines 105-116):

```typescript
// Per-step validation, same pattern as existing dialogs
const [errors, setErrors] = useState<Record<string, string>>({});

const validateStep = (step: number, data: FormData): boolean => {
  const newErrors: Record<string, string> = {};
  
  if (step === 1) { // ARS balance
    const balance = Number(data.get("arsBalance"));
    if (isNaN(balance) || balance < 0) {
      newErrors.arsBalance = "El saldo debe ser 0 o mayor";
    }
  }
  // ... per step
  
  setErrors(newErrors);
  return Object.keys(newErrors).length === 0;
};
```

### Step Transitions

Simple conditional rendering. No animation library needed — the wizard is a modal, not a page flow. If subtle transitions are desired later, CSS `transition` + `opacity` is sufficient without Framer Motion.

```typescript
// Wizard rendering pattern
<Dialog open={showWizard} onOpenChange={setShowWizard}>
  <DialogContent className="max-w-lg">
    <StepIndicator current={step} total={totalSteps} />
    {step === 0 && <WelcomeStep />}
    {step === 1 && <ArsBalanceStep />}
    {step === 2 && <UsdStep />}
    {step === 3 && <InvestmentsStep />}
    {step === 4 && <SummaryStep />}
    <WizardNavigation onBack={back} onNext={next} isLast={step === totalSteps - 1} />
  </DialogContent>
</Dialog>
```

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|---|---|---|---|
| Form library | Manual useState + FormData | React Hook Form + Zod | 8 existing dialogs use manual approach. Adding RHF for one wizard creates two form patterns in the codebase. Migrate all forms first if RHF is desired. |
| Stepper UI | Custom Tailwind component | shadcn-stepper (community) | External dependency for ~20 lines of CSS. Not in official registry. |
| Wizard state | Custom useWizard hook | Zustand / useReducer | 4 steps with linear flow. useState is sufficient. useReducer adds ceremony for no benefit at this scale. |
| Transitions | CSS opacity/transform | Framer Motion | Would add ~32KB to bundle for a single fade transition. Disproportionate. |
| First-time detection | localStorage flag | URL parameter / cookie | localStorage is the project's data layer. Flag lives with the data. |
| Wizard container | Dialog (modal) | Full-page route | Wizard is re-launchable from Settings. Modal is the right UX — user sees their (empty) app behind it, reinforcing "this is setup." |

## What NOT to Add

| Package | Why Avoid |
|---|---|
| `react-hook-form` | Would create a second form pattern. Either migrate ALL forms to RHF (separate milestone) or stay consistent with useState. |
| `zod` | Only useful paired with RHF for schema validation. Manual validation is fine for 4 steps with 1-3 fields each. |
| `framer-motion` | 32KB+ for cosmetic step transitions. CSS transitions are sufficient. |
| `@stepperize/react` | External dependency for trivial state management (a number that goes up and down). |
| Any wizard npm package | The problem is too simple to justify a dependency. |

## Installation

```bash
# No new packages to install.
# Build with existing: Dialog, Button, Input, Select, Card from shadcn/ui.
```

## Integration Points

### Where the wizard connects to existing code

| Integration | How |
|---|---|
| Setting initial ARS balance | Call existing balance-setting logic from `useMoneyTracker` |
| Setting USD balance + rate | Call `onSetGlobalUsdRate` from `useCurrencyEngine` + set USD balance |
| Adding initial investments | Call existing `addInvestment` from `useInvestmentsTracker` |
| Employment type config | Call `onUpdateIncomeConfig` from existing config flow |
| Persisting "setup done" flag | New key in localStorage via `useLocalStorage` hook |
| Re-launch from Settings | Add button in `ConfigCard` that sets `showWizard = true` |

### Where the wizard lives in the component tree

The `SetupWizard` component should live in `expense-tracker.tsx` (the main app component) alongside the existing dialogs. It reads the `setupCompleted` flag on mount and auto-opens if first time.

## Confidence Assessment

| Claim | Confidence | Basis |
|---|---|---|
| No stepper in official shadcn/ui registry | HIGH | Checked official components list and registry directory |
| Manual useState is the project's form pattern | HIGH | Verified in 3 dialog components (investment, config, adjustment) |
| Custom wizard hook is sufficient for 4-5 linear steps | HIGH | Standard React pattern, widely documented |
| localStorage flag for first-time detection | HIGH | Consistent with project's existing data persistence approach |
| No animation library needed | MEDIUM | CSS transitions handle simple fades; if the team wants sliding step transitions, Framer Motion becomes more attractive but still optional |

## Sources

- [shadcn/ui Official Components List](https://ui.shadcn.com/docs/components) — no stepper component in official registry
- [shadcn/ui Multi-Step Form Discussion #1869](https://github.com/shadcn-ui/ui/discussions/1869) — community approaches
- [shadcn-stepper by damianricobelli](https://github.com/damianricobelli/shadcn-stepper) — community stepper, not official
- [React Wizard Pattern (Medium)](https://medium.com/@vandanpatel29122001/react-building-a-multi-step-form-with-wizard-pattern-85edec21f793) — useState-based approach
- [LogRocket: Multi-Step Form with RHF + Zod](https://blog.logrocket.com/building-reusable-multi-step-form-react-hook-form-zod/) — alternative approach (not recommended for this project)
