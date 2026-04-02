---
phase: quick
plan: 1
type: execute
wave: 1
depends_on: []
files_modified:
  - components/expense-tracker.tsx
autonomous: true
requirements: [UI-REORG-01]

must_haves:
  truths:
    - "Each tab section has its own CTA button in the CardHeader, not in a floating sidebar stack"
    - "No action buttons remain in the bottom of the right sidebar column"
    - "Comprar/Registrar USD button is accessible from the Inversiones or Ingresos tab header area"
    - "All existing dialog functionality (add/edit expense, income, investment, USD purchase) works unchanged"
  artifacts:
    - path: "components/expense-tracker.tsx"
      provides: "Reorganized layout with per-section CTA buttons"
  key_links:
    - from: "Gastos tab CardHeader"
      to: "expense Dialog open state"
      via: "Button onClick -> setOpen(true) + handleOpenModal"
    - from: "Ingresos tab CardHeader"
      to: "income Dialog open state"
      via: "Button onClick -> setOpenExtraIncome(true) + handleOpenIncomeModal"
    - from: "Inversiones tab CardHeader"
      to: "investment Dialog open state"
      via: "Button onClick -> handleOpenInvestmentModal"
---

<objective>
Move action buttons (+ Gasto, + Otros ingresos, + Inversion, Comprar/Registrar USD) from the bottom-of-sidebar stack into their respective tab section headers as CTA buttons. Remove the leftover sidebar button stack. This follows the pattern already established by the Movimientos tab (line 541) and the Prestamos tab (line 581).

Purpose: The UI became disorganized as features accumulated. Action buttons belong with their data, not in a disconnected floating stack.
Output: Clean layout where each tab's CardHeader contains its relevant action button(s).
</objective>

<execution_context>
@C:/Users/Juan/.claude/get-shit-done/workflows/execute-plan.md
@C:/Users/Juan/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@components/expense-tracker.tsx
</context>

<tasks>

<task type="auto">
  <name>Task 1: Move CTA buttons into tab CardHeaders and clean up sidebar</name>
  <files>components/expense-tracker.tsx</files>
  <action>
Relocate action buttons from the sidebar stack (lines ~656-919) into their respective tab section CardHeaders. Follow the existing pattern from Movimientos tab (line 538-543) and Prestamos tab (lines 579-583) which already have their CTAs in the header.

Specific changes:

1. **Gastos tab (TabsContent value="table")**: In the CardHeader (line 473), add a Button that triggers the expense dialog. The button should call `handleOpenModal` and open the dialog. Move the entire expense Dialog component (lines 664-799) so it renders inside or near the Gastos tab section. The CardHeader should use `flex flex-row items-center justify-between space-y-0 pb-2` pattern. Button label: "+ Gasto" with Plus icon.

2. **Ingresos tab (TabsContent value="incomes")**: In the CardHeader (line 489), add a Button that triggers the income dialog. Move the income Dialog (lines 801-914) to render near the Ingresos section. Button label: "+ Ingreso" with Plus icon.

3. **Inversiones tab (TabsContent value="investments")**: In the CardHeader (line 504), add two buttons:
   - "+ Inversion" button calling `handleOpenInvestmentModal` (primary)
   - "Comprar/Registrar USD" button calling `() => setUsdPurchaseOpen(true)` (variant="outline", with DollarSign icon)

4. **Remove the sidebar button stack**: Delete the entire `<div className="flex flex-col gap-2">` block (lines ~656-919) from the sidebar. The sidebar should only contain: ResumenCard, PatrimonioCard, ConfigCard, ExchangeSummary.

5. **Keep all Dialog components functional**: The Dialog components for expense and income can be moved to render as standalone components (like InvestmentDialog, UsdPurchaseDialog already are at lines 923-953). Extract the expense and income Dialog markup out of the sidebar into standalone renders at the bottom of the component (alongside the other dialogs). This keeps the JSX clean.

Important: Do NOT change any dialog form logic, validation, submit handlers, or state management. Only move JSX and add trigger buttons to headers.

The CardHeader pattern to follow (from Movimientos):
```tsx
<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
  <CardTitle>Title</CardTitle>
  <Button size="sm" onClick={handler}>
    <Icon className="h-4 w-4 mr-1" />
    Label
  </Button>
</CardHeader>
```
  </action>
  <verify>
    <automated>cd D:/Documents/Programing/nextjs/expense-tracker && npx next build 2>&1 | tail -5</automated>
  </verify>
  <done>
    - Gastos tab has "+ Gasto" CTA in its CardHeader
    - Ingresos tab has "+ Ingreso" CTA in its CardHeader
    - Inversiones tab has "+ Inversion" and "Comprar/Registrar USD" CTAs in its CardHeader
    - No action buttons remain in the right sidebar below ExchangeSummary
    - All dialogs open and function correctly when triggered from new button locations
    - Build passes with no errors
  </done>
</task>

</tasks>

<verification>
- `npx next build` completes without errors
- Visual inspection: each tab header shows its CTA button
- Visual inspection: sidebar only shows cards (Resumen, Patrimonio, Config, Exchange)
- Click each CTA to verify dialog opens correctly
</verification>

<success_criteria>
Action buttons are contextually placed within their respective tab sections. The sidebar is clean with only informational cards. All dialog functionality preserved.
</success_criteria>

<output>
After completion, create `.planning/quick/1-reorganize-ui-layout-move-action-buttons/1-SUMMARY.md`
</output>
