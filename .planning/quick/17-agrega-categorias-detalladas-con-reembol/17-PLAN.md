---
phase: quick-17
plan: 1
type: execute
wave: 1
depends_on: []
files_modified:
  - hooks/useMoneyTracker.ts
  - constants/colors.ts
  - hooks/useBudgetTracker.ts
autonomous: false
requirements: [QUICK-17]

must_haves:
  truths:
    - "New categories appear in expense creation category selector"
    - "New categories appear in recurring expense category selector"
    - "New categories appear in budget category selector"
    - "Reembolso is available as a category"
    - "Existing expenses with old categories still display correctly"
  artifacts:
    - path: "hooks/useMoneyTracker.ts"
      provides: "Expanded Category union type"
      contains: "Reembolso"
    - path: "constants/colors.ts"
      provides: "Color mapping for all categories"
      contains: "Reembolso"
    - path: "hooks/useBudgetTracker.ts"
      provides: "ALL_CATEGORIES array with new entries"
      contains: "Reembolso"
  key_links:
    - from: "constants/colors.ts"
      to: "hooks/useMoneyTracker.ts"
      via: "import { Category }"
      pattern: "Record<Category"
    - from: "hooks/useBudgetTracker.ts"
      to: "hooks/useMoneyTracker.ts"
      via: "import { type Category }"
      pattern: "ALL_CATEGORIES: Category\\[\\]"
---

<objective>
Add more granular expense categories including "Reembolso" (reimbursement) to the expense tracker, ensuring all dependent systems (UI selectors, budget, recurring expenses, charts) automatically pick up the new categories.

Purpose: The current 16 categories are too broad. The user needs finer granularity and specifically needs "Reembolso" to track reimbursable expenses.
Output: Expanded category system with ~25 categories, backward-compatible with existing localStorage data.
</objective>

<execution_context>
@C:/Users/Juan/.claude/get-shit-done/workflows/execute-plan.md
@C:/Users/Juan/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md

Architecture: Categories are defined in 3 places that must stay in sync:
1. `hooks/useMoneyTracker.ts` — `Category` union type (source of truth for TypeScript)
2. `constants/colors.ts` — `CATEGORIES` record mapping Category to color (source of truth for UI)
3. `hooks/useBudgetTracker.ts` — `ALL_CATEGORIES` array (used for budget category picker)

All UI consumers (expense-tracker.tsx, recurring-dialog.tsx, budget-dialog.tsx, expenses-table.tsx, budget-row.tsx) use `Object.keys(CATEGORIES)` or accept `Category` type — they auto-propagate from the 3 source files.

IMPORTANT: Existing localStorage data has expenses with the current 16 categories. All old category names MUST remain unchanged. Only ADD new categories.

<interfaces>
From hooks/useMoneyTracker.ts:
```typescript
export type Category =
  | "Alquiler"
  | "Supermercado"
  | "Entretenimiento"
  | "Salidas"
  | "Vacaciones"
  | "Servicios"
  | "Vestimenta"
  | "Subscripciones"
  | "Insumos"
  | "Estudio"
  | "Otros"
  | "Gym"
  | "Seguros"
  | "Impuestos"
  | "Transporte"
  | "Salud";
```

From constants/colors.ts:
```typescript
export const CATEGORIES: Record<Category, { color: string }> = {
  Alquiler: { color: "rgb(239 68 68)" },
  // ... 16 entries total
};
```

From hooks/useBudgetTracker.ts:
```typescript
const ALL_CATEGORIES: Category[] = [
  "Alquiler", "Supermercado", "Entretenimiento", "Salidas",
  "Vacaciones", "Servicios", "Vestimenta", "Subscripciones",
  "Insumos", "Estudio", "Otros", "Gym",
  "Seguros", "Impuestos", "Transporte", "Salud",
];
```
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Expand Category type, colors, and ALL_CATEGORIES with new granular categories</name>
  <files>hooks/useMoneyTracker.ts, constants/colors.ts, hooks/useBudgetTracker.ts</files>
  <action>
Add the following new categories to all 3 files, keeping ALL existing 16 categories unchanged:

New categories to add (alphabetical insertion among existing):
- "Comida" — eating out / delivery (distinct from Supermercado which is groceries)
- "Electronica" — gadgets, tech purchases
- "Hogar" — home maintenance, furniture, household items
- "Mascotas" — pet expenses
- "Reembolso" — reimbursements (the specifically requested category)
- "Regalos" — gifts
- "Telefonia" — phone/internet bills (distinct from Servicios for utilities)
- "Viajes" — travel expenses beyond vacations (work trips, day trips)

1. In `hooks/useMoneyTracker.ts`: Add 8 new string literals to the `Category` union type. Keep alphabetical order within the union for readability.

2. In `constants/colors.ts`: Add 8 new entries to the `CATEGORIES` record with distinct, visually differentiable colors that do not clash with existing ones:
   - Comida: "rgb(251 146 60)" (orange-400)
   - Electronica: "rgb(56 189 248)" (sky-400)
   - Hogar: "rgb(163 130 98)" (warm brown)
   - Mascotas: "rgb(74 222 128)" (green-400)
   - Reembolso: "rgb(45 212 191)" (teal-400)
   - Regalos: "rgb(251 191 36)" (amber-400)
   - Telefonia: "rgb(129 140 248)" (indigo-400)
   - Viajes: "rgb(192 132 252)" (purple-400)

3. In `hooks/useBudgetTracker.ts`: Add the same 8 new categories to the `ALL_CATEGORIES` array.

CRITICAL: Do NOT rename or remove any existing category. This would break localStorage data.
  </action>
  <verify>
    <automated>cd D:/Documents/Programing/nextjs/expense-tracker && npx tsc --noEmit 2>&1 | head -20</automated>
  </verify>
  <done>Category type has 24 entries, CATEGORIES record has 24 entries with unique colors, ALL_CATEGORIES has 24 entries. TypeScript compiles without errors. All 16 original categories are unchanged.</done>
</task>

<task type="checkpoint:human-verify" gate="blocking">
  <name>Task 2: Verify new categories across all UI selectors</name>
  <files>n/a</files>
  <action>User verifies that all 24 categories appear correctly in the app UI.</action>
  <verify>Visual inspection by user</verify>
  <done>User confirms all selectors show new categories and existing data is intact.</done>
</task>

</tasks>

<verification>
- TypeScript compiles without errors (`npx tsc --noEmit`)
- Category type, CATEGORIES record, and ALL_CATEGORIES array all have exactly 24 entries
- All original 16 categories are present and unchanged
- New category "Reembolso" is present in all 3 files
</verification>

<success_criteria>
- 24 categories available across all category selectors in the app
- "Reembolso" specifically available as a category
- Existing expenses with old categories unaffected
- Each new category has a distinct, visible color
- No TypeScript compilation errors
</success_criteria>

<output>
After completion, create `.planning/quick/17-agrega-categorias-detalladas-con-reembol/17-SUMMARY.md`
</output>
