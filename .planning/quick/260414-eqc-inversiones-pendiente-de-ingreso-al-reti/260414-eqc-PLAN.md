---
phase: quick-260414-eqc
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - hooks/useMoneyTracker.ts
  - hooks/useInvestmentsTracker.ts
  - components/investment-movements.tsx
  - components/investment-row.tsx
  - components/investments-table.tsx
autonomous: true
must_haves:
  truths:
    - "When creating a retiro, user can optionally mark it as pendiente de ingreso"
    - "Pending retiro movements show a yellow 'Pendiente' badge in the movements list"
    - "Investment row shows a yellow 'Pendiente' badge when it has any pending retiro"
    - "User can confirm receipt of a pending retiro, optionally adjusting the received amount"
    - "Confirmed retiros clear the pending flag and store the receivedAmount if different"
    - "Existing investments without the new fields load and work without errors"
  artifacts:
    - path: "hooks/useMoneyTracker.ts"
      provides: "InvestmentMovement with optional pendingIngreso and receivedAmount fields"
      contains: "pendingIngreso"
    - path: "hooks/useInvestmentsTracker.ts"
      provides: "handleConfirmRetiro handler"
      exports: ["handleConfirmRetiro"]
    - path: "components/investment-movements.tsx"
      provides: "Pending badge, confirm receipt inline UI"
    - path: "components/investment-row.tsx"
      provides: "Pending badge on row when hasPendingRetiros"
  key_links:
    - from: "components/investment-movements.tsx"
      to: "hooks/useInvestmentsTracker.ts"
      via: "onConfirmRetiro prop callback"
      pattern: "onConfirmRetiro"
    - from: "components/investment-row.tsx"
      to: "investment.movements"
      via: "filter for pendingIngreso === true"
      pattern: "pendingIngreso"
---

<objective>
Add "pendiente de ingreso" workflow for investment retiros. When a user withdraws money
from an investment, the funds take ~48hs to arrive. This plan lets the user mark a retiro
as pending, see visual indicators, and later confirm receipt with an optional amount
adjustment (actual amount may differ due to exchange rate fluctuation at settlement time).

Purpose: Reflect the real-world delay between requesting a withdrawal and receiving funds.
Output: Updated data model + handler + UI for pending retiro workflow.
</objective>

<execution_context>
@.claude/get-shit-done/workflows/execute-plan.md
@.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@hooks/useMoneyTracker.ts (InvestmentMovement and Investment interfaces, lines 63-86)
@hooks/useInvestmentsTracker.ts (all handlers: handleAddMovement, handleFinalizeInvestment, updateInvestment helper)
@components/investment-movements.tsx (movement list + add form)
@components/investment-row.tsx (row rendering, badge display, InvestmentMovementsProps)
@components/investments-table.tsx (InvestmentsTableProps, prop drilling)

<interfaces>
<!-- Key types and contracts the executor needs -->

From hooks/useMoneyTracker.ts:
```typescript
export interface InvestmentMovement {
  id: string;
  date: string;          // yyyy-MM-dd
  type: "aporte" | "retiro";
  amount: number;
  isInitial?: boolean;
}

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
}
```

From hooks/useInvestmentsTracker.ts:
```typescript
// Helper used by all handlers — updates a single investment by ID
const updateInvestment = (investmentId: string, updater: (inv: Investment) => Investment) => { ... };

// Returned from hook:
handleAddMovement, handleDeleteMovement, handleUpdateValue, handleFinalizeInvestment, handleUpdatePFFields
```

From components/investment-movements.tsx:
```typescript
interface InvestmentMovementsProps {
  investment: Investment;
  onAddMovement: (investmentId: string, movement: { date: string; type: "aporte" | "retiro"; amount: number }) => void;
  onDeleteMovement: (investmentId: string, movementId: string) => void;
}
```

From components/investments-table.tsx:
```typescript
interface InvestmentsTableProps {
  investments: Investment[];
  onEdit: (investment: Investment) => void;
  onDelete: (id: string) => void;
  onAddMovement: (investmentId: string, movement: { date: string; type: "aporte" | "retiro"; amount: number }) => void;
  onDeleteMovement: (investmentId: string, movementId: string) => void;
  onUpdateValue: (investmentId: string, newValue: number) => void;
  onUpdatePFFields: (investmentId: string, fields: { tna?: number; plazoDias?: number; startDate?: string }) => void;
  onFinalize: (investmentId: string) => void;
}
```

