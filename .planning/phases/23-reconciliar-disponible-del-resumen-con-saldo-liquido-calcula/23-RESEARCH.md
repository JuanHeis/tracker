# Phase 23: Reconciliar Disponible del Resumen con saldo líquido - Research

**Researched:** 2026-07-01
**Domain:** Client-side finance calculation engines (TypeScript, pure functions), no external deps
**Confidence:** HIGH (all findings verified against the actual codebase + real backup fixture)

## Summary

This is a **calculation bug fix**, not a schema change. Two engines that should agree on liquid ARS/USD cash diverge because one of them (`computeMonthMetrics`, the Resumen engine) never receives — and never counts — the movements that move cash but aren't gastos/aportes: currency conversions, `cash_in`/`cash_out`, `usdPurchases` (tracked), and loans. The other engine (`calculateDualBalances`, plus its per-month twins `calculateAvailableForMonth`/`computeUsdAvailableForMonth`) counts them correctly. The verified anchor: June 2026 ARS "Disponible" shows $390.668,76 but should be $28.168,76 — the exact $362.500 delta is a `currency_ars_to_usd` conversion (2026-06-04, $362.500 → US$250) that the Resumen ignores.

The fix per CONTEXT.md decisions: extract a **single pure function** for cash effects (`lib/`, no React/localStorage/Date.now, takes `transfers`/`loans`/`usdPurchases` + `currency` + `isInRange`) consumed by BOTH engines, feed that data into `computeMonthMetrics`'s `egresosMes`, wire `expense-tracker.tsx` to actually pass the data, and align the `payDay` timing window. A vitest test using the real backup fixture asserts `Disponible(Resumen) == saldo líquido` for ARS and USD as a permanent regression net.

**Critical nuance the planner must internalize:** The codebase ALREADY has a correct per-month cash-flow engine — `calculateAvailableForMonth` (ARS, useMoneyTracker.ts L579-659) and `computeUsdAvailableForMonth` (expense-tracker.tsx L272-308). These include every cash effect. The bug is that only the **wizard month** routes through them; **chained (non-wizard) months** route through the incomplete `computeMonthMetrics`. The extracted pure function should encapsulate exactly the cash logic that already lives (duplicated) in these three places, so all four call sites converge on one implementation.

**Primary recommendation:** Extract `computeCashEffect(currency, isInRange, {transfers, loans, usdPurchases})` → net signed cash delta for the period. Add its result into `computeMonthMetrics` as part of `egresosMes` (negative-signed additions reduce egresos / act as income). Refactor `calculateAvailableForMonth`, `computeUsdAvailableForMonth`, and the transfer/loan/usdPurchase blocks of `calculateDualBalances` to call it. Test with the real backup.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Arquitectura — fuente de verdad única**
- Extraer UNA función pura compartida de efectos de caja consumida por AMBOS motores (`calculateDualBalances` y `computeMonthMetrics`). Single source of truth.
- Vive en `lib/` (pura: sin React/localStorage/Date.now). Recibe `transfers`/`loans`/`usdPurchases` + `currency` + `isInRange`, devuelve el efecto neto de caja del período para esa moneda.
- Tabla de efectos de caja (fuente de verdad = comportamiento actual de `calculateDualBalances`):
  - `currency_ars_to_usd`: ARS −arsAmount / USD +usdAmount
  - `currency_usd_to_ars`: ARS +arsAmount / USD −usdAmount
  - `cash_out` / `cash_in`: ∓amount en la moneda del transfer
  - usdPurchase (origin `"tracked"`): ARS −arsAmount / USD +usdAmount
  - préstamo "presté": −amount + Σpagos (misma moneda)
  - deuda "debo": −Σpagos (misma moneda)
- `computeMonthMetrics`: `egresosMes` incluye el efecto de caja negativo; los efectos positivos (cash_in, conversión entrante, cobro de préstamo) entran como ingreso/reducción de egreso, **preservando** `Disponible = sobranteAnteriorRaw + ingresosMes − egresosMes`.

