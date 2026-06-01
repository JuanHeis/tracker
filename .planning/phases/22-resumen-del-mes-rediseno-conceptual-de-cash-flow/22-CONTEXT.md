# Phase 22: Resumen del Mes — Rediseño conceptual de cash flow - Context

**Gathered:** 2026-06-01
**Status:** Ready for planning

<domain>
## Phase Boundary

The ResumenCard becomes a reliable cash-flow thermometer showing *available cash at month end* (Disponible) plus a secondary *performance metric* (Resultado del mes). Investment movements are classified by purpose so provisioning for a credit card doesn't penalize the monthly result. Deficit banners alert the user when they're drawing down savings or consistently ending months in the red.

Full deliverables:
1. Fix Disponible formula to include sobrante anterior (D1)
2. "Resultado del mes" secondary line in muted white (D2)
3. `purpose` field on Investment with 4 labels: ahorro / objetivo / tarjeta / especulación (D3)
4. One-shot investment classification wizard (modal on first app load post-deploy) (D10)
5. Inline purpose select per investment in the investments section (D3)
6. Banner: "Déficit anterior" when sobrante < 0 (D5)
7. Banner: "Déficit recurrente" when 2 consecutive negative months OR cumulative deficit > N% of salary (D6)
8. USD parallel toggle (small button in header, ARS default) (D7)
9. Settings slider for deficit alert threshold (10%–100% of salary, steps 10%, default 25%) stored in `resumenConfig` localStorage key (D6 + D13)

</domain>

<decisions>
## Implementation Decisions

### Disponible formula (D1)
- `Disponible = sobrante_anterior + ingresos_mes − egresos_mes`
- sobrante_anterior already flows into ResumenCard as a prop; it must be added to the disponible calculation
- The ResumenCard `disponible` prop should reflect the updated formula — compute in expense-tracker.tsx, not inside ResumenCard
- Tooltip updated to show the new formula explicitly

### Resultado del mes (D2, D11, D12)
- `Resultado del mes = ingresos_mes − egresos_mes − aportes_no_neutros`
- `aportes_no_neutros` = aportes to investments with purpose ∈ {ahorro, especulación} (tarjeta/objetivo are neutral)
- Retiros from any investment do NOT add to Resultado (prevents masking deficit with FCI withdrawals)
- Aguinaldo counts as part of ingresos_mes (D11)
- Always visible, even when equal to Disponible (D12)
- Rendered as a small muted-white secondary line below Disponible — no color coding by sign

### Investment purpose labels (D3)
- New type: `type InvestmentPurpose = "ahorro" | "objetivo" | "tarjeta" | "especulacion"`
- Add optional field `purpose?: InvestmentPurpose` to the `Investment` interface in `hooks/useMoneyTracker.ts`
- Default when unset: treated as "ahorro"
- Purpose affects only monthly flow metrics, not balance calculations

### Investment classification wizard (D3 migration, D10)
- One-shot modal: auto-shows on first app load when investments exist without `purpose` field
- User sees a list of all investments with suggested purpose (heuristics: name match for tarjeta/objetivo/especulación, default ahorro)
- "Aceptar sugerencias" button accepts all in one click; individual selects allow overrides
- If user closes without completing: investments remain with ahorro default, no persistent banner (D10)
- `resumenConfig.wizardCompletedAt` timestamp set on completion to suppress future shows

### Inline purpose select per investment (D3)
- Add a small purpose Badge/Select to each investment row in the investments section
- Non-destructive: changing purpose only updates the `purpose` field, no other data changes