From components/investment-row.tsx:
```typescript
interface InvestmentRowProps {
  investment: Investment;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onAddMovement: (...) => void;
  onDeleteMovement: (...) => void;
  onUpdateValue: (...) => void;
  onUpdatePFFields: (...) => void;
  onFinalize: (investmentId: string) => void;
  onDelete: (investmentId: string) => void;
  onEdit: (investment: Investment) => void;
}
```

UI components available: Badge, Button, Input, CurrencyInput, AlertDialog, Select, Tooltip.
No Checkbox component exists -- use a Button with Check icon instead.
Lucide icons already in use: Check, Trash2, Plus, Pencil, ChevronDown, ChevronUp.
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Data model + handler for pending retiro workflow</name>
  <files>hooks/useMoneyTracker.ts, hooks/useInvestmentsTracker.ts</files>
  <action>
**1. Extend InvestmentMovement interface** in `hooks/useMoneyTracker.ts` (line ~63-69):

Add two optional fields after `isInitial`:
```typescript
export interface InvestmentMovement {
  id: string;
  date: string;
  type: "aporte" | "retiro";
  amount: number;
  isInitial?: boolean;
  pendingIngreso?: boolean;   // true = retiro requested but funds not yet received
  receivedAmount?: number;    // actual amount received (may differ from amount due to exchange rate)
}
```

Both fields are optional (`?`) so existing localStorage data loads without any migration.

**2. Update handleAddMovement** in `hooks/useInvestmentsTracker.ts` (line ~70-86):

Expand the movement parameter type to accept an optional `pendingIngreso` boolean:
```typescript
const handleAddMovement = (
  investmentId: string,
  movement: { date: string; type: "aporte" | "retiro"; amount: number; pendingIngreso?: boolean }
) => {
  const newMovement: InvestmentMovement = {
    id: crypto.randomUUID(),
    date: movement.date,
    type: movement.type,
    amount: movement.amount,
    ...(movement.pendingIngreso && { pendingIngreso: true }),
  };
  // rest stays the same
};
```

**3. Add handleConfirmRetiro** in `hooks/useInvestmentsTracker.ts`:

Add a new handler right after handleDeleteMovement (line ~94):
```typescript
const handleConfirmRetiro = (
  investmentId: string,
  movementId: string,
  receivedAmount?: number
) => {
  updateInvestment(investmentId, (inv) => ({
    ...inv,
    movements: inv.movements.map((m) =>
      m.id === movementId
        ? {
            ...m,
            pendingIngreso: undefined, // clear pending flag (remove the key)
            ...(receivedAmount !== undefined && receivedAmount !== m.amount
              ? { receivedAmount }
              : {}),
          }
        : m
    ),
    lastUpdated: format(new Date(), "yyyy-MM-dd"),
  }));
};
```

When clearing pendingIngreso, set it to `undefined` so it gets removed from the serialized object (cleaner localStorage). Only set receivedAmount if it differs from the original amount.

**4. Export handleConfirmRetiro** from the hook's return object (line ~185-203):

Add `handleConfirmRetiro` to the returned object.
  </action>
  <verify>
    <automated>npx tsc --noEmit 2>&1 | head -30</automated>
  </verify>
  <done>
    - InvestmentMovement has pendingIngreso? and receivedAmount? optional fields
    - handleAddMovement accepts optional pendingIngreso in its movement param
    - handleConfirmRetiro exists and clears pendingIngreso, optionally sets receivedAmount
    - TypeScript compiles without errors
  </done>
</task>

<task type="auto">
  <name>Task 2: UI for pending retiro -- movements list, confirm dialog, row badge</name>
  <files>components/investment-movements.tsx, components/investment-row.tsx, components/investments-table.tsx, components/expense-tracker.tsx</files>
  <action>
**1. Update InvestmentMovementsProps** in `components/investment-movements.tsx`:

