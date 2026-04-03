---
phase: quick
plan: 9
subsystem: ui-settings
tags: [settings, taskbar, dialog, config, refactor]
dependency_graph:
  requires: []
  provides: [settings-panel-component, consolidated-settings-dialog]
  affects: [expense-tracker-layout, sidebar-layout]
tech_stack:
  added: []
  patterns: [dialog-settings-panel, scrollable-dialog-content]
key_files:
  created:
    - components/settings-panel.tsx
  modified:
    - components/expense-tracker.tsx
  deleted:
    - components/config-card.tsx
decisions:
  - Close settings dialog before opening adjust balance dialog to prevent dialog overlap
metrics:
  duration: ~8min
  completed: 2026-04-03
---

# Quick Task 9: Move Config Settings from Card to Taskbar Summary

All configuration settings consolidated from sidebar ConfigCard into taskbar gear icon dialog via new SettingsPanel component with 5 organized sections.

## What Was Done

### Task 1: Create SettingsPanel component (e384416)
- Extracted all config UI from ConfigCard into standalone `SettingsPanel` component
- Organized into 5 sections: Empleo, Cotizacion USD, Historial de ingresos, Herramientas, Zona peligrosa
- Added `onResetAllData` prop and internal `confirmReset` state for the danger zone two-step confirm
- Wrapped content in `max-h-[70vh] overflow-y-auto` for scrollable dialog use
- Preserved all editing interactions: employment type toggle, pay day inline edit, USD rate edit, salary CRUD

### Task 2: Wire SettingsPanel into dialog, remove ConfigCard (300e743)
- Replaced settings dialog content (previously just "Borrar todos los datos" button) with full SettingsPanel
- Removed ConfigCard from right sidebar layout
- Added dialog close before adjust balance dialog open to prevent overlap
- Removed unused `confirmReset` state from expense-tracker
- Replaced ConfigCard import with SettingsPanel import

### Task 3: Delete config-card.tsx (1736434)
- Deleted the now-unused `components/config-card.tsx` (570 lines removed)
- Verified no remaining imports reference the file

## Deviations from Plan

None - plan executed exactly as written.

## Verification

- `npx next build` passes with zero errors
- TypeScript compilation clean (`npx tsc --noEmit`)
- No remaining references to config-card in codebase
- Right sidebar now shows only ResumenCard + PatrimonioCard + ExchangeSummary

## Commits

| Task | Commit  | Description                                           |
|------|---------|-------------------------------------------------------|
| 1    | e384416 | Create SettingsPanel component from ConfigCard         |
| 2    | 300e743 | Wire SettingsPanel into dialog, remove ConfigCard      |
| 3    | 1736434 | Delete unused config-card.tsx                          |
