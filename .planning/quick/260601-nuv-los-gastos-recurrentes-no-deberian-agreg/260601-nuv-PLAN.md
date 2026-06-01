---
phase: quick-260601-nuv
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - hooks/useRecurringExpenses.ts
  - hooks/useRecurringExpenses.window.test.ts
autonomous: true
requirements: [NUV-BUGFIX]
must_haves:
  truths:
    - "Recurring expenses are NEVER generated for any month before the current month"
    - "Recurring expenses are generated for the current month and the next 3 months (4 months total)"
    - "A recurring whose createdAt is in the future still starts at its createdAt, not before"
    - "Pausada (pausedAt), Cancelada, and dedupe behavior are unchanged"
    - "The persisted RecurringExpense localStorage schema is NOT altered (no migration)"
  artifacts:
    - path: "hooks/useRecurringExpenses.ts"
      provides: "Pure computeProjectionWindow helper + corrected generateMissingInstances"
      contains: "RECURRING_PROJECTION_MONTHS"
    - path: "hooks/useRecurringExpenses.window.test.ts"
      provides: "Unit tests for the projection-window logic"
      contains: "computeProjectionWindow"
  key_links:
    - from: "generateMissingInstances"
      to: "computeProjectionWindow"
      via: "per-recurring window calculation replacing iterateMonths(rec.createdAt, currentMonth)"
      pattern: "computeProjectionWindow"
---

<objective>
Fix the bug where recurring expenses backfill into PAST months. They must only be
projected for the present month and up to 3 months ahead (4 months total: current,
+1, +2, +3), never earlier.

Purpose: The current code calls `iterateMonths(rec.createdAt, currentMonth)`, which
generates an instance for every month from the recurring's creation date up to now,
polluting past months. The intended behavior is forward-looking projection only.

Output: A pure, unit-tested `computeProjectionWindow` helper exported from
`hooks/useRecurringExpenses.ts`, wired into `generateMissingInstances`, plus tests.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@hooks/useRecurringExpenses.ts

<interfaces>
<!-- Key contracts already present in hooks/useRecurringExpenses.ts. Use directly. -->

export type RecurringStatus = "Activa" | "Pausada" | "Cancelada";

export interface RecurringExpense {
  id: string;
  name: string;
  amount: number;
  category: Category;
  currencyType: CurrencyType;
  status: RecurringStatus;
  createdAt: string;   // yyyy-MM — first month to generate
  pausedAt?: string;   // yyyy-MM — month when paused, cleared on resume
}

// Existing helpers in the same file (reuse, do not duplicate):
function parseMonth(yyyyMM: string): Date            // parse(yyyy-MM)
function monthIsBeforeOrEqual(a: string, b: string): boolean
function iterateMonths(start: string, end: string): string[]  // inclusive both ends
// date-fns already imported: format, addMonths, parse, isBefore, isEqual
</interfaces>

<constraints>
- DO NOT alter the persisted RecurringExpense schema. This change only affects
  in-memory generation at load time. No `_migrationVersion`, no localStorage changes.
  (Project rule: never break the localStorage JSON schema without a migration.)
- Preserve EXACTLY the existing Cancelada skip, pausedAt skip, and exists/justCreated
  dedupe logic. Only the month-range source changes.
- Tests are run via the local vitest binary: `npx vitest run <file>` (there is no
  npm "test" script). Vitest config: globals enabled, `@` aliased to repo root.
