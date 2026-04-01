# Phase 2: Investment Model Refactor - Context

**Gathered:** 2026-04-01
**Status:** Ready for planning

<domain>
## Phase Boundary

Replace the current transactional investment model (one flat record per investment) with an account-based model. Each investment becomes an account with movements (aportes/retiros), a tracked current value, performance metrics (gain/loss, %), and finalization support. Currency rules enforced per type. The monthly card and dual currency engine are separate phases — this phase focuses on the investment data model and its UI.

</domain>

<decisions>
## Implementation Decisions

### Movement registration
- Expandable row pattern: click an investment row to expand it, revealing movement history + inline add form
- Movements have: date, type (aporte/retiro), amount
- Date defaults to today, user can change
- Movements affect monthly liquidity immediately — an aporte reduces available money in that month, a retiro adds it back
- Expanded row shows last 5 movements (most recent first) with a "ver todo" link for full history
- Inline form in expanded row: [Fecha] [Monto] [Aporte|Retiro] [+]

### Inline value update
- Click-to-edit pattern on the "Valor Actual" cell: shows value as text, click turns it into input, Enter/blur saves
- Gain/loss amount and % recalculate instantly on save
- Use NumberFlow library (https://number-flow.barvian.me/) for animated number transitions on recalculated values
- "Value outdated" warning (>7 days since lastUpdated): small orange/yellow badge next to the value cell
- Plazo Fijo value is read-only (auto-calculated from TNA) — click-to-edit disabled for PF type

### Finalization flow
- "Finalizar" button on each active investment row
- One-click opens confirmation dialog: "Finalizar [name]? Se creara un retiro por $[currentValue] y la inversion pasara a Finalizada."
- On confirm: auto-creates retiro movement for currentValue, sets status to "Finalizada", zeroes currentValue
- Finalization is permanent — no reactivation. User creates a new investment if needed
- Finalized investments remain visible in the table with dimmed/reduced opacity style + "Finalizada" badge
- Final gain/loss and % remain visible on dimmed rows (historical performance)

### Plazo Fijo specific behavior
- At creation: when type = Plazo Fijo, form shows additional fields: TNA (%) and Plazo (dias)
- Currency forced to ARS for Plazo Fijo (not user-selectable)
- Auto-calculation formula: Value = Capital x (1 + TNA/365 x dias) — simple interest, matches Argentine banking practice
- TNA and plazo are editable in the expanded row (for rate changes on renewal)
- When today > start date + plazo days: show "Vencido" badge on the row. User decides to finalize or update rate/plazo for renewal
- Value recalculates from updated rate + new start date when user edits

### Claude's Discretion
- Exact styling for dimmed finalized rows (opacity level, color treatment)
- Animation/transition details for expandable rows
- Exact placement of badges (Desactualizado, Vencido, Finalizada)
- How "ver todo" displays full movement history (inline expand vs scrollable)
- NumberFlow configuration details
- Investment creation dialog layout adjustments for the new fields

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `components/ui/dialog.tsx`: Radix UI dialog — reuse for finalization confirmation
- `components/ui/badge.tsx`: Exists — use for status badges (Finalizada, Vencido, Desactualizado)
- `components/ui/table.tsx`: Table primitives — extend with expandable row pattern
- `components/ui/input.tsx`: Reuse for inline forms and click-to-edit cells
- `components/ui/select.tsx`: Reuse for Aporte/Retiro selector in movement form
- `constants/investments.ts`: INVESTMENT_TYPES constant already exists (Plazo Fijo, FCI, Crypto, Acciones)
- `components/formatted-amount.tsx`: Currency formatting — reuse in movement list and gain/loss display

### Established Patterns
- All state flows through `useMoneyTracker` -> domain hooks -> `useLocalStorage` -> localStorage
- `useInvestmentsTracker.ts`: Current investment hook — will be heavily refactored (new data model, movements, value tracking)
- Form handling uses `preventDefault()` with FormData extraction
- `cn()` utility for conditional class merging (dimmed styles, badge colors)
- `crypto.randomUUID()` for ID generation — use for movement IDs too
- Validation pattern from Phase 1: disabled submit + red borders + blur trigger

### Integration Points
- `hooks/useInvestmentsTracker.ts`: Core refactor target — new Investment type with movements[], currentValue, lastUpdated, PF-specific fields
- `hooks/useMoneyTracker.ts`: Must update calculateTotalAvailable to account for movements affecting liquidity
- `components/investments-table.tsx`: Must support expandable rows, click-to-edit, inline forms, badges
- `components/investment-dialog.tsx`: Must add PF-specific fields (TNA, plazo) conditionally
- `hooks/useMoneyTracker.ts` type definitions: Investment interface needs complete redesign

</code_context>

<specifics>
## Specific Ideas

- Use NumberFlow (https://number-flow.barvian.me/) for animated number transitions when gain/loss values recalculate after value update
- Investment types match Phase 1 canonical list: Plazo Fijo, FCI, Crypto, Acciones
- Currency enforcement: Crypto=USD always, Plazo Fijo=ARS always, FCI=user choice (ARS/USD), Acciones=user choice (market currency)
- The expandable row pattern is new to this codebase — will establish a reusable pattern for future phases
- Simple interest formula for PF matches Argentine banking standard (not compound)

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 02-investment-model-refactor*
*Context gathered: 2026-04-01*
