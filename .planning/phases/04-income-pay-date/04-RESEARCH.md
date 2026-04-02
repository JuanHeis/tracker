# Phase 4: Income & Pay Date - Research

**Researched:** 2026-04-02
**Domain:** Income data model refactor, pay period views, aguinaldo calculation
**Confidence:** HIGH

## Summary

Phase 4 transforms the income system from a simple per-month salary value to an effective-date salary history model with employment configuration, dual calendar views, and automatic aguinaldo calculation. The core challenge is a data migration from the current `MonthlyData.salaries` map (keyed by `yyyy-MM` with `{amount, usdRate}`) to an effective-date model with optional per-month overrides, plus adding global settings for employment type and pay date.

The existing codebase uses localStorage via `useLocalStorage` with a migration function pattern (currently at `_migrationVersion: 3`). This phase will bump to version 4. The salary card (`salary-card.tsx`) will be heavily refactored from a simple display/edit form into a multi-section card with employment config, salary timeline, pendiente de cobro banner, and aguinaldo display. The month selector in `expense-tracker.tsx` needs a segmented control for period vs calendar month toggle.

**Primary recommendation:** Implement in layers: (1) terminology rename across all files, (2) data model migration + salary history with effective dates, (3) employment config + aguinaldo logic, (4) pay period views with segmented control.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Config lives inside the salary card (no separate settings page)
- Employment type (dependiente/independiente) and pay date (day of month) always visible in the card with pencil icon to edit
- Pay date field: number input validated 1-31; if month doesn't have that day, use last day of month
- Defaults for first-time users: dependiente, day 1 (no onboarding wizard)
- Employment type and pay date are global settings (not per-month)
- Salary with effective date model: user enters amount + effective date, system auto-applies to all months from that date forward until the next raise
- Per-month override allowed: if actual deposit differs, user can override just that month without affecting future months
- Timeline visible in salary card: small list of salary changes ("Desde Ene 2026: $500.000" / "Desde Mar 2026: $600.000") with click to edit
- Editing a past salary entry retroactively updates all months between that entry and the next raise (recalculates)
- Current per-month `salaries` data model needs migration to effective-date model with optional per-month overrides
- Segmented control in header near month selector: [Periodo | Mes]
- Custom period view (default): combines all transactions from pay date of this month to day before pay date of next month as one period
- Calendar month view: traditional monthly view with "Pendiente de cobro" indicator before pay date
- Default view: custom period
- In custom period view, expenses and incomes from both calendar months are combined into one view
- In calendar month view only (before pay date in the current month): amber banner at top of salary card ("Pendiente de cobro - Cobras el dia 10") AND dimmed salary amount; disappears after pay date passes
- Aguinaldo only for dependiente users; hidden entirely for independiente
- Auto-calculated: 50% of best salary in the semester (Jan-Jun for June, Jul-Dec for December)
- Appears as separate line in salary card in June/December: "Aguinaldo (auto): $X"
- Editable: user can override the calculated amount if actual deposit differs
- Preview in May/November: blue info banner in salary card "Aguinaldo estimado en junio: $X (50% de $Y)"
- When switching to independiente: keep existing aguinaldos in data, hide future ones. Switching back resumes
- "Salario" -> "Ingreso fijo" everywhere (card, forms, charts, labels)
- "Ingresos extras" -> "Otros ingresos" everywhere
- Variable/function names can stay as-is internally -- only user-facing labels change