</constraints>
</context>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: Add RECURRING_PROJECTION_MONTHS constant and pure computeProjectionWindow helper</name>
  <files>hooks/useRecurringExpenses.ts, hooks/useRecurringExpenses.window.test.ts</files>
  <behavior>
    Export a constant `RECURRING_PROJECTION_MONTHS = 3` (the forward horizon).

    Export a pure function:
      computeProjectionWindow(createdAt: string, currentMonth: string):
        { startMonth: string; endMonth: string } | null

    Semantics:
      - startMonth = the later of currentMonth and createdAt (max → never project
        before the current month, but honor a future createdAt edge case).
        Use the existing month comparison helpers (parseMonth / monthIsBeforeOrEqual)
        or date-fns isBefore — do NOT compare yyyy-MM strings lexically via a new
        ad-hoc path; reuse existing helpers.
      - endMonth = currentMonth + RECURRING_PROJECTION_MONTHS months, computed with
        addMonths(parseMonth(currentMonth), RECURRING_PROJECTION_MONTHS) then
        format(..., "yyyy-MM").
      - If startMonth is after endMonth (i.e. createdAt is further in the future than
        the horizon), return null (generate nothing).

    Test cases (hooks/useRecurringExpenses.window.test.ts), using currentMonth "2026-06":
      - createdAt in the past ("2026-01") → { startMonth: "2026-06", endMonth: "2026-09" }
        (NEVER starts before current month — this is the core bug fix assertion)
      - createdAt equal to current ("2026-06") → { startMonth: "2026-06", endMonth: "2026-09" }
      - createdAt one month in the future ("2026-07") → { startMonth: "2026-07", endMonth: "2026-09" }
      - createdAt exactly at the horizon ("2026-09") → { startMonth: "2026-09", endMonth: "2026-09" }
      - createdAt beyond the horizon ("2026-10") → null
      - end is exactly current + 3 months (window spans 4 months inclusive when
        starting at current): iterateMonths(start, end) for the past-createdAt case
        yields exactly ["2026-06","2026-07","2026-08","2026-09"] (length 4)
  </behavior>
  <action>
    In hooks/useRecurringExpenses.ts, near the top-level helpers (after iterateMonths,
    before useRecurringExpenses):

    1. Add: `export const RECURRING_PROJECTION_MONTHS = 3;`

    2. Add and export `computeProjectionWindow(createdAt, currentMonth)` implementing
       the semantics in <behavior>. Compute endMonth via
       `format(addMonths(parseMonth(currentMonth), RECURRING_PROJECTION_MONTHS), "yyyy-MM")`.
       Compute startMonth as max(currentMonth, createdAt) using existing
       monthIsBeforeOrEqual (e.g. startMonth = monthIsBeforeOrEqual(createdAt, currentMonth)
       ? currentMonth : createdAt). Return null when
       `!monthIsBeforeOrEqual(startMonth, endMonth)`.

    3. Create hooks/useRecurringExpenses.window.test.ts importing
       { computeProjectionWindow, RECURRING_PROJECTION_MONTHS } and (for the length-4
       assertion) you may re-derive months inline — do NOT export iterateMonths just
       for the test; instead assert directly on startMonth/endMonth and add one
       sanity test that RECURRING_PROJECTION_MONTHS === 3. Follow the existing test
       style (import { describe, it, expect } from "vitest").

    Do NOT touch generateMissingInstances in this task.
  </action>
  <verify>
    <automated>npx vitest run hooks/useRecurringExpenses.window.test.ts</automated>
  </verify>
  <done>
    computeProjectionWindow and RECURRING_PROJECTION_MONTHS are exported; all window
    test cases pass, including the assertion that a past createdAt starts at the
    current month (not earlier) and that createdAt beyond the horizon returns null.
  </done>
</task>

<task type="auto">
  <name>Task 2: Wire computeProjectionWindow into generateMissingInstances</name>
  <files>hooks/useRecurringExpenses.ts</files>
  <action>
    In generateMissingInstances, replace the buggy line:
      `const months = iterateMonths(rec.createdAt, currentMonth);`
    with window-bounded logic:
      const window = computeProjectionWindow(rec.createdAt, currentMonth);
      if (!window) continue;
      const months = iterateMonths(window.startMonth, window.endMonth);

    Leave EVERYTHING else in the loop unchanged: the Cancelada skip, the pausedAt
    skip (`if (rec.pausedAt && !monthIsBeforeOrEqual(month, rec.pausedAt)) continue;`),
    the exists/justCreated dedupe checks, and the pushed Expense shape (including
    date `${month}-01`, usdRate logic, recurringId, isPaid: false).

    Update the JSDoc comment block above generateMissingInstances (lines ~86-94) so
    it describes forward projection (current month through current + 3 months) instead
    of "from createdAt to current month". Keep it brief.

    Do NOT change the call site in hooks/useMoneyTracker.ts (~676-695) — the signature
    is unchanged. Do NOT alter any persisted schema.
  </action>
  <verify>
    <automated>npx vitest run hooks/useRecurringExpenses.window.test.ts && npx tsc --noEmit -p tsconfig.json</automated>
  </verify>
  <done>
    generateMissingInstances uses computeProjectionWindow + iterateMonths(start,end);
    no past-month instances can be produced; pausedAt/Cancelada/dedupe logic intact;
    project typechecks; the call site in useMoneyTracker.ts is untouched.
  </done>
</task>

</tasks>

<verification>
- `npx vitest run hooks/useRecurringExpenses.window.test.ts` passes all cases.
- `npx tsc --noEmit` reports no new type errors.
- Manual grep confirms `iterateMonths(rec.createdAt, currentMonth)` no longer exists
  in hooks/useRecurringExpenses.ts.
- No changes to the RecurringExpense interface or any localStorage write path.
</verification>

<success_criteria>
- Recurring expenses generate only for the current month through current + 3 months.
- No recurring instance is ever created for a month before the current month.
- Future-createdAt edge case honored (starts at createdAt; null beyond horizon).
- Existing Cancelada / pausedAt / dedupe behavior unchanged.
- localStorage schema unchanged (no migration).
</success_criteria>

<output>
After completion, create
`.planning/quick/260601-nuv-los-gastos-recurrentes-no-deberian-agreg/260601-nuv-SUMMARY.md`
</output>
