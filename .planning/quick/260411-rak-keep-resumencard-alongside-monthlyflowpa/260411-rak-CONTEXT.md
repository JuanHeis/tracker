# Quick Task 260411-rak: Keep ResumenCard alongside MonthlyFlowPanel - Context

**Gathered:** 2026-04-11
**Status:** Ready for planning

<domain>
## Task Boundary

Revert the ResumenCard removal from Phase 21 and place MonthlyFlowPanel below it in the sidebar instead of replacing it. Also restore SavingsRateSelector to sidebar if needed (it was moved into the panel).

</domain>

<decisions>
## Implementation Decisions

### Placement
- **D-01:** ResumenCard is restored to its original position in the sidebar of expense-tracker.tsx.
- **D-02:** MonthlyFlowPanel renders BELOW ResumenCard in the same sidebar/content area. Both are visible in the same view without scrolling (if space allows) or with natural scrolling.
- **D-03:** SavingsRateSelector stays inside MonthlyFlowPanel (it was moved there in Phase 21 and that's fine — it provides context for the waterfall/projection).

### Relationship
- **D-04:** ResumenCard and MonthlyFlowPanel are complementary: ResumenCard = quick summary of numbers (ingresos, egresos, disponible). MonthlyFlowPanel = detailed visual flow breakdown + projection + simulation.
- **D-05:** No changes to either component's internal logic — only the wiring in expense-tracker.tsx changes (restore ResumenCard import/JSX, keep MonthlyFlowPanel below it).

### Claude's Discretion
- Whether to add any visual separator between ResumenCard and MonthlyFlowPanel
- Spacing between the two components

</decisions>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches.

</specifics>

<canonical_refs>
## Canonical References

- `components/expense-tracker.tsx` — Main orchestrator where ResumenCard was removed and MonthlyFlowPanel was added
- `components/resumen-card.tsx` — The card to restore (still exists in codebase, just not imported)
- `components/monthly-flow-panel.tsx` — The new panel (already wired)

</canonical_refs>
