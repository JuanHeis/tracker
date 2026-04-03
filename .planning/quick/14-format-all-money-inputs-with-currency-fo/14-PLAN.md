---
phase: quick-14
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - components/currency-input.tsx
  - components/budget-dialog.tsx
  - components/adjustment-dialog.tsx
  - components/expense-tracker.tsx
  - components/expenses-table.tsx
  - components/income-table.tsx
  - components/investment-dialog.tsx
  - components/investment-value-cell.tsx
  - components/investment-movements.tsx
  - components/transfer-dialog.tsx
  - components/loan-dialog.tsx
  - components/loan-payments.tsx
  - components/recurring-dialog.tsx
  - components/usd-purchase-dialog.tsx
  - components/salary-card.tsx
  - components/settings-panel.tsx
  - components/resumen-card.tsx
  - components/charts/investment-basis-info.tsx
  - components/setup-wizard/wizard-step-balance.tsx
  - components/setup-wizard/wizard-step-income.tsx
  - components/setup-wizard/wizard-step-usd.tsx
  - components/setup-wizard/wizard-step-investments.tsx
autonomous: true
requirements: [QUICK-14]

must_haves:
  truths:
    - "All money inputs display formatted values with thousand separators while typing"
    - "Underlying numeric value remains clean for all calculations and form submissions"
    - "Non-money inputs (payDay, TNA%, plazoDias, cuotas) remain as type=number unchanged"
    - "Both controlled (value+onChange) and uncontrolled (name+FormData) input patterns work correctly"
    - "Clearing an input and typing a new value works without formatting glitches"
  artifacts:
    - path: "components/currency-input.tsx"
      provides: "Reusable CurrencyInput component with formatting"
      exports: ["CurrencyInput"]
  key_links:
    - from: "components/currency-input.tsx"
      to: "all 22 files with money inputs"
      via: "import { CurrencyInput } from './currency-input'"
      pattern: "CurrencyInput"
---

<objective>
Create a reusable CurrencyInput component and replace all money inputs across the app with it.

Purpose: Users currently see raw numbers (e.g. 1500000) in money inputs. With formatting, they see "1.500.000" (ARS locale) making large amounts readable and reducing input errors.

Output: A CurrencyInput component used everywhere money is entered, with clean numeric values preserved for program logic.
</objective>

<execution_context>
@C:/Users/Juan/.claude/get-shit-done/workflows/execute-plan.md
@C:/Users/Juan/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@components/ui/input.tsx
@components/formatted-amount.tsx
</context>

<tasks>

<task type="auto">
  <name>Task 1: Create CurrencyInput component</name>
  <files>components/currency-input.tsx</files>
  <action>
Create a `CurrencyInput` component that wraps the existing `Input` component with currency formatting behavior.

**Core behavior:**
- Uses `type="text"` with `inputMode="decimal"` (mobile numeric keyboard)
- Displays formatted value with locale thousand separators (using `.` as thousands separator, `,` as decimal — Argentine locale `es-AR`)
- On focus: optionally select all text for easy replacement
- On change: strip non-numeric chars (except decimal separator), parse to number, call `onValueChange(numericValue)`
- On blur: re-format the display value

**API design — must support TWO usage patterns:**

Pattern 1 — Controlled (most common):
```tsx
<CurrencyInput
  value={amount}                    // number | string (the raw numeric value)
  onValueChange={(n) => setAmount(n)} // callback with parsed number
  placeholder="Monto"
  className="h-7 w-24 text-sm"
  // plus any other Input props (autoFocus, onKeyDown, onBlur, etc.)
/>
```

Pattern 2 — Uncontrolled with name (for FormData forms):
```tsx
<CurrencyInput
  name="amount"                     // hidden input holds the raw numeric value
  defaultValue={0}                  // optional initial value
  placeholder="Monto"
  // onValueChange is optional for uncontrolled
/>
```

