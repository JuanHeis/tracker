---
phase: quick-19
plan: 01
subsystem: ui
tags: [theme, settings, taskbar]
key-files:
  created: []
  modified:
    - components/expense-tracker.tsx
    - components/settings-panel.tsx
decisions:
  - Theme selector placed as first section "Apariencia" in SettingsPanel before Empleo
metrics:
  duration: ~1min
  completed: "2026-04-03"
---

# Quick Task 19: Move Theme Selector Into Settings Summary

Theme dropdown (Claro/Oscuro/Sistema) moved from top taskbar into Settings dialog as new "Apariencia" section, freeing taskbar space.

## What Changed

### Task 1: Move theme selector from taskbar into SettingsPanel

**Commit:** `7fdf6e6`

1. **components/expense-tracker.tsx** -- Removed `ThemeToggle` import and `<ThemeToggle />` from the taskbar area.
2. **components/settings-panel.tsx** -- Added `useTheme` from next-themes, `Select` components, and hydration-safe mounting. New "Apariencia" section renders as the first section with a `w-[140px]` Select dropdown offering Claro (light), Oscuro (dark), Sistema (system) options.

## Deviations from Plan

None -- plan executed exactly as written.

## Verification

- Build passes with zero errors
- ThemeToggle no longer rendered in taskbar
- Apariencia section with tema dropdown is first section in Settings dialog

## Self-Check: PASSED
