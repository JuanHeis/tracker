# Phase 22: Resumen del Mes — Rediseño conceptual de cash flow — Research

**Researched:** 2026-06-01
**Domain:** Next.js 14 + TypeScript expense tracker — derived monthly metrics, localStorage-backed config, props-only UI components
**Confidence:** HIGH (all findings verified against existing codebase; no external libraries to discover — everything builds on installed stack)

## Summary

This phase is an **internal refactor + UI extension** of an existing component (`components/resumen-card.tsx`) plus a small data-model addition (`Investment.purpose`), a one-shot migration modal, and a new localStorage key (`resumenConfig`). There is **zero new technology** to introduce — every primitive needed (Slider, Dialog, Badge, Select, Tooltip, `useLocalStorage`) already exists in the codebase.

The locked architectural rule from prior phases applies in full: **all derived metrics must be computed in `components/expense-tracker.tsx` and passed as props** to `ResumenCard`. The card itself remains props-only with internal UI state only (e.g. `editingAguinaldo`, the new `usdToggle`, the new `dismissedDeficitRecurrente` per-session flag).

The biggest risk is **double-counting and sign drift** in the two parallel calculations (`disponible` vs `resultadoDelMes`). The codebase already has subtle precedent: `calculateDualBalances` filters `!mov.isInitial && !mov.pendingIngreso` for investment movements (`hooks/useMoneyTracker.ts:429`). Any new `purpose`-based filtering must compose with — not replace — those existing exclusions.

**Primary recommendation:** Add a single helper `computeMonthMetrics(monthKey, investments, ...) → { disponible, resultadoDelMes, sobranteRaw }` inside or adjacent to `useMoneyTracker.ts`, reusing `calculateAvailableForMonth` and `getFilterDateRange`. Wire it through `expense-tracker.tsx` as new props on `ResumenCard`. Build the migration wizard as a top-level modal triggered from `expense-tracker.tsx` (sibling of `SetupWizard`), keyed off `resumenConfig.wizardCompletedAt`.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Disponible formula (D1)**
- `Disponible = sobrante_anterior + ingresos_mes − egresos_mes`
- sobrante_anterior already flows into ResumenCard as a prop; it must be added to the disponible calculation
- The ResumenCard `disponible` prop should reflect the updated formula — compute in expense-tracker.tsx, not inside ResumenCard
- Tooltip updated to show the new formula explicitly

**Resultado del mes (D2, D11, D12)**
- `Resultado del mes = ingresos_mes − egresos_mes − aportes_no_neutros`
- `aportes_no_neutros` = aportes to investments with purpose ∈ {ahorro, especulación} (tarjeta/objetivo are neutral)
- Retiros from any investment do NOT add to Resultado (prevents masking deficit with FCI withdrawals)
- Aguinaldo counts as part of ingresos_mes (D11)
- Always visible, even when equal to Disponible (D12)
- Rendered as a small muted-white secondary line below Disponible — no color coding by sign

**Investment purpose labels (D3)**
- New type: `type InvestmentPurpose = "ahorro" | "objetivo" | "tarjeta" | "especulacion"`
- Add optional field `purpose?: InvestmentPurpose` to the `Investment` interface in `hooks/useMoneyTracker.ts`
- Default when unset: treated as "ahorro"
- Purpose affects only monthly flow metrics, not balance calculations

**Investment classification wizard (D3 migration, D10)**
- One-shot modal: auto-shows on first app load when investments exist without `purpose` field
- User sees a list of all investments with suggested purpose (heuristics: name match for tarjeta/objetivo/especulación, default ahorro)
- "Aceptar sugerencias" button accepts all in one click; individual selects allow overrides
- If user closes without completing: investments remain with ahorro default, no persistent banner (D10)
- `resumenConfig.wizardCompletedAt` timestamp set on completion to suppress future shows

**Inline purpose select per investment (D3)**
- Add a small purpose Badge/Select to each investment row in the investments section
- Non-destructive: changing purpose only updates the `purpose` field, no other data changes

