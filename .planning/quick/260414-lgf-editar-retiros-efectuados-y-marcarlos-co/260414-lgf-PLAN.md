---
phase: quick-260414-lgf
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - hooks/useInvestmentsTracker.ts
  - components/investment-movements.tsx
  - components/investment-row.tsx
  - components/investments-table.tsx
  - components/expense-tracker.tsx
autonomous: true
requirements: [EDIT-RETIRO]

must_haves:
  truths:
    - "User can click an edit button on any non-isInitial retiro movement"
    - "User can change the retiro amount in a dialog and save it"
    - "User can toggle pendingIngreso on/off for a retiro and save it"
    - "User can change the receivedAmount for a confirmed retiro and save it"
    - "Editing a retiro amount correctly adjusts the investment currentValue"
    - "Toggling pendingIngreso on/off correctly adjusts the investment currentValue"
  artifacts:
    - path: "hooks/useInvestmentsTracker.ts"
      provides: "handleEditMovement handler"
      contains: "handleEditMovement"
    - path: "components/investment-movements.tsx"
      provides: "Edit button and edit dialog for retiro movements"
      contains: "editingMovement"
  key_links:
    - from: "components/investment-movements.tsx"
      to: "hooks/useInvestmentsTracker.ts"
      via: "onEditMovement prop -> handleEditMovement"
      pattern: "onEditMovement"
    - from: "components/expense-tracker.tsx"
      to: "hooks/useInvestmentsTracker.ts"
      via: "handleEditMovement passed through InvestmentsTable -> InvestmentRow -> InvestmentMovements"
      pattern: "handleEditMovement"
---

<objective>
Add edit functionality for retiro (withdrawal) movements on investments. Users can edit the amount, toggle the pendingIngreso flag, and edit the receivedAmount of existing retiros.

Purpose: Currently retiros can only be created or deleted. Users need to correct mistakes or update status without deleting and recreating.
Output: Edit button on retiro movements, edit dialog, handleEditMovement handler with correct currentValue adjustments.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@hooks/useInvestmentsTracker.ts
@components/investment-movements.tsx
@components/investment-row.tsx
@components/investments-table.tsx
@components/expense-tracker.tsx

<interfaces>
<!-- Key types the executor needs -->

From hooks/useMoneyTracker.ts:
```typescript
interface InvestmentMovement {
  id: string;
  date: string;
  type: "aporte" | "retiro";
  amount: number;
  isInitial?: boolean;
  pendingIngreso?: boolean;   // true = retiro requested but funds not yet received
  receivedAmount?: number;    // actual amount received (when different from requested)
}
```

From hooks/useInvestmentsTracker.ts:
```typescript
// Helper already exists — use it for the new handler:
const updateInvestment = (investmentId: string, updater: (inv: Investment) => Investment) => { ... };
```

currentValue adjustment rules (from existing handlers):
- When a retiro is PENDING (pendingIngreso=true): currentValue is NOT reduced (money still in investment)
- When a retiro is CONFIRMED (pendingIngreso=false/undefined): currentValue IS reduced by movement.amount
- Plazo Fijo investments: currentValue is never adjusted by movements
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Add handleEditMovement handler and wire through props</name>
  <files>
    hooks/useInvestmentsTracker.ts
    components/investments-table.tsx
    components/investment-row.tsx
    components/expense-tracker.tsx
  </files>
  <action>
1. In `hooks/useInvestmentsTracker.ts`, add a `handleEditMovement` function that accepts:
   ```typescript
   handleEditMovement(
     investmentId: string,
     movementId: string,
     updates: { amount?: number; pendingIngreso?: boolean; receivedAmount?: number }
   )
   ```

   Implementation logic using `updateInvestment`:
   - Find the existing movement by movementId within the investment
   - If not found or movement is not type "retiro", return early
   - Calculate currentValue adjustment based on what changed (skip for Plazo Fijo):
     a. **Amount changed**: If the old movement was confirmed (not pending), adjust currentValue by the difference: `oldAmount - newAmount` (add back old reduction, apply new reduction). If pending, no value adjustment needed since pending retiros don't reduce currentValue.
     b. **pendingIngreso toggled OFF (was pending, now confirmed)**: Reduce currentValue by the movement amount (same logic as handleConfirmRetiro). 
     c. **pendingIngreso toggled ON (was confirmed, now pending)**: Add back the movement amount to currentValue (reverse the reduction).
     d. **Both amount and pendingIngreso changed**: Apply both adjustments. If toggling to confirmed, use the NEW amount for the reduction. If toggling to pending, add back the OLD amount.
   - Update the movement in the movements array with spread of updates
   - For receivedAmount: if provided, set it on the movement. If the movement is being toggled to pending, clear receivedAmount (set to undefined).
   - Set lastUpdated to today

   Add `handleEditMovement` to the return object.

2. In `components/investments-table.tsx`:
   - Add `onEditMovement` to `InvestmentsTableProps` interface with signature: `(investmentId: string, movementId: string, updates: { amount?: number; pendingIngreso?: boolean; receivedAmount?: number }) => void`
   - Pass `onEditMovement` to each `InvestmentRow` in the active investments map

3. In `components/investment-row.tsx`:
   - Add `onEditMovement` to `InvestmentRowProps` interface with same signature
   - Pass `onEditMovement` to `InvestmentMovements` component

4. In `components/expense-tracker.tsx`:
   - Destructure `handleEditMovement` from useInvestmentsTracker return
   - Pass it as `onEditMovement={handleEditMovement}` to `InvestmentsTable`
  </action>
  <verify>
    TypeScript compilation: npx tsc --noEmit --pretty 2>&1 | head -30
  </verify>
  <done>
    - handleEditMovement exists in useInvestmentsTracker.ts with correct currentValue adjustment logic
    - Prop chain complete: expense-tracker -> investments-table -> investment-row -> investment-movements
    - No TypeScript errors
  </done>
