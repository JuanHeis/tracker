# Phase 10: Persistence & UX Polish - Research

**Researched:** 2026-04-02
**Domain:** Data export/import, form validation, terminology standardization
**Confidence:** HIGH

## Summary

Phase 10 is a cross-cutting polish phase with two distinct sub-domains: (1) data persistence via JSON export/import, and (2) UX consistency through standardized terminology and universal form validation. Both domains are well-understood, use no new libraries, and operate entirely on existing infrastructure.

The app stores all data across 5 localStorage keys: `monthlyData` (main data blob), `globalUsdRate`, `salaryHistory`, `incomeConfig`, `recurringExpenses`, `budgetData`, and `lastUsedUsdRate`. Export must capture ALL of these. Import must validate structure and version compatibility before replacing current data. The existing `migrateData()` function (currently at version 7) provides a model for data validation.

For UX, the app already uses correct terminology in most places (patrimonio, liquido, inversiones, etc.) but a systematic audit is needed. Form validation exists in expense/income dialogs (via `validateField`) and in several other dialogs with inline checks, but coverage is inconsistent -- the investment dialog has NO amount/rate validation, and the recurring dialog silently fails. All forms need consistent > 0 validation with visible error messages.

**Primary recommendation:** Build export/import as utility functions in a new `hooks/useDataPersistence.ts` hook, then systematically audit all 8+ form dialogs for validation gaps and all component labels for terminology consistency.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| PERS-01 | User can export all data to JSON file | Export all 7 localStorage keys into a single JSON envelope with version metadata. Use `Blob` + `URL.createObjectURL` + anchor click pattern for download. |
| PERS-02 | User can import data from JSON file with validation | File input reads JSON, validates envelope structure (version, required keys, type shapes), rejects corrupt/incompatible data with clear error messages, then writes all keys to localStorage and reloads. |
| UX-01 | Standard personal finance terminology across the app | Audit all user-visible strings in ~30 component files. Key terms already used: patrimonio, liquido, inversiones, ingresos, egresos, disponible, cotizacion. Check for inconsistencies and missing standard terms. |
| UX-02 | Forms validate amount > 0 and USD rate > 0 before submission | Existing `validateField` function covers expense/income forms. Investment dialog, recurring dialog, budget dialog, USD purchase dialog, and loan payment form need consistent validation with visible error states. |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| (none new) | - | All phase work uses existing stack | No new dependencies needed |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Built-in Blob API | - | File download for export | Standard browser API for generating downloadable files |
| Built-in FileReader API | - | File upload for import | Standard browser API for reading user-selected files |
| Built-in JSON | - | Serialization/deserialization | Already used throughout the app |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Raw JSON export | Libraries like `file-saver` | Unnecessary dependency for simple Blob download |
| Custom validation | Zod schema validation | Would add dependency; manual checks sufficient for 7 keys with known shapes |

**Installation:**
```bash
# No new packages needed
```

## Architecture Patterns

### Recommended Project Structure
```
hooks/
  useDataPersistence.ts    # NEW: export/import logic
components/
  config-card.tsx          # MODIFY: add Export/Import buttons to Herramientas section
  expense-tracker.tsx      # MODIFY: wire import/export, fix form validation
  investment-dialog.tsx    # MODIFY: add validation
  recurring-dialog.tsx     # MODIFY: add validation with error display
  budget-dialog.tsx        # MODIFY: add error display (logic exists, display missing)
  loan-payments.tsx        # VERIFY: validation exists, confirm error display
  transfer-dialog.tsx      # VERIFY: validation exists, confirm pattern
  usd-purchase-dialog.tsx  # VERIFY: validation exists, confirm pattern
  adjustment-dialog.tsx    # VERIFY: no monetary validation needed (allows 0 for "zero out")
```

