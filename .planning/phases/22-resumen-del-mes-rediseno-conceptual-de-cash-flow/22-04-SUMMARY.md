---
phase: 22
plan: 04
subsystem: investments-purpose-ux
tags: [ui, wizard, settings, investment-purpose, inline-select]
dependency_graph:
  requires:
    - 22-01  # InvestmentPurpose type, getInvestmentPurpose, ResumenConfig, RESUMEN_CONFIG_KEY
    - 22-02  # suggestPurpose heuristic (purpose-suggestion.ts)
    - 22-03  # resumenConfig state in expense-tracker.tsx, setResumenConfig
  provides:
    - Inline purpose Select per investment row in InvestmentsTable
    - InvestmentPurposeWizard one-shot migration modal
    - handleUpdatePurpose handler in useInvestmentsTracker + useMoneyTracker
    - Deficit threshold Slider in SettingsPanel
    - Factory reset clears resumenConfig
    - New investments default purpose="ahorro"
  affects:
    - hooks/useInvestmentsTracker.ts
    - hooks/useMoneyTracker.ts
    - components/investment-row.tsx
    - components/investments-table.tsx
    - components/investment-purpose-wizard/investment-purpose-wizard.tsx
    - components/settings-panel.tsx
    - components/expense-tracker.tsx
tech_stack:
  added: []
  patterns:
    - Purpose Select in table row with stopPropagation to prevent row expand toggle
    - Wizard onComplete batch-updates via setMonthlyData (single re-render for N investments)
    - onDismiss stamps wizardCompletedAt without modifying investments (D10 no red de seguridad)
    - Deficit threshold Slider uses same useLocalStorage pattern as savingsRate
    - Factory reset: removeItem per-key approach (NOT STORAGE_KEYS array, per Pitfall 7)
key_files:
  created:
    - components/investment-purpose-wizard/investment-purpose-wizard.tsx
    - components/investment-purpose-wizard/purpose-suggestion.ts
    - lib/resumen/month-metrics.ts
    - lib/resumen/deficit-detector.ts
  modified:
    - hooks/useInvestmentsTracker.ts
    - hooks/useMoneyTracker.ts
    - components/investment-row.tsx
    - components/investments-table.tsx
    - components/settings-panel.tsx
    - components/expense-tracker.tsx
decisions:
  - "handleUpdatePurpose does NOT update lastUpdated — purpose is metadata, not a value update (avoids triggering the 7-day stale warning)"
  - "setMonthlyData exposed from useMoneyTracker return block for batch wizard onComplete (avoids N separate re-renders)"
  - "Wizard fires for active investments only when wizardCompletedAt is undefined AND at least one investment has purpose===undefined"
  - "Factory reset in both Re-ejecutar wizard button AND handleResetAllData in expense-tracker.tsx to ensure both paths clear resumenConfig"
metrics:
  duration_minutes: 35
  completed_date: "2026-06-01"
  tasks_completed: 5
  tasks_total: 5
  files_modified: 6
---

# Phase 22 Plan 04: Investment Purpose UX Surfaces Summary

Three investment-purpose UX surfaces delivered: inline Select per row, one-shot migration wizard, and settings deficit threshold slider — completing all 13 SPEC decisions (D1-D13) across Phase 22.

## What Was Built

### Task 1: handleUpdatePurpose handler + purpose="ahorro" default (commit 1a64a64)

**Files:** `hooks/useInvestmentsTracker.ts`, `hooks/useMoneyTracker.ts`

- Added `InvestmentPurpose` to `useInvestmentsTracker.ts` imports
- Added `purpose: "ahorro"` as explicit default field in `handleAddInvestment` object literal
- Added `handleUpdatePurpose(investmentId, purpose)` handler that calls `updateInvestment` without touching `lastUpdated`
- Exported `handleUpdatePurpose` from `useInvestmentsTracker` return block
- Re-exported `handleUpdatePurpose` and `setMonthlyData` from `useMoneyTracker` return block

### Task 2: Inline purpose Select in InvestmentRow + InvestmentsTable (commit 37a602e)

**Files:** `components/investment-row.tsx`, `components/investments-table.tsx`

