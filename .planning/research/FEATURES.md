# Feature Landscape: Setup Wizard & Onboarding

**Domain:** First-time setup wizard for a personal finance tracker (dual ARS/USD, investments, loans, budgets)
**Researched:** 2026-04-02

## Table Stakes

Features users expect in a first-time setup wizard. Missing = confusing first experience, user doesn't know where to start.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Auto-detect first time (no data = show wizard) | Every finance app does this. YNAB, Wallet, Mint all detect empty state. User shouldn't manually find "setup". | Low | Check `monthlyData` for empty/default state in localStorage. Trivial detection. |
| Welcome screen with value proposition | Sets expectations. YNAB shows "3 steps to get started". Reduces anxiety about a complex app. | Low | Single screen, no logic. Just copy + "Let's go" button. |
| Current ARS liquid balance | The single most important datum. "How much money do you have right now?" is how YNAB starts. Without this, all calculations are wrong from day one. | Low | Single number input. Maps to an initial adjustment transfer or seed value. |
| Current USD holdings + exchange rate | Argentina-specific table stakes. User has dollars. Need both amount AND the rate they consider current (for patrimonio calc). | Low | Two inputs: USD amount + current ARS/USD rate. Maps to `usdPurchases` or initial balance seed. |
| Monthly income (ingreso fijo) setup | YNAB asks "what's your income?" early. Without salary, the monthly summary card is empty and useless. | Low | Amount + currency + pay day. Maps directly to `salaryHistory` + `incomeConfig`. |
| Employment type (dependiente/independiente) | Controls aguinaldo visibility. App already has this distinction. Must ask upfront to avoid showing irrelevant aguinaldo data. | Low | Binary toggle. Maps to `incomeConfig.employmentType`. |
| Summary/confirmation step | Every multi-step wizard ends with "here's what you entered, confirm?" YNAB, Wallet, and all enterprise wizards do this. | Low | Read-only summary of all entered data. "Edit" links back to each step. |
| Progress indicator (step X of Y) | UX best practice per ANODA, Eleken, and NN/g. Users need to know how long the wizard is and where they are. 68% of users abandon fintech onboarding without progress indicators. | Low | Simple step counter or progress bar. |
| Skip/do-later option | Not everyone wants to fill everything upfront. Progressive disclosure best practice. YNAB lets you skip their tutorial. Wallet lets you jump in immediately. | Low | "Skip for now" link on each optional step. Only ARS balance should be truly required. |

## Differentiators

Features that would make the onboarding notably better than "just a form." Not expected, but valued.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Existing investments quick-add | If user already has investments (FCI, crypto, plazo fijo), adding them during setup means the patrimonio card is accurate from minute one instead of showing $0 invested. | Medium | Mini-form per investment: name, type, currency, current value. Creates `Investment` objects with a single "aporte" movement. Needs investment type selector + currency logic already in app. |
| Existing loans quick-add | Same logic as investments. If user has outstanding loans, patrimonio is wrong without them. | Medium | Mini-form: type (preste/debo), persona, amount, currency. Creates `Loan` objects. |
| Existing recurring expenses quick-add | User likely has known monthly expenses (rent, subscriptions). Adding them during setup means the budget view is immediately useful. | Medium | Name, amount, category, currency. Creates `RecurringExpense` objects. Depends on category list. |
| Re-run wizard from settings | YNAB lets you revisit setup. Useful if user made mistakes or wants to "start fresh" with corrected numbers. PROJECT.md already lists this as a target feature. | Low | Just a button in settings that opens the wizard component again, pre-populated with current values. |
| Contextual help text per step | YNAB excels at friendly copy explaining WHY each step matters. "This helps us calculate your available money" builds understanding. Mint uses trust-building microcopy. | Low | Static text per step. No logic, just good UX writing. |
| Import from JSON as setup alternative | App already has JSON export/import. Returning users (or users migrating from another device) should be able to skip the wizard entirely by importing a backup. | Low | Already built. Just needs to be offered as an alternative path on the welcome screen: "Start fresh" vs "Import existing data." |
| Pay day configuration | Configuring the pay day (e.g., day 10) during setup means the pay-period view works correctly from the start. Already exists as `incomeConfig.payDay`. | Low | Single number input (1-31). Natural fit alongside salary step. |

## Anti-Features

Features to explicitly NOT build in the wizard.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Bank account connection / auto-import | This is a local-only app with no backend. Mint's bank connection is their core flow but it's irrelevant here. Adding it would violate the "no backend" constraint and create false expectations. | Manual balance entry. Make it clear: "Enter your current balance as shown in your bank app." |
| Category customization in wizard | Too much complexity for first-time setup. Users don't know their spending patterns yet. YNAB delays category customization to after initial setup. | Use default categories. Let users customize later from the main app. Categories already exist in constants. |
| Budget target setup in wizard | User needs to track a few months before knowing realistic budget targets. Setting budgets on day one produces arbitrary numbers. | Offer budget setup as a post-onboarding prompt after 2-4 weeks of data. |
| Detailed transaction history entry | Wizard should capture current state, not history. Asking users to enter past months of expenses is tedious and error-prone. | Start tracking from today. If they want history, they can use JSON import. |
| Credit card setup in wizard | Credit card modeling (cierre, vencimiento, cuotas) is complex. Overwhelming for first-time setup. Not yet fully built in the app either. | Defer to main app. Mention in wizard: "You can add credit cards later from the expenses tab." |
| Multi-account setup | App currently uses pool-based model. Setting up multiple accounts in the wizard adds complexity for a feature that's optional/future. | Single pool with total balances. Multi-account can be a future settings feature. |
| USD exchange rate auto-fetch | No internet dependency in wizard. Rate should be manual, matching what the user considers their current rate. | Manual input with helper text: "Enter today's blue/official rate." |
| Lengthy tutorial / product tour | Mint's 9-screen tutorial caused user fatigue. YNAB found that optional, contextual tutorials work better than upfront forced tours. | Brief contextual tooltips in the main app after wizard completes. Max 2-3 highlight callouts on first use. |