Add the new callback prop:
```typescript
interface InvestmentMovementsProps {
  investment: Investment;
  onAddMovement: (
    investmentId: string,
    movement: { date: string; type: "aporte" | "retiro"; amount: number; pendingIngreso?: boolean }
  ) => void;
  onDeleteMovement: (investmentId: string, movementId: string) => void;
  onConfirmRetiro: (investmentId: string, movementId: string, receivedAmount?: number) => void;
}
```

**2. Add "Pendiente" checkbox to add-movement form** in `investment-movements.tsx`:

Add state: `const [markPending, setMarkPending] = useState(false);`

When `movementType === "retiro"`, show a checkbox-like toggle below or beside the type selector:
```tsx
{movementType === "retiro" && (
  <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer select-none">
    <input
      type="checkbox"
      checked={markPending}
      onChange={(e) => setMarkPending(e.target.checked)}
      className="rounded border-gray-300 h-3.5 w-3.5 accent-amber-500"
    />
    Pendiente de ingreso
  </label>
)}
```

In handleSubmit, pass pendingIngreso when checked:
```typescript
onAddMovement(investment.id, {
  date,
  type: movementType,
  amount,
  ...(movementType === "retiro" && markPending ? { pendingIngreso: true } : {}),
});
```

Reset `setMarkPending(false)` after submit alongside `setMovementType("aporte")`.

**3. Show pending badge + confirm action on retiro movements** in `investment-movements.tsx`:

Add state for confirm dialog:
```typescript
const [confirmingMovement, setConfirmingMovement] = useState<string | null>(null);
const [adjustedAmount, setAdjustedAmount] = useState<string>("");
```

In the movement list rendering, after the existing type Badge, add a pending indicator for retiro movements with `pendingIngreso === true`:
```tsx
{movement.pendingIngreso && (
  <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200 text-[10px] px-1.5 py-0">
    Pendiente
  </Badge>
)}
```

If the movement has `receivedAmount` and it differs from `amount`, show both amounts:
```tsx
<span className="tabular-nums font-medium">
  {currencySymbol(investment.currencyType)}{movement.amount.toLocaleString()}
  {movement.receivedAmount !== undefined && movement.receivedAmount !== movement.amount && (
    <span className="text-xs text-muted-foreground ml-1">
      (recibido: {currencySymbol(investment.currencyType)}{movement.receivedAmount.toLocaleString()})
    </span>
  )}
</span>
```

For pending retiros, add a confirm button (small, green check icon) next to the delete button:
```tsx
{movement.type === "retiro" && movement.pendingIngreso && (
  <Button
    variant="ghost"
    size="icon"
    className="h-6 w-6 text-green-600 hover:bg-green-100 dark:hover:bg-green-900"
    onClick={() => {
      setConfirmingMovement(movement.id);
      setAdjustedAmount(String(movement.amount));
    }}
    title="Confirmar ingreso"
  >
    <Check className="h-3 w-3" />
  </Button>
)}
```

Import `Check` from lucide-react.

**4. Add confirm receipt AlertDialog** in `investment-movements.tsx`:

