---
phase: quick
plan: 9
type: execute
wave: 1
depends_on: []
files_modified:
  - components/settings-panel.tsx
  - components/expense-tracker.tsx
  - components/config-card.tsx
autonomous: true
requirements: [QUICK-9]
must_haves:
  truths:
    - "Clicking the gear icon in the taskbar opens a dialog with all config options organized in sections"
    - "Employment type, pay day, USD rate, salary history, and tools (adjust balance, export, import, re-run wizard) are all accessible from the settings dialog"
    - "The ConfigCard no longer renders in the right sidebar"
    - "All editing interactions (inline edit employment type, pay day, USD rate, salary entries) work identically inside the settings dialog"
  artifacts:
    - path: "components/settings-panel.tsx"
      provides: "Settings panel content extracted from config-card with organized sections"
      contains: "SettingsPanel"
    - path: "components/expense-tracker.tsx"
      provides: "Settings dialog uses SettingsPanel, ConfigCard removed from sidebar"
  key_links:
    - from: "components/expense-tracker.tsx"
      to: "components/settings-panel.tsx"
      via: "SettingsPanel rendered inside Dialog"
      pattern: "<SettingsPanel"
---

<objective>
Move all configuration settings from the ConfigCard (right sidebar) into the taskbar settings gear icon dialog.

Purpose: The ConfigCard takes up valuable sidebar space. All config options should be accessible from the gear icon, which currently only has a "Borrar todos los datos" button. This consolidates all settings into a single accessible location.
Output: New SettingsPanel component, updated settings dialog, ConfigCard removed from sidebar.
</objective>

<execution_context>
@C:/Users/Juan/.claude/get-shit-done/workflows/execute-plan.md
@C:/Users/Juan/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@components/config-card.tsx (full file - source of all config UI to migrate)
@components/expense-tracker.tsx (lines 435-487 - current settings dialog, lines 690-703 - ConfigCard usage)

<interfaces>
<!-- From hooks/useSalaryHistory.ts -->
```typescript
export interface SalaryEntry {
  id: string;
  effectiveDate: string;
  amount: number;
  usdRate: number;
}

export interface IncomeConfig {
  employmentType: "dependiente" | "independiente";
  payDay: number;
}
```

<!-- Current ConfigCard props (to be reused by SettingsPanel) -->
```typescript
interface ConfigCardProps {
  incomeConfig: IncomeConfig;
  onUpdateIncomeConfig: (config: IncomeConfig) => void;
  globalUsdRate: number;
  onSetGlobalUsdRate: (rate: number) => void;
  salaryHistory: SalaryEntry[];
  onAddSalaryEntry: (entry: Omit<SalaryEntry, "id">) => void;
  onUpdateSalaryEntry: (id: string, updates: Partial<SalaryEntry>) => void;
  onDeleteSalaryEntry: (id: string) => void;
  selectedMonth: string;
  onAdjustBalance?: () => void;
  onExport?: () => void;
  onImport?: (file: File) => void;
}
```

<!-- Current settings dialog (lines 435-487) contains only: -->
- "Borrar todos los datos" button with confirm flow
- handleResetAllData clears localStorage keys and reloads
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Create SettingsPanel component from ConfigCard internals</name>
  <files>components/settings-panel.tsx</files>
  <action>
Create a new component `SettingsPanel` that contains ALL the config UI currently in ConfigCard, PLUS the existing "Borrar todos los datos" functionality from the settings dialog.

The component should accept the same props as ConfigCard (rename interface to `SettingsPanelProps`) plus two additional props:
- `onResetAllData: () => void` - for the reset/borrar todos los datos action

Structure the panel content (no Card wrapper - it will live inside a Dialog) with clear visual sections using `h4` headings and `hr` dividers:

1. **Empleo** section: Employment type toggle + Pay day editor (identical logic to ConfigCard lines 183-273)
2. **Cotizacion USD** section: USD rate editor (identical logic to ConfigCard lines 278-321)
3. **Historial de ingresos** section: Salary history timeline with edit/delete/add (identical logic to ConfigCard lines 326-466)
4. **Herramientas** section: Adjust balance, Export JSON, Import data buttons (identical logic to ConfigCard lines 469-543)
5. **Zona peligrosa** section: "Borrar todos los datos" with the two-step confirm pattern currently in expense-tracker.tsx lines 455-484. Add `confirmReset` state internally.

Use `ScrollArea` pattern: wrap the entire content in a `div` with `max-h-[70vh] overflow-y-auto` so the dialog scrolls when content is tall (no need to install ScrollArea component, just use overflow classes).

Copy ALL state and handler logic from ConfigCard (lines 58-173) into this component. The component must be fully self-contained for editing state (editingEmploymentType, editingPayDay, editingRate, editingEntryId, etc.).

