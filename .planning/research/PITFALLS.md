# Pitfalls Research

**Domain:** Setup wizard / onboarding for existing localStorage-based personal finance app
**Researched:** 2026-04-02
**Confidence:** HIGH (pitfalls derived from codebase analysis + established patterns)

## Critical Pitfalls

### Pitfall 1: First-Time Detection That Ignores Existing Users

**What goes wrong:**
The wizard triggers based on a naive check like `!localStorage.getItem("monthlyData")`, but existing v1.0 users already have `monthlyData` with the default empty structure (`{ salaries: {}, expenses: [], ... }`). The check passes, the wizard never shows for new users who got the initial empty object written on first load — or worse, it shows for existing users who have data but whose `monthlyData` key looks "empty" after a migration glitch.

**Why it happens:**
The current `useLocalStorage` hook writes `initialValue` to state immediately when no stored data exists, but does NOT persist it to localStorage until the first `setValue` call. However, if any code path calls `setMonthlyData` before the wizard runs (e.g., a migration, a side effect), the key exists with the initial empty structure. Developers check for key existence instead of checking for meaningful data.

**How to avoid:**
- Use a dedicated flag: `localStorage.getItem("wizardCompleted")` or `localStorage.getItem("onboardingVersion")`.
- ALSO check for meaningful data: `monthlyData.investments.length > 0 || Object.keys(monthlyData.salaries).length > 0 || monthlyData.expenses.length > 0`. If meaningful data exists but wizard was never "completed," offer the wizard as optional ("Looks like you already have data. Want to review your setup?").
- The flag should be a separate localStorage key, NOT embedded inside `monthlyData`, because it is metadata about app state, not financial data.

**Warning signs:**
- Wizard never appears despite clearing browser data.
- Wizard appears for users who already have months of transactions.
- Export/import cycle resets wizard completion flag.

**Phase to address:**
Phase 1 (wizard infrastructure) -- first-time detection must be the very first thing implemented and tested.

---

### Pitfall 2: Wizard State Lost on Page Refresh

**What goes wrong:**
User fills in ARS balance (step 1), USD balance + cotizacion (step 2), adds three investments (step 3), then accidentally refreshes the page or the browser tab crashes. All wizard progress is gone. User has to start over. For a finance app where users are entering precise numbers, this is infuriating.

**Why it happens:**
Wizard state is stored in React component state (`useState`) which is ephemeral. Developers build the wizard as a simple multi-step form and forget that the wizard itself is a long-running operation that can be interrupted.

**How to avoid:**
- Persist wizard draft state to `sessionStorage` (not `localStorage`) under a key like `wizardDraft`. Session storage survives refreshes within the same tab but clears when the tab closes, which is the right lifecycle for incomplete wizard data.
- On wizard mount, check for existing draft and resume from the last completed step.
- On wizard completion, clear the draft from sessionStorage and write final data to localStorage.
- Important: do NOT write partial wizard data to the main `monthlyData` key. Only commit on final "Confirm" step.

**Warning signs:**
- No sessionStorage usage in wizard code.
- Wizard always starts at step 1 regardless of context.
- Users reporting "I had to enter everything twice."

**Phase to address:**
Phase 1 (wizard implementation) -- must be built into the step architecture from the start, not retrofitted.

---

### Pitfall 3: Wizard Writes Directly to monthlyData During Steps

**What goes wrong:**
Each wizard step writes its data directly to `monthlyData` in localStorage. If the user abandons the wizard at step 3 of 4, the app now has partial initial state: ARS and USD balances are set but investments are missing. The app displays these partial numbers as if they were the user's complete financial picture. The user sees wrong totals and loses trust in the app.

**Why it happens:**
It seems simpler to reuse existing hooks (`setMonthlyData`, `useSalaryHistory`) directly in wizard steps. The developer thinks "I'll just write each piece as the user confirms it." But this creates a transaction problem -- there is no rollback.

**How to avoid:**
- Treat the entire wizard as a single atomic transaction. Collect all data in a local draft object (or sessionStorage as described in Pitfall 2).
- Only on the final "Confirm" step, write everything to localStorage in one batch.
- The confirm step should show a complete summary of what will be written, with an "Edit" option for each section.
- Implementation: create a `WizardData` type that holds the draft, then a `commitWizardData()` function that translates it into the correct localStorage writes across all keys (`monthlyData`, `salaryHistory`, `incomeConfig`, `globalUsdRate`).

**Warning signs:**
- Wizard steps call `setMonthlyData` or other hooks directly.
- No "draft" or "pending" state concept in wizard code.
- Abandoning the wizard mid-flow leaves data in localStorage.

**Phase to address:**
Phase 1 (wizard architecture) -- the atomic commit pattern must be designed before any steps are built.

---

### Pitfall 4: Re-Running Wizard Overwrites Existing Data