### Pattern 1: JSON Export Envelope
**What:** Wrap all localStorage data in a versioned envelope for safe export/import
**When to use:** Always for export/import
**Example:**
```typescript
interface ExportEnvelope {
  appName: "expense-tracker";
  exportVersion: 1;
  exportDate: string;  // ISO timestamp
  data: {
    monthlyData: MonthlyData;
    globalUsdRate: number;
    salaryHistory: SalaryHistory;
    incomeConfig: IncomeConfig;
    recurringExpenses: RecurringExpense[];
    budgetData: BudgetData;
    lastUsedUsdRate: number;
  };
}
```

### Pattern 2: File Download via Blob
**What:** Create a downloadable JSON file without server
**When to use:** For PERS-01 export
**Example:**
```typescript
function downloadJson(data: ExportEnvelope): void {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `expense-tracker-backup-${format(new Date(), "yyyy-MM-dd")}.json`;
  a.click();
  URL.revokeObjectURL(url);
}
```

### Pattern 3: File Import via Hidden Input
**What:** Read a JSON file from the user's filesystem
**When to use:** For PERS-02 import
**Example:**
```typescript
function handleImportFile(file: File): Promise<ExportEnvelope> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result as string);
        const validated = validateEnvelope(parsed);
        resolve(validated);
      } catch (e) {
        reject(e);
      }
    };
    reader.onerror = () => reject(new Error("Error reading file"));
    reader.readAsText(file);
  });
}
```

### Pattern 4: Consistent Form Validation (existing pattern)
**What:** The app already uses `validateField` + `errors` state + red text display
**When to use:** Extend to all dialogs that accept monetary amounts
**Example:**
```typescript
// Existing pattern from expense-tracker.tsx
function validateField(name: string, value: string): string | undefined {
  const num = parseFloat(value);
  if (name === "amount") {
    if (isNaN(num) || num <= 0) return "El monto debe ser mayor a 0";
  }
  if (name === "usdRate") {
    if (isNaN(num) || num <= 0) return "La cotizacion USD debe ser mayor a 0";
  }
  return undefined;
}
// Display pattern: red text under input field
{errors.amount && (
  <p className="text-xs text-red-500">{errors.amount}</p>
)}
```

### Anti-Patterns to Avoid
- **Partial export:** Missing even one localStorage key makes import incomplete. MUST export ALL 7 keys.
- **Import without confirmation:** Never silently replace all data. Always show confirmation dialog with summary of what will change.
- **Trusting import data:** Never write imported data to localStorage without structural validation. Corrupt JSON could break the entire app.
- **Silent validation failures:** The recurring dialog currently does `if (!name || amount <= 0 || !selectedCategory) return;` with NO error display. All validations must show errors.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| File download | Custom XMLHttpRequest | Blob + createObjectURL + anchor click | Standard browser pattern, works everywhere |
| JSON schema validation | Full schema validator library | Manual type checks with clear error messages | Only 7 keys with known shapes, Zod would be overkill |
| Date formatting | Custom string manipulation | date-fns (already in project) | Already the project standard |

**Key insight:** This phase needs no new libraries. Every pattern uses existing browser APIs and project conventions.

## Common Pitfalls

### Pitfall 1: Forgetting localStorage Keys
**What goes wrong:** Export captures `monthlyData` but misses `salaryHistory`, `incomeConfig`, `recurringExpenses`, `budgetData`, `globalUsdRate`, or `lastUsedUsdRate`.
**Why it happens:** Data is spread across 7 separate localStorage keys, not one.
**How to avoid:** Enumerate ALL keys explicitly in the export function. Test by exporting, clearing localStorage, importing, and verifying all features still work.
**Warning signs:** After import, salary history is empty, or recurring expenses are missing, or budget definitions are gone.

### Pitfall 2: Import Overwrites Without Migration
**What goes wrong:** Old export file (pre-migration-v7) is imported and breaks the app because `migrateData()` is not applied.
**Why it happens:** Export from an older version doesn't include fields added in later migrations.
**How to avoid:** After import, run `migrateData()` on the monthlyData before writing to localStorage. The existing migration function handles all upgrades.
**Warning signs:** Missing `transfers`, `loans`, or `_migrationVersion` fields after import.

