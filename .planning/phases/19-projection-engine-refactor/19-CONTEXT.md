# Phase 19: Projection Engine Refactor - Context

**Gathered:** 2026-04-09
**Status:** Ready for planning

<domain>
## Phase Boundary

Wire computeSavingsEstimate() into useProjectionEngine and SimulatorDialog, replacing estimateMonthlyNetSavings(). All projection consumers (Charts tab and Simulator) use the configured savings rate instead of the old hardcoded estimate.

</domain>

<decisions>
## Implementation Decisions

### Hook Interface Change
- **D-01:** `useProjectionEngine` receives a `monthlyNetSavings: number` parameter instead of computing it internally via `estimateMonthlyNetSavings()`. The caller (expense-tracker.tsx) passes `savingsRate.estimate`.
- **D-02:** Remove the `recurringExpenses` parameter from `useProjectionEngine` since it was only used to compute `estimateMonthlyNetSavings()` — no longer needed.
- **D-03:** Remove the `estimateMonthlyNetSavings` import from `useProjectionEngine.ts`.

### Simulator Wiring
- **D-04:** `SimulatorDialog` prop `monthlyNetFlow` receives `savingsRate.estimate` instead of `historicalNetFlow`. Both Charts and Simulator share the same savings scalar from the single call site in expense-tracker.tsx (per ROADMAP decision).

### Dead Code Cleanup
- **D-05:** Delete `estimateMonthlyNetSavings()` from `lib/projection/income-projection.ts` after replacement. No backward compatibility needed — it has no other consumers.

### Claude's Discretion
- Whether to inline the parameter rename or keep the prop name `monthlyNetFlow` in SimulatorDialog
- Test file updates for any projection tests referencing the old function

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Projection Engine (modify)
- `hooks/useProjectionEngine.ts` — Lines 27-29 (imports), 118-130 (params), 164-168 (estimateMonthlyNetSavings call)
- `lib/projection/income-projection.ts` — Lines 19-34 (estimateMonthlyNetSavings to delete)
- `lib/projection/scenario-engine.ts` — Receives monthlyNetSavings, no changes needed

### Savings Rate (Phase 18, read-only)
- `lib/projection/savings-rate.ts` — computeSavingsEstimate() pure function
- `hooks/useSavingsRate.ts` — Hook returning { config, setConfig, estimate }

### Consumers (modify wiring)
- `components/expense-tracker.tsx` — Line 267 (savingsRate already available), line 1022 (SimulatorDialog monthlyNetFlow prop)
- `components/simulator-dialog.tsx` — Line 39 (monthlyNetFlow prop), line 82-84 (projection computation)
- `components/charts-container.tsx` — If it calls useProjectionEngine, needs updated params

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `useSavingsRate` hook already wired in expense-tracker.tsx:267 with `savingsRate.estimate` available
- `computeSavingsEstimate()` pure function in lib/projection/savings-rate.ts (Phase 18 output)
- `projectPatrimonyScenarios()` already accepts `monthlyNetSavings` as parameter — no change needed

### Established Patterns
- useProjectionEngine is a pure computation hook (useMemo, no useState) — parameter-driven
- SimulatorDialog receives all data as props from expense-tracker.tsx
- Single call site pattern: expense-tracker.tsx is the orchestrator that feeds data to all consumers

### Integration Points
- expense-tracker.tsx passes `savingsRate.estimate` to both useProjectionEngine (via ChartsContainer) and SimulatorDialog
- ChartsContainer likely proxies useProjectionEngine — check if it passes recurringExpenses

</code_context>

<specifics>
## Specific Ideas

No specific requirements — this is a mechanical refactor with clear before/after states dictated by the ROADMAP.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 19-projection-engine-refactor*
*Context gathered: 2026-04-09*
