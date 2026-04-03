---
phase: quick-19
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - components/expense-tracker.tsx
  - components/settings-panel.tsx
  - components/theme-toggle.tsx
autonomous: true
requirements: [QUICK-19]
must_haves:
  truths:
    - "Theme selector no longer appears in the taskbar"
    - "Theme selector appears inside the Settings dialog"
    - "Changing theme inside Settings still works (light/dark/system)"
  artifacts:
    - path: "components/settings-panel.tsx"
      provides: "Theme selector UI inside settings"
      contains: "useTheme"
    - path: "components/expense-tracker.tsx"
      provides: "Taskbar without theme toggle"
  key_links:
    - from: "components/settings-panel.tsx"
      to: "next-themes"
      via: "useTheme hook"
      pattern: "useTheme"
---

<objective>
Move the theme selector (Sistema/Claro/Oscuro) from the top taskbar into the Settings dialog to free up taskbar space.

Purpose: Reduce taskbar clutter by moving an infrequently-used control into Settings where it belongs.
Output: Theme selector removed from taskbar, added as a new section in SettingsPanel.
</objective>

<context>
@components/expense-tracker.tsx (taskbar area ~line 480 has ThemeToggle)
@components/settings-panel.tsx (settings dialog content)
@components/theme-toggle.tsx (current theme selector component)
</context>

<tasks>

<task type="auto">
  <name>Task 1: Move theme selector from taskbar into SettingsPanel</name>
  <files>components/expense-tracker.tsx, components/settings-panel.tsx, components/theme-toggle.tsx</files>
  <action>
1. In `components/expense-tracker.tsx`:
   - Remove the `import { ThemeToggle } from "./theme-toggle"` line (line 74)
   - Remove `<ThemeToggle />` from the taskbar (line 480)
   - The ThemeToggle component file can be left as-is (or deleted if unused elsewhere)

2. In `components/settings-panel.tsx`:
   - Add imports: `import { useTheme } from "next-themes"` and `import { useState as useStateMounted, useEffect } from "react"` (reuse existing useState/useEffect from React import)
   - Add `import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"`
   - Inside the component, add theme state:
     ```
     const { theme, setTheme } = useTheme()
     const [themeMounted, setThemeMounted] = useState(false)
     useEffect(() => { setThemeMounted(true) }, [])
     ```
     (Note: useState and useEffect are already imported from "react" at top of file — just add useEffect to the existing import)
   - Add a new "Apariencia" section as the FIRST section in the settings panel (before "Empleo"), containing a row with label "Tema:" on the left and a Select dropdown on the right (w-[140px]) with options: Claro (light), Oscuro (dark), Sistema (system). Only render the Select when themeMounted is true, otherwise show a placeholder span.
   - Add an `<hr>` separator after the Apariencia section, matching the existing pattern.

The theme selector should match the existing settings panel styling: `text-sm`, `flex items-center justify-between` row layout, same as USD rate or employment type rows.
  </action>
  <verify>
    <automated>cd D:/Documents/Programing/nextjs/expense-tracker && npx next build 2>&1 | tail -5</automated>
  </verify>
  <done>Theme selector is gone from taskbar. Opening Settings dialog shows "Apariencia" section at top with tema dropdown. Selecting Claro/Oscuro/Sistema changes the theme correctly.</done>
</task>

</tasks>

<verification>
- Open the app, verify taskbar no longer shows the theme dropdown
- Click the settings gear icon, verify "Apariencia" section appears at top with Tema selector
- Switch between Claro, Oscuro, Sistema and confirm theme changes correctly
- Verify no TypeScript/build errors
</verification>

<success_criteria>
- Theme toggle removed from taskbar (no ThemeToggle component rendered there)
- Theme selector present inside Settings dialog as first section
- All three theme options (light/dark/system) work correctly
- Build passes with no errors
</success_criteria>

<output>
After completion, create `.planning/quick/19-move-el-selector-de-tema-dentro-de-setti/19-SUMMARY.md`
</output>
