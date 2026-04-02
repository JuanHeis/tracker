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