### Pitfall 3: Investment Dialog Zero Amount
**What goes wrong:** User creates investment with amount 0 or negative, which corrupts balance calculations.
**Why it happens:** `investment-dialog.tsx` has NO amount validation -- `Number(formData.get("amount"))` is used directly without checking > 0.
**How to avoid:** Add validation before `onAdd()` call.
**Warning signs:** Investments with 0 capital showing in table.

### Pitfall 4: Import File Is Not JSON
**What goes wrong:** User selects a non-JSON file (CSV, image, etc.) and the app crashes.
**Why it happens:** `JSON.parse` throws on non-JSON content.
**How to avoid:** Wrap in try/catch, show user-friendly error message. Also check `file.type` or at minimum catch parse errors.
**Warning signs:** Uncaught exceptions in console.

### Pitfall 5: Terminology Audit Misses Dynamic Content
**What goes wrong:** Static labels are fixed but template strings or computed labels still use inconsistent terms.
**Why it happens:** grep for visible terms misses `${variable}` patterns and computed strings.
**How to avoid:** Search for ALL user-visible strings, including tooltip content, error messages, placeholder text, and dynamically composed strings.
**Warning signs:** User sees mixed terminology (e.g., "salario" in one place and "ingreso fijo" in another).

## Code Examples

Verified patterns from the existing codebase:

### All localStorage Keys to Export
```typescript
// Source: Codebase analysis of hooks/*.ts
const STORAGE_KEYS = {
  monthlyData: "monthlyData",           // useLocalStorage in useMoneyTracker
  globalUsdRate: "globalUsdRate",        // direct in useCurrencyEngine
  salaryHistory: "salaryHistory",        // useLocalStorage in useSalaryHistory
  incomeConfig: "incomeConfig",          // useLocalStorage in useSalaryHistory
  recurringExpenses: "recurringExpenses", // useLocalStorage in useRecurringExpenses
  budgetData: "budgetData",             // useLocalStorage in useBudgetTracker
  lastUsedUsdRate: "lastUsedUsdRate",   // direct in expense-tracker.tsx
} as const;
```

### Existing handleResetAllData (reference for import)
```typescript
// Source: components/expense-tracker.tsx:308-312
const handleResetAllData = () => {
  localStorage.removeItem("monthlyData");
  localStorage.removeItem("lastUsedUsdRate");
  window.location.reload();
};
// NOTE: This is INCOMPLETE -- misses salaryHistory, incomeConfig,
// recurringExpenses, budgetData, globalUsdRate. Import should set ALL keys.
```

### Validation State Pattern (loan-dialog.tsx - good example to replicate)
```typescript
// Source: components/loan-dialog.tsx:42,63-79
const [errors, setErrors] = useState<Record<string, string>>({});

const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault();
  const newErrors: Record<string, string> = {};
  const parsedAmount = parseFloat(amount);

  if (!trimmedPersona) {
    newErrors.persona = "Persona es requerida";
  }
  if (isNaN(parsedAmount) || parsedAmount <= 0) {
    newErrors.amount = "Debe ser mayor a 0";
  }

  if (Object.keys(newErrors).length > 0) {
    setErrors(newErrors);
    return;
  }
  // ... proceed
};
```

