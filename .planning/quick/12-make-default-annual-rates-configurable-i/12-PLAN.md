---
quick: 12
title: Make default annual rates configurable + toggle real vs default rates
type: execute
autonomous: true
files_modified:
  - lib/projection/types.ts
  - lib/projection/compound-interest.ts
  - hooks/useProjectionEngine.ts
  - hooks/useDataPersistence.ts
  - components/settings-panel.tsx
  - components/charts/investment-chart.tsx
  - components/charts-container.tsx
---

<objective>
Make the hardcoded DEFAULT_ANNUAL_RATES configurable via Settings, and add a toggle in InvestmentChart to switch between user-configured default rates and actual TNA/rates from investments.

Purpose: Users can adjust projection assumptions per investment type, and compare projections using default vs real rates.
Output: New "Tasas de proyeccion" section in settings, rate-mode toggle button in investment chart.
</objective>

<context>
@lib/projection/types.ts (DEFAULT_ANNUAL_RATES constant)
@lib/projection/compound-interest.ts (getDefaultMonthlyRate reads DEFAULT_ANNUAL_RATES)
@hooks/useProjectionEngine.ts (orchestrator hook calling projection functions)
@hooks/useDataPersistence.ts (STORAGE_KEYS, export/import envelope)
@hooks/useLocalStorage.ts (useLocalStorage with migrateFn)
@components/settings-panel.tsx (existing settings UI)
@components/charts/investment-chart.tsx (chart with type toggles)
@components/charts-container.tsx (wires useProjectionEngine to charts)
@constants/investments.ts (INVESTMENT_TYPES array, InvestmentType)
</context>

<tasks>

<task type="auto">
  <name>Task 1: Add configurable rates to localStorage + plumb through projection engine</name>
  <files>
    lib/projection/types.ts,
    lib/projection/compound-interest.ts,
    hooks/useProjectionEngine.ts,
    hooks/useDataPersistence.ts,
    components/charts-container.tsx
  </files>
  <action>
1. In `lib/projection/types.ts`:
   - Keep `DEFAULT_ANNUAL_RATES` as the hardcoded fallback (rename nothing, it stays as the factory default).
   - Export a new type: `type CustomAnnualRates = Partial<Record<InvestmentType, number>>` — partial because user may only override some types.

2. In `lib/projection/compound-interest.ts`:
   - Add an optional `customRates` parameter to `getDefaultMonthlyRate(type, rateMultiplier, customRates?)`.
   - When customRates is provided and has a value for that type, use it instead of DEFAULT_ANNUAL_RATES[type].
   - Update `projectInvestment` to also accept optional `customRates` so the `annualRate` field in the returned projection reflects the custom rate when used.

3. In `hooks/useProjectionEngine.ts`:
   - Add `customAnnualRates?: CustomAnnualRates` to the options parameter.
   - Add `useRealRates?: boolean` option (default false). When true, for non-PF investments that have a `tna` field, use the investment's own tna instead of the default/custom rate.
   - Pass customRates through to `computeInvestmentGrowth` -> `getDefaultMonthlyRate` and `projectInvestment`.
   - When `useRealRates` is true, for each investment: if it has `tna != null`, compute monthly rate from `pfMonthlyRate(inv.tna)` regardless of type; otherwise fall back to default/custom rates. This gives users a way to see projections based on actual known rates.