**Timing "mes vencido"**
- Alinear `payDay` al día de cobro real (fin de mes), no `payDay=1`. Ambos motores ya filtran con `getFilterDateRange(monthKey, viewMode, payDay)` → con el mismo `payDay` quedan sincronizados; los movimientos del borde (ej. préstamo del 30/06 con el cobro de julio) caen en el ciclo de julio.
- El sueldo se resuelve por `effectiveDate`/`getSalaryForMonth(monthKey)` (assign por monthKey, no por rango de fecha) → esta ventana no lo afecta.
- Criterio ÚNICO compartido: la ventana `getFilterDateRange(payDay)` es la misma para Resumen y saldo. No inventar un segundo criterio de rango.

**adjustment_ars (~$4,1M)**
- Esta fase es SOLO cálculo, NO toca datos. Una vez reconciliados los motores, el `adjustment_ars` de cuadre queda redundante.
- La corrección del dato en el backup del usuario es un paso separado, verificado (via UI o edición del backup respaldando el original primero). NO se hace en esta fase.
- OJO doble-conteo: validar en planning si el `adjustment_ars` es seed legítimo (patrimonio inicial) vs fudge de cuadre antes de proponer su corrección. No borrar a ciegas.

**Verificación**
- Test unitario con fixture del backup real (`expense-tracker-backup-2026-06-30.json`): corre AMBOS motores y asERTA `Disponible(Resumen) == saldo líquido` para ARS y USD.
- Caso ancla: Resumen ARS junio 2026 "Disponible" == **$28.168,76** (hoy $390.668,76; diff = $362.500 de la compra de dólares).

**Restricciones**
- Preservar la cadena "sobrante anterior" (disponible del mes → sobrante del siguiente).
- Preservar la lógica de aportes por `purpose` (tarjeta/objetivo neutros; ahorro/especulación restan) — `sumAportes` NO cambia.
- Simetría ARS/USD.
- NO reutilizar `isInitial` (solo wizard) ni `pendingIngreso` para excluir nada; si hace falta excluir, flag nuevo con nombre propio.
- Sin cambio de schema, sin migración (`_migrationVersion` intacto).

### Claude's Discretion
- Cómo estructurar internamente la función pura (una función por moneda vs una parametrizada por `currency`).
- Nombre de la función y su ubicación exacta dentro de `lib/` (sugerencia: `lib/resumen/cash-effects.ts` o `lib/cash/`).
- Si conviene extraer también el núcleo de `calculateDualBalances` a `lib/` para poder testear la igualdad de ambos motores (ver Open Questions Q1 — probablemente necesario).

### Deferred Ideas (OUT OF SCOPE)
- Corrección del dato `adjustment_ars` en el backup del usuario (paso separado post-reconciliación).
- Evaluar si el mes wizard puede unificar su rama especial (`calculateAvailableForMonth`) con la fórmula general una vez reconciliados los motores — solo si no rompe la cadena de sobrante.
</user_constraints>

<phase_requirements>
## Phase Requirements

The phase has acceptance criteria (from PROMPT.md), mapped here to research support:

| ID | Description | Research Support |
|----|-------------|------------------|
| AC-1 | Resumen ARS junio 2026 Disponible pasa de $390.668,76 a $28.168,76 | Verified: diff = exactly $362.500 = the `currency_ars_to_usd` 2026-06-04 conversion. Adding cash effect to `egresosMes` closes it. See "Why they diverge by exactly $362.500". |
| AC-2 | Para cualquier moneda+período: `Disponible(Resumen) == saldo líquido` | Requires the shared pure function + wiring data into `computeMonthMetrics`. See "Reconciliation invariant" — note this holds for the CHAINED flow, not the raw accumulated balance (see Open Questions Q2). |
| AC-3 | `adjustment_ars` de cuadre deja de ser necesario | Downstream/manual — this phase only makes the calc correct; the $4.1M fudge removal is deferred. |
| AC-4 | Simetría ARS/USD verificada | `computeUsdAvailableForMonth` already mirrors ARS; the pure function must be currency-parametric. Test asserts both. |
| AC-5 | Sin cambios de schema / migración intacta | Verified `_migrationVersion: 8` in backup — no reads/writes of persisted shape change. Pure calc only. |
| AC-6 | Efectos de caja son funciones puras testeables | The extracted `lib/` function is the deliverable; existing vitest infra runs it. |
</phase_requirements>

## Standard Stack

