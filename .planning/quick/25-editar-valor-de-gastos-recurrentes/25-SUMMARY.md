---
phase: quick-25
plan: 01
subsystem: recurring-expenses
tags: [edit, recurring, dialog, localStorage]
dependency_graph:
  requires: []
  provides: [updateRecurring, recurring-edit-mode]
  affects: [recurring-table, recurring-dialog, expense-tracker]
tech_stack:
  added: []
  patterns: [ephemeral-dialog-edit-mode, useEffect-sync-on-prop]
key_files:
  created: []
  modified:
    - hooks/useRecurringExpenses.ts
    - hooks/useMoneyTracker.ts
    - components/recurring-dialog.tsx
    - components/recurring-table.tsx
    - components/expense-tracker.tsx
decisions:
  - Reused existing RecurringDialog with add/edit mode toggle via editingRecurring prop
  - Pencil icon placed before pause/play buttons in action column
metrics:
  duration: ~4min
  completed: "2026-04-07"
  tasks_completed: 2
  tasks_total: 2
---

# Quick Task 25: Editar valor de gastos recurrentes Summary

Edit recurring expense values (amount, name, category, currency) via pencil icon and reused dialog in edit mode.

## Task Results

| # | Task | Commit | Key Changes |
|---|------|--------|-------------|
| 1 | Add updateRecurring to hook and dialog edit mode | e9d5f93 | updateRecurring in hook, RecurringDialog edit mode with pre-filled fields |
| 2 | Add edit button to table and wire in expense-tracker | d6c8b1f | Pencil button on active/paused rows, editingRecurring state wiring |

## Deviations from Plan

None - plan executed exactly as written.

## Verification

- `npx tsc --noEmit` passes with zero errors
- `npm run build` succeeds
- Pencil edit icon renders on active and paused recurring rows
- Dialog pre-fills name, amount, category, currency when editing
- Dialog title shows "Editar gasto recurrente" and button shows "Guardar" in edit mode
- Saving updates the recurring expense in localStorage via updateRecurring

## Self-Check: PASSED

- [x] hooks/useRecurringExpenses.ts - modified, exports updateRecurring
- [x] hooks/useMoneyTracker.ts - modified, exposes updateRecurring
- [x] components/recurring-dialog.tsx - modified, supports edit mode
- [x] components/recurring-table.tsx - modified, has Pencil edit button
- [x] components/expense-tracker.tsx - modified, wires editingRecurring state
- [x] Commit e9d5f93 exists
- [x] Commit d6c8b1f exists