**What goes wrong:**
User runs the wizard at first use, then adds 3 months of expenses, investments, and income. Later they want to re-run the wizard from Settings to "fix my initial ARS balance." The wizard overwrites `monthlyData` with the new wizard output, destroying 3 months of transaction history.

**Why it happens:**
The wizard was designed for first-time use only. When making it re-runnable from Settings, the developer reuses the same `commitWizardData()` function which replaces data instead of merging it.

**How to avoid:**
- Re-run mode must be fundamentally different from first-run mode:
  - **First run:** Creates initial state from scratch. Writes new investments, sets balances.
  - **Re-run:** Only updates what the user explicitly changes. Pre-populates all fields with current values. Merges changes into existing data.
- For investments specifically: re-run should show existing investments and allow editing, NOT create duplicates. Match by ID, not by name.
- For balances (ARS/USD liquid): these are derived values in the current system (calculated from income - expenses + transfers). The wizard cannot directly "set" a balance without creating an adjustment entry. This needs careful design.
- Consider: instead of a full re-run, offer individual "Adjust initial balance" and "Edit investment" actions from Settings. A full wizard re-run may not be the right UX.

**Warning signs:**
- No `mode` parameter distinguishing first-run from re-run.
- Re-run uses the same code path as first-run.
- No confirmation dialog warning "This will update your initial balances."
- Testing only covers first-run scenario.

**Phase to address:**
Phase 2 or 3 (re-run capability) -- deliberately deferred after first-run works correctly. First-run and re-run are different enough to warrant separate implementation phases.

---

### Pitfall 5: Currency Enforcement Bypassed in Wizard Investment Setup

**What goes wrong:**
The wizard lets users add existing investments. User creates a "Crypto" investment and selects ARS as the currency. Or creates a "Plazo Fijo" and selects USD. The `CURRENCY_ENFORCEMENT` rules from `constants/investments.ts` are not applied in the wizard form, only in the main app's investment dialog. Now the data is inconsistent.

**Why it happens:**
The wizard investment form is built separately from the existing `InvestmentDialog`. The developer duplicates the form without the validation logic, or builds a simplified version that skips the currency enforcement dropdown behavior.

**How to avoid:**
- Extract the currency enforcement logic into a shared utility: `getValidCurrency(investmentType: InvestmentType, userChoice?: CurrencyType): CurrencyType`. This function applies the rules from `CURRENCY_ENFORCEMENT` and is used by both the wizard and the main dialog.
- In the wizard UI: when user selects "Crypto," auto-select USD and disable the currency dropdown. When user selects "Plazo Fijo," auto-select ARS and disable it. For FCI/Acciones, let the user choose.
- Validate on commit: the `commitWizardData()` function should validate all investments against `CURRENCY_ENFORCEMENT` before writing.

**Warning signs:**
- Wizard investment form has its own currency dropdown without conditional logic.
- No shared validation between wizard and main investment dialog.
- Test: create a Crypto investment in wizard with ARS -- if it saves, the pitfall is present.

**Phase to address:**
Phase 1 (wizard investment step) -- validation must be present from the first implementation.

---

### Pitfall 6: Initial Balance Cannot Be "Set" -- Only Derived

**What goes wrong:**
The wizard asks "How much ARS do you have liquid right now?" and the user enters $500,000. But the current system calculates liquid balance as `income - expenses + transfers - investment_contributions + investment_withdrawals`. There is no "initial balance" field. The wizard either (a) ignores the number, (b) creates a fake income entry to make the math work, or (c) adds a field that nothing else reads.

**Why it happens:**
The developer does not realize that liquid balance is a derived value in the current architecture. They add a field to `monthlyData` like `initialArsBalance` but none of the existing calculation code reads it. Or they create a "System: Initial Balance" income entry that pollutes the user's income history.

**How to avoid:**
- Design the initial balance as an explicit "adjustment" entry, clearly labeled. This is the pattern real accounting apps use (opening balance as the first transaction).
- Create a special income type or a dedicated `initialBalances` field in `monthlyData` that the calculation engine explicitly includes.
- The calculation in `useMoneyTracker` (around line ~400 where `arsIncome`, `usdIncome` etc. are computed) must be updated to include initial balances BEFORE the wizard is built.
- For USD: the wizard must capture both the USD amount AND the cotizacion at which it was acquired (or current cotizacion as default).
- Display: initial balance should appear in the summary card but be visually distinct from regular income.

**Warning signs:**
- Wizard collects balance but the summary card shows $0 until expenses/income are added.
- "Initial Balance" shows up as a regular income in the income table.
- No changes to `useMoneyTracker` calculation logic alongside wizard implementation.

**Phase to address:**
Phase 1 (data model extension) -- the `initialBalances` field and calculation integration must be implemented BEFORE the wizard UI, because the wizard depends on somewhere to write these values.

