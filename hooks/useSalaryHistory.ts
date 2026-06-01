"use client";
import { useLocalStorage } from "./useLocalStorage";

// --- Types ---

export interface SalaryEntry {
  id: string;
  effectiveDate: string; // "yyyy-MM" format
  amount: number;
  usdRate: number;
}

export interface SalaryHistory {
  entries: SalaryEntry[];
}

export interface IncomeConfig {
  employmentType: "dependiente" | "independiente";
  payDay: number; // 1-31
}

export interface SalaryResolution {
  amount: number;
  usdRate: number;
  isOverride: boolean;
}

// --- Pure function ---

export function getSalaryForMonth(
  monthKey: string,
  salaryHistory: SalaryEntry[],
  overrides: Record<string, { amount: number; usdRate: number }>
): SalaryResolution {
  // Check overrides first
  if (overrides[monthKey]) {
    return {
      amount: overrides[monthKey].amount,
      usdRate: overrides[monthKey].usdRate,
      isOverride: true,
    };
  }

  // Find most recent entry where effectiveDate <= monthKey
  // (string comparison works for yyyy-MM format)
  let best: SalaryEntry | null = null;
  for (const entry of salaryHistory) {
    if (entry.effectiveDate <= monthKey) {
      if (!best || entry.effectiveDate > best.effectiveDate) {
        best = entry;
      }
    }
  }

  if (best) {
    return { amount: best.amount, usdRate: best.usdRate, isOverride: false };
  }

  return { amount: 0, usdRate: 0, isOverride: false };
}

// --- Aguinaldo pure functions ---

export interface AguinaldoResult {
  amount: number;
  bestSalary: number;
  isAuto: boolean;
}

export interface AguinaldoPreview {
  estimatedAmount: number;
  bestSalary: number;
  targetMonth: string;
}

export function calculateAguinaldo(
  targetMonth: string, // "yyyy-MM" — must be July (7) or January (1)
  salaryHistory: SalaryEntry[],
  overrides: Record<string, { amount: number; usdRate: number }>
): AguinaldoResult {
  const [yearStr, monthStr] = targetMonth.split("-");
  const year = Number(yearStr);
  const month = Number(monthStr);

  // Determine which semester to look back at
  // July (7) → look at Jan(1)-Jun(6) of the same year
  // January (1) → look at Jul(7)-Dec(12) of the PREVIOUS year
  let semYear: number;
  let semStart: number;
  let semEnd: number;

  if (month === 7) {
    semYear = year;
    semStart = 1;
    semEnd = 6;
  } else if (month === 1) {
    semYear = year - 1;
    semStart = 7;
    semEnd = 12;
  } else {
    return { amount: 0, bestSalary: 0, isAuto: true };
  }

  let bestSalary = 0;
  for (let m = semStart; m <= semEnd; m++) {
    const mk = `${semYear}-${String(m).padStart(2, "0")}`;
    const salary = getSalaryForMonth(mk, salaryHistory, overrides);
    bestSalary = Math.max(bestSalary, salary.amount);
  }

  return {
    amount: Math.round(bestSalary * 0.5),
    bestSalary,
    isAuto: true,
  };
}

export function getAguinaldoPreview(
  currentMonth: string, // "yyyy-MM"
  salaryHistory: SalaryEntry[],
  overrides: Record<string, { amount: number; usdRate: number }>
): AguinaldoPreview | null {
  const [yearStr, monthStr] = currentMonth.split("-");
  const year = Number(yearStr);
  const month = Number(monthStr);

  // Preview shown in June (for July payment) and December (for January payment)
  if (month !== 6 && month !== 12) return null;

  // Determine target payment month and the semester range already elapsed
  let targetMonth: string;
  let semYear: number;
  let semStart: number;
  let semEnd: number; // only months up to currentMonth are known

  if (month === 6) {
    // Payment in July, semester Jan-Jun (Jun is current, so all months known)
    targetMonth = `${year}-07`;
    semYear = year;
    semStart = 1;
    semEnd = 6;
  } else {
    // month === 12
    // Payment in January next year, semester Jul-Dec (Dec is current, all months known)
    targetMonth = `${year + 1}-01`;
    semYear = year;
    semStart = 7;
    semEnd = 12;
  }

  let bestSalary = 0;
  for (let m = semStart; m <= semEnd; m++) {
    const mk = `${semYear}-${String(m).padStart(2, "0")}`;
    const salary = getSalaryForMonth(mk, salaryHistory, overrides);
    bestSalary = Math.max(bestSalary, salary.amount);
  }

  return {
    estimatedAmount: Math.round(bestSalary * 0.5),
    bestSalary,
    targetMonth,
  };
}

// --- Hook ---

export function useSalaryHistory() {
  const [salaryHistory, setSalaryHistory] = useLocalStorage<SalaryHistory>(
    "salaryHistory",
    { entries: [] }
  );

  const [incomeConfig, setIncomeConfig] = useLocalStorage<IncomeConfig>(
    "incomeConfig",
    { employmentType: "dependiente" as const, payDay: 1 }
  );

  const addSalaryEntry = (entry: Omit<SalaryEntry, "id">) => {
    const newEntry: SalaryEntry = {
      ...entry,
      id: crypto.randomUUID(),
    };
    setSalaryHistory({
      entries: [...salaryHistory.entries, newEntry].sort(
        (a, b) => a.effectiveDate.localeCompare(b.effectiveDate)
      ),
    });
  };

  const updateSalaryEntry = (id: string, updates: Partial<Omit<SalaryEntry, "id">>) => {
    setSalaryHistory({
      entries: salaryHistory.entries
        .map((e) => (e.id === id ? { ...e, ...updates } : e))
        .sort((a, b) => a.effectiveDate.localeCompare(b.effectiveDate)),
    });
  };

  const deleteSalaryEntry = (id: string) => {
    setSalaryHistory({
      entries: salaryHistory.entries.filter((e) => e.id !== id),
    });
  };

  const getSalaryForMonthBound = (
    monthKey: string,
    overrides: Record<string, { amount: number; usdRate: number }> = {}
  ): SalaryResolution => {
    return getSalaryForMonth(monthKey, salaryHistory.entries, overrides);
  };

  return {
    salaryHistory,
    setSalaryHistory,
    incomeConfig,
    setIncomeConfig,
    addSalaryEntry,
    updateSalaryEntry,
    deleteSalaryEntry,
    getSalaryForMonth: getSalaryForMonthBound,
  };
}
