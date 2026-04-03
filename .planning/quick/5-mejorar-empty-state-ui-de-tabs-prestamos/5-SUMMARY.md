---
phase: quick
plan: 5
status: complete
started: "2026-04-03T01:45:45.869Z"
completed: "2026-04-03T01:50:00.000Z"
commit: f9cb037
---

# Quick Task 5: Mejorar empty state UI Prestamos y Recurrentes

## Changes

### `components/recurring-table.tsx`
- Empty state now returns early before rendering the table
- No more empty table headers showing when there are no recurring expenses
- Centered empty state with description text and action button (matches Prestamos style)

### `components/expense-tracker.tsx`
- Header with "Prestamos" title and "Nuevo prestamo" button only renders when there are loans
- Eliminates duplicate button (header + empty state both had "Nuevo prestamo")
