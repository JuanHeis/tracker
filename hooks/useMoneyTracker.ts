"use client";
import { useState } from "react";
import { format, getYear } from "date-fns";
import { useLocalStorage } from "./useLocalStorage";
import { useInvestmentsTracker } from "./useInvestmentsTracker";
import { useIncomes } from "./useIncomes";
import { useExpensesTracker } from "./useExpensesTracker";

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
  | "Gym";

export enum CurrencyType {
  ARS = "ARS",
  USD = "USD",
}

export interface Expense {
  id: string;
  date: string;
  name: string;
  amount: number;
  usdRate: number;
  category: Category;
  currencyType: CurrencyType;
  installments?: {
    total: number;
    current: number;
    startDate: string;
  };
}

export interface Investment {
  id: string;
  date: string;
  name: string;
  amount: number;
  type: "Plazo Fijo" | "Acciones" | "Bonos" | "Otros";
  status: "Activa" | "Finalizada";
  expectedEndDate: string;
  usdRate: number;
  currencyType: CurrencyType;
}

export interface ExtraIncome {
  id: string;
  date: string;
  name: string;
  amount: number;
  usdRate: number;
  currencyType: CurrencyType;
}

export interface MonthlyData {
  salaries: {
    [key: string]: {
      amount: number;
      usdRate: number;
    };
  };
  expenses: Expense[];
  extraIncomes: ExtraIncome[];
  investments: Investment[];
}

export const CATEGORIES: Record<Category, { color: string }> = {
  Alquiler: { color: "bg-red-500" },
  Supermercado: { color: "bg-blue-500" },
  Entretenimiento: { color: "bg-green-500" },
  Salidas: { color: "bg-yellow-500" },
  Vacaciones: { color: "bg-purple-500" },
  Servicios: { color: "bg-orange-500" },
  Vestimenta: { color: "bg-pink-500" },
  Subscripciones: { color: "bg-indigo-500" },
  Insumos: { color: "bg-cyan-500" },
  Otros: { color: "bg-slate-500" },
  Gym: { color: "bg-lime-500" },
  Estudio: { color: "bg-teal-500" },
};

function migrateData(data: MonthlyData): MonthlyData {
  return {
    ...data,
    expenses: data.expenses.map((expense) => ({
      ...expense,
      currencyType: expense.currencyType || CurrencyType.ARS,
    })),
    extraIncomes: data.extraIncomes.map((income) => ({
      ...income,
      currencyType: income.currencyType || CurrencyType.ARS,
    })),
    investments: (data.investments || []).map((investment) => ({
      ...investment,
      currencyType: investment.currencyType || CurrencyType.ARS,
    })),
  };
}