</task>

<task type="auto">
  <name>Task 2: Add edit button and edit dialog to investment-movements.tsx</name>
  <files>components/investment-movements.tsx</files>
  <action>
1. Add new imports: `Pencil` from lucide-react, `Dialog/DialogContent/DialogHeader/DialogTitle/DialogFooter` from `@/components/ui/dialog`, `Checkbox` or use native checkbox (matching existing markPending pattern).

2. Add `onEditMovement` to `InvestmentMovementsProps` interface:
   ```typescript
   onEditMovement: (investmentId: string, movementId: string, updates: { amount?: number; pendingIngreso?: boolean; receivedAmount?: number }) => void;
   ```

3. Add state for the edit dialog:
   ```typescript
   const [editingMovement, setEditingMovement] = useState<string | null>(null);
   const [editAmount, setEditAmount] = useState<number>(0);
   const [editPending, setEditPending] = useState<boolean>(false);
   const [editReceivedAmount, setEditReceivedAmount] = useState<number>(0);
   ```

4. Add an edit button (Pencil icon) next to the delete button for each movement that is:
   - type === "retiro" AND NOT isInitial
   - Place BEFORE the existing confirm button (if pending) and delete button
   - Style: same ghost/icon pattern as delete button but with blue color (matching existing edit patterns in investment-row.tsx: `text-blue-500 hover:bg-blue-100 dark:hover:bg-blue-900`)
   - Size: `h-6 w-6` (matching existing buttons in the movement row)
   - onClick: populate edit state from the movement and open dialog:
     ```typescript
     setEditingMovement(movement.id);
     setEditAmount(movement.amount);
     setEditPending(!!movement.pendingIngreso);
     setEditReceivedAmount(movement.receivedAmount ?? movement.amount);
     ```

5. Add an edit Dialog (NOT AlertDialog, since this is a form, not a confirmation) at the bottom of the component alongside the existing AlertDialogs:
   ```
   Dialog open={!!editingMovement} onOpenChange={...}
     DialogContent
       DialogHeader
         DialogTitle: "Editar retiro"
       Body (div className="space-y-4 py-2"):
         - Monto field: label "Monto del retiro" + CurrencyInput with editAmount/setEditAmount
         - Pendiente toggle: label with native checkbox (matching the existing markPending checkbox style in the add form) + "Pendiente de ingreso" text
         - Monto recibido field (only show when editPending is false AND the movement originally had receivedAmount OR user wants to set one): label "Monto recibido" + CurrencyInput with editReceivedAmount/setEditReceivedAmount. Show this field whenever editPending is false.
       DialogFooter:
         - Cancel button (variant="outline"): onClick closes dialog
         - Save button (variant="default"): onClick calls onEditMovement with the changed fields, then closes dialog
   ```

   The save handler should:
   - Find the original movement from investment.movements
   - Build the updates object comparing old vs new values:
     - amount: only include if changed from original
     - pendingIngreso: only include if changed from original
     - receivedAmount: include if editPending is false and value differs from original (or if transitioning from pending to confirmed). If editPending is true, set receivedAmount to undefined to clear it.
   - Call onEditMovement(investment.id, editingMovement, updates)
   - Reset state and close dialog

6. Accept `onEditMovement` in the destructured props of the component function.
  </action>
  <verify>
    npx tsc --noEmit --pretty 2>&1 | head -30
    Then manually verify in browser: expand an investment with retiro movements, see edit (pencil) button, click it, see dialog with fields.
  </verify>
  <done>
    - Edit (pencil) button appears on all non-isInitial retiro movements
    - Edit button does NOT appear on aporte movements or isInitial retiros
    - Clicking edit opens a dialog pre-filled with movement's current values
    - User can change amount, toggle pendingIngreso, change receivedAmount
    - Saving calls onEditMovement with correct diff of changed fields
    - Dialog closes after save
    - No TypeScript errors, app compiles and renders correctly
  </done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

No new trust boundaries -- all data is local (localStorage). No API calls.

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-q-01 | Tampering | handleEditMovement | accept | Local-only data, user owns all data, no integrity risk |
| T-q-02 | Denial of Service | editAmount input | mitigate | CurrencyInput already validates numeric input; amount <= 0 should be rejected in handler (check before applying) |
</threat_model>

<verification>
1. `npx tsc --noEmit` passes with no errors
2. In browser: navigate to Inversiones tab, expand an investment with retiro movements
3. Verify edit button (pencil icon) appears ONLY on retiro movements that are not isInitial
4. Click edit on a confirmed retiro: dialog shows amount and receivedAmount fields, pendiente checkbox unchecked
5. Click edit on a pending retiro: dialog shows amount field, pendiente checkbox checked, receivedAmount hidden
6. Change amount on a confirmed retiro, save: investment currentValue adjusts correctly
7. Toggle pending ON for a confirmed retiro, save: currentValue increases by movement amount (retiro no longer reduces value)
8. Toggle pending OFF for a pending retiro, save: currentValue decreases by movement amount
</verification>

<success_criteria>
- Edit button visible on retiro movements (non-isInitial only)
- Edit dialog allows changing amount, pendingIngreso toggle, receivedAmount
- currentValue correctly recalculated after each edit scenario
- No regression on existing add/delete/confirm movement functionality
- TypeScript compiles without errors
</success_criteria>

<output>
After completion, create `.planning/quick/260414-lgf-editar-retiros-efectuados-y-marcarlos-co/260414-lgf-SUMMARY.md`
</output>
