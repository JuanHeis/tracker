# Project Research Summary

**Project:** Expense Tracker v1.1 — Setup Wizard & Onboarding
**Domain:** First-time setup wizard integrated into existing localStorage-based personal finance SPA
**Researched:** 2026-04-02
**Confidence:** HIGH

## Executive Summary

The setup wizard is a gateway layer, not a refactor. The correct approach is to build a 4-5 step linear wizard that runs inside the existing app, collects initial financial data in a draft object, and commits it all to localStorage in one atomic batch on final confirmation. Zero new npm packages are needed — the project's existing shadcn/ui components (Dialog, Button, Input, Select, Card) plus a custom `useWizard` hook (~30 lines) handle everything. All 8 existing dialogs use the `useState + FormData` pattern; the wizard must follow this same pattern to stay consistent.

The recommended approach is: (1) detect first-time users by checking for the absence of both `monthlyData` AND `salaryHistory` localStorage keys, (2) render a `SetupWizard` component in place of the normal UI, (3) accumulate user inputs in a `WizardData` object stored in `sessionStorage` for refresh resilience, (4) on final confirmation write all keys (`monthlyData`, `salaryHistory`, `incomeConfig`, `globalUsdRate`) in one synchronous block, then (5) trigger a component remount via a React `key` change in `app/page.tsx` so all existing hooks re-initialize from the newly written data. No existing hooks need modification.

The primary risk is data integrity: partial writes on wizard abandonment, re-run mode overwriting months of transaction history, and currency enforcement rules not being applied to wizard-created investments. All three are Phase 1 concerns that must be solved architecturally before any wizard UI is built. A secondary risk is SSR hydration mismatch — the wizard must use the existing `useHydration` pattern to avoid a flash of content mismatch in the Next.js App Router.

## Key Findings

### Recommended Stack

The wizard requires zero new dependencies. The project already has everything needed: Dialog for the modal container, Button for navigation, Input and Select for form fields, and Card for the summary step. A custom `useWizard` hook manages step state (a number that increments/decrements) and a `StepIndicator` component is roughly 20 lines of Tailwind. Adding any wizard npm package would be unjustifiable overhead for a 4-step linear form.

**Core technologies:**
- `shadcn/ui` (Dialog, Button, Input, Select, Card): wizard UI — already installed, zero overhead
- `useState` custom `useWizard` hook: step navigation — sufficient for 4-5 linear steps
- `sessionStorage`: wizard draft persistence — survives refresh within tab, clears on close (correct lifecycle)
- `localStorage` (direct writes): final data commit — matches how `importData` works in the existing codebase

**What NOT to add:** `react-hook-form`, `zod`, `framer-motion`, or any wizard/stepper npm package.

### Expected Features

Research across YNAB, Wallet, Mint, and NN/g guidelines yields a clear MVP feature set. Wizards with more than 5 steps see significant abandonment; each additional step reduces completion approximately 10-15%.

**Must have (table stakes):**
- Auto-detect first-time user (no data = show wizard automatically)
- Welcome screen with brief value proposition and "Let's go" CTA
- ARS liquid balance capture (foundational number; everything derives from this)
- USD holdings + exchange rate (Argentina-specific; two inputs, huge accuracy impact)
- Employment type + salary amount + pay day (powers monthly summary, aguinaldo, pay-period views)
- Progress indicator (step dots or "Step X of Y")
- Skip option per optional step (only ARS balance should be required)
- Summary/confirmation step (shows all entered values before committing)

**Should have (differentiators):**
- Existing investments quick-add (makes patrimonio card accurate from minute one)
- Existing loans quick-add (same rationale as investments)
- Contextual help text per step (YNAB-style "why this matters" microcopy)
- Import-as-alternative link on welcome screen (already built; just needs exposure)
- Re-run wizard from Settings (PROJECT.md lists this as a target feature)

**Defer (v2+):**
- Recurring expenses quick-add (useful but not critical for first impression)
- Budget target setup (users need 2-4 weeks of data first)
- Category customization (overwhelming for day one)
- Detailed transaction history entry (use JSON import instead)

**Wizard step count target:** 4-5 steps maximum for MVP. Step ordering: Welcome > ARS Balance > USD + Rate > Income Config > Summary. Optional investments/loans steps can follow income if included.

### Architecture Approach

The wizard is a conditional render inside `ExpenseTracker`, not a new route or a lifted hook. When first-time state is detected, `ExpenseTracker` renders `<SetupWizard />` in place of the normal tabbed UI. The wizard accumulates all user data in a local `WizardData` object, then on final confirmation calls `commitWizardData()` which writes to all four localStorage keys in a single synchronous block. The parent `app/page.tsx` holds a `key` prop on `ExpenseTracker` and increments it after wizard completion, forcing all hooks to re-mount and re-read from the newly populated localStorage. Zero existing hooks are modified.