### Claude's Discretion
- Exact segmented control styling (use existing Shadcn/Radix patterns)
- Salary timeline layout details within the card
- Migration strategy from current per-month salary model to effective-date model
- How override indicator shows in the timeline (e.g., badge, different color)
- Exact aguinaldo formula display in tooltip/hover

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| ING-01 | Terminology renamed: "Salario" -> "Ingreso fijo", "Ingresos extras" -> "Otros ingresos" | 7 occurrences identified across 3 files; string-only changes, no logic impact |
| ING-02 | User can set pay date (e.g., day 10) | Global config stored in separate localStorage key; validated 1-31 with end-of-month clamping via date-fns |
| ING-03 | Custom period view (pay date to day before next pay date) | Requires new date range calculation in useIncomes/useExpensesTracker filteredX logic; segmented control in header |
| ING-04 | Calendar month view with "Pendiente de cobro" indicator | Amber banner + dimmed amount in salary card when current date < pay date in current month |
| ING-05 | Toggle between period and calendar month views | Radix Tabs (already in project) used as segmented control near month selector |
| ING-06 | Salary increases apply forward only | Effective-date salary history model; getSalaryForMonth() resolves by finding most recent entry <= month |
| ING-07 | Aguinaldo auto-calculated for dependiente (50% best salary in semester) | Pure calculation function over salary history; displayed in salary card June/December with preview in May/November |
| ING-08 | Employment type toggle (dependiente/independiente); aguinaldo hidden for independiente | Global config; conditional rendering in salary card |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| date-fns | ^4.1.0 | Date arithmetic, period calculations, end-of-month clamping | Already in project; `lastDayOfMonth`, `addMonths`, `isBefore`, `isAfter` for pay period logic |
| @radix-ui/react-tabs | ^1.1.1 | Segmented control for period/month toggle | Already in project; TabsList + TabsTrigger provides accessible segmented control |
| React useState/useEffect | 18.x | State management for employment config, view mode | Established project pattern; no external state library needed |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @radix-ui/react-tooltip | ^1.1.3 | Aguinaldo formula explanation | Already in project; use for "50% de $Y" tooltip |
| lucide-react | ^0.454.0 | Pencil icon for inline editing | Already in project; established click-to-edit pattern |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Radix Tabs for segmented control | Custom toggle buttons | Tabs already used in project, provides keyboard nav and ARIA for free |
| Separate localStorage key for config | Embed in MonthlyData | Config is global (not per-month), separate key is cleaner and matches globalUsdRate pattern |

**Installation:**
No new packages needed. All required libraries already in project.

## Architecture Patterns

### Recommended Data Model Changes

```
Current MonthlyData.salaries:
{
  "2026-01": { amount: 500000, usdRate: 1200 },
  "2026-02": { amount: 500000, usdRate: 1200 },
  "2026-03": { amount: 600000, usdRate: 1250 }
}

New model (separate localStorage keys):

// Key: "incomeConfig" (global, not per-month)
{
  employmentType: "dependiente" | "independiente",
  payDay: number  // 1-31
}

// Key: "salaryHistory" (global timeline)
{
  entries: [
    { id: string, effectiveDate: "2026-01", amount: 500000, usdRate: 1200 },
    { id: string, effectiveDate: "2026-03", amount: 600000, usdRate: 1250 }
  ]
}

// Kept in MonthlyData: per-month overrides and aguinaldo overrides
MonthlyData.salaryOverrides: {
  "2026-02": { amount: 480000, usdRate: 1200 }  // actual deposit differed
}
MonthlyData.aguinaldoOverrides: {
  "2026-06": { amount: 280000 }  // user override of calculated amount
}
```

### Pattern 1: Salary Resolution Function
**What:** Pure function that resolves the effective salary for any given month
**When to use:** Anywhere salary amount is needed (balance calc, chart, card display)
**Example:**
```typescript
function getSalaryForMonth(
  monthKey: string,  // "2026-03"
  salaryHistory: SalaryEntry[],
  overrides: Record<string, { amount: number; usdRate: number }>
): { amount: number; usdRate: number; isOverride: boolean } {
  // Check override first
  if (overrides[monthKey]) {
    return { ...overrides[monthKey], isOverride: true };
  }
  // Find most recent entry where effectiveDate <= monthKey
  const sorted = [...salaryHistory].sort((a, b) => 
    b.effectiveDate.localeCompare(a.effectiveDate)
  );
  const entry = sorted.find(e => e.effectiveDate <= monthKey);
  if (entry) return { amount: entry.amount, usdRate: entry.usdRate, isOverride: false };
  return { amount: 0, usdRate: 0, isOverride: false };
}
```