No new dependencies. Everything needed is already installed.

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| vitest | 4.1.2 (devDep) | Unit test runner | Already the project's test runner [VERIFIED: package.json + `npx vitest run` passes] |
| date-fns | 4.1.0 | `parse`/`format`/`subMonths`/`lastDayOfMonth` for date-range math | Already used everywhere for period logic [VERIFIED: package.json, usePayPeriod.ts] |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| TypeScript | ^5 | Pure function types (mirror existing `MonthMetricsInput` pattern) | The extracted function's signature |

**Installation:** None required.

**Test invocation:** There is NO `test` script in `package.json`. Tests run via `npx vitest run <path>` (verified working) or `npx vitest run` for all. [VERIFIED: package.json scripts block has only dev/build/start/lint; `npx vitest run lib/resumen/month-metrics.test.ts` → 6 passed]. **The planner should add a `"test": "vitest run"` script** to package.json as a low-risk convenience (does not touch app schema).

## Architecture Patterns

### Current engine topology (VERIFIED by reading the code)

There are effectively **four** cash-computing code paths, three of which are correct and one incomplete:

```
CORRECT (count all cash effects: transfers, loans, usdPurchases):
  calculateDualBalances       hooks/useMoneyTracker.ts L370-577  (closure in hook; period + accumulated, ARS + USD)
  calculateAvailableForMonth  hooks/useMoneyTracker.ts L579-659  (ARS per-month cash flow; used for wizard month)
  computeUsdAvailableForMonth components/expense-tracker.tsx L272-308  (USD per-month cash flow)

INCOMPLETE (only gastos + aportesNoNeutros; ignores transfers/loans/usdPurchases):
  computeMonthMetrics         lib/resumen/month-metrics.ts L86-135  (used for CHAINED non-wizard months + the Resumen card)
```

The bug: `computeChainedDisponible` (expense-tracker.tsx L330-371) and the `arsMetrics`/`usdMetrics` memos (L433-468) call `computeMonthMetrics` **without passing** `transfers`/`loans`/`usdPurchases`. The data never reaches the calc. [VERIFIED: L359-369 and L435-445 — the input object has no transfers/loans/usdPurchases keys].

### Recommended structure

```
lib/
├── resumen/
│   ├── month-metrics.ts        # extend MonthMetricsInput + egresos formula
│   ├── month-metrics.test.ts   # existing — keep passing
│   └── cash-effects.ts         # NEW: computeCashEffect() pure fn (single source of truth)
└── resumen/
    └── reconciliation.test.ts  # NEW: fixture-driven both-engines-agree test
```

### Pattern 1: Currency-parametric pure cash function
**What:** One function, `currency` param, returns net signed cash delta for the in-range movements.
**When to use:** Called by all four sites above so they can't diverge.
**Signature (mirrors existing `MonthMetricsInput`/`isInRange` convention):**
```typescript
// Source: derived from calculateDualBalances L471-547 (VERIFIED)
export interface CashEffectInput {
  currency: CurrencyType;
  isInRange: (dateStr: string) => boolean;
  transfers: ReadonlyArray<Transfer>;
  loans: ReadonlyArray<Loan>;
  usdPurchases: ReadonlyArray<UsdPurchase>;
}
// Returns the net signed cash delta (positive = money in, negative = money out)
// for the given currency, over the in-range movements.
export function computeCashEffect(input: CashEffectInput): number { ... }
```
**Exact sign table (transcribed from `calculateDualBalances` L471-547, the source of truth):**

