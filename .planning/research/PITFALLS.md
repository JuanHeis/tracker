# Pitfalls Research: Predictive Financial Charts

**Domain:** Adding predictive charts to existing localStorage-based personal finance app
**Researched:** 2026-04-03

## Critical Pitfalls

### P1: Compound Interest on Irregular Movements (HIGH RISK)

**The Trap:** Trying to derive growth rates from `movements[]`. Movements mix user actions (aportes, retiros) with market returns. A user who deposited $100K and now has $120K didn't necessarily earn 20% — they might have deposited $110K and lost value, then market recovered.

**Prevention:**
- NEVER derive growth rates from movements. They're not returns.
- Use `currentValue` as the projection starting point
- For Plazo Fijo: use the explicit `rate` (TNA) field — deterministic, no guessing
- For FCI/Crypto/Acciones: use a configurable assumed annual rate (default: 10% FCI, 15% Crypto, 12% Acciones)
- Alternative: calculate actual return as `(currentValue - totalInvested) / totalInvested` and use that as the projection rate. But warn: "basado en rendimiento observado"

**Phase impact:** Must be resolved in projection engine design (Phase 1)

### P2: ARS/USD Currency Mixing in Projections (HIGH RISK)

**The Trap:** Combining ARS and USD projections into a single patrimonio number. This requires projecting the future USD/ARS exchange rate, which is inherently unreliable in Argentina (devaluations, crawling peg, etc.).

**Prevention:**
- Option A (Recommended): Show separate ARS and USD charts. Each in its own currency. Clear and honest.
- Option B: Combine using current globalUsdRate for all future points. Add prominent disclaimer: "Proyección a cotización actual (${rate} ARS/USD)"
- NEVER project exchange rate changes — that's speculation, not projection
- The patrimonio card already uses `globalUsdRate` for conversion — follow same pattern for consistency

**Phase impact:** Architectural decision needed before building any chart (Phase 1)

### P3: Recharts SSR with Next.js (MEDIUM RISK)

**The Trap:** Recharts uses browser APIs (DOM measurements). Next.js renders on server first. Charts will crash or render incorrectly without proper hydration handling.

**Prevention:**
- All chart components MUST be `"use client"`
- Use existing `useHydration()` hook pattern — already solved in the codebase
- Don't render chart content until `isHydrated` is true
- Existing charts (salary-by-month, expenses-by-month) already follow this pattern — copy it

**Phase impact:** Every chart component (all phases)

### P4: ResponsiveContainer Height Issues (MEDIUM RISK)

**The Trap:** Recharts `ResponsiveContainer` needs a parent with explicit height. Without it, chart collapses to 0px. Common issue in flex/grid layouts.

**Prevention:**
- Wrap in a container with explicit `aspect-video` or fixed height class
- Existing pattern in codebase: `ChartContainer` from shadcn wraps `ResponsiveContainer`
- Follow the same pattern used in `salary-by-month.tsx` and `expenses-by-month.tsx`
- Test on mobile viewports — responsive sizing can break on small screens

**Phase impact:** Every chart component (all phases)

### P5: Edge Cases — Empty/Minimal Data (MEDIUM RISK)

**The Trap:** Charts that crash or mislead when data is missing. 8 distinct scenarios:

1. **No investments** — investment chart is empty
2. **No salary history** — can't project income
3. **No recurring expenses** — expense deduction is zero (fine, but note it)
4. **globalUsdRate = 0** — division by zero in USD conversion
5. **All investments finalized** — nothing to project
6. **Only 1 month of data** — "historical" chart is a single point
7. **New user (just ran wizard)** — very sparse data
8. **Investments with 0 currentValue** — projection from zero is meaningless

**Prevention:**
- Show friendly empty state for each chart: "Agregá inversiones para ver proyecciones"
- Guard against globalUsdRate = 0 (already validated elsewhere, but double-check in projections)
- Minimum 2 data points for historical line (otherwise show "Necesitás al menos 2 meses de datos")
- Skip finalized investments in projection
- Skip investments with currentValue = 0

**Phase impact:** Every phase — build empty states alongside each chart, not as separate cleanup

### P6: Overpromising Projection Accuracy (UX RISK)

**The Trap:** Users might interpret projections as promises. "The app said I'd have $X by December!" Solid-looking projections create false confidence.

**Prevention:**
- Dashed/dotted lines for ALL projections (never solid)
- "Hoy" reference line clearly marking where real data ends
- Disclaimer text: "Proyección estimativa basada en datos actuales. No constituye predicción financiera."
- Scenarios labeled with rates: "Base (10% anual)" — user sees the assumption
- Consider muted colors (lower opacity) for projections vs vivid for historical

**Phase impact:** Chart UI phase — must be baked into design from start

### P7: localStorage Schema Safety (CRITICAL)

**The Trap:** Accidentally modifying MonthlyData, Investment, or other interfaces while adding chart features. User is actively using the app with real data.

**Prevention:**
- Charts are READ-ONLY. Zero changes to any existing interface or localStorage key.
- Projection functions take data as input, return new arrays. Never mutate input.
- Chart preferences (horizon, scenario selection) stored in component state, NOT localStorage
- If chart preferences need persistence later, use a SEPARATE localStorage key (e.g., `chartConfig`)
- Run JSON export/import test after each phase to verify no schema changes

**Phase impact:** ALL phases — enforce as invariant throughout milestone

## Integration Gotchas

| Gotcha | Why It Matters | Mitigation |
|--------|---------------|------------|
| date-fns month parsing | monthlyData uses "yyyy-MM" keys. Projection generates future dates. Timezone issues can shift months. | Use `startOfMonth()` and consistent UTC handling |
| Patrimonio reconstruction accuracy | Historical patrimonio isn't stored — must be derived. Rounding errors accumulate. | Accept ±1% tolerance. Show "estimado" label on historical points |
| Investment value at past dates | Only `currentValue` is stored, not historical values. Movements have dates but no value snapshots. | For historical chart: interpolate between movement dates. For PF: calculate from rate + startDate |
| Recharts tooltip naming collision | Existing chart.tsx exports `Tooltip` (shadcn) AND Recharts has `Tooltip`. | Use `ChartTooltip` (shadcn wrapper) consistently. Never import Recharts Tooltip directly. |

## Performance Traps

| Trap | Impact | Prevention |
|------|--------|------------|
| Recalculating projections on every render | Projection math is O(investments × months). Not expensive per se, but wasteful. | `useMemo` with proper dependency array on all projection calculations |
| Rendering hidden charts | Charts in non-visible tabs still render and measure | Lazy render: only mount chart when tab is active |
| Too many data points | 24 months × 3 scenarios × multiple investments = many lines | Cap at monthly granularity. Aggregate investments by type if > 10 |

---
*Research completed: 2026-04-03*