---

### Pitfall 7: Export/Import Does Not Preserve Wizard State

**What goes wrong:**
User completes the wizard, uses the app for months, exports a backup. They import the backup on a new browser. The wizard triggers again because `wizardCompleted` is a separate localStorage key that the export/import system (`useDataPersistence.ts`) does not know about.

**Why it happens:**
The current `STORAGE_KEYS` array in `useDataPersistence.ts` is hardcoded with 7 keys. Any new localStorage key added by the wizard feature must also be added to this array. Developers forget this because persistence is in a different file from wizard implementation.

**How to avoid:**
- When adding ANY new localStorage key (e.g., `wizardCompleted`, `onboardingVersion`, `initialBalances`), ALWAYS update the `STORAGE_KEYS` array in `useDataPersistence.ts`.
- Also update `JSON_KEYS` or `NUMERIC_KEYS` as appropriate so the export serialization handles the type correctly.
- Add a test or checklist: "Does `STORAGE_KEYS` include all keys used by the app?"
- Consider: bump `exportVersion` to 2 when adding wizard-related keys, and handle backward compatibility in `validateEnvelope`.

**Warning signs:**
- Export JSON does not contain `wizardCompleted` key.
- Importing a backup triggers the wizard.
- `STORAGE_KEYS` array has fewer entries than actual localStorage keys used.

**Phase to address:**
Phase 1 (wizard infrastructure) -- must be part of the wizard feature, not an afterthought.

---

### Pitfall 8: SSR Hydration Mismatch with Wizard Visibility

**What goes wrong:**
The wizard's visibility depends on localStorage (`wizardCompleted`). During SSR, localStorage is not available, so the server renders "no wizard." On the client, it reads localStorage, finds no flag, and tries to render the wizard. React detects a hydration mismatch and either throws an error or produces visual flickering.

**Why it happens:**
Next.js App Router renders on the server first. Any component that conditionally renders based on localStorage will have a different server vs. client output. The app already handles this for other components via `useHydration`, but the wizard introduces a new conditional rendering path.

**How to avoid:**
- Use the existing `useHydration` pattern: render nothing (or a loading skeleton) on the server, then check localStorage on the client after hydration.
- The wizard component must be a client component (`"use client"`) and should not render until after hydration check.
- Pattern: `const isHydrated = useHydration(); if (!isHydrated) return null;`
- Alternative: make the wizard a portal/overlay that mounts lazily, avoiding SSR entirely.

**Warning signs:**
- Console warnings about hydration mismatch.
- Wizard flashes briefly then disappears (or vice versa).
- Wizard renders differently on first load vs. navigation.

**Phase to address:**
Phase 1 (wizard component setup) -- standard Next.js concern, apply existing pattern.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Wizard writes to monthlyData per-step | Simpler code, reuses existing hooks | Partial state on abandon, no rollback | Never -- use draft + atomic commit |
| Duplicating investment form in wizard | Faster to build wizard step | Validation drift, currency rules bypassed | Never -- extract shared components |
| Storing wizard flag inside monthlyData | One fewer localStorage key | Couples metadata to financial data, migration headaches | Never -- use separate key |
| Hardcoding wizard steps (no step registry) | Quick implementation | Cannot easily add/remove/reorder steps, re-run mode harder | MVP only -- refactor before re-run |
| Skipping sessionStorage for wizard draft | Simpler state management | Users lose progress on refresh | Never for a finance app where users enter precise numbers |

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| `useLocalStorage` hook | Calling `setMonthlyData` from wizard steps (creates partial state) | Build draft separately, commit once at end via a dedicated function |
| `migrateData()` function | Not considering that wizard-created data also passes through migration on next load | Ensure wizard output uses latest `_migrationVersion` (currently 7) so no migration re-runs |
| `useDataPersistence` export | Forgetting to add new wizard keys to `STORAGE_KEYS` | Update `STORAGE_KEYS`, `JSON_KEYS`/`NUMERIC_KEYS`, and bump `exportVersion` |
| `useSalaryHistory` hook | Wizard sets salary but doesn't create salary history entry | Wizard commit must write to both `monthlyData.salaries` (if still used) AND `salaryHistory` localStorage key |
| `useCurrencyEngine` hook | Wizard sets USD balance without setting `globalUsdRate` | Wizard must capture and persist `globalUsdRate` as part of the USD step |
| `CURRENCY_ENFORCEMENT` | Wizard builds its own investment form without these rules | Extract validation, share between wizard and main dialog |

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Re-rendering entire app when wizard commits | Brief freeze after clicking "Confirm" as all hooks recompute | Batch all localStorage writes, then trigger a single state update (or `window.location.reload()` like import does) | With 500+ transactions in localStorage |
| Wizard loading all existing data to pre-populate re-run mode | Slow wizard open in re-run mode | Only load summary data for pre-population, not full transaction arrays | With 1000+ transactions |

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Asking for exact ARS balance to the peso | Users don't know their exact balance, get anxious about precision | Accept approximate values, explain they can adjust later with "Ajustar saldo real" |
| Mandatory wizard with no skip option | User who just wants to explore the app is blocked | Allow "Skip for now" that sets initial balances to 0 and marks wizard as skippable-completed |
| No summary/confirmation step | User clicks through and isn't sure what was saved | Always show a final summary with all entered values before committing |
| Wizard asks about features user doesn't use yet | New user doesn't have investments, but wizard makes them feel required | Make investment step optional ("Do you have existing investments? [Yes / Not yet]") |
| Not explaining what "cotizacion" means | User unfamiliar with exchange rates confused by USD step | Add contextual help: "At what rate did you buy your dollars? If unsure, use today's blue dollar rate" |
| Forcing sequential steps when user knows what they want | Power user has to click through empty steps | Allow step navigation (click on step indicator to jump) once each step has been visited or skipped |