Also include the AlertDialog for delete confirmation of salary entries (from ConfigCard lines 549-567).

Import everything ConfigCard imports plus the STORAGE_KEYS import for the reset wizard button.
  </action>
  <verify>
    <automated>cd D:/Documents/Programing/nextjs/expense-tracker && npx tsc --noEmit 2>&1 | head -20</automated>
  </verify>
  <done>SettingsPanel component exists at components/settings-panel.tsx, exports SettingsPanel, accepts all config props plus onResetAllData, TypeScript compiles without errors.</done>
</task>

<task type="auto">
  <name>Task 2: Wire SettingsPanel into taskbar dialog and remove ConfigCard</name>
  <files>components/expense-tracker.tsx</files>
  <action>
Make these changes to expense-tracker.tsx:

1. **Replace ConfigCard import** (line 52): Change `import { ConfigCard }` to `import { SettingsPanel } from "@/components/settings-panel"`. Remove the config-card import entirely.

2. **Update the settings Dialog** (lines 435-487): Replace the entire DialogContent innards with SettingsPanel. The Dialog wrapper stays. Replace the current content (lines 447-485) with:
   ```tsx
   <DialogContent className="max-w-lg">
     <DialogHeader>
       <DialogTitle>Configuracion</DialogTitle>
       <DialogDescription>Opciones generales de la aplicacion</DialogDescription>
     </DialogHeader>
     <SettingsPanel
       incomeConfig={incomeConfig}
       onUpdateIncomeConfig={setIncomeConfig}
       globalUsdRate={globalUsdRate}
       onSetGlobalUsdRate={setGlobalUsdRate}
       salaryHistory={salaryHistory.entries}
       onAddSalaryEntry={addSalaryEntry}
       onUpdateSalaryEntry={updateSalaryEntry}
       onDeleteSalaryEntry={deleteSalaryEntry}
       selectedMonth={selectedMonth}
       onAdjustBalance={() => { setSettingsOpen(false); setOpenAdjustmentDialog(true); }}
       onExport={() => { exportData(); }}
       onImport={(file) => { handleImport(file); }}
       onResetAllData={handleResetAllData}
     />
   </DialogContent>
   ```
   Note: `onAdjustBalance` closes the settings dialog first, then opens the adjustment dialog, so they don't overlap.

3. **Remove ConfigCard from sidebar** (lines 690-703): Delete the entire `<ConfigCard ... />` block from the right sidebar `div`. Keep ResumenCard, PatrimonioCard, and ExchangeSummary.

4. **Remove unused state**: Delete `confirmReset` state (line 262) since it is now internal to SettingsPanel.

5. **Clean up unused imports**: Remove `Card, CardContent, CardHeader, CardTitle` if no longer used elsewhere in this file (check first - they may be used by other components in this file). Remove `ConfigCard` import.
  </action>
  <verify>
    <automated>cd D:/Documents/Programing/nextjs/expense-tracker && npx next build 2>&1 | tail -10</automated>
  </verify>
  <done>Settings gear icon opens a dialog containing all config options (employment, pay day, USD rate, salary history, tools, danger zone). ConfigCard no longer renders in the sidebar. Build succeeds. No TypeScript errors.</done>
</task>

<task type="auto">
  <name>Task 3: Delete config-card.tsx</name>
  <files>components/config-card.tsx</files>
  <action>
After Task 2 succeeds and build passes, delete the now-unused `components/config-card.tsx` file.

Verify no other files import from config-card:
```bash
grep -r "config-card" components/ --include="*.tsx" --include="*.ts"
```
If no imports found, delete the file. If imports exist, update them to use settings-panel instead.
  </action>
  <verify>
    <automated>cd D:/Documents/Programing/nextjs/expense-tracker && npx next build 2>&1 | tail -5</automated>
  </verify>
  <done>config-card.tsx is deleted. No remaining imports reference it. Build passes cleanly.</done>
</task>

</tasks>

<verification>
- `npx next build` passes with zero errors
- Gear icon in taskbar opens dialog with all 5 sections (Empleo, Cotizacion USD, Historial, Herramientas, Zona peligrosa)
- Right sidebar shows ResumenCard + PatrimonioCard + ExchangeSummary only (no ConfigCard)
- config-card.tsx no longer exists in the codebase
</verification>

<success_criteria>
All configuration settings previously in the ConfigCard are now accessible exclusively through the taskbar gear icon dialog. The ConfigCard is completely removed from the sidebar and codebase. All editing interactions (employment type toggle, pay day, USD rate, salary history CRUD, tools) work identically in the new location.
</success_criteria>

<output>
After completion, create `.planning/quick/9-move-config-settings-from-card-to-taskba/9-SUMMARY.md`
</output>