### Where Export/Import Buttons Go
```typescript
// Source: components/config-card.tsx:440-456
// The existing "Herramientas" section is the natural location:
{onAdjustBalance && (
  <>
    <hr className="border-border" />
    <div className="space-y-2">
      <h4 className="text-sm font-medium text-muted-foreground">Herramientas</h4>
      <Button ...>Ajustar saldo real</Button>
      {/* ADD: Export and Import buttons here */}
    </div>
  </>
)}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| IndexedDB for client storage | localStorage with JSON (project choice) | Project inception | Simple but limits to ~5MB; export/import makes this a non-issue |
| Schema validation libraries | Manual validation | Project convention | Consistent with existing patterns, no new deps |

**Deprecated/outdated:**
- Nothing relevant -- all patterns are current and standard.

## Open Questions

1. **Should import trigger full page reload or hot-swap state?**
   - What we know: `handleResetAllData` uses `window.location.reload()` after clearing. Import could do the same.
   - What's unclear: Whether React state can be hot-swapped without reload.
   - Recommendation: Use `window.location.reload()` after import -- simpler, guaranteed consistent state, follows existing pattern.

2. **Should the existing reset function also clear ALL 7 keys?**
   - What we know: Current reset only clears `monthlyData` and `lastUsedUsdRate`, leaving salaryHistory, incomeConfig, recurringExpenses, budgetData, and globalUsdRate intact.
   - What's unclear: Whether this is intentional or an oversight.
   - Recommendation: Fix reset to clear all keys as part of this phase, since we are already enumerating them for export.

3. **Terminology: Is there a glossary of standard terms?**
   - What we know: REQUIREMENTS.md uses: patrimonio, liquido, activo, pasivo, ingreso fijo, otros ingresos, egresos, disponible, cotizacion, inversiones, prestamos, deudas, aguinaldo, presupuesto, recurrente.
   - What's unclear: Whether the user wants specific term changes or just consistency.
   - Recommendation: Audit against REQUIREMENTS.md terminology as source of truth. The codebase already uses most terms correctly.

## Detailed Validation Audit

### Forms WITH adequate validation (error states + display):
| Component | Validation | Error Display |
|-----------|-----------|---------------|
| expense-tracker.tsx (expense form) | amount > 0, usdRate > 0 | Red text under fields |
| expense-tracker.tsx (income form) | amount > 0, usdRate > 0 | Red text under fields |
| loan-dialog.tsx | amount > 0, persona required | Red text under fields |
| transfer-dialog.tsx | amounts > 0 (both types) | Red text under fields |
| loan-payments.tsx | amount > 0, amount <= remaining | Red text message |
| config-card.tsx | amount > 0, usdRate > 0 | Silent (prevents save only) |

### Forms MISSING validation or error display:
| Component | Issue | Fix Needed |
|-----------|-------|------------|
| investment-dialog.tsx | NO amount validation at all | Add amount > 0 check with error display |
| recurring-dialog.tsx | Silent return on invalid (no error display) | Add errors state + red text |
| budget-dialog.tsx | Silent return on invalid (no error display) | Add errors state + red text |
| usd-purchase-dialog.tsx | `isValid` disables button but no error messages | Add error text for clarity |
| config-card.tsx (salary entries) | Silent validation (prevents save only) | Consider adding error messages |

## Sources

### Primary (HIGH confidence)
- Codebase analysis: All hooks under `hooks/` directory -- direct file reads of useMoneyTracker.ts, useLocalStorage.ts, useCurrencyEngine.ts, useRecurringExpenses.ts, useBudgetTracker.ts, useSalaryHistory.ts
- Codebase analysis: All dialog components under `components/` -- direct file reads of every *-dialog.tsx file
- Codebase analysis: Card components -- patrimonio-card.tsx, resumen-card.tsx, config-card.tsx
- MDN Web Docs: Blob API, FileReader API, URL.createObjectURL -- standard browser APIs

### Secondary (MEDIUM confidence)
- None needed -- all patterns are from direct codebase analysis

### Tertiary (LOW confidence)
- None

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - No new libraries, all existing patterns
- Architecture: HIGH - Direct codebase analysis of all relevant files
- Pitfalls: HIGH - Identified from reading actual code, not speculation

**Research date:** 2026-04-02
**Valid until:** 2026-05-02 (stable domain, no external dependencies)