### Pattern 2: Pay Period Date Range
**What:** Calculate start/end dates for a custom pay period
**When to use:** Filtering transactions in custom period view
**Example:**
```typescript
import { lastDayOfMonth, setDate, addMonths, subDays } from "date-fns";

function getPayPeriodRange(monthKey: string, payDay: number) {
  const [year, month] = monthKey.split("-").map(Number);
  const monthDate = new Date(year, month - 1, 1);
  
  // Clamp pay day to actual days in month
  const lastDay = lastDayOfMonth(monthDate).getDate();
  const clampedPayDay = Math.min(payDay, lastDay);
  
  const periodStart = setDate(monthDate, clampedPayDay);
  
  // End = day before pay day of next month
  const nextMonth = addMonths(monthDate, 1);
  const nextLastDay = lastDayOfMonth(nextMonth).getDate();
  const nextClampedPayDay = Math.min(payDay, nextLastDay);
  const periodEnd = subDays(setDate(nextMonth, nextClampedPayDay), 1);
  
  return { start: periodStart, end: periodEnd };
}
```

### Pattern 3: Aguinaldo Calculation
**What:** Pure function to compute aguinaldo for June/December
**When to use:** Salary card display, preview banner
**Example:**
```typescript
function calculateAguinaldo(
  targetMonth: string,  // "2026-06" or "2026-12"
  salaryHistory: SalaryEntry[],
  overrides: Record<string, { amount: number }>
): number {
  const [year, month] = targetMonth.split("-").map(Number);
  // Semester: Jan-Jun for June, Jul-Dec for December
  const semesterStart = month <= 6 ? `${year}-01` : `${year}-07`;
  const semesterEnd = month <= 6 ? `${year}-06` : `${year}-12`;
  
  // Find best salary in the semester
  let bestSalary = 0;
  for (let m = parseInt(semesterStart.split("-")[1]); m <= parseInt(semesterEnd.split("-")[1]); m++) {
    const mk = `${year}-${String(m).padStart(2, "0")}`;
    const salary = getSalaryForMonth(mk, salaryHistory, overrides);
    bestSalary = Math.max(bestSalary, salary.amount);
  }
  
  return Math.round(bestSalary * 0.5);
}
```

### Pattern 4: View Mode State
**What:** Global view mode toggle affecting transaction filtering across all tabs
**When to use:** Period vs calendar month toggle
**Example:**
```typescript
// In useMoneyTracker or as separate hook
const [viewMode, setViewMode] = useState<"periodo" | "mes">("periodo");

// Pass viewMode to useIncomes, useExpensesTracker
// Each hook adjusts its filter date range based on viewMode + payDay
```

### Anti-Patterns to Avoid
- **Storing resolved salaries per-month:** Don't pre-compute salaries for every month. Resolve on-the-fly from history + overrides. Pre-computation creates stale data when editing past entries.
- **Mixing global config into MonthlyData:** Employment type and pay day are not month-specific. Store separately (like globalUsdRate pattern).
- **Filtering by string prefix for custom periods:** Custom periods span two calendar months. Use actual Date comparisons, not `startsWith(monthKey)`.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| End-of-month clamping (pay day 31 in Feb) | Manual day math | `date-fns/lastDayOfMonth` + `Math.min` | Leap years, 28/29/30/31 day months |
| Date range filtering | String comparison on yyyy-MM-dd | `date-fns/isWithinInterval` or `>=` / `<=` on Date objects | String comparison breaks with period spanning two months |
| Segmented control UI | Custom div + onClick toggle | Radix `Tabs` with `TabsList` + `TabsTrigger` | Keyboard nav, ARIA roles, focus management for free |

**Key insight:** The pay period view is the most complex new feature because it crosses calendar month boundaries. Every existing filter that uses `date.startsWith(monthKey)` must be updated to support date range filtering when in period mode.

## Common Pitfalls

### Pitfall 1: Calendar Month Filters Everywhere
**What goes wrong:** Existing code filters transactions with `date.startsWith(monthKey)`. Custom period view requires filtering by date range across two months.
**Why it happens:** The entire app was built around calendar-month scoping. Switching to period view requires touching every filter.
**How to avoid:** Create a central `getFilterDateRange(monthKey, viewMode, payDay)` function. All hooks use this instead of building month keys manually.
**Warning signs:** Transactions disappearing or duplicating when switching between period and calendar views.

