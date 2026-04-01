# Phase 1: Critical Bug Fixes - Context

**Gathered:** 2026-04-01
**Status:** Ready for planning

<domain>
## Phase Boundary

Fix 7 confirmed bugs (BUG-01 through BUG-07) that produce wrong calculations, broken forms, and corrupted data. Every existing calculation must produce correct results and every form must work as expected after this phase.

</domain>

<decisions>
## Implementation Decisions

### Data migration strategy
- No data migration needed — user is starting fresh with clean data
- Add a "Reset all data" button behind a gear/settings icon in the header
- Reset requires a confirmation dialog ("Are you sure? This will delete all your financial data." with Cancel/Confirm)
- No auto-clear or version-based wipe — user controls when to reset

### Investment type canonicalization (BUG-02)
- Canonical list: Plazo Fijo, FCI, Crypto, Acciones (4 types)
- Drop "Bonos" — covered by FCI/Acciones
- Extract as shared constant used by both dialog and type system
- Aligns with Phase 2 investment model (Plazo Fijo=ARS only, Crypto=USD, FCI=ARS/USD, Acciones=market currency)

### Validation UX (BUG-04, forms in general)
- Disabled submit button when fields are invalid + tooltip on hover showing what needs fixing
- Red border on invalid fields for at-a-glance identification
- Validation triggers on blur (when user leaves the field)
- USD rate field: pre-fill with last used rate (persisted) to avoid the 0/empty problem
- Validation rules: amount > 0, USD rate > 0

### Installment dates (BUG-05)
- Use last day of month when original day doesn't exist: Jan 31 -> Feb 28 -> Mar 31 -> Apr 30
- Preserves "end of month" intent rather than clipping permanently to shortest month

### Salary form (BUG-07)
- Pre-fill with current values only when editing an existing salary entry
- New salary entries start with blank fields

### Fix scope
- Fix + minimal cleanup: fix the bug AND do small related improvements (extract shared constants, add type safety that prevents recurrence)
- No big refactors — those belong in Phase 2
- No scope creep into Phase 2 investment model restructuring

### Claude's Discretion
- Exact tooltip content and positioning for disabled submit button
- How to persist the "last used USD rate" (localStorage key or within monthlyData)
- Gear icon placement and settings menu design
- Red border styling specifics (shade, animation, etc.)

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `useLocalStorage.ts`: Already has `migrateData()` function — can add reset functionality here
- `components/ui/dialog.tsx`: Radix UI dialog — use for reset confirmation
- `components/ui/tooltip.tsx`: Exists — use for disabled submit button tooltip
- `components/ui/button.tsx`: Has variant support — add disabled state styling
- `constants/colors.ts`: Pattern for shared constants — follow same pattern for investment types

### Established Patterns
- All state flows through `useMoneyTracker` -> domain hooks -> `useLocalStorage` -> localStorage
- Form handling uses `preventDefault()` with HTML5 attributes — validation will need to augment this
- `cn()` utility from `lib/utils.ts` for conditional class merging — use for red border toggling
- `@/` path aliases for all imports

### Integration Points
- `investment-dialog.tsx`: Where investment type options are rendered (BUG-02 fix point)
- `useMoneyTracker.ts`: Where `calculateTotalAvailable()` lives (BUG-03 fix point)
- `useExpensesTracker.ts`: Where installment date logic lives (BUG-05 fix point)
- `useInvestmentsTracker.ts`: Where currency handling lives (BUG-01 fix point)
- `expense-tracker.tsx`: Main component where settings gear icon would be added

</code_context>

<specifics>
## Specific Ideas

- Investment types should match Phase 2 requirements upfront to avoid re-work: Plazo Fijo, FCI, Crypto, Acciones
- Settings gear icon in header — minimal, just reset for now, but extensible for future settings
- "Last used USD rate" pre-fill makes the common case (same rate for multiple entries in one session) frictionless

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 01-critical-bug-fixes*
*Context gathered: 2026-04-01*
