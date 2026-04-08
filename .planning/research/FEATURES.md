# Feature Research

**Domain:** Monthly Flow Panel — Waterfall Chart + Savings Rate Selector + Inline Projection (v1.3)
**Researched:** 2026-04-07
**Confidence:** HIGH (detailed spec in PROMPT.md confirmed by direct code inspection; research validates and categorizes)

---

## Feature Landscape

### Table Stakes (Users Expect These)

Features the user will notice as missing if absent. This is a single-user app with a clear spec — "table stakes" means the core promise of the milestone.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Waterfall chart: Ingresos → Fijos → Variables → Inversiones → Libre | The entire reason for this panel; without it there is no panel | MEDIUM | Recharts BarChart with custom waterfall logic; no new chart lib needed |
| Auto-classify fixed vs variable without manual tagging | User expects the split to happen automatically from existing data | LOW | `expense.recurringId != null` = fijo; already in schema — zero extra fields |
| Savings rate selector with 3 modes (Auto / % / Fixed) | Core control feeding all projections; must replace broken `estimateMonthlyNetSavings()` | MEDIUM | 3-mode toggle + conditional input; `SavingsRateConfig` interface designed in spec |
| Persist savings rate config across sessions | Config must survive page reload; user sets it once | LOW | Separate localStorage key `"savingsRateConfig"` — no existing schema migration needed |
| Mini-projection inline (12-month patrimony, 3 scenarios) | Shows immediate impact of savings rate changes; the core feedback loop | MEDIUM | Reuses `projectPatrimonyScenarios()` with new `computeSavingsEstimate()` input |
| Replace `estimateMonthlyNetSavings()` in projection engine | Projection tab currently overestimates savings (salary - recurring only); fix is the milestone's stated goal | MEDIUM | `useProjectionEngine.ts` + simulator both consume this; 2 call sites |
| Auto mode shows the calculated value prominently | User must see what "auto" actually means — e.g., "$312.000/mes — promedio últimos 6 meses" | LOW | `averageMonthlyNetFlow(flows, 6)` already exists in `lib/projection/net-flow.ts` |
| "Libre" prominently as the final waterfall bar | The chain must be visually complete: not just a remainder number, a green closing bar | LOW | Computed as `ingresos - fijos - variables - inversiones`; framing decision |

### Differentiators (Competitive Advantage)

Features that go beyond table stakes and deliver extra value specific to this app.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Real-time projection update when savings rate changes | User adjusts slider/input and immediately sees 12-month patrimony shift — instant feedback loop that no spreadsheet can match | LOW | Pure function call + React state; no async, no loading state |
| recurringId-based auto-classification | Other tools require users to tag each expense as fixed/variable. This classifies at zero extra effort from existing schema. | LOW | Dependency: recurringId field already present; confirmed in codebase |
| "Libre" as distinct final bar (not just "saldo disponible") | Naming matters: "libre para el día a día" frames money differently than "available balance." Shows the full chain of decisions. | LOW | Purely framing; same number, different mental model |
| Link from mini-projection to Charts tab | Provides drill-down without duplicating the full chart in two places | LOW | Navigation link only; keeps panel compact |
| Sparkline trend inside mini-projection | Visual trend line (not just 3 endpoint numbers) shows trajectory at a glance | MEDIUM | Optional P2; can use small Recharts LineChart; add post-launch if user requests |

### Anti-Features (Commonly Requested, Often Problematic)

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Manual fixed/variable override per expense | Power users may want to reclassify individual expenses | Creates a third classification source conflicting with recurringId logic; adds UI complexity for marginal gain | Trust recurringId: if expense came from a recurring template it is fixed. If user wants a non-recurring expense treated as fixed, they should create a recurring template for it. |
| Separate "Savings account" category in waterfall (distinct from Inversiones) | Users conceptually separate "saving cash" from "investing" | In the Argentine context, no savings account beats inflation. Conflating cash savings with investment aportes adds a category that will always be near-zero and creates confusion. | Treat investment aportes as the savings/investment line. Libre = spending power. |
| Multiple savings rate configs per month or per scenario | Power users may want scenario-specific savings rates | The 3-scenario `savingsMultiplier` in `ScenarioConfig` already handles this (pesimista saves less, optimista saves more). Adding per-month configs duplicates that mechanism. | Use the existing SCENARIOS multipliers. The savings rate config sets the base; scenarios multiply it. |
| Historical waterfall comparison (this month vs last month side by side) | Useful for spotting trends | Doubles chart complexity; defeats the "monthly flow at a glance" purpose of this panel | The existing monthly card and Charts tab already provide historical context. Keep waterfall as current-month focus only. |
| Budget limit overlays on waterfall bars | Users want to see budget caps on the same chart | Mixes two concepts (what happened vs. what was allowed); creates visual noise | Existing budget progress bars in the budget tab handle this. Keep concerns separate. |