### Pitfall 2: Migration Data Loss
**What goes wrong:** Existing per-month salary data lost during migration to effective-date model.
**Why it happens:** Per-month data has unique values per month (different usdRate). Naive migration might collapse these.
**How to avoid:** Migration should detect salary changes between consecutive months and create separate history entries for each change. Months with identical salary to the previous month don't need entries.
**Warning signs:** All months showing same salary after migration, or months showing $0.

### Pitfall 3: Aguinaldo Semester Boundary
**What goes wrong:** Aguinaldo calculation uses wrong semester months.
**Why it happens:** Off-by-one in month ranges. January is month 1, not 0.
**How to avoid:** Explicitly define: June aguinaldo covers Jan(01)-Jun(06). December aguinaldo covers Jul(07)-Dec(12). Test with salary changes mid-semester.
**Warning signs:** Aguinaldo amount doesn't change when salary increases mid-semester.

### Pitfall 4: Pay Period Edge Case - Day 29/30/31
**What goes wrong:** Pay day 31 with February = period start is Feb 28 (or 29), but March period start is Mar 31.
**Why it happens:** Month lengths vary; clamping must happen per-month.
**How to avoid:** Always clamp to `Math.min(payDay, lastDayOfMonth(month).getDate())` at the point of use. Never cache the clamped day.
**Warning signs:** Gaps or overlaps between consecutive periods.

### Pitfall 5: Pendiente de Cobro with Custom Period View
**What goes wrong:** "Pendiente de cobro" banner showing in custom period view.
**Why it happens:** Developer forgets it only applies to calendar month view.
**How to avoid:** Guard with `viewMode === "mes"` AND `currentDate < payDate in current real month`.
**Warning signs:** Banner appearing in both views.

### Pitfall 6: Balance Calculation Drift
**What goes wrong:** `calculateDualBalances()` in useMoneyTracker uses `monthKey` for ARS scoping. With custom period view, the "month" changes meaning.
**Why it happens:** Balance is currently month-scoped for ARS. Period view spans two months.
**How to avoid:** Balance calculation must accept the active date range (from filter function), not just monthKey.
**Warning signs:** Balance showing only half the transactions in period view.

## Code Examples

### Migration Function (v3 -> v4)
```typescript
function migrateV3toV4(data: MonthlyData): MonthlyData {
  if ((data as any)._migrationVersion >= 4) return data;
  
  // Convert per-month salaries to effective-date history
  const monthKeys = Object.keys(data.salaries).sort();
  const entries: SalaryEntry[] = [];
  
  let prevAmount = -1;
  let prevRate = -1;
  for (const mk of monthKeys) {
    const s = data.salaries[mk];
    if (s.amount !== prevAmount || s.usdRate !== prevRate) {
      entries.push({
        id: crypto.randomUUID(),
        effectiveDate: mk,
        amount: s.amount,
        usdRate: s.usdRate,
      });
      prevAmount = s.amount;
      prevRate = s.usdRate;
    }
  }
  
  // Store salary history in separate localStorage key
  localStorage.setItem("salaryHistory", JSON.stringify({ entries }));
  
  // Initialize income config with defaults
  if (!localStorage.getItem("incomeConfig")) {
    localStorage.setItem("incomeConfig", JSON.stringify({
      employmentType: "dependiente",
      payDay: 1,
    }));
  }
  
  return {
    ...data,
    salaryOverrides: {},
    aguinaldoOverrides: {},
    _migrationVersion: 4,
  } as any;
}
```

### Segmented Control for View Toggle
```typescript
// Near month selector in expense-tracker.tsx header
<Tabs value={viewMode} onValueChange={(v) => setViewMode(v as "periodo" | "mes")}>
  <TabsList className="grid w-[200px] grid-cols-2">
    <TabsTrigger value="periodo">Periodo</TabsTrigger>
    <TabsTrigger value="mes">Mes</TabsTrigger>
  </TabsList>
</Tabs>
```