4. In `hooks/useDataPersistence.ts`:
   - Add `"customAnnualRates"` to STORAGE_KEYS array.
   - Add it to JSON_KEYS array (it's a JSON object).
   - This ensures export/import includes custom rates.
   - MIGRATION SAFETY: The validateEnvelope function checks all STORAGE_KEYS exist in import data. Make the check for `customAnnualRates` lenient — if missing from imported data, default to `{}` (empty object) instead of failing validation. Do this by checking if missing keys include only `customAnnualRates` and treating that as acceptable (set it to `{}`).

5. In `components/charts-container.tsx`:
   - Import `useLocalStorage` from `@/hooks/useLocalStorage`.
   - Import `CustomAnnualRates` from `@/lib/projection/types`.
   - Add state: `const [customAnnualRates, setCustomAnnualRates] = useLocalStorage<CustomAnnualRates>("customAnnualRates", {})`.
   - Add state: `const [useRealRates, setUseRealRates] = useState(false)`.
   - Pass `customAnnualRates` and `useRealRates` into useProjectionEngine options.
   - Pass `useRealRates` and `onToggleRealRates` to InvestmentChart.
  </action>
  <verify>
    npx tsc --noEmit 2>&1 | head -20
  </verify>
  <done>
    - getDefaultMonthlyRate and projectInvestment accept optional customRates override
    - useProjectionEngine accepts customAnnualRates and useRealRates options
    - customAnnualRates persisted in localStorage via useLocalStorage
    - Export/import handles customAnnualRates (present or missing gracefully)
    - TypeScript compiles cleanly
  </done>
</task>

<task type="auto">
  <name>Task 2: Settings UI for rates + chart toggle button</name>
  <files>
    components/settings-panel.tsx,
    components/charts/investment-chart.tsx,
    components/expense-tracker.tsx
  </files>
  <action>
1. In `components/settings-panel.tsx`:
   - Add new props: `customAnnualRates: CustomAnnualRates`, `onUpdateCustomAnnualRates: (rates: CustomAnnualRates) => void`.
   - Add a new section between "Cotizacion USD" and "Historial de ingresos" titled "Tasas de proyeccion".
   - Import `INVESTMENT_TYPES` from `@/constants/investments` and `DEFAULT_ANNUAL_RATES` from `@/lib/projection/types`.
   - For each investment type in INVESTMENT_TYPES, show a row with:
     - Type name label
     - Special case for "Plazo Fijo": show "Usa TNA de cada inversion" as non-editable text (since PF always uses its own TNA)
     - For other types: show current rate as percentage with inline edit (same Pencil/Check/X pattern as existing USD rate editing). Display the effective rate: customAnnualRates[type] if set, otherwise DEFAULT_ANNUAL_RATES[type]. When editing, input is percentage (e.g., "40" for 40%). On save, store as decimal (0.40) in customAnnualRates.
     - If the user has customized a rate (differs from default), show a small reset button (X or RotateCcw icon) to clear that override back to default.
   - The editing pattern should match the existing inline-edit pattern (editingRate state, Input with Enter/Escape handlers, Check/X buttons).

2. In `components/charts/investment-chart.tsx`:
   - Add new props: `useRealRates: boolean`, `onToggleRealRates: () => void`.
   - In the header, next to the existing "Con/Sin aportes" button, add a new toggle Button:
     - When useRealRates is false: text "Tasas por defecto", variant "outline"
     - When useRealRates is true: text "Tasas reales", variant "default"
     - onClick calls onToggleRealRates
   - Only show this button if at least one investment in the projections has a real rate available (i.e., any investment has tna != null). Check via the `investments` prop. If no investment has tna, don't show the toggle (it would do nothing).

3. In `components/expense-tracker.tsx`:
   - Thread `customAnnualRates` and `onUpdateCustomAnnualRates` from ChartsContainer (or directly from useLocalStorage in expense-tracker) down to SettingsPanel.
   - Since SettingsPanel is rendered in expense-tracker.tsx and customAnnualRates state lives in charts-container.tsx, the simplest approach: add useLocalStorage for customAnnualRates in expense-tracker.tsx as well (both read the same localStorage key, so they stay in sync). Pass to SettingsPanel.
  </action>
  <verify>
    npx tsc --noEmit 2>&1 | head -20 && echo "--- Build check ---" && npx next build 2>&1 | tail -5
  </verify>
  <done>
    - Settings panel shows "Tasas de proyeccion" section with editable rates per investment type
    - Plazo Fijo shows as non-editable (uses TNA)
    - Edited rates persist in localStorage and survive page refresh
    - Investment chart shows "Tasas por defecto" / "Tasas reales" toggle when real rates available
    - Toggle switches projection engine between custom/default rates and real TNA rates
    - App builds without errors
  </done>
</task>

</tasks>

<verification>
1. `npx tsc --noEmit` — zero errors
2. `npx next build` — builds successfully
3. Open Settings: "Tasas de proyeccion" section visible with all 5 types
4. Edit FCI rate from 40% to 50%, close settings, refresh page — rate persists
5. Open investment chart: if any investment has TNA, toggle button visible
6. Click toggle: chart projections update (visible in basis info section showing different rates)
7. Export data, check JSON includes customAnnualRates key
</verification>

<success_criteria>
- Custom annual rates stored in localStorage under "customAnnualRates" key
- Settings panel allows editing rates per investment type (except Plazo Fijo)
- Investment chart has rate-mode toggle between default and real rates
- Projection engine uses custom rates when configured, falls back to hardcoded defaults
- Export/import handles new key gracefully (missing = empty object, no crash)
- No breaking changes to existing localStorage schema
</success_criteria>
