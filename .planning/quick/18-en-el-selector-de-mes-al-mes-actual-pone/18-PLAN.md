---
phase: quick-18
plan: 1
type: execute
wave: 1
depends_on: []
files_modified:
  - components/expense-tracker.tsx
autonomous: true
requirements: [QUICK-18]
must_haves:
  truths:
    - "Current month item in the month selector dropdown has a visually distinct background"
    - "Other months remain unstyled"
    - "The highlight updates correctly based on the real current date"
  artifacts:
    - path: "components/expense-tracker.tsx"
      provides: "Highlighted current month in selector"
  key_links: []
---

<objective>
Highlight the current month in the month selector dropdown with a distinct background so the user can quickly locate it.

Purpose: Quick visual anchor when scrolling through months.
Output: Modified expense-tracker.tsx with conditional styling on the current month's SelectItem.
</objective>

<execution_context>
@C:/Users/Juan/.claude/get-shit-done/workflows/execute-plan.md
@C:/Users/Juan/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@components/expense-tracker.tsx (lines 240-242 for currentRealMonth, lines 416-430 for month selector)
</context>

<tasks>

<task type="auto">
  <name>Task 1: Add distinct background to current month in selector</name>
  <files>components/expense-tracker.tsx</files>
  <action>
In the month selector dropdown (lines 420-429 of expense-tracker.tsx), add a conditional className to the SelectItem for the current month.

The current month value is already computed at line 241 as `currentRealMonth = format(today, "yyyy-MM")`. The `today` variable is already in scope (line 240).

Inside the `.map()` callback (line 421-428), compute:
```
const monthValue = format(date, "yyyy-MM");
const isCurrent = monthValue === currentRealMonth;
```

Then on the SelectItem, add a className using `cn()` (already imported at line 75):
```tsx
<SelectItem
  key={i}
  value={monthValue}
  className={cn(isCurrent && "bg-primary/10 font-medium")}
>
  {format(date, "MMMM yyyy")}
</SelectItem>
```

This gives the current month a subtle primary-colored background tint and slightly bolder text, making it easy to spot in the dropdown without being overly distracting. The `bg-primary/10` uses the app's existing primary color at 10% opacity.

Note: `currentRealMonth` is currently defined at line 241 which is AFTER the JSX return might reference it. Verify it is defined before the return statement (it is — line 241 is well before the return at ~line 390+). No hoisting issue.
  </action>
  <verify>
    <automated>cd D:/Documents/Programing/nextjs/expense-tracker && npx next build 2>&1 | tail -5</automated>
  </verify>
  <done>The current month's SelectItem in the month dropdown has a visually distinct bg-primary/10 background and font-medium weight. Other months remain default styled.</done>
</task>

</tasks>

<verification>
- Open app, click the month selector dropdown
- The current real month (April 2026) should have a subtle highlighted background
- All other months should appear with default styling
- Selecting a different month works normally (highlight stays on real current month, not selected month)
</verification>

<success_criteria>
Current month visually distinguishable in the month selector dropdown at a glance.
</success_criteria>

<output>
After completion, create `.planning/quick/18-en-el-selector-de-mes-al-mes-actual-pone/18-SUMMARY.md`
</output>