---

## Feature Dependencies

```
[computeSavingsEstimate() — lib/projection/savings-rate.ts]
    └──required by──> [Savings Rate Selector: Auto mode display value]
    └──required by──> [Mini-projection inline]
    └──required by──> [useProjectionEngine.ts refactor]
    └──required by──> [Simulator refactor]

[SavingsRateConfig — useSavingsRate hook → localStorage "savingsRateConfig"]
    └──required by──> [Savings Rate Selector: any mode persists]
    └──feeds──> [computeSavingsEstimate()]

[useMonthlyFlowData hook]
    └──required by──> [WaterfallChart component]
    └──required by──> [Libre calculation shown in mini-projection]
    └──consumes──> [filteredExpenses (useExpensesTracker, already exists)]
    └──consumes──> [filteredIncomes + salary (useIncomes + useSalaryHistory, already exist)]
    └──consumes──> [investment aportes for current month (useInvestmentsTracker, already exists)]

[WaterfallChart component]
    └──requires──> [useMonthlyFlowData hook]
    └──requires──> [Recharts BarChart — already in stack]

[Mini-projection inline]
    └──requires──> [computeSavingsEstimate()]
    └──requires──> [projectPatrimonyScenarios() — already exists in scenario-engine.ts]
    └──enhances──> [WaterfallChart (sits below it in MonthlyFlowPanel)]

[MonthlyFlowPanel — parent component]
    └──composes──> [WaterfallChart]
    └──composes──> [SavingsRateSelector]
    └──composes──> [Mini-projection inline]
    └──receives props only — no direct hook access (enables tab placement flexibility)
```

### Dependency Notes

- **computeSavingsEstimate() is the critical path blocker.** All downstream features (mini-projection, projection engine refactor, simulator refactor) depend on this single pure function. Build and test it first.
- **useMonthlyFlowData is the second blocker.** It aggregates all the data the waterfall chart needs. Confirmed: `filteredExpenses` (with `recurringId`), `filteredIncomes`, salary, and investment movements all already exist in the codebase.
- **Projection engine refactor is low-effort but high-impact.** `useProjectionEngine.ts` has exactly 2 call sites: one calls `estimateMonthlyNetSavings()`. Swapping it for `computeSavingsEstimate()` is ~3 lines once the new function exists.
- **MonthlyFlowPanel placement is a decision, not a dependency.** Whether it goes above the Gastos table or in a new Resumen tab does not affect any logic. The prop-only pattern keeps it movable without rewrites.
- **No localStorage schema migration required.** `SavingsRateConfig` goes in its own key (`"savingsRateConfig"`), separate from `"monthlyData"`. The existing schema is untouched.

---

## MVP Definition

This is a subsequent milestone on a live production app — MVP = the exact 4 items listed in PROJECT.md v1.3.

### Launch With (v1.3)

- [ ] `computeSavingsEstimate()` pure function — `lib/projection/savings-rate.ts` — prerequisite for everything
- [ ] `useSavingsRate` hook — persists `SavingsRateConfig` in `"savingsRateConfig"` localStorage key
- [ ] `useMonthlyFlowData` hook — groups filteredExpenses into fijo/variable, aggregates inversiones aportes, computes libre
- [ ] `WaterfallChart` component — Recharts BarChart with 5-bar waterfall cascade
- [ ] `SavingsRateSelector` component — 3-mode toggle with conditional input (slider or number input for %)
- [ ] `MonthlyFlowPanel` parent component — composes all above, receives props only
- [ ] Mini-projection inline — patrimony at 12 months under 3 scenarios, link to Charts tab
- [ ] Refactor `useProjectionEngine.ts` — replace `estimateMonthlyNetSavings()` with `computeSavingsEstimate()`
- [ ] Refactor simulator — same replacement as projection engine

### Add After Validation (v1.x)

- [ ] Sparkline trend in mini-projection — add only if user finds the 3 endpoint numbers insufficient
- [ ] Responsive layout optimization — BarChart horizontal vs vertical by viewport (add if mobile usage confirmed)
- [ ] "Gastos variables por categoría" breakdown inside waterfall — click-to-expand showing categories under the variable bar

### Future Consideration (v2+)

- [ ] Multi-month waterfall comparison panel — defer until explicit user request
- [ ] Per-category budget overlays on waterfall — belongs in a richer budget phase

