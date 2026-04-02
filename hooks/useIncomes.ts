"use client";
import { useState } from "react";
import { format, parse } from "date-fns";
import {
  CurrencyType,
  type ExtraIncome,
  type MonthlyData,
} from "./useMoneyTracker";
import type { SalaryEntry } from "./useSalaryHistory";
import { type ViewMode, getFilterDateRange } from "./usePayPeriod";

interface SalaryHistoryActions {
  salaryHistory: { entries: SalaryEntry[] };
  addSalaryEntry: (entry: Omit<SalaryEntry, "id">) => void;
  updateSalaryEntry: (id: string, updates: Partial<Omit<SalaryEntry, "id">>) => void;
}

export function useIncomes(
  monthlyData: MonthlyData,
  updateMonthlyData: (data: MonthlyData) => void,
  selectedYear: string,
  selectedMonth: string,
  salaryHistoryActions?: SalaryHistoryActions,
  viewMode: ViewMode = "mes",
  payDay: number = 1
) {
  const [showSalaryForm, setShowSalaryForm] = useState(true);
  const [openExtraIncome, setOpenExtraIncome] = useState(false);
  const [editingIncome, setEditingIncome] = useState<ExtraIncome | null>(null);
  const [defaultIncomeDate, setDefaultIncomeDate] = useState(
    format(new Date(), "yyyy-MM-dd")
  );

  const handleSetSalary = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const monthKey = `${selectedYear}-${selectedMonth.split("-")[1]}`;
    const amount = Number(formData.get("salary"));
    const usdRate = Number(formData.get("usdRate"));

    // Write to salary history (effective-date model)
    if (salaryHistoryActions) {
      const existing = salaryHistoryActions.salaryHistory.entries.find(
        (e) => e.effectiveDate === monthKey
      );
      if (existing) {
        salaryHistoryActions.updateSalaryEntry(existing.id, { amount, usdRate });
      } else {
        salaryHistoryActions.addSalaryEntry({ effectiveDate: monthKey, amount, usdRate });
      }
    }

    // Also update legacy salaries map for backward compat
    updateMonthlyData({
      ...monthlyData,
      salaries: {
        ...monthlyData.salaries,
        [monthKey]: { amount, usdRate },
      },
    });

    setShowSalaryForm(false);
  };

  const handleAddExtraIncome = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const currencyType = formData.get("currencyType") as CurrencyType;
    const usdRate = Number(formData.get("usdRate"));
    const amount = Number(formData.get("amount"));


    const newIncome: ExtraIncome = {
      id: crypto.randomUUID(),
      date: formData.get("date") as string,
      name: formData.get("name") as string,
      amount,
      usdRate,
      currencyType,
    };

    updateMonthlyData({
      ...monthlyData,
      extraIncomes: [...monthlyData.extraIncomes, newIncome],
    });

    setOpenExtraIncome(false);
    e.currentTarget.reset();
  };

  const handleDeleteIncome = (incomeId: string) => {
    updateMonthlyData({
      ...monthlyData,
      extraIncomes: monthlyData.extraIncomes.filter(
        (income) => income.id !== incomeId
      ),
    });
  };

  const handleOpenIncomeModal = () => {
    setDefaultIncomeDate(format(new Date(), "yyyy-MM-dd"));
    setEditingIncome(null);
    setOpenExtraIncome(true);
  };

  const handleEditIncome = (incomeToEdit: ExtraIncome) => {
    setEditingIncome(incomeToEdit);
    setOpenExtraIncome(true);
  };

  const handleUpdateIncome = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingIncome) return;

    const formData = new FormData(e.currentTarget);
    const currencyType = formData.get("currencyType") as CurrencyType;
    const usdRate = Number(formData.get("usdRate"));
    const amount = Number(formData.get("amount"));


    const updatedIncome = {
      ...editingIncome,
      date: formData.get("date") as string,
      name: formData.get("name") as string,
      amount,
      usdRate,
      currencyType,
    };

    updateMonthlyData({
      ...monthlyData,
      extraIncomes: monthlyData.extraIncomes.map((income) =>
        income.id === editingIncome.id ? updatedIncome : income
      ),
    });

    setOpenExtraIncome(false);
    setEditingIncome(null);
    e.currentTarget.reset();
  };

  const monthKey = `${selectedYear}-${selectedMonth.split("-")[1]}`;
  const { start: filterStart, end: filterEnd } = getFilterDateRange(monthKey, viewMode, payDay);
  const filteredIncomes = monthlyData.extraIncomes.filter((income) => {
    const incomeDate = parse(income.date, "yyyy-MM-dd", new Date());
    return incomeDate >= filterStart && incomeDate <= filterEnd;
  });

  const handleUpdateIncomeUsdRate = (incomeId: string, newRate: number) => {
    if (newRate <= 0) return;
    updateMonthlyData({
      ...monthlyData,
      extraIncomes: monthlyData.extraIncomes.map((income) =>
        income.id === incomeId ? { ...income, usdRate: newRate } : income
      ),
    });
  };

  return {
    showSalaryForm,
    setShowSalaryForm,
    openExtraIncome,
    setOpenExtraIncome,
    editingIncome,
    defaultIncomeDate,
    filteredIncomes,
    handleSetSalary,
    handleAddExtraIncome,
    handleDeleteIncome,
    handleOpenIncomeModal,
    handleEditIncome,
    handleUpdateIncome,
    handleUpdateIncomeUsdRate,
  };
}