- Added `InvestmentPurpose`, `getInvestmentPurpose`, and Select component imports to `investment-row.tsx`
- Added `onUpdatePurpose` prop to both `InvestmentRowProps` and `InvestmentsTableProps`
- Inserted purpose `<Select>` `<TableCell>` between "Tipo" and "Capital Invertido" columns
- Select uses `getInvestmentPurpose(investment)` as value; `disabled={isFinalized}`; 4 options: ahorro/objetivo/tarjeta/especulacion
- Added `<TableHead>Propósito</TableHead>` in both loading-state and active-state table headers
- Updated all `colSpan={8}` to `colSpan={9}` in both files (3 in investments-table, 1 in investment-row)
- Forwarded `onUpdatePurpose` from `InvestmentsTable` to each `<InvestmentRow>`

### Task 3: InvestmentPurposeWizard modal component (commit 4dbe5ca)

**Files:** `components/investment-purpose-wizard/investment-purpose-wizard.tsx`, plus Plan 02 artifacts

- Created `InvestmentPurposeWizard` named export with props: `open`, `investments`, `onComplete`, `onDismiss`
- Internal `assignments` state initialized from `inv.purpose ?? suggestPurpose(inv)` per investment
- `useEffect` re-seeds when `open` changes or `investments.length` changes
- "Aceptar sugerencias" resets all to `suggestPurpose()` heuristic
- "Confirmar" calls `onComplete(assignments)`; "Cancelar"/X calls `onDismiss`
- No `localStorage` references; no `useLocalStorage` import — parent owns persistence
- Also committed Plan 02 artifacts (`purpose-suggestion.ts`, `month-metrics.ts`, `deficit-detector.ts`) that were created but untracked in main repo

### Task 4: Wire wizard in expense-tracker.tsx (commit 98e613f)

**Files:** `components/expense-tracker.tsx`

- Added `InvestmentPurposeWizard` import
- Added `handleUpdatePurpose` and `setMonthlyData` to `useMoneyTracker()` destructure
- Changed `const [resumenConfig]` to `const [resumenConfig, setResumenConfig]` to expose setter
- Added `needsPurposeWizard` `useMemo`: false when `wizardCompletedAt` is set OR investments list is empty OR all have `purpose` defined
- Mounted `<InvestmentPurposeWizard>` near end of return JSX with `open={needsPurposeWizard}`
- `onComplete`: batch-maps all investment purposes via `setMonthlyData` + stamps `wizardCompletedAt`
- `onDismiss`: stamps `wizardCompletedAt` only (D10: no red de seguridad)
- Added `onUpdatePurpose={handleUpdatePurpose}` to `<InvestmentsTable>` call

### Task 5: Deficit threshold Slider in settings panel (commit 817c9a7)

**Files:** `components/settings-panel.tsx`, `components/expense-tracker.tsx`

- Added imports for `useLocalStorage`, `RESUMEN_CONFIG_KEY`, `DEFAULT_RESUMEN_CONFIG`, `ResumenConfig`, `Slider`
- Added `[resumenConfig, setResumenConfig]` state hook inside `SettingsPanel`
- Added "Alerta de déficit" section with `Slider` (min=10, max=100, step=10) before "Re-ejecutar wizard" button
- Slider `onValueChange` calls `setResumenConfig({ ...resumenConfig, deficitThresholdPercent: val })`
- Added `localStorage.removeItem(RESUMEN_CONFIG_KEY)` to both the "Re-ejecutar wizard" onClick and `handleResetAllData` in expense-tracker.tsx
- `STORAGE_KEYS` array left unchanged (Pitfall 7: no export/import envelope modification)

## Success Criteria Verification

- D3: Inline purpose Select per row — done (4 options, disabled for finalized)
- D3 (migration) + D10: One-shot wizard with auto-mount, dismiss stamps timestamp — done
- D13: Settings slider 10-100 step 10 default 25 — done
- Factory reset clears resumenConfig (both paths) — done
- New investments default purpose="ahorro" explicitly — done
- All colSpan values updated for the new column (8→9) — done
- `tsc --noEmit` exits 0 — confirmed
- `npm run build` exits 0 — confirmed

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Plan 02 artifacts missing from worktree**