## "Looks Done But Isn't" Checklist

- [ ] **First-time detection:** Test with: empty localStorage, existing data, import then clear wizard flag, private browsing mode
- [ ] **Wizard draft persistence:** Refresh page at each step -- does state survive?
- [ ] **Atomic commit:** Abandon wizard at step 3 -- is localStorage still clean?
- [ ] **Currency enforcement:** Create Crypto with ARS in wizard -- does it block or auto-correct?
- [ ] **Export/import round-trip:** Complete wizard, export, clear storage, import -- does wizard stay completed?
- [ ] **Calculation integration:** After wizard sets initial balance of $500k ARS, does the summary card show $500k available (with no other transactions)?
- [ ] **Re-run mode:** Complete wizard, add expenses, re-run wizard, change ARS balance -- are expenses preserved?
- [ ] **Hydration:** Hard-refresh the page -- is there a flash of wizard before it resolves?
- [ ] **Migration version:** After wizard commits data, check `_migrationVersion` in localStorage -- is it set to current (7)?
- [ ] **USD cotizacion:** Wizard sets USD balance -- is `globalUsdRate` also updated?

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Wizard wrote partial data on abandon | LOW | Clear wizard-related fields from localStorage, restart wizard. If `monthlyData` was corrupted, use export/import to restore backup |
| Re-run overwrote transaction history | HIGH | Only recoverable from JSON backup. This is why atomic commit + confirmation is critical |
| Currency enforcement bypassed | MEDIUM | Write a one-time migration to fix investments with wrong currency types. Add validation to `migrateData()` |
| Export missing wizard keys | LOW | Manually add wizard keys to `STORAGE_KEYS` and re-export. Existing exports can be patched with a migration |
| Initial balance not reflected in calculations | MEDIUM | Requires updating calculation logic in `useMoneyTracker`. Retroactive -- once fixed, existing wizard data will be picked up |

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| First-time detection (P1) | Phase 1: Wizard infrastructure | Test all detection edge cases before building any wizard steps |
| Wizard state on refresh (P2) | Phase 1: Wizard step architecture | Refresh test at every step during development |
| Partial writes on abandon (P3) | Phase 1: Wizard architecture | Abandon at each step, verify localStorage unchanged |
| Re-run data destruction (P4) | Phase 2+: Re-run feature | Separate implementation from first-run, with dedicated merge logic |
| Currency enforcement (P5) | Phase 1: Investment step | Share validation with existing investment dialog |
| Initial balance model (P6) | Phase 1: Data model (BEFORE wizard UI) | Verify calculation engine includes initial balances |
| Export/import sync (P7) | Phase 1: Infrastructure | Export after wizard, verify all keys present in JSON |
| SSR hydration (P8) | Phase 1: Component setup | Apply existing `useHydration` pattern from day one |

## Sources

- Codebase analysis: `hooks/useLocalStorage.ts`, `hooks/useMoneyTracker.ts` (migration system, data model), `hooks/useDataPersistence.ts` (export/import keys), `constants/investments.ts` (currency enforcement)
- [OnboardJS - React Onboarding Libraries](https://onboardjs.com/blog/5-best-react-onboarding-libraries-in-2025-compared) -- patterns for wizard state persistence
- [MDN Web Storage API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API/Using_the_Web_Storage_API) -- localStorage availability edge cases, private browsing behavior
- [Zustand Persist Middleware patterns](https://sanjewa.com/blogs/zustand-persistence-middleware-guide/) -- state migration patterns applicable to localStorage
- [SPA State Persistence](https://roquec.com/articles/2023-10-26-smooth-state-persistence-in-mpas/) -- multi-page state persistence approaches

---
*Pitfalls research for: Setup wizard / onboarding added to existing expense-tracker app*
*Researched: 2026-04-02*
