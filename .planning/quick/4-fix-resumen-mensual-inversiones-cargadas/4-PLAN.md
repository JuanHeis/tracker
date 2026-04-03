---
phase: quick
plan: 4
type: execute
wave: 1
depends_on: []
files_modified:
  - hooks/useMoneyTracker.ts
  - hooks/useSetupWizard.ts
autonomous: true
requirements: [FIX-RESUMEN-WIZARD-INV]

must_haves:
  truths:
    - "Wizard-loaded investments do NOT reduce disponible in Resumen del Mes"
    - "Wizard-loaded investments do NOT appear as Aportes inversiones in Resumen del Mes"
    - "Wizard-loaded investments still appear in the investments table with correct currentValue"
    - "Manually added aportes (post-wizard) still reduce disponible and show as Aportes inversiones"
  artifacts:
    - path: "hooks/useMoneyTracker.ts"
      provides: "InvestmentMovement with isInitial flag, skipped in calculateDualBalances"
      contains: "isInitial"
    - path: "hooks/useSetupWizard.ts"
      provides: "Wizard commit sets isInitial: true on initial investment movements"
      contains: "isInitial: true"
  key_links:
    - from: "hooks/useSetupWizard.ts"
      to: "hooks/useMoneyTracker.ts"
      via: "isInitial flag on InvestmentMovement"
      pattern: "isInitial.*true"
---

<objective>
Fix the Resumen del Mes showing wizard-loaded pre-existing investments as current-month outflows.

Purpose: When a user loads their existing investment portfolio via the setup wizard, those are pre-existing patrimony -- not purchases made from this month's salary. The monthly summary should only subtract actual investment contributions made during the current period, not initial portfolio setup.

Output: Modified InvestmentMovement type with `isInitial` flag, wizard sets it on commit, calculateDualBalances skips initial movements for arsBalance and arsInvestmentContributions.
</objective>

<execution_context>
@C:/Users/Juan/.claude/get-shit-done/workflows/execute-plan.md
@C:/Users/Juan/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@hooks/useMoneyTracker.ts
@hooks/useSetupWizard.ts
@components/resumen-card.tsx

<interfaces>
<!-- Key types the executor needs -->

From hooks/useMoneyTracker.ts:
```typescript
export interface InvestmentMovement {
  id: string;
  date: string;          // yyyy-MM-dd
  type: "aporte" | "retiro";
  amount: number;
}
```

From hooks/useSetupWizard.ts (commitWizardData, lines 147-165):
```typescript
// Wizard maps investments to Investment objects with movements:
movements: [{
  id: crypto.randomUUID(),
  date: today,
  type: "aporte" as const,
  amount: wi.amount,
}] as InvestmentMovement[],
```

From hooks/useMoneyTracker.ts (calculateDualBalances, lines 404-421):
```typescript
// ARS investment movements: scoped by view mode
inv.movements
  .filter((mov) => isInArsRange(mov.date))
  .forEach((mov) => {
    const impact = mov.type === "aporte" ? -mov.amount : mov.amount;
    arsBalance += impact;              // <-- BUG: reduces arsBalance for initial
    if (mov.type === "aporte") arsInvestmentContributions += mov.amount; // <-- BUG: counts initial as contribution
  });
```
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Add isInitial flag to InvestmentMovement and skip in calculateDualBalances</name>
  <files>hooks/useMoneyTracker.ts</files>
  <action>
1. Add `isInitial?: boolean` to the `InvestmentMovement` interface (around line 55-60).

2. In `calculateDualBalances()` (around line 404-421), modify the ARS investment movement loop to skip movements where `mov.isInitial === true`. The current code:
```typescript
inv.movements
  .filter((mov) => isInArsRange(mov.date))
  .forEach((mov) => {
    const impact = mov.type === "aporte" ? -mov.amount : mov.amount;
    arsBalance += impact;
    if (mov.type === "aporte") arsInvestmentContributions += mov.amount;
  });
```
Change the filter to also exclude initial movements:
```typescript
inv.movements
  .filter((mov) => isInArsRange(mov.date) && !mov.isInitial)
  .forEach((mov) => {
    const impact = mov.type === "aporte" ? -mov.amount : mov.amount;
    arsBalance += impact;
    if (mov.type === "aporte") arsInvestmentContributions += mov.amount;
  });
```

3. Apply the same `!mov.isInitial` filter to the USD investment movements loop (around line 407-409) for consistency:
```typescript
inv.movements.filter((mov) => !mov.isInitial).forEach((mov) => {
  const impact = mov.type === "aporte" ? -mov.amount : mov.amount;
  usdBalance += impact;
});
```

IMPORTANT: Do NOT add the isInitial filter anywhere else. The investment table, investment-value-cell, investment-row, and investment-movements components should still see initial movements for display purposes (total invested calculation, movement history). Only the monthly balance calculation should ignore them.
  </action>
  <verify>
    <automated>npx tsc --noEmit 2>&1 | head -20</automated>
  </verify>
  <done>InvestmentMovement has isInitial flag, calculateDualBalances skips initial movements for both ARS and USD balance calculations</done>
</task>

<task type="auto">
  <name>Task 2: Set isInitial true on wizard-created investment movements</name>
  <files>hooks/useSetupWizard.ts</files>
  <action>
In `commitWizardData()` (around line 147-165), add `isInitial: true` to the movement object created for each wizard investment:

Change:
```typescript
movements: [{
  id: crypto.randomUUID(),
  date: today,
  type: "aporte" as const,
  amount: wi.amount,
}] as InvestmentMovement[],
```

To:
```typescript
movements: [{
  id: crypto.randomUUID(),
  date: today,
  type: "aporte" as const,
  amount: wi.amount,
  isInitial: true,
}] as InvestmentMovement[],
```

This ensures only wizard-loaded investments are flagged. Future aportes added manually via the investments UI will NOT have this flag, so they will correctly reduce disponible and show as Aportes inversiones.
  </action>
  <verify>
    <automated>npx tsc --noEmit 2>&1 | head -20</automated>
  </verify>
  <done>Wizard commit sets isInitial: true on investment movements, distinguishing initial portfolio from actual monthly contributions</done>
</task>

</tasks>

<verification>
1. `npx tsc --noEmit` passes with no errors
2. Manual test: Run wizard with investments, check Resumen del Mes -- Aportes inversiones should be 0 or absent, Disponible should equal salary minus gastos (not reduced by initial investments)
3. Manual test: After wizard, manually add an aporte to an investment -- that aporte SHOULD appear in Aportes inversiones and reduce Disponible
</verification>

<success_criteria>
- Wizard-loaded investments do not reduce Disponible in Resumen del Mes
- Wizard-loaded investments do not appear as "Aportes inversiones" line
- Investment table still shows correct currentValue and total invested
- Manually added post-wizard aportes still work normally as monthly outflows
- TypeScript compiles with no errors
</success_criteria>

<output>
After completion, create `.planning/quick/4-fix-resumen-mensual-inversiones-cargadas/4-SUMMARY.md`
</output>
