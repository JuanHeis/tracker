---
phase: quick-3
plan: 01
subsystem: ui/taskbar
tags: [ui, tabs, floating-taskbar, conditional-rendering]
dependency_graph:
  requires: []
  provides: [conditional-tab-labels]
  affects: [expense-tracker-component]
tech_stack:
  added: []
  patterns: [cn-conditional-classname, conditional-rendering]
key_files:
  modified:
    - components/expense-tracker.tsx
decisions: []
metrics:
  duration: "2min"
  completed: "2026-04-02"
---

# Quick Task 3: Conditional Tab Labels in Floating Taskbar

**One-liner:** Inactive tabs show icon only; active tab shows icon + text label using conditional rendering with cn() utility.

## What Was Done

### Task 1: Conditionally render tab labels based on active state
**Commit:** `16b7cdc`

Updated all 8 TabsTrigger elements in the floating bottom taskbar to:
- Always render the icon (h-4 w-4)
- Only render the text label when `activeTab` matches that tab's value
- Only apply margin (mr-2 or mr-1) to the icon when the tab is active (using `cn()`)

Pattern applied to each tab:
```tsx
<TabsTrigger value="table">
  <Coins className={cn("h-4 w-4", activeTab === "table" && "mr-2")} />
  {activeTab === "table" && "Gastos"}
</TabsTrigger>
```

The secondary TabsList (periodo/mes toggle) was left untouched.

## Deviations from Plan

None - plan executed exactly as written.

## Verification

- TypeScript compilation: PASSED (no type errors)
- Build: Compiled successfully (pre-existing PageNotFoundError and ESLint config issues are unrelated)
- Pattern applied consistently to all 8 tabs with correct margin values (mr-1 for movements/budgets, mr-2 for all others)

## Self-Check: PASSED