export function useMoneyTracker() {
  const [activeTab, setActiveTab] = useState("table");
  const [selectedMonth, setSelectedMonth] = useState(
    format(new Date(), "yyyy-MM")
  );
  const [selectedYear, setSelectedYear] = useState(
    getYear(new Date()).toString()
  );

  const initialData: MonthlyData = {
    salaries: {},
    expenses: [],
    extraIncomes: [],
    investments: [],
  };

  const [monthlyData, setMonthlyData] = useLocalStorage(
    "monthlyData",
    initialData,
    migrateData
  );

  const incomesTracker = useIncomes(
    monthlyData,
    setMonthlyData,
    selectedYear,
    selectedMonth
  );

  const getAvailableYears = () => {
    const years = new Set<string>();
    const currentYear = getYear(new Date());

    years.add(currentYear.toString());
    years.add((currentYear - 1).toString());

    Object.keys(monthlyData.salaries).forEach((monthKey) => {
      const year = monthKey.split("-")[0];
      years.add(year);
    });

    monthlyData.expenses.forEach((expense) => {
      const year = expense.date.split("-")[0];
      years.add(year);
    });

    monthlyData.extraIncomes.forEach((income) => {
      const year = income.date.split("-")[0];
      years.add(year);
    });

    return Array.from(years).sort().reverse();
  };

  const getCurrentMonthKey = () =>
    `${selectedYear}-${selectedMonth.split("-")[1]}`;

  const calculateTotalAvailable = () => {
    const totalSalaries = Object.values(monthlyData.salaries).reduce(
      (sum, salary) => sum + salary.amount,
      0
    );
    const totalExtraIncomes = monthlyData.extraIncomes.reduce(
      (sum, income) => sum + income.amount,
      0
    );
    const totalExpenses = monthlyData.expenses.reduce(
      (sum, expense) => sum + expense.amount,
      0
    );
    const totalInvestments = (monthlyData.investments || []).reduce(
      (sum, investment) => sum + investment.amount,
      0
    );

    return {
      total:
        totalInvestments + totalSalaries + totalExtraIncomes - totalExpenses,
      availableForUse:
        totalSalaries + totalExtraIncomes - totalExpenses - totalInvestments,
      blockedInInvestments: totalInvestments,
    };
  };

  const expensesTracker = useExpensesTracker(
    monthlyData,
    setMonthlyData,
    selectedYear,
    selectedMonth
  );

  const investmentsTracker = useInvestmentsTracker(
    monthlyData,
    setMonthlyData,
    selectedYear,
    selectedMonth
  );

  const availableMoney = monthlyData.salaries[getCurrentMonthKey()]
    ? monthlyData.salaries[getCurrentMonthKey()].amount -
      expensesTracker.totalExpenses -
      (monthlyData.investments || [])
        .filter((inv) => inv.date.startsWith(getCurrentMonthKey()))
        .reduce((sum, inv) => sum + inv.amount, 0)
    : 0;

  const savings = availableMoney > 0 ? availableMoney : 0;

  return {
    // Estado general
    activeTab,
    setActiveTab,
    monthlyData,
    selectedMonth,
    setSelectedMonth,
    selectedYear,
    setSelectedYear,
    getAvailableYears,
    availableMoney,
    savings,
    calculateTotalAvailable,

    // Funciones de useIncomes
    showSalaryForm: incomesTracker.showSalaryForm,
    setShowSalaryForm: incomesTracker.setShowSalaryForm,
    openExtraIncome: incomesTracker.openExtraIncome,
    setOpenExtraIncome: incomesTracker.setOpenExtraIncome,
    handleAddExtraIncome: incomesTracker.handleAddExtraIncome,
    handleSetSalary: incomesTracker.handleSetSalary,
    handleDeleteIncome: incomesTracker.handleDeleteIncome,
    filteredIncomes: incomesTracker.filteredIncomes,
    defaultIncomeDate: incomesTracker.defaultIncomeDate,
    handleOpenIncomeModal: incomesTracker.handleOpenIncomeModal,
    editingIncome: incomesTracker.editingIncome,
    handleEditIncome: incomesTracker.handleEditIncome,
    handleUpdateIncome: incomesTracker.handleUpdateIncome,

    // Funciones de useExpensesTracker
    open: expensesTracker.open,
    setOpen: expensesTracker.setOpen,
    defaultDate: expensesTracker.defaultDate,
    handleOpenModal: expensesTracker.handleOpenModal,
    filteredExpenses: expensesTracker.filteredExpenses,
    totalExpenses: expensesTracker.totalExpenses,
    handleAddExpense: expensesTracker.handleAddExpense,
    handleDeleteExpense: expensesTracker.handleDeleteExpense,
    handleEditExpense: expensesTracker.handleEditExpense,
    editingExpense: expensesTracker.editingExpense,
    handleUpdateExpense: expensesTracker.handleUpdateExpense,

    // Funciones de useInvestmentsTracker
    openInvestment: investmentsTracker.openInvestment,
    setOpenInvestment: investmentsTracker.setOpenInvestment,
    defaultInvestmentDate: investmentsTracker.defaultInvestmentDate,
    editingInvestment: investmentsTracker.editingInvestment,
    filteredInvestments: investmentsTracker.filteredInvestments,
    handleAddInvestment: investmentsTracker.handleAddInvestment,
    handleEditInvestment: investmentsTracker.handleEditInvestment,
    handleDeleteInvestment: investmentsTracker.handleDeleteInvestment,
    handleUpdateInvestment: investmentsTracker.handleUpdateInvestment,
    handleOpenInvestmentModal: investmentsTracker.handleOpenInvestmentModal,
    handleCloseInvestmentModal: investmentsTracker.handleCloseInvestmentModal,
  };
}
