"use client";
import { useState } from "react";
import { format, parse, startOfMonth, endOfMonth } from "date-fns";
import {
  CurrencyType,
  type ExtraIncome,
  type MonthlyData,
} from "./useMoneyTracker";

export function useIncomes(
  monthlyData: MonthlyData,
  updateMonthlyData: (data: MonthlyData) => void,
  selectedYear: string,
  selectedMonth: string
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

    updateMonthlyData({
      ...monthlyData,
      salaries: {
        ...monthlyData.salaries,
        [`${selectedYear}-${selectedMonth.split("-")[1]}`]: {
          amount: Number(formData.get("salary")),
          usdRate: Number(formData.get("usdRate")),
        },
      },
    });

    setShowSalaryForm(false);
  };

  const handleAddExtraIncome = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const currencyType = formData.get("currencyType") as CurrencyType;
    const usdRate = Number(formData.get("usdRate"));
    let amount = Number(formData.get("amount"));

    if (currencyType === CurrencyType.USD) {
      amount = amount * usdRate;
    }

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
    let amount = Number(formData.get("amount"));

    if (currencyType === CurrencyType.USD) {
      amount = amount * usdRate;
    }

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

  const filteredIncomes = monthlyData.extraIncomes.filter((income) => {
    const incomeDate = parse(income.date, "yyyy-MM-dd", new Date());
    const monthStart = startOfMonth(
      parse(
        `${selectedYear}-${selectedMonth.split("-")[1]}`,
        "yyyy-MM",
        new Date()
      )
    );
    const monthEnd = endOfMonth(monthStart);
    return incomeDate >= monthStart && incomeDate <= monthEnd;
  });

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
  };
}
