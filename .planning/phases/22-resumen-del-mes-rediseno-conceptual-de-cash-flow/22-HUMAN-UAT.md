---
status: partial
phase: 22-resumen-del-mes-rediseno-conceptual-de-cash-flow
source: [22-VERIFICATION.md]
started: 2026-06-01T00:00:00Z
updated: 2026-06-01T00:00:00Z
---

## Current Test

[awaiting human testing]

## Tests

### 1. Deficit banners render correctly
expected: Amber "Déficit anterior" banner when previous month ended negative. Red "Déficit recurrente" banner after 3+ deficit months. Both dismissable. Banners absent when no deficit.
result: [pending]

### 2. USD/ARS toggle in ResumenCard
expected: Toggle button visible in header. In USD mode: salary/aguinaldo lines disappear, numbers switch to USD values. In ARS mode: full view restored. Toggle state resets on month change.
result: [pending]

### 3. Migration wizard auto-mount on first load
expected: Wizard opens automatically when investments exist without a `purpose` field. "Aceptar sugerencias" stamps `wizardCompletedAt` in localStorage and wizard does not reopen on next load. "Omitir" also dismisses permanently.
result: [pending]

### 4. Settings Slider persists deficit threshold
expected: Slider in settings panel changes the deficit threshold (0-100%). Value survives page reload (stored in `resumenConfig` localStorage key).
result: [pending]

### 5. Factory reset clears resumenConfig
expected: After factory reset, `resumenConfig` key absent from localStorage (verify in DevTools → Application → Local Storage). Wizard re-opens on next load if investments exist.
result: [pending]

### 6. Inline purpose Select per investment row
expected: Each active investment row shows a Select with 4 options (ahorro, retiro, objetivo, liquidez). Selecting an option persists immediately. Finalized-month rows are disabled. New investments default to "ahorro".
result: [pending]

## Summary

total: 6
passed: 0
issues: 0
pending: 6
skipped: 0
blocked: 0

## Gaps