### Pendiente de Cobro Banner
```typescript
// In salary card, calendar month view only
const today = new Date();
const currentMonthKey = format(today, "yyyy-MM");
const isCurrentMonth = selectedMonth === currentMonthKey;
const payDayThisMonth = Math.min(payDay, lastDayOfMonth(today).getDate());
const isPendiente = viewMode === "mes" && isCurrentMonth && today.getDate() < payDayThisMonth;

{isPendiente && (
  <div className="rounded-md bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 p-3 text-sm text-amber-800 dark:text-amber-200">
    Pendiente de cobro — Cobras el dia {payDay}
  </div>
)}
```

### Terminology Rename Locations
```
salary-card.tsx:84    placeholder="Salario"       -> "Ingreso fijo"
salary-card.tsx:102   <span>Salario:</span>       -> "Ingreso fijo:"
salary-card.tsx:195   "Editar Salario"            -> "Editar Ingreso fijo"
expense-tracker.tsx:363  "Ingresos extras del Mes"   -> "Otros ingresos del Mes"
expense-tracker.tsx:594  "Ingresos Extra"            -> "Otros ingresos"
salary-by-month.tsx:29   label: "Salario"            -> "Ingreso fijo"
salary-by-month.tsx:63   "Salario por Mes"           -> "Ingreso fijo por Mes"
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Per-month salary storage | Effective-date salary history | This phase | Enables forward-propagation of raises, timeline view |
| Calendar-month only filtering | Dual view (period + calendar) | This phase | All transaction filters must support date range mode |
| No employment config | Global employmentType + payDay | This phase | Enables aguinaldo auto-calculation and period views |

**Deprecated/outdated:**
- `MonthlyData.salaries` map: Will be emptied after migration; salary resolution moves to `salaryHistory` + `salaryOverrides`

## Open Questions

1. **Where to store viewMode (periodo/mes) preference**
   - What we know: It's a user preference, not data
   - What's unclear: localStorage for persistence across sessions, or just React state (resets on refresh)?
   - Recommendation: localStorage for persistence, using same `useLocalStorage` hook. Key: `"viewMode"`. Default: `"periodo"`.

2. **Should salary history entries store usdRate?**
   - What we know: Current salary data stores usdRate per-month. The effective-date model collapses months.
   - What's unclear: Is usdRate meaningful as part of salary history? USD rates change daily.
   - Recommendation: Keep usdRate in salary history for backwards compat, but it's less meaningful. The chart already has an ARS/USD toggle that divides by rate. Migration should carry it over.

3. **Balance calculation scope in period view**
   - What we know: ARS balance is currently month-scoped. Period view crosses months.
   - What's unclear: Should period view show a "period balance" (income - expenses within period dates) or keep the calendar-month balance?
   - Recommendation: In period view, balance = salary (from effective date) + other incomes in period - expenses in period. The salary is the same regardless (it's the amount paid at pay date). Investments remain cumulative.

## Sources

### Primary (HIGH confidence)
- Codebase analysis: `useMoneyTracker.ts`, `useIncomes.ts`, `salary-card.tsx`, `expense-tracker.tsx`, `salary-by-month.tsx` -- direct file reads
- Codebase analysis: `useLocalStorage.ts` -- migration pattern with `migrateFn` parameter
- Codebase analysis: `package.json` -- date-fns ^4.1.0, Radix tabs ^1.1.1 confirmed

### Secondary (MEDIUM confidence)
- date-fns `lastDayOfMonth`, `setDate`, `isWithinInterval` -- well-established APIs in date-fns v4
- Radix Tabs as segmented control -- common pattern in Shadcn/Radix projects

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - no new libraries needed, all APIs well-known
- Architecture: HIGH - data model migration is well-understood from Phase 3 precedent; salary resolution is pure function
- Pitfalls: HIGH - identified from direct codebase analysis of existing filter patterns

**Research date:** 2026-04-02
**Valid until:** 2026-05-02 (stable domain, no external dependencies)
