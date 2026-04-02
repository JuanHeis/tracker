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
  targetMonth: string, // "yyyy-MM" — must be June or December
  salaryHistory: SalaryEntry[],
  overrides: Record<string, { amount: number; usdRate: number }>
): AguinaldoResult {
  const [year, month] = targetMonth.split("-").map(Number);

  // Semester: Jan(01)-Jun(06) for June, Jul(07)-Dec(12) for December
  const semesterStartMonth = month <= 6 ? 1 : 7;
  const semesterEndMonth = month <= 6 ? 6 : 12;

  let bestSalary = 0;
  for (let m = semesterStartMonth; m <= semesterEndMonth; m++) {
    const mk = `${year}-${String(m).padStart(2, "0")}`;
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
  const month = parseInt(currentMonth.split("-")[1], 10);
  const year = currentMonth.split("-")[0];

  // Only May or November get a preview
  if (month !== 5 && month !== 11) return null;

  // Target: June for May, December for November
  const targetMonthNum = month === 5 ? 6 : 12;
  const targetMonth = `${year}-${String(targetMonthNum).padStart(2, "0")}`;

  // Calculate using the semester up to and including current month
  // (target month salary not yet known, so semester is partial)
  const semesterStartMonth = month <= 6 ? 1 : 7;

  let bestSalary = 0;
  for (let m = semesterStartMonth; m <= month; m++) {
    const mk = `${year}-${String(m).padStart(2, "0")}`;
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
