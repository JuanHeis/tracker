---
phase: quick-3
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - components/expense-tracker.tsx
autonomous: true
requirements: [QUICK-3]

must_haves:
  truths:
    - "Active tab shows icon + text label"
    - "Inactive tabs show icon only (no text)"
    - "Switching tabs updates which tab shows text"
  artifacts:
    - path: "components/expense-tracker.tsx"
      provides: "Floating taskbar with conditional tab labels"
  key_links:
    - from: "TabsTrigger children"
      to: "activeTab state"
      via: "conditional rendering of text span"
      pattern: "activeTab.*===.*value"
---

<objective>
Modify the floating bottom taskbar so that inactive tabs display only their icon, while the active tab displays both icon and text label. This reduces visual clutter and makes the active tab clearly stand out.

Purpose: Cleaner, more compact floating taskbar — active tab is visually distinct with its label.
Output: Updated expense-tracker.tsx with conditional tab label rendering.
</objective>

<execution_context>
@C:/Users/Juan/.claude/get-shit-done/workflows/execute-plan.md
@C:/Users/Juan/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@components/expense-tracker.tsx (lines 335-374 — floating taskbar with TabsTrigger elements)
</context>

<tasks>

<task type="auto">
  <name>Task 1: Conditionally render tab labels based on active state</name>
  <files>components/expense-tracker.tsx</files>
  <action>
In the floating bottom taskbar (around lines 341-374), update each TabsTrigger so that:

1. The icon is ALWAYS rendered (keep existing icon with its className).
2. The text label is ONLY rendered when `activeTab` matches that tab's value.
3. Remove the `mr-2` or `mr-1` class from icons when the tab is inactive (no margin needed when there's no text next to it). Use conditional className: `cn("h-4 w-4", activeTab === "value" && "mr-2")` (or mr-1 where currently mr-1).

For each of the 8 tabs, the pattern is:

```tsx
<TabsTrigger value="table">
  <Coins className={cn("h-4 w-4", activeTab === "table" && "mr-2")} />
  {activeTab === "table" && "Gastos"}
</TabsTrigger>
```

Apply this pattern to all 8 tabs in the floating taskbar:
- table: Coins icon, "Gastos", mr-2
- incomes: DollarSign icon, "Ingresos", mr-2
- investments: ChartNoAxesCombined icon, "Inversiones", mr-2
- charts: PieChart icon, "Charts", mr-2
- movements: ArrowLeftRight icon, "Movimientos", mr-1
- recurrentes: Repeat icon, "Recurrentes", mr-2
- budgets: Target icon, "Presupuestos", mr-1
- loans: Handshake icon, "Prestamos", mr-2

IMPORTANT: Do NOT touch the secondary TabsList (periodo/mes around line 405-408) — that one stays as-is.

The `cn` utility is already imported at line 74.
  </action>
  <verify>
    <automated>cd D:/Documents/Programing/nextjs/expense-tracker && npx next build 2>&1 | tail -5</automated>
  </verify>
  <done>Only the active tab in the floating taskbar shows its text label. Inactive tabs show icon only. Build succeeds with no errors.</done>
</task>

</tasks>

<verification>
- Build completes without errors
- Visual: floating taskbar shows 8 icon-only tabs + 1 active tab with icon+text
- Clicking a different tab collapses the previous label and expands the new one
</verification>

<success_criteria>
- Active tab renders icon + text label
- All 7 inactive tabs render icon only (no text, no extra margin)
- No regression on the periodo/mes tab toggle
- Build passes
</success_criteria>

<output>
After completion, create `.planning/quick/3-cuando-una-tab-no-este-seleccionada-quit/3-SUMMARY.md`
</output>