---

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| `computeSavingsEstimate()` + `SavingsRateConfig` type | HIGH | LOW | P1 |
| `useSavingsRate` hook (localStorage persistence) | HIGH | LOW | P1 |
| `useMonthlyFlowData` hook | HIGH | LOW | P1 |
| `WaterfallChart` component | HIGH | MEDIUM | P1 |
| `SavingsRateSelector` (3-mode toggle + conditional input) | HIGH | LOW | P1 |
| Mini-projection inline (reuses existing engine) | HIGH | LOW | P1 |
| Projection engine refactor (2-line swap) | HIGH — fixes overestimation bug | LOW | P1 |
| `MonthlyFlowPanel` composition + placement decision | MEDIUM | LOW | P1 |
| Simulator refactor | MEDIUM | LOW | P1 |
| Sparkline in mini-projection | LOW | MEDIUM | P3 |
| Horizontal/vertical responsive layout | LOW | LOW | P2 |
| Variable expenses category drill-down | MEDIUM | MEDIUM | P2 |

**Priority key:**
- P1: Must have for v1.3 launch
- P2: Should have, add when possible
- P3: Nice to have, future consideration

---

## Competitor Feature Analysis

| Feature | YNAB | Simplifi | Our Approach |
|---------|------|----------|--------------|
| Monthly cash flow breakdown | Income vs Expense report with per-category rows | Projected Cash Flows (forward-looking to 12 months) | Waterfall chart: ingresos → fijos → variables → inversiones → libre — current month, visual cascade |
| Savings rate / targets | Targets per budget category (no global savings rate control) | Not prominent | 3-mode global selector (auto/percentage/fixed) feeding projection engine |
| Inline projection | Net Worth report (historical only, no forward projection inline) | Balance projection (12 months, automatic, no scenario control) | Mini-projection (12 months, 3 scenarios, live update when savings rate changes) |
| Fixed vs variable classification | Manual assignment to budget categories | Auto-categorization via ML (cloud, not offline) | Auto via recurringId — zero manual effort, works offline, no ML needed |
| Overestimation of savings | YNAB avoids by requiring manual assignment to categories | Simplifi uses bank-linked actual data | computeSavingsEstimate() with auto mode averaging last 6 months of actual net flow |

---

## Existing Code Inventory (Reused, Not Rebuilt)

| Asset | Location | Used For | Confirmed |
|-------|----------|----------|-----------|
| `averageMonthlyNetFlow()` | `lib/projection/net-flow.ts:30` | Auto mode savings estimate input | Yes — inspected |
| `calculateMonthlyNetFlow()` | `lib/projection/net-flow.ts:13` | Input to averageMonthlyNetFlow | Yes — inspected |
| `projectPatrimonyScenarios()` | `lib/projection/scenario-engine.ts:13` | Mini-projection 3-scenario output | Yes — inspected |
| `SCENARIOS` config | `lib/projection/types.ts:68` | savingsMultiplier for pesimista/base/optimista | Yes — inspected |
| `filteredExpenses` (with `recurringId`) | `useExpensesTracker` | Source for fijo/variable classification | Yes — field confirmed |
| `filteredIncomes` + salary | `useIncomes` + `useSalaryHistory` | Ingresos bar in waterfall | Yes — architecture confirmed |
| Investment movements | `useInvestmentsTracker` | Inversiones bar in waterfall | Yes — architecture confirmed |
| `estimateMonthlyNetSavings()` | `lib/projection/income-projection.ts:19` | TO BE REPLACED — current broken estimator | Yes — inspected, 1 call site in useProjectionEngine.ts |
| Recharts `BarChart` | Already in stack | Waterfall chart rendering | Yes — in STACK.md |
| shadcn `ToggleGroup`, `Input`, `Card`, `Badge` | Already in stack | SavingsRateSelector UI | Yes — confirmed in architecture |

---

## Sources

- Project functional specification: `.planning/phases/18-flujo-mensual-panel-unificado/PROMPT.md` — primary source (HIGH confidence, direct inspection)
- Existing code: `lib/projection/net-flow.ts`, `scenario-engine.ts`, `income-projection.ts`, `types.ts` — confirmed by direct read
- YNAB Income vs Expense report patterns: [YNAB Reports and Data](https://www.ynab.com/blog/ynab-reports-and-data)
- Simplifi 12-month projected cash flows: [Best Personal Finance Software 2026](https://www.quicken.com/blog/best-personal-finance-software-for-cash-flow-and-expense-tracking/)
- Waterfall chart UX patterns for cash flow: [Yellowfin Cash Flow Waterfall Guide](https://www.yellowfinbi.com/blog/how-to-perform-cash-flow-analysis-using-yellowfin-waterfall-charts)
- Personal finance app UX practices 2026: [G & Co. UX Design Practices](https://www.g-co.agency/insights/the-best-ux-design-practices-for-finance-apps)
- Savings goals flexibility in finance apps: [Eleken Budget App Design](https://www.eleken.co/blog-posts/budget-app-design)

---
*Feature research for: Monthly Flow Panel (v1.3) — expense-tracker*
*Researched: 2026-04-07*