## Feature Dependencies

```
Welcome screen (no dependencies)
  |
  v
ARS balance step (no dependencies)
  |
  v
USD balance step (depends: ARS balance establishes the "we track money" mental model)
  |
  v
Employment type + Salary step (depends: currency understanding from USD step)
  |
  v
[OPTIONAL] Investments quick-add (depends: currency + balance context established)
  |
  v
[OPTIONAL] Loans quick-add (depends: currency context established)
  |
  v
[OPTIONAL] Recurring expenses quick-add (depends: category constants available)
  |
  v
Summary + Confirm (depends: all previous steps)
  |
  v
Main app (post-wizard: optional contextual hints)
```

**Key dependency insight:** The required steps (ARS balance, USD balance, salary) form a natural progression from simple to complex. Optional steps (investments, loans, recurring) should be skippable and can be added in any order after the core financial picture is established.

## MVP Recommendation

**Prioritize (must-have for v1.1):**

1. **Auto-detect first time** - Zero-data detection triggers wizard. Without this, the wizard is invisible.
2. **Welcome screen** - Brief, warm, sets expectations. "3 minutes to set up your finances."
3. **ARS liquid balance** - The foundational number. Everything else derives from this.
4. **USD holdings + rate** - Argentina-specific must-have. Two inputs, huge impact on accuracy.
5. **Employment type + salary + pay day** - Three inputs that power the monthly summary, aguinaldo, and pay-period views.
6. **Summary/confirmation** - Shows what was entered, lets user correct mistakes before committing.
7. **Progress indicator** - Step dots or "Step 2 of 5". Trivial to implement, big UX win.
8. **Skip option per step** - Only ARS balance is truly mandatory. Everything else should be skippable.

**Defer (nice-to-have, post-MVP):**

- **Investments quick-add**: Medium complexity, requires the full investment type/currency UI. Offer as a post-wizard prompt instead: "Want to add your existing investments now?"
- **Loans quick-add**: Same reasoning. Prompt after wizard.
- **Recurring expenses quick-add**: Useful but not critical for first impression. The app works fine without them on day one.
- **Re-run from settings**: Low effort but not blocking. Can be added in a follow-up.
- **Import as alternative**: Already built. Just needs a link on the welcome screen. Very low effort to add.

**Wizard step count target:** 4-5 steps maximum for MVP (welcome, ARS balance, USD balance, income setup, summary). Research consistently shows that 3-5 steps is the sweet spot for wizard completion rates. Each additional step reduces completion by approximately 10-15%.

## Wizard Data Mapping to Existing App Structures

This section maps each wizard input to the actual data structures it populates.

| Wizard Input | Target Data Structure | How It Gets There |
|---|---|---|
| ARS liquid balance | `Transfer` (type: `adjustment_ars`) | Creates an initial balance adjustment in current month |
| USD amount | `Transfer` (type: `adjustment_usd`) or `UsdPurchase` (origin: untracked) | Seed USD balance via adjustment transfer |
| USD exchange rate | `useCurrencyEngine` global rate | Sets the current global USD/ARS rate used for patrimonio |
| Employment type | `IncomeConfig.employmentType` | Stored via `useSalaryHistory` hook's config |
| Salary amount | `SalaryEntry` in `SalaryHistory.entries` | Creates first salary history entry with current month as effectiveDate |
| Pay day | `IncomeConfig.payDay` | Stored via `useSalaryHistory` hook's config |
| Wizard completed flag | New: `localStorage` key (e.g., `setupComplete: true`) | Simple boolean to prevent wizard from showing again |

## Sources

- [YNAB Ultimate Get Started Guide](https://www.ynab.com/guide/the-ultimate-get-started-guide) - Onboarding flow structure
- [YNAB Day One Setup](https://www.ynab.com/blog/day-one-with-ynab-how-to-set-up-your-budget) - What to ask first
- [YNAB Onboarding on Page Flows](https://pageflows.com/post/desktop-web/onboarding/ynab/) - Step-by-step screenshots
- [Mint Onboarding UX Analysis](https://goodux.appcues.com/blog/mint-user-onboarding-product-tour) - Trust-building copy patterns
- [ANODA: 10 Steps to Perfect Financial App Onboarding](https://www.anoda.mobi/ux-blog/essential-financial-app-onboarding-steps) - Step framework
- [Eleken: Wizard UI Pattern](https://www.eleken.co/blog-posts/wizard-ui-pattern-explained) - When and how to use wizards
- [Eleken: Fintech UX Best Practices 2026](https://www.eleken.co/blog-posts/fintech-ux-best-practices) - Progressive disclosure, trust
- [UX Design Institute: Onboarding Best Practices 2025](https://www.uxdesigninstitute.com/blog/ux-onboarding-best-practices-guide/) - Skip options, progressive disclosure
- [CleverTap: Fintech App Onboarding](https://clevertap.com/blog/onboarding-fintech-app-users/) - 68% abandonment stat, quick wins
- [Wallet by BudgetBakers: Getting Started](https://support.budgetbakers.com/hc/en-us/articles/7151352625938-Getting-Started-with-Wallet) - Currency selection pattern
- [UserGuiding: Onboarding Wizard Examples](https://userguiding.com/blog/what-is-an-onboarding-wizard-with-examples) - Skip and save-progress patterns