**Major components:**
1. `useSetupWizard` hook — owns `WizardData` state, step index, sessionStorage draft, `commitWizardData()` logic
2. `SetupWizard` container — step navigation, progress indicator, conditional step rendering
3. `WizardStep*` components (Income, Currency, Balance, Usd, Investments, Summary) — controlled forms that report up to `SetupWizard`
4. Modified `ExpenseTracker` — first-time detection gate, conditional render
5. Modified `app/page.tsx` — holds remount key, passes `onWizardComplete` callback

**File layout:**
```
components/setup-wizard/
  setup-wizard.tsx
  wizard-step-income.tsx
  wizard-step-currency.tsx
  wizard-step-balance.tsx
  wizard-step-usd.tsx
  wizard-step-investments.tsx
  wizard-step-summary.tsx
hooks/
  useSetupWizard.ts
```

### Critical Pitfalls

1. **Naive first-time detection triggers for returning users** — Check BOTH `monthlyData` AND `salaryHistory` key absence. Do NOT use a dedicated `wizardCompleted` flag (gets out of sync when users clear data or import backups). Detecting actual data presence is the correct signal.

2. **Wizard writes to localStorage per-step (partial state on abandon)** — The wizard must treat itself as an atomic transaction. All writes happen in one synchronous batch on the final "Confirm" step only. Use a `WizardData` draft object; never call `setMonthlyData` or other hook methods from within wizard steps.

3. **Re-run mode overwrites months of transaction history** — First-run and re-run are fundamentally different operations. Re-run must merge into existing data, not overwrite it. Defer re-run mode to a separate phase and build it with explicit merge logic.

4. **Wizard investment form bypasses currency enforcement rules** — `CURRENCY_ENFORCEMENT` constants from `constants/investments.ts` must apply in the wizard. Extract the validation into a shared utility used by both the wizard and the main investment dialog; validate again inside `commitWizardData()` before any write.

5. **SSR hydration mismatch on wizard visibility** — The wizard's visibility depends on localStorage which is unavailable during SSR. Apply the existing `useHydration` pattern: render `null` until client hydration completes. This is already the project's established pattern.

6. **Wizard-created data not including `_migrationVersion: 7`** — If the migration version is missing or wrong, `migrateData()` will re-run migrations on wizard-generated data and potentially corrupt amounts. Always write `_migrationVersion: 7` (current version) into `monthlyData` at commit time.

7. **New localStorage keys omitted from `useDataPersistence` export** — Any key added by the wizard (`wizardDraft` in sessionStorage is exempt, but any persistent key) must be added to `STORAGE_KEYS` in `useDataPersistence.ts`. Failing to do so means import/export doesn't round-trip correctly and users who import a backup will see the wizard trigger again.

## Implications for Roadmap

Based on combined research, the wizard naturally decomposes into three phases with clear dependency ordering.

### Phase 1: Wizard Infrastructure and Data Model

**Rationale:** The data model changes and architectural decisions must exist before any wizard UI. Specifically: the `adjustment_ars` transfer pattern for initial ARS balance, the `untracked` USD purchase pattern, the `commitWizardData()` atomic write function, and the `app/page.tsx` remount mechanism. Building UI first and then trying to wire it to data is the most common failure mode for wizard implementations.

**Delivers:** A working wizard that covers the 4-5 must-have MVP steps. First-time detection, all required steps (Welcome, ARS Balance, USD + Rate, Income Config, Summary), progress indicator, skip options, and correct atomic localStorage commit.

**Features addressed:** Auto-detect first time, welcome screen, ARS balance, USD + rate, employment type + salary + pay day, summary/confirmation, progress indicator, skip option.

**Pitfalls to prevent:** Pitfall 1 (detection), Pitfall 2 (draft persistence via sessionStorage), Pitfall 3 (atomic commit), Pitfall 5 (currency enforcement), Pitfall 6 (migration version), Pitfall 7 (export sync), Pitfall 8 (SSR hydration).

**Research flag:** Standard patterns. No additional research-phase needed. Architecture is fully documented from codebase analysis.

### Phase 2: Investments and Loans Quick-Add

**Rationale:** Investment quick-add is "medium complexity" per FEATURES.md — it needs the full investment type/currency enforcement UI and the `CURRENCY_ENFORCEMENT` logic extracted as a shared utility. Deferring it keeps Phase 1 to pure must-haves and avoids the complexity of the dynamic investment list builder during initial delivery.

**Delivers:** Optional wizard steps for adding existing investments and loans. Patrimonio card shows accurate initial state from minute one rather than requiring users to add investments separately after wizard completion.

**Features addressed:** Existing investments quick-add, existing loans quick-add.

**Pitfalls to prevent:** Pitfall 5 (currency enforcement — this is where it becomes most complex).

**Research flag:** Standard patterns. Currency enforcement rules are already documented in `constants/investments.ts`.

### Phase 3: Re-Run from Settings and UX Polish

**Rationale:** Re-run mode is architecturally distinct from first-run (merge vs. overwrite). PITFALLS.md is explicit: these must be separate implementation phases. Re-run also requires the wizard to pre-populate all fields with current values, which adds complexity. UX polish (contextual help text, import-as-alternative on welcome, step navigation on indicator dots) belongs here as well — these are low-effort improvements on top of a working foundation.

