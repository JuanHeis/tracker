"use client";
import { useState } from "react";
import { format, parse, endOfMonth, addMonths, getDate, setDate } from "date-fns";
import type { Expense, MonthlyData, Category } from "./useMoneyTracker";
import { CurrencyType } from "./useMoneyTracker";
import { type ViewMode, getFilterDateRange } from "./usePayPeriod";

export function useExpensesTracker(
  monthlyData: MonthlyData,
  updateMonthlyData: (data: MonthlyData) => void,
  selectedYear: string,
  selectedMonth: string,
  viewMode: ViewMode = "mes",
  payDay: number = 1
) {
  const [open, setOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [defaultDate, setDefaultDate] = useState(
    format(new Date(), "yyyy-MM-dd")
  );

  const handleAddExpense = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const currencyType = formData.get("currencyType") as CurrencyType;
    const usdRate = Number(formData.get("usdRate"));
    const amount = Number(formData.get("amount"));

    const isPending = formData.get("isPending") === "on";
    const baseExpense = {
      id: crypto.randomUUID(),
      date: formData.get("date") as string,
      name: formData.get("name") as string,
      amount,
      usdRate,
      category: formData.get("category") as Category,
      currencyType,
      ...(isPending ? { isPaid: false as const } : {}),
    };

    const installments = Number(formData.get("installments"));
    let newExpenses: Expense[] = [];

    if (installments > 1) {
      const startDate = new Date(baseExpense.date);
      const originalDay = getDate(startDate);

      for (let i = 0; i < installments; i++) {
        const targetMonth = addMonths(startDate, i);
        const lastDay = getDate(endOfMonth(targetMonth));
        const safeDay = Math.min(originalDay, lastDay);
        const installmentDate = setDate(targetMonth, safeDay);

        newExpenses.push({
          ...baseExpense,
          id: crypto.randomUUID(),
          date: format(installmentDate, "yyyy-MM-dd"),
          installments: {
            total: installments,
            current: i + 1,
            startDate: baseExpense.date,
          },
        });
      }
    } else {
      newExpenses = [baseExpense];
    }

    updateMonthlyData({
      ...monthlyData,
      expenses: [...monthlyData.expenses, ...newExpenses],
    });

    setOpen(false);
    e.currentTarget.reset();
  };

  const monthKey = `${selectedYear}-${selectedMonth.split("-")[1]}`;
  const { start: filterStart, end: filterEnd } = getFilterDateRange(monthKey, viewMode, payDay);
  const filteredExpenses = monthlyData.expenses.filter((expense) => {
    const expenseDate = parse(expense.date, "yyyy-MM-dd", new Date());
    return expenseDate >= filterStart && expenseDate <= filterEnd;
  });

  const totalExpenses = filteredExpenses.reduce(
    (sum, expense) => sum + expense.amount,
    0
  );

  const porPagar = filteredExpenses
    .filter((e) => e.isPaid === false)
    .reduce((sum, e) => sum + e.amount, 0);

  const handleDeleteExpense = (expenseId: string) => {
    updateMonthlyData({
      ...monthlyData,
      expenses: monthlyData.expenses.filter(
        (expense) => expense.id !== expenseId
      ),
    });
  };

  const handleOpenModal = () => {
    setDefaultDate(format(new Date(), "yyyy-MM-dd"));
    setEditingExpense(null);
    setOpen(true);
  };

  const handleEditExpense = (expenseToEdit: Expense) => {
    setEditingExpense(expenseToEdit);
    setOpen(true);
  };

  const handleUpdateExpense = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingExpense) return;

    const formData = new FormData(e.currentTarget);
    const currencyType = formData.get("currencyType") as CurrencyType;
    const usdRate = Number(formData.get("usdRate"));
    const amount = Number(formData.get("amount"));

    const isPending = formData.get("isPending") === "on";
    const updatedExpense = {
      ...editingExpense,
      date: formData.get("date") as string,
      name: formData.get("name") as string,
      amount,
      usdRate,
      category: formData.get("category") as Category,
      currencyType,
      ...(isPending ? { isPaid: false as const } : { isPaid: undefined }),
    };

    updateMonthlyData({
      ...monthlyData,
      expenses: monthlyData.expenses.map((expense) =>
        expense.id === editingExpense.id ? updatedExpense : expense
      ),
    });

    setOpen(false);
    setEditingExpense(null);
    e.currentTarget.reset();
  };

  const handleCloseModal = () => {
    setOpen(false);
    setEditingExpense(null);
  };

  const handleUpdateUsdRate = (expenseId: string, newRate: number) => {
    if (newRate <= 0) return;
    updateMonthlyData({
      ...monthlyData,
      expenses: monthlyData.expenses.map((expense) =>
        expense.id === expenseId ? { ...expense, usdRate: newRate } : expense
      ),
    });
  };

  return {
    open,
    setOpen,
    editingExpense,
    defaultDate,
    filteredExpenses,
    totalExpenses,
    porPagar,
    handleAddExpense,
    handleDeleteExpense,
    handleOpenModal,
    handleEditExpense,
    handleUpdateExpense,
    handleCloseModal,
    handleUpdateUsdRate,
  };
}