### Sobrante anterior negative (D5)
- When sobrante_anterior < 0: show as "Déficit anterior: $X" in amber/red banner ABOVE the card content
- Still included in Disponible calculation (it's a real debt)
- The existing `sobrante` prop only carries positive values currently — need to also pass the raw value (or add a new prop `sobranteRaw`) so the component can show the deficit banner

### Deficit recurrente banner (D6)
- Triggers when: 2 consecutive months with Resultado del mes < 0 OR cumulative deficit exceeds N% of last salary
- N is configurable (stored in resumenConfig.deficitThresholdPercent, default 25%)
- Banner rendered above the card, dismissable per session (not persistent)
- Threshold slider change applies only to future evaluations (D13)

### USD parallel toggle (D7)
- Small toggle/button in card header (not prominent)
- Default: ARS view
- USD calculation mirrors ARS logic: sobrante_usd + ingresos_usd − egresos_usd
- Same banners apply in USD mode when applicable
- Sobrante USD anterior only shown in USD toggle mode

### First month / future month handling (D8, D9)
- First month post-wizard: sobrante = 0 (existing behavior preserved)
- Future month: sobrante anterior = Disponible of previous month (same calculateAvailableForMonth logic, which is already dynamic)

### Settings storage (discuss decision)
- New localStorage key: `"resumenConfig"`
- Schema: `{ deficitThresholdPercent: number; wizardCompletedAt?: string }`
- Must be cleared in factory reset flow (wizard already clears other keys on reset)

### Claude's Discretion
- Exact banner styling (amber vs red for déficit anterior vs déficit recurrente)
- Whether the USD toggle is a text button or an icon toggle
- How to handle the case where Resultado del mes === Disponible exactly (show both lines, different labels)
- Spinner or empty state when no salary data exists for a month

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `components/resumen-card.tsx` — existing component with all props; modify in place
- `components/expense-tracker.tsx` — orchestrator: soranteDelMesAnterior (positive-only), availableMoney; need to add sobranteRaw and resultadoDelMes
- `hooks/useMoneyTracker.ts:570` — `calculateAvailableForMonth()` — base for computing Disponible recursively
- `hooks/useMoneyTracker.ts:63` — `Investment` interface — add `purpose` field here
- `components/formatted-amount.tsx` — use for all monetary values
- `components/ui/badge.tsx`, `components/ui/tooltip.tsx` — existing UI primitives
- Banners pattern: amber/red banners already exist in resumen-card.tsx (aguinaldo preview, isPendiente)

### Established Patterns
- Props-only pattern: ResumenCard is already props-only — keep it that way
- expense-tracker.tsx as single orchestrator: all new calcs (resultadoDelMes, sobranteRaw) computed here, passed as props
- localStorage hooks: useSavingsRate pattern (useLocalStorage custom hook or direct localStorage.getItem with JSON.parse)
- CurrencyType enum: `CurrencyType.USD` for USD filtering
- `getFilterDateRange(monthKey, viewMode, payDay)` for date range calculations

### Integration Points
- `hooks/useMoneyTracker.ts` — Investment interface (add purpose)
- `components/expense-tracker.tsx` — compute resultadoDelMes, sobranteRaw, deficitAlertState
- `components/resumen-card.tsx` — main UI: new props, new lines, banners, USD toggle
- Investments section (find exact component) — add inline purpose select
- Factory reset handler — add 'resumenConfig' key to clear list
- New: investment classification wizard component (modal)
- New: settings section with deficit slider

</code_context>

<specifics>
## Specific Ideas

From the user's spec at `.planning/quick/260601-rdm-resumen-del-mes-redesign/260601-rdm-SPEC.md`:

- **Wire case**: user aportes 344k to SBS RTA PESOS (purpose=tarjeta) then pays credit card → Resultado del mes shows only the card expense, NOT the aporte (double counting prevented)
- **Heuristics for purpose suggestions**: `/tarjeta|tc|sbs.*rta.*pesos/i` → tarjeta; `/piano|viaje|auto|casa/i` or type Cuenta Remunerada → objetivo; type Acciones/Cedear → especulación; default → ahorro
- **Card wireframe**:
  ```
  ┌─────────────────────────────────────────┐
  │ ⚠ Vienes en déficit 2 meses seguidos    │
  ├─────────────────────────────────────────┤
  │ ⚠ Déficit anterior: ARS -50,000         │
  ├─────────────────────────────────────────┤
  │ Resumen del Mes         [Este mes] [$U] │
  │ INGRESOS                                │
  │   Ingreso fijo:       2,276,318         │
  │   Sobrante anterior:    103,255         │
  │   Otros ingresos:             0         │
  │ EGRESOS                                 │
  │   Gastos:               149,819         │
  │   Aportes inversión:          0         │
  │   Por pagar:           -149,819         │
  │ ─────────────────────────────────       │
  │ Disponible:           2,229,754         │
  │   Resultado del mes:  +2,126,499        │  ← gris muted
  └─────────────────────────────────────────┘
  ```

</specifics>

<deferred>
## Deferred Ideas

- Time Weighted Return (TWR) for observed investment rate — already resolved with simpler approach in commit 218f5a6
- Historical chart of Resultado del mes and Sobrante anterior over time
- Push notifications for deficit recurrente
- More granular purpose rules (expiry dates for objectives)

</deferred>

---

*Phase: 22-resumen-del-mes-rediseno-conceptual-de-cash-flow*
*Context gathered: 2026-06-01*
