---
status: complete
phase: 04-income-pay-date
source: [04-01-SUMMARY.md, 04-02-SUMMARY.md, 04-03-SUMMARY.md, 04-04-SUMMARY.md]
started: 2026-04-02T14:30:00Z
updated: 2026-04-02T14:45:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Income Terminology Rename
expected: All references to "Salario" now show "Ingreso fijo". All references to "Ingresos extras" or "Ingreso Extra" now show "Otros ingresos". Check the salary card header, chart titles, and income labels.
result: pass

### 2. Employment Type Toggle
expected: The salary card shows an employment config section with a two-button toggle for "Dependiente" / "Independiente". Clicking each button switches the type and persists on reload.
result: pass

### 3. Pay Day Input
expected: Below the employment type toggle, there's a pay day input (1-31). Changing the number persists on reload. Values outside 1-31 are not accepted.
result: pass

### 4. Salary History Timeline
expected: The salary card shows a timeline of salary entries sorted most-recent-first. Each entry shows an effective date (e.g., "Desde Abr 2026") and amount. Clicking the pencil icon on an entry lets you edit its amount inline.
result: pass

### 5. Add New Salary Entry
expected: There's a "Nuevo ingreso fijo" button or form. Clicking it shows inputs for effective date, amount, and USD rate. Submitting adds the entry to the timeline.
result: pass

### 6. Delete Salary Entry
expected: Each salary entry has a trash/delete icon. Clicking it removes the entry from the timeline.
result: pass

### 7. Aguinaldo Display (June/December)
expected: Navigate to June or December (with employment type set to "Dependiente"). The salary card shows an aguinaldo line in green with the calculated amount (50% of best salary in that semester). Hovering shows formula tooltip.
result: pass

### 8. Aguinaldo Preview (May/November)
expected: Navigate to May or November (dependiente). A preview banner shows estimated aguinaldo for the upcoming month with the formula explanation.
result: pass

### 9. Aguinaldo Override
expected: On the aguinaldo line (June/December), clicking the edit icon lets you override the auto-calculated amount. After overriding, a reset button appears to revert to auto-calculation.
result: pass

### 10. Aguinaldo Hidden for Independiente
expected: Switch employment type to "Independiente". Navigate to June or December. No aguinaldo line or preview banner is shown.
result: pass

### 11. Periodo/Mes Toggle
expected: Near the month/year selectors, a segmented control shows "Periodo" and "Mes" options. Clicking each switches the view mode. The selection persists on reload.
result: pass

### 12. Pay Period Filtering
expected: With pay day set to 25 and "Periodo" selected, the date range should be ~25th of previous month to ~24th of current month. Expenses and incomes shown should correspond to this period, not the calendar month.
result: pass

### 13. Pendiente de Cobro Banner
expected: In "Mes" view, if today is before your pay day in the current month, the salary card shows an amber "Pendiente de cobro" banner and the salary amount appears dimmed. After pay day (or in Periodo view), this banner does not appear.
result: pass

## Summary

total: 13
passed: 13
issues: 0
pending: 0
skipped: 0

## Gaps

[none]
