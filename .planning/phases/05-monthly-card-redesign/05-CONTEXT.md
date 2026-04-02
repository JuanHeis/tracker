# Phase 5: Monthly Card Redesign - Context

**Gathered:** 2026-04-02
**Status:** Ready for planning

<domain>
## Phase Boundary

Rebuild the monthly summary card into a clear, accurate financial dashboard with correct formulas, visible desgloses, and patrimonio calculation. The current salary-card.tsx (670 lines) and total-amounts.tsx (77 lines) are split into three focused cards. No new data models or calculations — this phase reorganizes and enhances the presentation of data already computed by existing hooks.

</domain>

<decisions>
## Implementation Decisions

### Card structure
- Split into 3 separate cards (replacing current salary-card.tsx + total-amounts.tsx):
  1. **Resumen del Mes** — Monthly income/expense/available summary with aguinaldo and pendiente de cobro
  2. **Patrimonio** — All-time accumulated wealth: liquid ARS, liquid USD, investments, total (read-only)
  3. **Configuracion** — Employment type, pay day, cotizacion USD, salary history timeline
- Each card is a separate component file for maintainability
- Resumen = "Este mes" data; Patrimonio = "Historico" (accumulated) data — the card split itself provides the CARD-02 visual separation

### Este Mes vs Historico separation (CARD-02)
- Resumen card gets a colored chip/badge labeled "Este mes"
- Patrimonio card gets a colored chip/badge labeled "Historico"
- Explicit labels make the distinction unmistakable — not just relying on card titles
- Card titles: "Resumen del Mes" and "Patrimonio Total"

### Resumen card line items (CARD-01)
- Separate visible lines for all components (not bundled totals):
  - **INGRESOS** (section header, green):
    - Ingreso fijo: $X
    - Otros ingresos: $X
    - Aguinaldo: $X (when applicable — June/December, dependiente only)
  - **EGRESOS** (section header, red):
    - Gastos: -$X
    - Aportes inversiones: -$X
  - **Disponible**: $X (bold, prominent)
- Pendiente de cobro banner stays in Resumen card (amber banner at top, before income lines)
- Aguinaldo line stays in Resumen card with existing tooltip + edit behavior from Phase 4

### Patrimonio card (CARD-03)
- Shows: Liquido ARS, Liquido USD, Inversiones ARS, Inversiones USD, Patrimonio Total
- Investment lines in blue color, liquid lines neutral/white, total in bold
- Read-only (no edit controls — cotizacion USD lives in Config card)
- Patrimonio formula unchanged: arsLiquid + (usdLiquid * globalRate) + arsInvestments + (usdInvestments * globalRate)

### Config card
- Contains: employment type toggle, pay day, cotizacion USD (with pencil-to-edit), salary history timeline
- All existing edit interactions from Phase 4 salary-card.tsx migrate here
- "Add new salary entry" form stays here

### Desglose interaction (CARD-04)
- Tooltips on every summary number (extending existing Disponible tooltip pattern)
- Tooltip content shows formula with names AND actual values: "Ingreso fijo $500.000 + Otros ingresos $50.000 - Gastos $250.000 - Aportes inv. $50.000 = $250.000"
- Patrimonio tooltip shows full breakdown WITH USD conversion math: "Liq USD US$500 x $1.200 = $600.000"
- Each component value visible in the tooltip, not just the formula logic

### Semantic colors (CARD-05)
- Section headers colored: "INGRESOS" in green, "EGRESOS" in red
- Investment-related lines (aportes in Resumen, investment rows in Patrimonio) in blue
- Individual amounts keep +/- coloring: green for positive results, red for negative
- Patrimonio card: liquid lines neutral, investment lines blue, total bold white/gold
- USD amounts no longer exclusively green — follow semantic meaning instead

### Claude's Discretion
- Month-over-month patrimonio change indicator (arrow + amount vs previous month) — include if it adds value without clutter
- Exact badge/chip styling for "Este mes" / "Historico" labels
- Card ordering in the sidebar layout
- Exact tooltip positioning and sizing for formula desgloses
- How to handle edge cases (no income, no expenses, no investments)
- NumberFlow animation on card values (established pattern from Phase 2)

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `components/salary-card.tsx` (670 lines): Will be split into 3 cards — all existing edit interactions (employment config, salary history, aguinaldo, cotiz USD) migrate to Config card
- `components/total-amounts.tsx` (77 lines): Patrimonio calculation and display — becomes the Patrimonio card
- `components/formatted-amount.tsx`: Currency formatting — reuse across all 3 cards
- `components/ui/tooltip.tsx`: Radix tooltip — extend pattern for all summary numbers
- `components/ui/card.tsx`: Card/CardHeader/CardContent/CardTitle primitives
- `components/ui/badge.tsx`: Status badges — use for "Este mes" / "Historico" chips
- NumberFlow library: Animated number transitions (established in Phase 2)

### Established Patterns
- Click-to-edit with pencil icons (muted + hover:blue) — Phase 2/3/4
- Tooltip with TooltipProvider/Trigger/Content from Radix — existing on Disponible
- State flows through useMoneyTracker -> domain hooks -> useLocalStorage
- `cn()` utility for conditional class merging
- FormattedAmount component handles currency display

### Integration Points
- `components/expense-tracker.tsx`: Where cards are rendered — needs to swap salary-card + total-amounts for 3 new cards
- `hooks/useMoneyTracker.ts`: Provides arsBalance, usdBalance, arsInvestments, usdInvestments, globalUsdRate
- `hooks/useIncomes.ts`: Provides salary resolution, aguinaldo data
- `hooks/useSalaryHistory.ts`: Provides salary history, income config
- `hooks/usePayPeriod.ts`: Provides viewMode for pendiente de cobro logic

</code_context>

<specifics>
## Specific Ideas

- The card split mirrors how the user thinks: "What happened this month?" (Resumen) vs "What do I have total?" (Patrimonio) vs "My settings" (Config)
- Tooltips with full formula + values = the user can always verify any number they see, which aligns with the core value "nunca perderse un peso ni un dolar"
- Patrimonio tooltip showing USD conversion math makes the exchange rate impact transparent — important in Argentina's dual-currency context

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 05-monthly-card-redesign*
*Context gathered: 2026-04-02*