| Movement | Condition | ARS delta | USD delta |
|----------|-----------|-----------|-----------|
| `currency_ars_to_usd` | in range | `−arsAmount` | `+usdAmount` |
| `currency_usd_to_ars` | in range | `+arsAmount` | `−usdAmount` |
| `cash_out` (`currency==="ARS"`) | in range | `−amount` | — |
| `cash_out` (`currency==="USD"`) | in range | — | `−amount` |
| `cash_in` (`currency==="ARS"`) | in range | `+amount` | — |
| `cash_in` (`currency==="USD"`) | in range | — | `+amount` |
| `usdPurchase` (`origin==="tracked"`) | in range | `−arsAmount` | `+usdAmount` |
| `usdPurchase` (`origin==="untracked"`) | in range | 0 (no ARS deduction) | `+usdAmount` |
| loan `preste` (same currency) | loan.date in range | `−amount` | (same, its currency) |
| loan `preste` payments | payment.date in range | `+p.amount` | (same) |
| loan `debo` payments | payment.date in range | `−p.amount` | (same) |
| loan `debo` principal | — | 0 (borrowing doesn't move liquid) | 0 |

**IMPORTANT edge cases baked into the current code (must preserve):**
- `adjustment_ars`/`adjustment_usd` are handled by `calculateDualBalances` but are NOT part of the cash-effect the Resumen should add — they are the cuadre fudge. Note `calculateAvailableForMonth` (the wizard-month path) DOES add `adjustment_ars` (L625). The extracted function should NOT include adjustments (they belong only to the wizard-month special branch). [VERIFIED L504-511 vs L625 — decide explicitly, see Open Questions Q3].
- USD purchases: in `calculateDualBalances` the USD `+usdAmount` is added for ALL purchases regardless of origin, but the ARS `−arsAmount` only for `origin==="tracked"` (L418-425). Preserve that asymmetry.
- Loans and transfers use `!` non-null assertions on optional fields (`arsAmount!`, `amount!`) — the shape guarantees them by type. Keep the same assumptions.

### Pattern 2: Integrating cash effect into the Resumen formula
**What:** Fold `computeCashEffect` into `egresosMes` while preserving `Disponible = sobranteAnteriorRaw + ingresosMes − egresosMes`.
**Recommended approach (makes Disponible == period balance exactly):**
```typescript
// cashEffect is signed: negative = net money out, positive = net money in.
// egresos should INCREASE when money went out. So subtract cashEffect from egresos:
const egresosMes = totalGastos + aportesNoNeutros - cashEffect;
// Disponible = sobranteAnteriorRaw + ingresosMes - egresosMes
//            = sobranteAnteriorRaw + ingresosMes - totalGastos - aportesNoNeutros + cashEffect
```
This adds `+cashEffect` to Disponible. For June: cashEffect includes `−362500` (the conversion out) → Disponible drops by 362500 → $390.668,76 − $362.500 = $28.168,76. [VERIFIED arithmetically against the real backup]. Positive effects (cash_in, incoming conversion, loan collection) raise Disponible symmetrically — no need to split income vs egreso; a single signed term is cleaner and provably symmetric.

### Anti-Patterns to Avoid
- **Duplicating the sign table:** Do NOT reimplement the cash logic inside `computeMonthMetrics`. Call the shared function. The whole point is single source of truth.
- **Reusing `isInitial`/`pendingIngreso` as exclusion flags for new purposes:** Forbidden by memory + CONTEXT. The cash function already respects them only where the current code does (loans/transfers/usdPurchases don't have those flags anyway).
- **Adding a second date-range criterion:** Use the existing `getFilterDateRange`/`isInRange` injected by the caller. Do not invent a parallel window.
- **Touching `sumAportes` or purpose logic:** Out of scope; aportes stay exactly as-is.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Period date window | Custom month/pay-period math | `getFilterDateRange(monthKey, viewMode, payDay)` (usePayPeriod.ts) | Already handles payDay clamping, calendar vs periodo, month-boundary edge cases [VERIFIED L7-38] |
| The cash sign table | New sign logic | Transcribe from `calculateDualBalances` L471-547 verbatim | It's the verified source of truth; any deviation reintroduces the divergence |
| Loan remaining | `remaining` field | `amount − Σ payments` recompute | Invariant from data-model.md; never stored |
| Test fixture parsing | Hand-crafted objects | Load `expense-tracker-backup-2026-06-30.json` and read `data.monthlyData` | Real data catches real bugs; anchor case is embedded in it |

**Key insight:** The correct algorithm already exists three times in the repo. This phase is de-duplication + wiring, not new financial logic. The risk is regression (changing a sign), not missing knowledge.

## Runtime State Inventory

This is a pure calculation phase — no rename, no data migration, no stored-state changes.

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | None — `_migrationVersion: 8` stays untouched [VERIFIED in backup]. No localStorage key added/renamed. | None |
| Live service config | None — client-side only, no backend/services | None |
| OS-registered state | None | None |
| Secrets/env vars | None | None |
| Build artifacts | None — no new package, no compiled output | None |

**The one persisted-shape consideration:** The `adjustment_ars` ($4.1M, 2026-06-30) and the wizard seed `adjustment_ars` ($360.834,74, 2026-04-02) live in the user's backup. This phase does NOT modify them (deferred). Confirmed there are TWO `adjustment_ars` transfers; `wizardMonth` detection uses `.find()` → picks the FIRST (2026-04, the seed), NOT the June fudge. [VERIFIED by reading backup]. The planner must not assume there's only one.

## Common Pitfalls

### Pitfall 1: Confusing "period balance" with "chained flow disponible"
**What goes wrong:** Assuming `Disponible(Resumen)` should equal `calculateDualBalances.arsBalancePeriod` for the CURRENT month directly. The June raw period balance (with salary + the $4.1M cuadre adjustment) is ~$3.4M, NOT $28.168,76.
**Why it happens:** `computeMonthMetrics` computes a *chained flow* (sobrante anterior + this month's ins − outs), where sobrante anterior is itself the previous month's chained disponible — NOT the accumulated balance. The reconciliation invariant holds along the chain, and the `adjustment_ars` cuadre is what makes the raw accumulated balance diverge from the honest chained flow.
**How to avoid:** The test should assert the reconciliation the way the app actually chains: `computeChainedDisponible(month) == calculateAvailableForMonth(month)` for the wizard month and per-month flow, and that adding cashEffect makes the non-wizard chained value match the per-month cash-flow engine. See "Reconciliation invariant" below. Do NOT naively assert against `arsBalancePeriod` which still carries the cuadre fudge.
**Warning signs:** Test expects $28.168,76 but gets a multi-million number → you compared against the wrong balance field.

### Pitfall 2: Sign inversion when folding cashEffect into egresos
**What goes wrong:** Adding `+cashEffect` to `egresosMes` instead of `−cashEffect`, doubling the error direction.
**Why it happens:** `cashEffect` is signed (negative = out). Egresos should rise when cash leaves, so it's `egresos − cashEffect`.
**How to avoid:** Sanity check: June cashEffect for ARS should be negative (money left via conversion); Disponible must DROP. If Disponible rises, sign is flipped.
**Warning signs:** June goes to $753k instead of $28k.

### Pitfall 3: Double-counting the wizard-month adjustment
**What goes wrong:** If `computeCashEffect` includes `adjustment_ars`/`adjustment_usd`, and the wizard-month branch ALSO adds them via `calculateAvailableForMonth`, the wizard month double-counts.
**Why it happens:** `calculateDualBalances` includes adjustments (L504-511); `calculateAvailableForMonth` includes `adjustment_ars` (L625). If you extract naively you carry adjustments into the Resumen for every month.
**How to avoid:** EXCLUDE adjustments from `computeCashEffect`. They are cuadre/seed artifacts, not real cash flow. The wizard month keeps its special branch (which handles the seed adjustment). This is consistent with the deferred plan to make the $4.1M fudge redundant. See Open Questions Q3.
**Warning signs:** Every non-wizard month's Disponible shifts by the adjustment amount.

### Pitfall 4: USD range uses ARS pay-period
**What goes wrong:** Building a separate USD date window.
**Why it happens:** Reasonable-looking but wrong — the codebase intentionally uses `arsIsInRange` for USD metrics too (expense-tracker.tsx L465 comment: "same range function — USD uses ARS pay-period per existing convention").
**How to avoid:** Pass the same `isInRange` for both currencies. `computeCashEffect` is currency-parametric but range-agnostic; caller injects the (shared) range.
**Warning signs:** USD reconciliation off by movements near month boundaries.

### Pitfall 5: payDay change is data, not code
**What goes wrong:** Hard-coding a new payDay or changing the default in `useMoneyTracker.ts` L288 (`payDay: 1`).
**Why it happens:** CONTEXT says "align payDay to real pay day". But payDay lives in `incomeConfig` (persisted, user-editable via UI).
**How to avoid:** Both engines already read `incomeConfig.payDay` and pass it to `getFilterDateRange`. The CODE change needed is only that both engines use the SAME payDay (they already do — both read `incomeConfig.payDay`). The user setting payDay to their real pay day is a **user/data action** (via UI), not a code change. Verify in planning whether any code path still hard-codes payDay=1; the default at L288 is only the initial seed for new users. Do not migrate existing data.
**Warning signs:** Proposing to write payDay into the backup — that's a schema-adjacent data change, out of scope.

## Code Examples

### Reconstructing the June anchor from the real backup (VERIFIED)
```javascript
// Source: run against expense-tracker-backup-2026-06-30.json (VERIFIED 2026-07-01)
// payDay=1, periodo → June range 2026-06-01..2026-06-30
// Confirmed: today's Resumen June ARS Disponible = 390668.76
// Target = 28168.76; delta = 390668.76 - 28168.76 = 362500.00
// = the currency_ars_to_usd transfer { date:"2026-06-04", arsAmount:362500, usdAmount:250 }
// May salary (effectiveDate "2026-05", amount 2364969) resolves for June via getSalaryForMonth.
```

### Extracted cash-effect function (skeleton mirroring calculateDualBalances)
```typescript
// Source: transcribed from hooks/useMoneyTracker.ts L471-547 (VERIFIED source of truth)
export function computeCashEffect(input: CashEffectInput): number {
  const { currency, isInRange, transfers, loans, usdPurchases } = input;
  const isUsd = currency === CurrencyType.USD;
  let delta = 0;

  for (const p of usdPurchases) {
    if (!isInRange(p.date)) continue;
    if (isUsd) delta += p.usdAmount;
    else if (p.origin === "tracked") delta -= p.arsAmount;
  }

  for (const t of transfers) {
    if (!isInRange(t.date)) continue;
    switch (t.type) {
      case "currency_ars_to_usd": delta += isUsd ? t.usdAmount! : -t.arsAmount!; break;
      case "currency_usd_to_ars": delta += isUsd ? -t.usdAmount! : t.arsAmount!; break;
      case "cash_out": if ((t.currency === "USD") === isUsd) delta -= t.amount!; break;
      case "cash_in":  if ((t.currency === "USD") === isUsd) delta += t.amount!; break;
      // adjustment_ars / adjustment_usd intentionally EXCLUDED — cuadre artifacts (see Pitfall 3)
    }
  }

  for (const loan of loans) {
    if ((loan.currencyType === CurrencyType.USD) !== isUsd) continue;
    if (loan.type === "preste") {
      if (isInRange(loan.date)) delta -= loan.amount;
      for (const pay of loan.payments) if (isInRange(pay.date)) delta += pay.amount;
    } else { // debo
      for (const pay of loan.payments) if (isInRange(pay.date)) delta -= pay.amount;
    }
  }
  return delta;
}
```

### Fixture-driven reconciliation test (existing vitest style)
```typescript
// Source: existing lib/resumen/month-metrics.test.ts uses `vitest` globals + `@/` alias (VERIFIED)
import { describe, it, expect } from "vitest";
import backup from "../../expense-tracker-backup-2026-06-30.json";

describe("Phase 23 reconciliation", () => {
  it("June 2026 ARS Disponible == 28168.76", () => {
    // build isInRange for June periodo, call computeMonthMetrics with cashEffect wired,
    // assert disponible ≈ 28168.76 (use expect(x).toBeCloseTo(28168.76, 2))
  });
  // symmetric USD assertion; assert both engines agree.
});
```

## State of the Art

Not applicable — this is internal refactoring against a stable, self-contained codebase. No external library/API currency involved. date-fns 4.x and vitest 4.x are current.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Today's Resumen June ARS Disponible is exactly $390.668,76 (I verified the $362.500 delta from data, but the $390.668,76 baseline comes from PROMPT, not from running the live app) | Summary / AC-1 | If baseline differs, target arithmetic shifts, but the fix (adding cashEffect) is unchanged. |
| A2 | The reconciliation invariant should be checked against the per-month cash-flow engine (`calculateAvailableForMonth`), not the raw `arsBalancePeriod` (which still carries the $4.1M cuadre) | Pitfall 1 / Reconciliation invariant | If planner asserts against `arsBalancePeriod`, the test will fail until the cuadre is removed (deferred) — must target the chained flow. Medium risk; planner must decide the exact assertion target in Wave 0. |
| A3 | `adjustment_ars`/`adjustment_usd` should be EXCLUDED from the extracted cash function (they're cuadre/seed, not real flow) | Pitfall 3 / Q3 | If wrong, wizard-month double-counts the seed adjustment. |

## Open Questions

1. **Should `calculateDualBalances`'s core also be extracted to `lib/` to make it directly testable?**
   - What we know: `calculateDualBalances` is a closure inside `useMoneyTracker` (L370), reading `monthlyData`, `viewMode`, `payDay`, `salaryHistoryTracker` from closure — not callable from a vitest file today. `calculateAvailableForMonth` (L579) and `computeUsdAvailableForMonth` (expense-tracker L272) are similarly closures.
   - What's unclear: Whether the test can assert "both engines agree" without extracting the balance engine's pure core.
   - Recommendation: Extract a pure `computeLiquidBalance(monthlyData-subset, currency, isInRange, salaryResolver)` core to `lib/` so the test can invoke it directly. This is likely REQUIRED for AC-2/AC-6. Low risk if it's a mechanical move preserving signs. The planner should scope this as a task in Wave 0 (extract) before Wave 1 (wire into Resumen).

2. **Does the chained sobrante reproduce accumulated state, or is there residual double-count/omission beyond the $362.500?**
   - What we know: The $362.500 conversion is the ONLY divergence for June ARS (verified). But other months may involve loans, cash_in/out, USD retiros, liquid-investment `currentValue`.
   - What's unclear: `computeMonthMetrics` does not account for liquid investment `currentValue` (L451-469 in calculateDualBalances adds `i.currentValue` for `isLiquid` Activa investments) or investment retiros/aportes-as-cash the same way. The Resumen's `sumAportes` handles aportes-as-egreso, but retiros (which ADD cash) are explicitly excluded from Resultado (month-metrics.ts L17-19 comment). This means retiros of ARS investments add liquid cash in `calculateDualBalances` but NOT in `computeMonthMetrics`.
   - Recommendation: **Investigate in planning whether investment retiros and liquid `currentValue` are additional divergence sources.** The June case happens not to have them, but AC-2 ("any currency + period") requires them. The pure cash function per CONTEXT covers transfers/loans/usdPurchases; the planner must decide whether investment retiros-as-cash also need folding in (they move liquid cash and are currently omitted from the Resumen). This is the highest-value open question. Flag: possibly extend scope or confirm retiros stay out per the "retiros never add to Resultado" rule vs. the reconciliation requirement — these two rules CONFLICT and must be reconciled explicitly. See memory `project_mes_vencido_model`.

3. **Include adjustments in the cash function or not?**
   - What we know: `calculateDualBalances` includes them; `calculateAvailableForMonth` includes `adjustment_ars`; the wizard month routes through the latter.
   - Recommendation: EXCLUDE from `computeCashEffect`; keep them only in the wizard-month special branch. Consistent with the deferred goal of making the $4.1M cuadre redundant. Confirm in planning.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| vitest | Reconciliation test | ✓ | 4.1.2 | — |
| Real backup JSON | Test fixture | ✓ | `expense-tracker-backup-2026-06-30.json` (+ `.ORIGINAL.json`) in repo root | — |
| Node (for fixture import) | Test | ✓ | verified `npx vitest run` works | — |

**Missing dependencies:** None. All infra present.

**Note:** Importing a `.json` in a vitest test needs `resolveJsonModule` (TS) — already implicit via Next.js tsconfig; verify `tsconfig.json` has it, else import via `fs.readFileSync` (works without config). Low risk.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | vitest 4.1.2 |
| Config file | `vitest.config.ts` (globals: true, `@` alias → repo root) |
| Quick run command | `npx vitest run lib/resumen/month-metrics.test.ts` |
| Full suite command | `npx vitest run` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| AC-1 | June 2026 ARS Disponible == 28168.76 | unit (fixture) | `npx vitest run lib/resumen/reconciliation.test.ts` | ❌ Wave 0 |
| AC-2 | Disponible(Resumen) == liquid balance, ARS+USD | unit (fixture) | `npx vitest run lib/resumen/reconciliation.test.ts` | ❌ Wave 0 |
| AC-4 | ARS/USD symmetry | unit | same file | ❌ Wave 0 |
| AC-6 | cash effects are pure/testable | unit | `npx vitest run lib/resumen/cash-effects.test.ts` | ❌ Wave 0 |
| (regression) | existing month-metrics behavior unchanged | unit | `npx vitest run lib/resumen/month-metrics.test.ts` | ✅ (6 tests pass) |

### Sampling Rate
- **Per task commit:** `npx vitest run lib/resumen/` (fast, targeted)
- **Per wave merge:** `npx vitest run` (full suite — 7 existing test files)
- **Phase gate:** Full suite green + June anchor asserts 28168.76 before `/gsd-verify-work`

### The central reconciliation invariant (this IS the phase's validation)
For any month + currency, with the same `isInRange`:
```
computeMonthMetrics(...).disponible  ==  <per-month cash-flow engine>(month)
```
where `<per-month cash-flow engine>` is `calculateAvailableForMonth` (ARS) / `computeUsdAvailableForMonth` (USD) — the ALREADY-CORRECT engines. After extracting their shared core to `lib/`, the test can call both pure functions and assert equality. This is the permanent regression net. (Do NOT assert against `arsBalancePeriod` which still carries the cuadre fudge — see Pitfall 1 / A2.)

### Wave 0 Gaps
- [ ] `lib/resumen/cash-effects.ts` — extract `computeCashEffect` (single source of truth)
- [ ] `lib/resumen/cash-effects.test.ts` — unit test the sign table per movement type
- [ ] Extract pure core of `calculateAvailableForMonth`/`computeUsdAvailableForMonth`/`calculateDualBalances` to `lib/` so the reconciliation test can invoke both engines (see Q1) — REQUIRED for AC-2
- [ ] `lib/resumen/reconciliation.test.ts` — fixture-driven both-engines-agree test (June anchor)
- [ ] Add `"test": "vitest run"` to package.json scripts (convenience; no schema impact)
- [ ] Confirm `tsconfig.json` allows JSON import OR test uses `fs.readFileSync`

## Project Constraints (from CLAUDE.md / skill)

There is no root `CLAUDE.md`. Constraints come from the `contador` skill (`.claude/skills/contador/`) and auto-memory:
- **Never break localStorage schema without migration** (memory `feedback_json_safety`) — this phase does not touch schema; `_migrationVersion: 8` stays.
- **`isInitial` is wizard-only** (memory `feedback_isinitial_wizard_only`) — do not reuse it to exclude movements; add a new flag if exclusion is needed (not expected here).
- **Manual corrections via UI by default** (memory `feedback_manual_corrections`) — the $4.1M `adjustment_ars` fix is deferred and user-applied, not code.
- **Mes-vencido model** (memory `project_mes_vencido_model`) — devengado vs caja; the timing decision (align payDay) flows from this. Directly relevant to Open Question Q2.
- **Reproduce, don't guess** (skill rule 4) — all balance claims here were reconstructed with node against the real backup, per skill discipline.
- **Diagnose before cuadrar** (skill rule 1) — this phase removes the NEED for the cuadre adjustment by fixing the root cause; aligns with skill philosophy.

## Sources

### Primary (HIGH confidence)
- `hooks/useMoneyTracker.ts` L370-659 — `calculateDualBalances`, `calculateAvailableForMonth` (source of truth for cash sign table)
- `components/expense-tracker.tsx` L272-468 — `computeUsdAvailableForMonth`, `computeChainedDisponible(Usd)`, `arsMetrics`/`usdMetrics` memos, `wizardMonth`
- `lib/resumen/month-metrics.ts` — `computeMonthMetrics`, `sumAportes` (the engine to fix)
- `hooks/usePayPeriod.ts` — `getFilterDateRange`/`getPayPeriodRange` (shared window)
- `.claude/skills/contador/references/data-model.md` — verified formulas + invariants
- `expense-tracker-backup-2026-06-30.json` — real fixture; reconstructed June $362.500 delta, confirmed two `adjustment_ars`, payDay=1, migrationVersion 8
- `vitest.config.ts` + `lib/resumen/month-metrics.test.ts` — test infra (verified passing via `npx vitest run`)

### Secondary (MEDIUM confidence)
- PROMPT.md baseline figure $390.668,76 (asserted by user, not re-run against live app — see A1)

### Tertiary (LOW confidence)
- None.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new deps, test infra verified running
- Architecture (extract shared cash fn + wire data): HIGH — all four call sites read and cross-checked; sign table transcribed verbatim
- Reconciliation invariant / June anchor: HIGH for the $362.500 ARS delta (reconstructed from data); MEDIUM on whether OTHER months have additional divergence sources (investment retiros / liquid currentValue) — flagged as Q2, the key planning risk
- Pitfalls: HIGH — derived from actual code asymmetries (adjustments, USD-uses-ARS-range, two adjustment transfers)

**Research date:** 2026-07-01
**Valid until:** Stable — internal codebase, ~30 days (only invalidated by unrelated refactors to the balance engines)