- **Found during:** Task 3 setup — `purpose-suggestion.ts`, `month-metrics.ts`, `deficit-detector.ts` existed only as untracked files in main repo, not committed or present in worktree
- **Issue:** Plan 02 was never committed (no 22-02-SUMMARY.md). Plan 03 ran on a different worktree that had these files untracked. This worktree lacked them, blocking Task 3 compilation.
- **Fix:** Copied the three files from main repo's working tree to this worktree, then committed them as part of Task 3.
- **Files modified:** `components/investment-purpose-wizard/purpose-suggestion.ts`, `lib/resumen/month-metrics.ts`, `lib/resumen/deficit-detector.ts`
- **Commit:** 4dbe5ca

**2. [Rule 2 - Missing] setMonthlyData not exported from useMoneyTracker**

- **Found during:** Task 4 — plan required `setMonthlyData` for wizard `onComplete` batch update, but `useMoneyTracker` didn't export it
- **Issue:** Plan incorrectly assumed `setMonthlyData` was already in the return block. Without it, only expensive N-call `handleUpdatePurpose` loop was available.
- **Fix:** Added `setMonthlyData` to `useMoneyTracker` return block (alongside `handleUpdatePurpose`). This is safe: `setMonthlyData` was already accessible inside the hook, just not exposed.
- **Files modified:** `hooks/useMoneyTracker.ts`
- **Commit:** 1a64a64

**3. [Rule 1 - Bug] resumenConfig setter missing in expense-tracker.tsx (Plan 03 left it incomplete)**

- **Found during:** Task 4 — Plan 03 only destructured `[resumenConfig]` (no setter), but Task 4 requires `setResumenConfig` for wizard onComplete/onDismiss
- **Fix:** Changed `const [resumenConfig]` to `const [resumenConfig, setResumenConfig]`
- **Files modified:** `components/expense-tracker.tsx`
- **Commit:** 98e613f

**4. [Rule 1 - Bug] Unescaped quotes in JSX causing build error**

- **Found during:** Task 5 build run — `"Déficit recurrente"` quotes in paragraph text triggered `react/no-unescaped-entities` ESLint build error
- **Fix:** Replaced `"` with `&ldquo;` and `&rdquo;` HTML entities
- **Files modified:** `components/settings-panel.tsx`
- **Commit:** 817c9a7

**5. [Rule 2 - Missing] handleResetAllData in expense-tracker.tsx missing RESUMEN_CONFIG_KEY clear**

- **Found during:** Task 5 — the "Zona peligrosa" Confirmar button calls `handleResetAllData` in expense-tracker.tsx which didn't clear `resumenConfig`. Only the settings-panel "Re-ejecutar wizard" button was updated by the plan.
- **Fix:** Added `localStorage.removeItem(RESUMEN_CONFIG_KEY)` to `handleResetAllData` in expense-tracker.tsx
- **Files modified:** `components/expense-tracker.tsx`
- **Commit:** 817c9a7

## Known Stubs

None. All data flows are wired end-to-end. Wizard, inline Select, and settings slider all persist to localStorage via the correct hooks.

## Threat Flags

No new network endpoints, auth paths, or schema changes at trust boundaries. All changes are UI-only, reading/writing existing localStorage keys (`resumenConfig`, `monthlyData`).

## Self-Check: PASSED

- FOUND: components/investment-purpose-wizard/investment-purpose-wizard.tsx
- FOUND: components/investment-purpose-wizard/purpose-suggestion.ts
- FOUND: lib/resumen/month-metrics.ts
- FOUND: lib/resumen/deficit-detector.ts
- FOUND: hooks/useInvestmentsTracker.ts (modified)
- FOUND: hooks/useMoneyTracker.ts (modified)
- FOUND: components/investment-row.tsx (modified)
- FOUND: components/investments-table.tsx (modified)
- FOUND: components/settings-panel.tsx (modified)
- FOUND: components/expense-tracker.tsx (modified)
- FOUND commit: 1a64a64 (Task 1)
- FOUND commit: 37a602e (Task 2)
- FOUND commit: 4dbe5ca (Task 3)
- FOUND commit: 98e613f (Task 4)
- FOUND commit: 817c9a7 (Task 5)