**Delivers:** "Re-ejecutar wizard" button in ConfigCard, pre-populated re-run mode with merge semantics, contextual help microcopy per step, import-as-alternative path on welcome screen.

**Features addressed:** Re-run from settings (PROJECT.md target feature), contextual help text, import-as-alternative.

**Pitfalls to prevent:** Pitfall 4 (re-run data destruction — the entire phase is designed around this).

**Research flag:** Needs attention during planning. The merge semantics for ARS/USD balances in re-run mode (which are derived values, not stored directly) require careful design. An "Adjust initial balance" adjustment entry will be created, which interacts with existing transaction history in ways that need to be explicitly designed.

### Phase Ordering Rationale

- Phase 1 before Phase 2: the atomic commit pattern and `WizardData` type must exist before the investments step is added. Investments are the most complex wizard step and adding them to an untested foundation is risky.
- Phase 2 before Phase 3: the investment step's currency enforcement utility must be built and tested before the re-run mode pre-populates existing investments.
- Re-run explicitly last: PITFALLS.md identifies it as the highest-risk operation (overwriting months of history). A functioning first-run must be stable before re-run mode is implemented.

### Research Flags

Phases needing deeper research during planning:
- **Phase 3 (re-run mode):** Merge semantics for derived balance values (ARS liquid balance is calculated, not stored) need explicit design. The question of whether to create a new adjustment entry or update the original wizard entry on re-run is not resolved and has UX implications.

Phases with standard patterns (no additional research needed):
- **Phase 1:** Fully documented. All patterns verified against existing codebase. Build order is specified in ARCHITECTURE.md.
- **Phase 2:** Currency enforcement rules are in `constants/investments.ts`. Investment data shape is verified from codebase analysis. No unknowns.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All findings verified against official shadcn/ui registry and existing codebase. No speculation. |
| Features | HIGH | Multiple authoritative sources (YNAB, Wallet, NN/g, Eleken, CleverTap). Feature-to-data-structure mapping verified against codebase. |
| Architecture | HIGH | All integration points verified directly from source code (`useMoneyTracker`, `useLocalStorage`, `useSalaryHistory`, `useCurrencyEngine`, `useDataPersistence`). |
| Pitfalls | HIGH | Pitfalls derived from direct codebase analysis plus well-documented patterns. All 8 pitfalls have specific prevention strategies tied to actual code paths. |

**Overall confidence:** HIGH

### Gaps to Address

- **Re-run balance merge semantics:** How should re-run mode handle ARS/USD balance correction? Two options exist (create a new adjustment entry vs. update the original wizard entry) and neither is clearly better without knowing how the balance history should appear in the UI. Resolve during Phase 3 planning.
- **Optional step ordering in MVP:** The ARCHITECTURE.md step order (Income > Currency > ARS > USD > Investments > Summary) differs slightly from the FEATURES.md dependency chain (ARS > USD > Income > Investments > Summary). The architecture rationale (income first because most universally applicable) is sound, but this should be validated with a real user flow before Phase 1 implementation is locked.
- **Wizard draft sessionStorage on mobile:** sessionStorage behavior in Safari's private browsing mode and iOS WebView contexts can be restrictive. Since this is a Next.js SPA likely used on mobile browsers, the sessionStorage draft persistence assumption should be tested early in Phase 1.

## Sources

### Primary (HIGH confidence)
- Codebase analysis: `hooks/useMoneyTracker.ts`, `hooks/useLocalStorage.ts`, `hooks/useSalaryHistory.ts`, `hooks/useCurrencyEngine.ts`, `hooks/useDataPersistence.ts`, `constants/investments.ts` — all integration points verified from source
- [shadcn/ui Official Components List](https://ui.shadcn.com/docs/components) — confirmed no stepper component in official registry

### Secondary (MEDIUM confidence)
- [YNAB Ultimate Get Started Guide](https://www.ynab.com/guide/the-ultimate-get-started-guide) — onboarding flow structure and step ordering
- [Eleken: Wizard UI Pattern](https://www.eleken.co/blog-posts/wizard-ui-pattern-explained) — when and how to use wizards
- [UX Design Institute: Onboarding Best Practices 2025](https://www.uxdesigninstitute.com/blog/ux-onboarding-best-practices-guide/) — skip options, progressive disclosure
- [CleverTap: Fintech App Onboarding](https://clevertap.com/blog/onboarding-fintech-app-users/) — abandonment statistics

### Tertiary (LOW confidence)
- [shadcn-stepper by damianricobelli](https://github.com/damianricobelli/shadcn-stepper) — evaluated and rejected; community package, not official
- [LogRocket: Multi-Step Form with RHF + Zod](https://blog.logrocket.com/building-reusable-multi-step-form-react-hook-form-zod/) — alternative approach, not recommended for this project

---
*Research completed: 2026-04-02*
*Ready for roadmap: yes*
