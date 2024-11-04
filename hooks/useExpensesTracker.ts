"use client";
import { useState } from "react";
import { format, parse, startOfMonth, endOfMonth } from "date-fns";
import type { Expense, MonthlyData, Category } from "./useMoneyTracker";
import { CurrencyType } from "./useMoneyTracker";

export function useExpensesTracker(
  monthlyData: MonthlyData,
  updateMonthlyData: (data: MonthlyData) => void,
  selectedYear: string,
  selectedMonth: string
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
    let amount = Number(formData.get("amount"));

    if (currencyType === CurrencyType.USD) {
      amount = amount * usdRate;
    }

    const baseExpense = {
      id: crypto.randomUUID(),
      date: formData.get("date") as string,
      name: formData.get("name") as string,
      amount,
      usdRate,
      category: formData.get("category") as Category,
      currencyType,
    };

    const installments = Number(formData.get("installments"));
    let newExpenses: Expense[] = [];

    if (installments > 1) {
      for (let i = 0; i < installments; i++) {
        const installmentDate = new Date(baseExpense.date);
        installmentDate.setMonth(installmentDate.getMonth() + i);

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

  const filteredExpenses = monthlyData.expenses.filter((expense) => {
    const expenseDate = parse(expense.date, "yyyy-MM-dd", new Date());
    const monthStart = startOfMonth(
      parse(
        `${selectedYear}-${selectedMonth.split("-")[1]}`,
        "yyyy-MM",
        new Date()
      )
    );
    const monthEnd = endOfMonth(monthStart);
    return expenseDate >= monthStart && expenseDate <= monthEnd;
  });

  const totalExpenses = filteredExpenses.reduce(
    (sum, expense) => sum + expense.amount,
    0
  );

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
    let amount = Number(formData.get("amount"));

    if (currencyType === CurrencyType.USD) {
      amount = amount * usdRate;
    }

    const updatedExpense = {
      ...editingExpense,
      date: formData.get("date") as string,
      name: formData.get("name") as string,
      amount,
      usdRate,
      category: formData.get("category") as Category,
      currencyType,
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

  return {
    open,
    setOpen,
    editingExpense,
    defaultDate,
    filteredExpenses,
    totalExpenses,
    handleAddExpense,
    handleDeleteExpense,
    handleOpenModal,
    handleEditExpense,
    handleUpdateExpense,
    handleCloseModal,
  };
}
