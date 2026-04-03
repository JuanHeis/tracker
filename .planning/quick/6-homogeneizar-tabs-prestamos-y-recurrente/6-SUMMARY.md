---
phase: quick
plan: 6
status: complete
started: "2026-04-03T01:52:28.256Z"
completed: "2026-04-03T01:58:00.000Z"
commit: e614f4f
---

# Quick Task 6: Homogeneizar tabs Prestamos y Recurrentes

## Changes

All tabs now follow the same Card > CardHeader > CardContent pattern:

### `components/expense-tracker.tsx`
- Wrapped Recurrentes tab in Card with CardHeader (title + button) and CardContent
- Wrapped Prestamos tab in Card with CardHeader (title + button) and CardContent
- Removed conditional header that was outside the Card pattern

### `components/recurring-table.tsx`
- Removed internal header (title + button) — now provided by Card wrapper
- Removed `onAddClick` prop (no longer needed)
- Simple empty state inside TableCell matching other tables (expenses, incomes)

### `components/loans-table.tsx`
- Removed elaborate empty state with centered text + button
- Simple empty state inside TableCell matching other tables