**Sobrante anterior negative (D5)**
- When sobrante_anterior < 0: show as "Déficit anterior: $X" in amber/red banner ABOVE the card content
- Still included in Disponible calculation (it's a real debt)
- The existing `sobrante` prop only carries positive values currently — need to also pass the raw value (or add a new prop `sobranteRaw`) so the component can show the deficit banner

**Deficit recurrente banner (D6)**
- Triggers when: 2 consecutive months with Resultado del mes < 0 OR cumulative deficit exceeds N% of last salary
- N is configurable (stored in resumenConfig.deficitThresholdPercent, default 25%)
- Banner rendered above the card, dismissable per session (not persistent)
- Threshold slider change applies only to future evaluations (D13)

**USD parallel toggle (D7)**
- Small toggle/button in card header (not prominent)
- Default: ARS view
- USD calculation mirrors ARS logic: sobrante_usd + ingresos_usd − egresos_usd
- Same banners apply in USD mode when applicable
- Sobrante USD anterior only shown in USD toggle mode

**First month / future month handling (D8, D9)**
- First month post-wizard: sobrante = 0 (existing behavior preserved)
- Future month: sobrante anterior = Disponible of previous month (same calculateAvailableForMonth logic, which is already dynamic)

**Settings storage**
- New localStorage key: `"resumenConfig"`
- Schema: `{ deficitThresholdPercent: number; wizardCompletedAt?: string }`
- Must be cleared in factory reset flow (wizard already clears other keys on reset)

### Claude's Discretion

- Exact banner styling (amber vs red for déficit anterior vs déficit recurrente)
- Whether the USD toggle is a text button or an icon toggle
- How to handle the case where Resultado del mes === Disponible exactly (show both lines, different labels)
- Spinner or empty state when no salary data exists for a month

### Deferred Ideas (OUT OF SCOPE)

- Time Weighted Return (TWR) for observed investment rate — already resolved with simpler approach in commit 218f5a6
- Historical chart of Resultado del mes and Sobrante anterior over time
- Push notifications for deficit recurrente
- More granular purpose rules (expiry dates for objectives)
</user_constraints>

<phase_requirements>
## Phase Requirements

This phase does not map to formal REQ-IDs in `.planning/REQUIREMENTS.md` (which currently covers v1.0–v1.3 — phase 22 is a standalone post-v1.3 quality-of-life addition). The work items map directly to the 13 decisions in `260601-rdm-SPEC.md` (D1–D13). The phase delivers all items in the SPEC's Definition of Done.

| Spec ID | Behavior | Research Support |
|---------|----------|------------------|
| D1 | Disponible incluye sobrante anterior | `expense-tracker.tsx:257` — `soranteDelMesAnterior` already computed via `calculateAvailableForMonth(prevMonthKey)`. Pass through to disponible calc. |
| D2 | Resultado del mes = ingresos − egresos − aportes(ahorro/especulacion) | New helper, see "Code Examples" §2 |
| D3 | `purpose?` field on Investment + inline select | Extend `Investment` interface (`useMoneyTracker.ts:73`); add `<Select>` cell in `investment-row.tsx` |
| D4 | Cash líquido = solo cuentas digitales | No change — `arsBalance` already excludes investments (only `arsInvestments` aggregates them) |
| D5 | Banner déficit anterior | Add `sobranteRaw` prop to ResumenCard; conditional amber banner |
| D6 | Banner déficit recurrente | New helper `evaluateDeficitState(...)` reading historical disponible+resultado |
| D7 | Toggle USD | Internal `useState` in ResumenCard + parallel USD prop block |
| D8 | Mes futuro: sobrante = disponible proyectado del mes anterior | Already correct — `calculateAvailableForMonth` is pure & dynamic |
| D9 | Primer mes: sobrante = 0 | Already correct via `prev > 0 ? prev : 0` (with negative-keep change applied for D5) |
| D10 | Wizard one-shot, sin red de seguridad | Modal component + `resumenConfig.wizardCompletedAt` |
| D11 | Aguinaldo en ingresos_mes | `calculateAvailableForMonth` already adds aguinaldo (lines 631–647) |
| D12 | Resultado siempre visible | Render unconditionally |
| D13 | Slider sólo aplica a futuro | No historical re-evaluation — alerts are read-time, not stored |
</phase_requirements>

## Standard Stack

### Core (all already installed)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@radix-ui/react-slider` | 1.3.6 | Threshold slider in settings | `[VERIFIED: package.json]` Already used by `SavingsRateSelector` — copy that pattern |
| `@radix-ui/react-select` | 2.1.2 | Inline purpose select on investment rows | `[VERIFIED: package.json]` Already used in `settings-panel.tsx` and `investment-dialog.tsx` |
| `@radix-ui/react-dialog` | 1.1.2 | Migration wizard modal | `[VERIFIED: package.json]` Already used by `SetupWizard` and many existing modals |
| `@radix-ui/react-tooltip` | 1.1.3 | Updated Disponible tooltip | `[VERIFIED: package.json]` Already used in `ResumenCard` |
| `date-fns` | 4.1.0 | Month arithmetic (`subMonths`, `parse`, `format`) | `[VERIFIED: package.json]` Already imported in `expense-tracker.tsx` |
| `lucide-react` | 0.454.0 | Icons (AlertTriangle, DollarSign for USD toggle) | `[VERIFIED: package.json]` |

### Internal modules already in place

| Module | Location | Purpose |
|--------|----------|---------|
| `useLocalStorage<T>` | `hooks/useLocalStorage.ts` | Type-safe localStorage hook for `resumenConfig` |
| `calculateAvailableForMonth(monthKey)` | `hooks/useMoneyTracker.ts:570` | Reusable Disponible engine — already handles sobrante recursion, aguinaldo, view mode |
| `getFilterDateRange(monthKey, viewMode, payDay)` | `hooks/usePayPeriod.ts` | Period range respecting "mes calendario" vs "periodo personalizado" |
| `STORAGE_KEYS` array | `hooks/useDataPersistence.ts:3` | Where to register `"resumenConfig"` for factory reset |
| `FormattedAmount` | `components/formatted-amount.tsx` | Use for all monetary display |
| `Slider` UI primitive | `components/ui/slider.tsx` | Shadcn wrapper around Radix |
| `Select` UI primitive | `components/ui/select.tsx` | Shadcn wrapper |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Adding `purpose` to `Investment` interface | Storing in `resumenConfig.investmentPurposes: Record<id,purpose>` | Rejected — purpose is a property of the investment, not of the resumen card. Mixing concerns and breaks import/export envelope. |
| New separate localStorage key `resumenConfig` | Extending `incomeConfig` or `monthlyData` | `[CITED: 260601-rdm-SPEC.md decision section]` Locked decision — keep narrow scope, own key, easier to clear/migrate. Mirrors the `savingsRateConfig` pattern from Phase 18. |
| One-shot modal | Persistent banner | `[CITED: CONTEXT.md D10]` Locked — user explicitly chose simplicity over robustness. |

**Installation:** No new packages. Verify with:

```bash
npm ls @radix-ui/react-slider @radix-ui/react-select
```

Both already at `^1.3.6` and `^2.1.2` respectively `[VERIFIED: package.json]`.

## Architecture Patterns

### Recommended Module Layout

```
components/
├── resumen-card.tsx                          # MODIFY: new props, banners, USD toggle, Resultado line
├── expense-tracker.tsx                       # MODIFY: compute new derived values, pass to ResumenCard, mount wizard
├── investment-row.tsx                        # MODIFY: add inline purpose Badge/Select cell
├── settings-panel.tsx                        # MODIFY: add deficit threshold slider section
└── investment-purpose-wizard/                # NEW: one-shot migration modal
    ├── investment-purpose-wizard.tsx
    └── purpose-suggestion.ts                 # pure heuristic helper

hooks/
└── useMoneyTracker.ts                        # MODIFY: extend Investment interface, optional helper for resultadoDelMes

lib/
└── resumen/                                  # NEW (mirrors lib/projection/savings-rate.ts)
    ├── resumen-config.ts                     # localStorage key + type + defaults
    ├── deficit-detector.ts                   # evaluateDeficitState(history, threshold) → { recurring, anterior }
    └── month-metrics.ts                      # computeMonthMetrics(monthKey, …) → { disponible, resultado, sobranteRaw }
```

### Pattern 1: Props-only derived metrics

**What:** All ResumenCard inputs are scalar props computed in `expense-tracker.tsx`. The component never reads localStorage or calls hooks for data.

**When to use:** Always, for this card. Established in Phase 5 (CARD-01) and reaffirmed in Phase 21 for `MonthlyFlowPanel` `[VERIFIED: components/expense-tracker.tsx:753-775]`.

**Example:**

```typescript
// Source: components/expense-tracker.tsx:753 (existing pattern to extend)
<ResumenCard
  ingresoFijo={currentMonthSalary.amount}
  otrosIngresos={otrosIngresosArs}
  sobrante={soranteDelMesAnterior}     // existing positive-only
  // NEW PROPS:
  sobranteRaw={soranteDelMesAnteriorRaw}     // signed value for deficit banner
  resultadoDelMes={resultadoDelMes}
  // USD parallel block:
  usdMetrics={{ ingresoFijo: ..., otrosIngresos: ..., sobrante: ..., disponible: ..., resultado: ... }}
  // Deficit state:
  deficitState={{ anterior: boolean, recurrente: boolean, consecutiveMonths: number, cumulativeDeficit: number }}
  // ... existing props
/>
```

### Pattern 2: localStorage config module (mirrors `savings-rate.ts`)

**What:** Co-locate the type, key constant, default value, and pure helpers in a single file under `lib/`. Consumed via `useLocalStorage(KEY, DEFAULT)`.

**When to use:** Always for new persisted config. Established in Phase 18 with `lib/projection/savings-rate.ts`.

**Example:**

```typescript
// File: lib/resumen/resumen-config.ts
export interface ResumenConfig {
  deficitThresholdPercent: number;
  wizardCompletedAt?: string; // ISO timestamp
}

export const RESUMEN_CONFIG_KEY = "resumenConfig";

export const DEFAULT_RESUMEN_CONFIG: ResumenConfig = {
  deficitThresholdPercent: 25,
};

// Source: mirrors lib/projection/savings-rate.ts:12-13
```

Then consume:

```typescript
// In a new hook or directly in expense-tracker.tsx
const [resumenConfig, setResumenConfig] = useLocalStorage<ResumenConfig>(
  RESUMEN_CONFIG_KEY,
  DEFAULT_RESUMEN_CONFIG,
);
```

### Pattern 3: One-shot wizard gated by timestamp

**What:** Top-level modal mounted in `expense-tracker.tsx` (sibling of `SetupWizard`); renders only when `resumenConfig.wizardCompletedAt` is undefined **and** there exists at least one investment lacking `purpose`.

**When to use:** For migrations of existing user data that need user input. Pattern is new but mirrors how `SetupWizard` is gated in `app/page.tsx`.

**Example:**

```typescript
// Source: NEW — components/investment-purpose-wizard/investment-purpose-wizard.tsx
const needsWizard = useMemo(() => {
  if (resumenConfig.wizardCompletedAt) return false;
  return (monthlyData.investments || []).some((inv) => inv.purpose === undefined);
}, [resumenConfig.wizardCompletedAt, monthlyData.investments]);

// In JSX:
{needsWizard && (
  <InvestmentPurposeWizard
    investments={monthlyData.investments || []}
    onComplete={(assignments) => {
      setMonthlyData({
        ...monthlyData,
        investments: monthlyData.investments.map((inv) => ({
          ...inv,
          purpose: assignments[inv.id] ?? "ahorro",
        })),
      });
      setResumenConfig({ ...resumenConfig, wizardCompletedAt: new Date().toISOString() });
    }}
    onDismiss={() => {
      // Per D10: no red de seguridad. Set timestamp so it doesn't reopen next session;
      // user can change purpose inline later.
      setResumenConfig({ ...resumenConfig, wizardCompletedAt: new Date().toISOString() });
    }}
  />
)}
```

> **Discuss-with-user note (re-confirm at planning time):** The CONTEXT says "If user closes without completing: investments remain with ahorro default, no persistent banner." That can be implemented two ways: (a) set `wizardCompletedAt` on dismiss so it doesn't reopen, or (b) leave it unset and re-show every session. Spec D10 says "no recordatorio persistente" → interpretation (a) is correct. **Flag this to the planner.**

### Pattern 4: Heuristic suggestion as a pure function

**What:** Extract the purpose-suggestion logic as a pure helper so it's testable and reusable.

**Example:**

```typescript
// Source: NEW — components/investment-purpose-wizard/purpose-suggestion.ts
// Heuristics from 260601-rdm-SPEC.md lines 165-169
export function suggestPurpose(inv: { name: string; type: InvestmentType }): InvestmentPurpose {
  const n = inv.name.toLowerCase();
  if (/tarjeta|tc|sbs.*rta.*pesos/.test(n)) return "tarjeta";
  if (/piano|viaje|auto|casa/.test(n)) return "objetivo";
  if (inv.type === "Cuenta remunerada") return "objetivo";
  if (inv.type === "Acciones") return "especulacion"; // SPEC also mentions "Cedear" but that's not in INVESTMENT_TYPES
  return "ahorro";
}
```

**Note on Cedear:** SPEC mentions Cedear, but `constants/investments.ts:1` defines `INVESTMENT_TYPES = ["Plazo Fijo", "FCI", "Crypto", "Acciones", "Cuenta remunerada"]`. Cedears are stored under "Acciones". **Don't add a new type for Cedear** — keep the heuristic on "Acciones".

### Anti-Patterns to Avoid

- **Storing purpose outside `Investment`:** Breaks JSON export envelope; introduces sync bugs. Always extend the interface in place.
- **Recomputing `resultadoDelMes` inside `ResumenCard`:** Violates props-only pattern; couples UI to data layer.
- **Forgetting `!mov.isInitial && !mov.pendingIngreso` filter when summing aportes_no_neutros:** Will count wizard-seeded patrimony as a current-month aporte → false negatives in Resultado del mes. `[VERIFIED: hooks/useMoneyTracker.ts:429, 601]`
- **Treating retiros as positive in Resultado:** Explicitly forbidden by D2 — retiros are never added to Resultado. Only the existing `calculateAvailableForMonth` adds retiros (and that drives Disponible, not Resultado).
- **Adding deficit-history state to localStorage:** Per D13, alerts are read-time evaluations, not stored. Re-derive each render from `monthlyData`.
- **Migrating localStorage schema:** `useLocalStorage` supports an optional `migrateFn` (`hooks/useLocalStorage.ts:7`), but `resumenConfig` is a new key with safe defaults — no migration needed. **Never mutate `monthlyData` shape**, per the `[isInitial flag is wizard-only]` memory rule and `[JSON structure safety]` rule.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Slider control | Custom range input | `components/ui/slider.tsx` (wraps Radix) | Already wired, accessible, keyboard-navigable. `SavingsRateSelector` is the reference implementation. |
| Select dropdown | Native `<select>` | `components/ui/select.tsx` (Radix) | Consistency with rest of app, dark-mode aware, portal-based. |
| Modal | Inline conditional render | `components/ui/dialog.tsx` (Radix) | Focus trap, ESC handling, scroll lock — all free. |
| localStorage state | `useState` + `useEffect(localStorage.setItem)` | `hooks/useLocalStorage.ts` | SSR-safe (checks `typeof window`), JSON parse error handling already in place. |
| Date arithmetic for prev month | Manual month decrement | `subMonths(parse(monthKey, "yyyy-MM", new Date()), 1)` from `date-fns` | Handles year rollover; already used in `expense-tracker.tsx:252`. |
| Currency formatting | `value.toLocaleString()` ad-hoc | `<FormattedAmount value={x} currency="ARS" />` | Centralized formatting, hydration-safe. |

**Key insight:** This phase introduces zero new dependencies. Every primitive is already in the codebase with established usage patterns to mirror.

## Common Pitfalls

### Pitfall 1: Sobrante double-counting via recursion

**What goes wrong:** `calculateAvailableForMonth` already returns "disponible of that month" — but the new formula adds **sobrante anterior** = `calculateAvailableForMonth(prevMonthKey)`. If we recurse without a base case, we recompute the entire chain N times.

**Why it happens:** `calculateAvailableForMonth` as it stands today does NOT recursively call itself for the previous month; it computes a single month's flow. The sobrante carry is currently injected at the call site (`expense-tracker.tsx:258`).

**How to avoid:** Keep `calculateAvailableForMonth` as the single-month engine. Compute the carry **only at the orchestrator level** (`expense-tracker.tsx`), and have the formula be: `disponible = sobranteAnterior + singleMonthFlow` where `singleMonthFlow = calculateAvailableForMonth(currentMonth)`. **Do not refactor `calculateAvailableForMonth` to add the carry internally** — that would break callers that use it for the prev-month value (it would become recursive). `[VERIFIED: hooks/useMoneyTracker.ts:570-650, expense-tracker.tsx:258]`

**Warning signs:** Stack overflow, exponential slowdown when navigating months, prev-month and current-month numbers becoming inconsistent.

### Pitfall 2: `arsInvestmentContributions` already counts ALL aportes (not just non-neutros)

**What goes wrong:** The current `dualBalances.arsInvestmentContributions` (passed as `aportesInversiones` to ResumenCard, `expense-tracker.tsx:765`) sums ALL aportes regardless of purpose. If we naively use it for both Disponible and Resultado, the tarjeta/objetivo carve-out won't work.

**Why it happens:** `useMoneyTracker.ts:433` adds `mov.amount` for every aporte without filtering by purpose.

**How to avoid:** Compute TWO sums in `expense-tracker.tsx` (or in the new `month-metrics.ts`):

- `aportesAll` (used for Disponible — same as today's `arsInvestmentContributions`)
- `aportesNoNeutros` (used for Resultado — filters `purpose ∈ {ahorro, especulacion}`, treating `undefined` as `"ahorro"`)

Egresos for Disponible **still includes all aportes** (because they're real outflows from cash). Egresos for Resultado **excludes tarjeta/objetivo aportes** (because those are neutral).

> Wait — re-read the spec carefully: `Disponible = sobrante + ingresos − egresos` where `egresos = gastos + aportes_no_neutros`. **Spec lines 180-183 explicitly say egresos_mes for Disponible includes `aportes_inversion_no_neutros`.** So tarjeta/objetivo aportes DO NOT reduce Disponible either. This is intentional: provisioning for tarjeta is neutral cash movement.
>
> **Re-check:** Lines 182-183 of SPEC: `egresos_mes = gastos_pagados_y_pendientes + aportes_inversion_no_neutros`. Confirmed: both Disponible AND Resultado use `aportes_no_neutros`. The "tarjeta provision" stays as cash conceptually. The actual cash effect happens when the user later pays the tarjeta (which IS a gasto).
>
> **Implication:** The current `aportesInversiones` prop displayed in the EGRESOS section needs to switch to the no-neutros version too. The full aporte sum (for transparency) could still be shown in the tooltip, but the visible egreso line should match the formula. **Confirm with user at plan-check stage.** `[ASSUMED]` — this is the cleanest interpretation but the SPEC's wireframe (line 144 shows "Aportes inversión: 0") doesn't disambiguate purpose-filtering of the line item visibility.

**Warning signs:** Disponible different from sum of visible lines; tooltip math doesn't match displayed numbers; user reports "aporte to tarjeta is reducing my Disponible when it shouldn't."

### Pitfall 3: Investments without `purpose` after wizard dismiss

**What goes wrong:** User closes wizard via X. Investments without `purpose` need a default. If we treat `undefined` as `"ahorro"` at read time (per spec D3 "Default when unset: treated as ahorro"), this is fine. But if any code path persists `purpose: undefined` explicitly and later code does `inv.purpose === "ahorro"`, it returns false.

**How to avoid:** Always read via a helper: `getPurpose(inv) → inv.purpose ?? "ahorro"`. Never compare `inv.purpose === "ahorro"` directly. Include this helper in `lib/resumen/month-metrics.ts`.

**Warning signs:** Aportes to legacy unclassified investments showing up unexpectedly in Resultado or not at all.

### Pitfall 4: USD parallel toggle re-using ARS dates

**What goes wrong:** The USD calculation needs its own filtered movement set (currencyType === USD) with the same date-range function. Forgetting one branch leads to ARS amounts leaking into USD totals.

**How to avoid:** Build a generic `computeMonthMetricsByCurrency(monthKey, currency)` that takes `CurrencyType` as a parameter and filters every iteration on `entity.currencyType === currency`. This mirrors how `calculateDualBalances` already splits ARS/USD throughout `useMoneyTracker.ts:362-560`.

**Warning signs:** USD toggle shows ARS-scale numbers, or USD aguinaldo appears (it shouldn't — aguinaldo is ARS only per `useMoneyTracker.ts:631-647`).

### Pitfall 5: Deficit recurrente performance

**What goes wrong:** Computing `evaluateDeficitState` requires looking at multiple months of `resultadoDelMes`. Naively calling `calculateAvailableForMonth` and the new resultado helper for every month in history is O(N × monthly_iterations).

**How to avoid:** Only look at the last 2–3 months for the "2 consecutive negative" check, and accumulate "cumulative deficit since last positive" only as far back as needed. Memoize via `useMemo` keyed on `[monthlyData, resumenConfig.deficitThresholdPercent, selectedMonth]`.

**Warning signs:** Sluggish month navigation, React DevTools showing repeated heavy compute on every state change.

### Pitfall 6: Per-session dismiss state leaking across reloads

**What goes wrong:** D6 says deficit-recurrente banner is "dismissable per session (not persistent)." Using a normal `useState` inside `ResumenCard` works on a per-mount basis but resets if the component remounts (e.g. tab switch). If we persist to localStorage, it stops being per-session.

**How to avoid:** Use `sessionStorage` (cleared on tab close) or a top-level `useState` in `expense-tracker.tsx` that survives child remounts. Recommended: top-level `useState` — `sessionStorage` adds another SSR consideration we don't need.

**Warning signs:** Banner reappears immediately after dismiss, or persists across reload (both wrong directions).

### Pitfall 7: Factory reset misses `resumenConfig`

**What goes wrong:** `settings-panel.tsx:691` clears keys via `STORAGE_KEYS.forEach((key) => localStorage.removeItem(key))` plus the explicit `SAVINGS_RATE_KEY`. A new `resumenConfig` key won't be in `STORAGE_KEYS` (which is used by export/import envelope schema validation).

**How to avoid:** Two options — `[ASSUMED]` recommendation: mirror the SAVINGS_RATE_KEY pattern exactly. Add an explicit `localStorage.removeItem(RESUMEN_CONFIG_KEY)` line at `settings-panel.tsx:692-693` (right after `SAVINGS_RATE_KEY`). Do NOT add it to `STORAGE_KEYS` array — that array is also used by `useDataPersistence.ts` for export/import schema validation, and bundling `resumenConfig` there would mean older backups fail validation.

**Warning signs:** After "Re-ejecutar wizard", the purpose wizard does NOT re-show even though monthly data is wiped. Or: importing an older JSON backup fails with "Faltan datos requeridos: resumenConfig".

### Pitfall 8: Wizard suggesting "objetivo" for "Cuenta remunerada" overrides user's actual savings account

**What goes wrong:** SPEC line 167 suggests `type "Cuenta remunerada"` → objetivo. But many users use Cuenta remunerada as their main ahorro vehicle (cocos, mercado pago rendimiento, etc.). Auto-classifying as "objetivo" would silently make those aportes neutral → Resultado del mes overstates performance.

**How to avoid:** This is a heuristic, not a rule. The wizard shows suggestions in a select; the user can override each one. The spec acknowledges this — heuristics are "Suggest defaults inteligentes." Just make sure:
1. Suggestions are visible per row (not auto-applied)
2. "Aceptar sugerencias" is a separate explicit click (per CONTEXT line 51)
3. Each row has a Select so the user can change before accepting

**Warning signs:** Users report "my savings stopped counting" after the wizard.

## Runtime State Inventory

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | (1) `monthlyData.investments[*]` in localStorage — needs new optional `purpose` field. (2) New `resumenConfig` key holding `{ deficitThresholdPercent, wizardCompletedAt? }`. | (1) **Code edit only** — no migration script; `useMoneyTracker.ts` extends interface, missing `purpose` reads as undefined and is treated as "ahorro" at read time. (2) New key, default seeded by `useLocalStorage`. |
| Live service config | None — app is local-first, no backend services. | None. |
| OS-registered state | None — browser-only app. | None. |
| Secrets/env vars | None. | None. |
| Build artifacts | None — Next.js 14 dev/build picks up TS changes automatically. | None — verify with `npm run lint` and (per workflow) `npm run build`. |

**Backups concern:** A backup taken before this phase (e.g. `expense-tracker-backup-2026-06-01.json` in the repo root `[VERIFIED: gitStatus]`) will lack `purpose` on investments and lack `resumenConfig` entirely. `useDataPersistence.ts:62-79` already treats `customAnnualRates` as an optional key with default. **Add `resumenConfig` to `OPTIONAL_KEYS`** if (and only if) we also add it to `STORAGE_KEYS` — but per Pitfall 7 we should NOT do that. Therefore, import of old backups just leaves `resumenConfig` at its default. `purpose` on imported investments will be undefined, the wizard will fire post-import. **This is the desired UX.** `[VERIFIED: hooks/useDataPersistence.ts]`

## Code Examples

### Example 1: Extended Investment interface

```typescript
// Source: hooks/useMoneyTracker.ts:73 — extend in place
export type InvestmentPurpose = "ahorro" | "objetivo" | "tarjeta" | "especulacion";

export interface Investment {
  id: string;
  name: string;
  type: InvestmentType;
  currencyType: CurrencyType;
  status: "Activa" | "Finalizada";
  movements: InvestmentMovement[];
  currentValue: number;
  lastUpdated: string;
  createdAt: string;
  isLiquid?: boolean;
  tna?: number;
  plazoDias?: number;
  startDate?: string;
  purpose?: InvestmentPurpose;  // NEW — default at read time: "ahorro"
}

export function getInvestmentPurpose(inv: Investment): InvestmentPurpose {
  return inv.purpose ?? "ahorro";
}
```

### Example 2: Month metrics helper

```typescript
// Source: NEW — lib/resumen/month-metrics.ts
import { parse, subMonths, format } from "date-fns";
import { CurrencyType } from "@/constants/investments";
import { getInvestmentPurpose, type Investment, type MonthlyData } from "@/hooks/useMoneyTracker";

export interface MonthMetrics {
  ingresoFijo: number;
  otrosIngresos: number;
  aguinaldo: number;
  sobranteAnterior: number;       // signed — may be negative
  totalGastos: number;
  aportesAll: number;             // for tooltip / transparency
  aportesNoNeutros: number;       // ahorro + especulacion only
  disponible: number;
  resultadoDelMes: number;
}

const isNonNeutro = (inv: Investment) => {
  const p = getInvestmentPurpose(inv);
  return p === "ahorro" || p === "especulacion";
};

// Sum aportes filtered by purpose-neutrality and currency, respecting isInitial/pendingIngreso
export function sumAportes(
  investments: Investment[],
  currency: CurrencyType,
  isInRange: (d: string) => boolean,
  onlyNonNeutros: boolean,
): number {
  let sum = 0;
  for (const inv of investments) {
    if (inv.currencyType !== currency) continue;
    if (onlyNonNeutros && !isNonNeutro(inv)) continue;
    for (const mov of inv.movements) {
      if (mov.isInitial || mov.pendingIngreso) continue;
      if (mov.type !== "aporte") continue;
      if (!isInRange(mov.date)) continue;
      sum += mov.amount;
    }
  }
  return sum;
}
```

### Example 3: Deficit detector

```typescript
// Source: NEW — lib/resumen/deficit-detector.ts
export interface DeficitState {
  anterior: boolean;              // sobrante anterior < 0
  recurrente: boolean;            // 2 consecutive months < 0 OR cumulative > threshold
  consecutiveNegativeMonths: number;
  cumulativeDeficit: number;
  threshold: number;              // computed: lastSalary * percentage / 100
}

export function evaluateDeficitState(
  resultadoHistory: number[],     // most recent month FIRST
  sobranteAnteriorRaw: number,
  lastSalary: number,
  thresholdPercent: number,
): DeficitState {
  const threshold = (lastSalary * thresholdPercent) / 100;

  let consecutive = 0;
  for (const r of resultadoHistory) {
    if (r < 0) consecutive++;
    else break;
  }

  // Cumulative deficit since last positive month (capped at 6 months back)
  let cumulative = 0;
  for (let i = 0; i < Math.min(resultadoHistory.length, 6); i++) {
    if (resultadoHistory[i] < 0) cumulative += -resultadoHistory[i];
    else break;
  }

  return {
    anterior: sobranteAnteriorRaw < 0,
    recurrente: consecutive >= 2 || cumulative > threshold,
    consecutiveNegativeMonths: consecutive,
    cumulativeDeficit: cumulative,
    threshold,
  };
}
```

### Example 4: Slider in settings panel (copy from `savings-rate-selector.tsx`)

```typescript
// Source: components/savings-rate-selector.tsx:104-117 — pattern to mirror
// New section to add to components/settings-panel.tsx

<div className="space-y-2">
  <h4 className="text-sm font-medium">Alerta de déficit</h4>
  <div className="space-y-3">
    <Slider
      value={[resumenConfig.deficitThresholdPercent]}
      onValueChange={([val]) =>
        setResumenConfig({ ...resumenConfig, deficitThresholdPercent: val })
      }
      min={10}
      max={100}
      step={10}
    />
    <p className="text-sm text-muted-foreground">
      Umbral: <span className="font-medium">{resumenConfig.deficitThresholdPercent}%</span> del último sueldo
    </p>
  </div>
</div>
```

### Example 5: Inline purpose select in investment row

```typescript
// Source: NEW cell in components/investment-row.tsx between Tipo and Capital Invertido
// Mirrors the Select pattern from components/settings-panel.tsx:202-211

<TableCell onClick={(e) => e.stopPropagation()}>
  <Select
    value={investment.purpose ?? "ahorro"}
    onValueChange={(val) =>
      onUpdatePurpose(investment.id, val as InvestmentPurpose)
    }
  >
    <SelectTrigger className="h-7 w-[110px] text-xs">
      <SelectValue />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="ahorro">Ahorro</SelectItem>
      <SelectItem value="objetivo">Objetivo</SelectItem>
      <SelectItem value="tarjeta">Tarjeta</SelectItem>
      <SelectItem value="especulacion">Especulación</SelectItem>
    </SelectContent>
  </Select>
</TableCell>
```

The new `onUpdatePurpose` callback follows the same shape as `onUpdateValue`, `onUpdatePFFields` in `useInvestmentsTracker.ts`.

## State of the Art

This phase is internal — no industry "state of the art" change to track. The architecture mirrors a pattern already proven across phases 14–21 of this repo (props-only cards, localStorage config modules, derived-metric helpers).

**Deprecated/outdated within this codebase:**
- The current `sobrante: number` prop on ResumenCard (which is positive-only) is being superseded by `sobranteRaw` for the deficit-anterior banner. Keep the existing prop for the green INGRESOS line display, add `sobranteRaw` for the banner / Disponible calc. **Or rename `sobrante` → `sobranteRaw` and let the component derive the positive display value internally.** The latter is cleaner; recommend that approach.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | "Aportes inversión" line in EGRESOS displayed in the card should switch to the no-neutros sum (so tarjeta/objetivo aportes don't appear as an egreso of the month) | Pitfall 2 | Visual line shows different total than Disponible suggests — confusing to user. Need user confirmation in discuss/plan-check. |
| A2 | Wizard dismiss sets `wizardCompletedAt` (interpretation of "no persistent banner" per D10) | Pattern 3 callout | If user wanted re-prompt every session, they'd see it every reload — annoying. If user wanted "set on dismiss," current plan is correct. Confirm at plan-check. |
| A3 | Cumulative deficit lookback window of 6 months is sufficient | Example 3 | Could miss longer cumulative-deficit streaks. Acceptable since "2 consecutive months" is also a trigger (catches recent decline). |
| A4 | `resumenConfig` should NOT be added to `STORAGE_KEYS` (export/import schema) | Pitfall 7 | If added, older backup imports break. If not added (current plan), the setting just resets to default on import — which is fine since it's a UI preference. |
| A5 | Per-session dismiss of deficit-recurrente banner uses top-level `useState` (not sessionStorage) | Pitfall 6 | Tab switch could reset the dismiss inadvertently. `useState` at `expense-tracker.tsx` survives ResumenCard remounts as long as expense-tracker itself doesn't unmount, which it doesn't during normal navigation. |
| A6 | "Acciones" type maps to especulación; Cedear is not a separate type | Pattern 4 | Slightly broader — all Acciones default to especulación. Users can override via inline select. Acceptable per spec heuristic note. |

## Open Questions

1. **Resultado del mes wireframe location.** SPEC wireframe (line 148) shows it directly under Disponible. Does the user want it left-aligned (small muted line) or right-aligned (continuing the column of numbers)? *Recommendation:* Mirror Disponible's right-aligned numeric style but in muted color.
2. **USD toggle visibility on months without USD activity.** If `selectedMonth` has zero USD ingresos and zero USD egresos, should the toggle still be shown? *Recommendation:* Always shown (consistency over conditional minimalism, matches D12 spirit).
3. **Deficit recurrente in USD mode.** Does the recurrente check apply to USD `resultadoDelMes` history too, or only to ARS? *Recommendation:* Compute independently for each currency; show in whichever mode is active. This matches the spec's "Same banners apply in USD mode when applicable."
4. **First-month detection for D9.** What defines "first month after wizard"? *Recommendation:* The earliest month-key with any data. Already handled implicitly because `calculateAvailableForMonth` returns 0 if all sums are 0 and there's no prior month data.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| `npm` | Standard project tooling | ✓ | bundled | — |
| `node` | Next.js dev/build | ✓ | (project-defined) | — |
| `@radix-ui/react-slider` | Threshold slider | ✓ | ^1.3.6 | — |
| `@radix-ui/react-select` | Inline purpose select | ✓ | ^2.1.2 | — |
| `@radix-ui/react-dialog` | Migration wizard modal | ✓ | ^1.1.2 | — |
| `vitest` | Unit tests for `month-metrics`, `deficit-detector`, `purpose-suggestion` | ✓ | ^4.1.2 | — |

**No missing dependencies.** This phase is entirely code-only inside the existing stack.

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.2 `[VERIFIED: package.json]` |
| Config file | (none committed — uses defaults; existing tests live in `lib/projection/savings-rate.test.ts`) |
| Quick run command | `npx vitest run lib/resumen` |
| Full suite command | `npx vitest run` |

### Phase Requirements → Test Map

| Spec ID | Behavior | Test Type | Automated Command | File Exists? |
|---------|----------|-----------|-------------------|--------------|
| D1 | Disponible includes sobrante anterior | unit | `npx vitest run lib/resumen/month-metrics.test.ts -t "disponible incluye sobrante"` | ❌ Wave 0 |
| D2 | Resultado excluyes tarjeta/objetivo aportes y todos los retiros | unit | `npx vitest run lib/resumen/month-metrics.test.ts -t "resultado neutros"` | ❌ Wave 0 |
| D3 (heuristic) | suggestPurpose mapea nombres y tipos correctamente | unit | `npx vitest run components/investment-purpose-wizard/purpose-suggestion.test.ts` | ❌ Wave 0 |
| D5 | sobranteRaw negativo activa deficit anterior | unit | `npx vitest run lib/resumen/deficit-detector.test.ts -t "anterior"` | ❌ Wave 0 |
| D6 | 2 meses consecutivos en rojo activa recurrente | unit | `npx vitest run lib/resumen/deficit-detector.test.ts -t "consecutive"` | ❌ Wave 0 |
| D6 | cumulative > threshold activa recurrente | unit | `npx vitest run lib/resumen/deficit-detector.test.ts -t "threshold"` | ❌ Wave 0 |
| D7 | USD parallel calc espeja ARS | unit | `npx vitest run lib/resumen/month-metrics.test.ts -t "USD parallel"` | ❌ Wave 0 |
| D9 | Primer mes sobrante = 0 | unit | `npx vitest run lib/resumen/month-metrics.test.ts -t "primer mes"` | ❌ Wave 0 |
| D10 | Wizard dismiss sets wizardCompletedAt | manual | (visual — open app, dismiss wizard, reload, confirm no reappear) | manual |
| D11 | Aguinaldo en ingresos_mes para Resultado | unit | `npx vitest run lib/resumen/month-metrics.test.ts -t "aguinaldo"` | ❌ Wave 0 |
| D12 | Resultado siempre visible | smoke | manual visual check | manual |
| D13 | Slider afecta sólo futuro | manual | (visual — change slider, confirm old months banners unchanged) | manual |
| migration | Investment sin purpose → tratada como ahorro | unit | `npx vitest run hooks/useMoneyTracker -t "getInvestmentPurpose default"` | ❌ Wave 0 |
| factory reset | resumenConfig limpiado en reset | manual | (visual — reset, check localStorage) | manual |

### Sampling Rate

- **Per task commit:** `npx vitest run lib/resumen` (under 5 seconds for the new lib)
- **Per wave merge:** `npx vitest run` (full suite, sub-30s)
- **Phase gate:** Full suite green + `npm run build` + manual smoke of wizard flow before `/gsd-verify-work`

### Wave 0 Gaps

- [ ] `lib/resumen/month-metrics.test.ts` — covers D1, D2, D7, D9, D11
- [ ] `lib/resumen/deficit-detector.test.ts` — covers D5, D6
- [ ] `components/investment-purpose-wizard/purpose-suggestion.test.ts` — covers D3 heuristics
- [ ] (no shared `conftest`/fixtures file needed — vitest pattern matches Phase 18's flat-file structure)
- [ ] No framework install needed — vitest already in devDependencies

## Sources

### Primary (HIGH confidence — codebase-verified)

- `components/resumen-card.tsx` (all 346 lines read) — current ResumenCard
- `hooks/useMoneyTracker.ts` lines 1–150, 365–605 — Investment interface, calculateDualBalances, calculateAvailableForMonth
- `components/expense-tracker.tsx` lines 240–340, 740–800 — orchestrator wiring and sobrante computation
- `hooks/useLocalStorage.ts` — entire file (37 lines)
- `lib/projection/savings-rate.ts` — entire file (31 lines, reference pattern)
- `components/savings-rate-selector.tsx` — entire file (Slider pattern reference)
- `components/settings-panel.tsx` — full read (factory reset at line 691, Select pattern at line 202)
- `constants/investments.ts` — entire file (InvestmentType, CurrencyType)
- `hooks/useDataPersistence.ts` lines 1–80 — STORAGE_KEYS and import envelope validation
- `hooks/useInvestmentsTracker.ts` lines 1–120 — investment mutation patterns
- `components/investment-row.tsx` — entire file (table cell layout)
- `components/setup-wizard/setup-wizard.tsx` lines 1–80 — wizard mounting pattern
- `package.json` — entire file (dependency versions)
- `.planning/quick/260601-rdm-resumen-del-mes-redesign/260601-rdm-SPEC.md` — full spec, all 13 decisions
- `.planning/phases/22-resumen-del-mes-rediseno-conceptual-de-cash-flow/22-CONTEXT.md` — user decisions
- `.planning/STATE.md` — phase progress, recent commits

### Secondary (MEDIUM)

- Recent commits: `f2a2243`, `cec2a8e`, `1bcda19` — show current sobrante implementation and known bugs
- Memory directives: `JSON structure safety`, `isInitial flag is wizard-only` — followed throughout this research

### Tertiary (LOW)

- None — this phase doesn't require external research. Every primitive is in-repo with established usage.

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH — every dependency verified present in `package.json` with version
- Architecture: HIGH — patterns are mirrors of existing in-repo patterns (savings-rate, ResumenCard, settings-panel, useLocalStorage), not novel designs
- Pitfalls: HIGH for sobrante recursion, aportes filtering, factory reset (all grounded in specific file:line); MEDIUM for the "EGRESOS aportes line should switch to no-neutros" recommendation (A1 — needs user confirmation)
- Heuristics: MEDIUM — wizard suggestion rules come from spec and are reasonable, but user may want to tweak (A6)

**Research date:** 2026-06-01
**Valid until:** 2026-07-01 (30 days; codebase-internal research, no fast-moving external dependencies)