After the existing delete AlertDialog, add a second one for confirming receipt:
```tsx
<AlertDialog open={!!confirmingMovement} onOpenChange={(open) => !open && setConfirmingMovement(null)}>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Confirmar ingreso del retiro</AlertDialogTitle>
      <AlertDialogDescription>
        El monto original del retiro es {currencySymbol(investment.currencyType)}
        {(() => {
          const mov = investment.movements.find(m => m.id === confirmingMovement);
          return mov ? mov.amount.toLocaleString() : "0";
        })()}.
        Si recibiste un monto diferente, ajustalo abajo.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <div className="py-2">
      <label className="text-sm text-muted-foreground">Monto recibido</label>
      <CurrencyInput
        value={adjustedAmount}
        onChange={(e) => setAdjustedAmount(e.target.value)}
        className="h-8 w-full mt-1"
      />
    </div>
    <AlertDialogFooter>
      <AlertDialogCancel>Cancelar</AlertDialogCancel>
      <AlertDialogAction
        onClick={() => {
          if (confirmingMovement) {
            const received = Number(adjustedAmount);
            onConfirmRetiro(
              investment.id,
              confirmingMovement,
              received > 0 ? received : undefined
            );
            setConfirmingMovement(null);
            setAdjustedAmount("");
          }
        }}
        className="bg-green-600 hover:bg-green-700 text-white"
      >
        Confirmar ingreso
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

**5. Show pending badge on InvestmentRow** in `components/investment-row.tsx`:

Compute whether the investment has pending retiros:
```typescript
const hasPendingRetiros = investment.movements.some(
  (m) => m.type === "retiro" && m.pendingIngreso
);
```

In the name cell (line ~100-111), after the existing "Finalizada" and "Vencido" badges, add:
```tsx
{hasPendingRetiros && !isFinalized && (
  <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200 text-[10px] px-1.5 py-0">
    Pendiente
  </Badge>
)}
```

**6. Thread onConfirmRetiro prop** through the component chain:

In `components/investment-row.tsx`:
- Add `onConfirmRetiro: (investmentId: string, movementId: string, receivedAmount?: number) => void;` to InvestmentRowProps
- Pass it to `<InvestmentMovements>`:
  ```tsx
  <InvestmentMovements
    investment={investment}
    onAddMovement={onAddMovement}
    onDeleteMovement={onDeleteMovement}
    onConfirmRetiro={onConfirmRetiro}
  />
  ```

In `components/investments-table.tsx`:
- Add `onConfirmRetiro: (investmentId: string, movementId: string, receivedAmount?: number) => void;` to InvestmentsTableProps
- Pass it to each `<InvestmentRow>`:
  ```tsx
  <InvestmentRow ... onConfirmRetiro={onConfirmRetiro} />
  ```

In `components/expense-tracker.tsx`:
- Destructure `handleConfirmRetiro` from `useInvestmentsTracker` return value (already returned from Task 1)
- Pass it to `<InvestmentsTable>`:
  ```tsx
  <InvestmentsTable ... onConfirmRetiro={handleConfirmRetiro} />
  ```
  </action>
  <verify>
    <automated>npx tsc --noEmit 2>&1 | head -30</automated>
  </verify>
  <done>
    - Add-movement form shows "Pendiente de ingreso" checkbox when type is "retiro"
    - Pending retiro movements display a yellow "Pendiente" badge
    - Pending retiro movements have a green check button to confirm receipt
    - Confirm dialog allows adjusting the received amount
    - Confirmed retiros clear the pending badge; if amount adjusted, "(recibido: $X)" shows
    - Investment row shows "Pendiente" badge when any movement is pending
    - All props threaded correctly from expense-tracker -> investments-table -> investment-row -> investment-movements
    - TypeScript compiles without errors
    - Existing investments without new fields render normally
  </done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

No new trust boundaries. All data is client-side localStorage, same as existing investment handling.

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-quick-01 | T (Tampering) | InvestmentMovement fields | accept | Client-only app, no server. User owns their own data. |
| T-quick-02 | I (Info Disclosure) | receivedAmount in localStorage | accept | No PII, no server, user's own financial tracking data on their device. |
</threat_model>

<verification>
1. Create a new investment, add a retiro movement with "Pendiente de ingreso" checked
2. Verify "Pendiente" badge appears on the movement AND on the investment row
3. Click the green check button on the pending movement
4. In the confirm dialog, adjust the amount to a different value, confirm
5. Verify the "Pendiente" badge disappears and "(recibido: $X)" appears on the movement
6. Refresh the page -- verify all data persists correctly from localStorage
7. Verify existing investments without the new fields still load and display correctly
</verification>

<success_criteria>
- Retiro movements can be marked as pending during creation
- Pending retiros show amber "Pendiente" badge on movement and row
- User can confirm receipt with optional amount adjustment
- Received amount displays inline when different from original
- No breaking changes to existing investment data (backward compatible)
- TypeScript compiles cleanly
</success_criteria>

<output>
After completion, create `.planning/quick/260414-eqc-inversiones-pendiente-de-ingreso-al-reti/260414-eqc-SUMMARY.md`
</output>