**Implementation details:**
- Internal state: `displayValue` (string, formatted for display)
- When `value` prop changes externally, update displayValue (controlled mode)
- When user types, parse input: allow digits, one decimal separator (either `.` or `,`), and optional leading `-`
- Format function: `formatNumber(n: number): string` — use `n.toLocaleString('es-AR')` for display (produces `1.234.567,89`)
- Parse function: `parseNumber(s: string): number` — strip dots (thousands), replace comma with dot (decimal), then `parseFloat`
- For uncontrolled mode: render a `<input type="hidden" name={name} value={numericValue} />` alongside the visible input
- Forward ref using `React.forwardRef`
- Accept all InputProps except `type` and `onChange` (we override those)
- Pass through `min`, `max`, `step`, `required`, `disabled`, `className`, `placeholder`, `autoFocus`, `onKeyDown`, `onBlur` (call formatting on blur THEN call user's onBlur if provided)

**Edge cases:**
- Empty string -> display empty, numeric value is `NaN` or `0` (match current parseFloat behavior)
- Just typing a decimal separator -> display "0," and value is 0
- Pasting formatted values -> strip formatting on paste
- Negative values -> allowed (for adjustments)

Do NOT add currency symbol prefix to the input itself — the surrounding label or layout handles that (matching current patterns like `<span>$</span> <Input ...>`).
  </action>
  <verify>
    <automated>cd D:\Documents\Programing\nextjs\expense-tracker && npx tsc --noEmit components/currency-input.tsx 2>&1 | head -20</automated>
  </verify>
  <done>CurrencyInput component exists, exports CurrencyInput, compiles without errors, supports both controlled and uncontrolled patterns</done>
</task>

<task type="auto">
  <name>Task 2: Replace all money inputs with CurrencyInput</name>
  <files>
    components/budget-dialog.tsx
    components/adjustment-dialog.tsx
    components/expense-tracker.tsx
    components/expenses-table.tsx
    components/income-table.tsx
    components/investment-dialog.tsx
    components/investment-value-cell.tsx
    components/investment-movements.tsx
    components/transfer-dialog.tsx
    components/loan-dialog.tsx
    components/loan-payments.tsx
    components/recurring-dialog.tsx
    components/usd-purchase-dialog.tsx
    components/salary-card.tsx
    components/settings-panel.tsx
    components/resumen-card.tsx
    components/charts/investment-basis-info.tsx
    components/setup-wizard/wizard-step-balance.tsx
    components/setup-wizard/wizard-step-income.tsx
    components/setup-wizard/wizard-step-usd.tsx
    components/setup-wizard/wizard-step-investments.tsx
  </files>
  <action>
Replace `<Input type="number" ...>` with `<CurrencyInput ...>` for ALL money/currency inputs. Add `import { CurrencyInput } from "@/components/currency-input"` (or relative path matching existing import style in each file).

**CRITICAL: Only replace MONEY inputs. Leave these as `<Input type="number">` unchanged:**
- `payDay` / "dia de cobro" (1-31 integer) — in salary-card.tsx, settings-panel.tsx, wizard-step-income.tsx
- `tna` / "TNA %" (percentage) — in investment-dialog.tsx, investment-row.tsx, wizard-step-investments.tsx
- `plazoDias` / "Plazo (dias)" (integer days) — in investment-dialog.tsx, investment-row.tsx, wizard-step-investments.tsx
- `installments` / "Cuotas" — in expense-tracker.tsx
- Projection rate percentages — in settings-panel.tsx (the projRateInput inputs for annual rates)

**Replacement patterns by file:**

**Controlled inputs (value + onChange)** — Replace `onChange={(e) => setSomething(e.target.value)}` with `onValueChange={(n) => setSomething(String(n))}` or `onValueChange={(n) => setSomething(n)}` depending on whether the state holds string or number. Remove `type="number"`, `step`, `min` attributes (CurrencyInput handles text input natively).

Files with controlled money inputs:
- `budget-dialog.tsx`: limitValue (string state) — use `onValueChange={(n) => { setLimitValue(String(n)); setErrors(...);}}`
- `adjustment-dialog.tsx`: realBalance (string state) — use `onValueChange={(n) => setRealBalance(String(n))}`
- `transfer-dialog.tsx`: arsAmount, usdAmount, amount (string states) — adapt handleArsChange/handleUsdChange to receive number directly. Keep the cross-calculation logic but work with the number value instead of parsing from string.
- `loan-dialog.tsx`: amount (string state) — `onValueChange={(n) => { setAmount(String(n)); setErrors(...);}}`
- `salary-card.tsx`: rateInput, aguinaldoInput, entryAmountInput, entryRateInput, newEntryAmount, newEntryRate (all string states) — replace onChange with onValueChange
- `settings-panel.tsx`: rateInput, entryAmountInput, entryRateInput, newEntryAmount, newEntryRate (string states) — replace onChange with onValueChange. NOTE: Leave projRateInput (annual rate %) as Input type="number"
- `resumen-card.tsx`: aguinaldoInput (string state) — replace onChange with onValueChange
- `investment-value-cell.tsx`: value (number state) — `onValueChange={(n) => setValue(n)}`
- `expenses-table.tsx`: InlineRateEditor value (string state) — `onValueChange={(n) => setValue(String(n))}`
- `income-table.tsx`: InlineRateEditor value (string state) — `onValueChange={(n) => setValue(String(n))}`
- `usd-purchase-dialog.tsx`: arsAmount, usdAmount (string states, also have name attrs) — use both controlled value + name via CurrencyInput
- `charts/investment-basis-info.tsx`: contribution input (controlled) — replace with CurrencyInput

Wizard controlled inputs:
- `wizard-step-balance.tsx`: arsBalance — `onValueChange={(n) => onChange({...data, arsBalance: n || 0})}`
- `wizard-step-income.tsx`: salaryAmount — `onValueChange={(n) => onChange({...data, salaryAmount: n || 0})}`. NOTE: Keep payDay as Input type="number"
- `wizard-step-usd.tsx`: usdAmount, globalUsdRate — both get CurrencyInput
- `wizard-step-investments.tsx`: amount — CurrencyInput. NOTE: Keep TNA and plazoDias as Input type="number"

**Uncontrolled inputs (name + FormData)** — Add `name` prop to CurrencyInput (it renders hidden input). Remove `type="number"`, `step`, `min`.

Files with uncontrolled money inputs:
- `expense-tracker.tsx`: Two add-expense forms have `name="amount"` and `name="usdRate"` inputs — replace with `<CurrencyInput name="amount" placeholder="Monto" required />` and `<CurrencyInput name="usdRate" placeholder="Valor USD" required />`. NOTE: Keep `name="installments"` as Input type="number"
- `investment-dialog.tsx`: `name="amount"` input — replace with CurrencyInput. NOTE: Keep `name="tna"` and `name="plazoDias"` as Input type="number"
- `investment-movements.tsx`: `name="amount"` input — replace with CurrencyInput
- `recurring-dialog.tsx`: `name="amount"` input — replace with CurrencyInput
- `loan-payments.tsx`: `name="amount"` input — replace with CurrencyInput

**For all replacements:**
- Keep all existing className, placeholder, autoFocus, onKeyDown, onBlur behavior
- Keep all existing error class bindings (cn(errors.x && "border-red-500"))
- Keep all existing required attributes
- Remove `step` and `min`/`max` attributes (not applicable to text inputs; validation is handled by the existing parseFloat checks)
- For inputs inside forms that call `Number(formData.get("amount"))` — the hidden input from CurrencyInput will provide the clean numeric string, so `Number()` / `parseFloat()` will work unchanged
  </action>
  <verify>
    <automated>cd D:\Documents\Programing\nextjs\expense-tracker && npx next build 2>&1 | tail -5</automated>
  </verify>
  <done>All ~40+ money inputs across 21 files use CurrencyInput. Non-money inputs (payDay, TNA, plazoDias, cuotas, projection rates) remain as Input type="number". Build succeeds with no errors.</done>
</task>

</tasks>

<verification>
1. `npx next build` succeeds with no type errors
2. Grep confirms no remaining `type="number"` on money inputs: `grep -rn 'type="number"' components/ | grep -v 'payDay\|tna\|plazo\|installment\|cuota\|projRate'` should return zero results for money fields (some hits from non-money fields expected)
3. Manual spot check: Open app, go to add expense dialog, type "1500000" and see it formatted as "1.500.000"
</verification>

<success_criteria>
- CurrencyInput component exists and is reusable
- All money inputs show formatted values with thousand separators
- Typing, clearing, and pasting all work without glitches
- Form submissions still receive correct numeric values
- Non-money inputs are untouched
- Build passes cleanly
</success_criteria>

<output>
After completion, create `.planning/quick/14-format-all-money-inputs-with-currency-fo/14-SUMMARY.md`
</output>
