"use client";
import { useState } from "react";
import { format, getYear } from "date-fns";
import { useLocalStorage } from "./useLocalStorage";
import { useInvestmentsTracker } from "./useInvestmentsTracker";
import { useIncomes } from "./useIncomes";
import { useExpensesTracker } from "./useExpensesTracker";
import { type InvestmentType, CurrencyType } from "@/constants/investments";

// Re-export CurrencyType from constants so existing consumers don't break
export { CurrencyType } from "@/constants/investments";

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

export interface InvestmentMovement {
  id: string;
  date: string;          // yyyy-MM-dd
  type: "aporte" | "retiro";
  amount: number;
}

export interface Investment {
  id: string;
  name: string;
  type: InvestmentType;
  currencyType: CurrencyType;
  status: "Activa" | "Finalizada";
  movements: InvestmentMovement[];
  currentValue: number;
  lastUpdated: string;   // ISO date string (yyyy-MM-dd)
  createdAt: string;     // yyyy-MM-dd
  // PF-specific (optional)
  tna?: number;          // Annual nominal rate as percentage
  plazoDias?: number;    // Term in days
  startDate?: string;    // PF start date for calculation
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
    investments: (data.investments || []).map((investment: any) => ({
      id: investment.id,
      name: investment.name,
      type: investment.type,
      currencyType: investment.currencyType || CurrencyType.ARS,
      status: investment.status || "Activa",
      // Migrate: if no movements array, create initial aporte from old amount
      movements: investment.movements || [{
        id: crypto.randomUUID(),
        date: investment.date || new Date().toISOString().split('T')[0],
        type: "aporte" as const,
        amount: investment.amount || 0,
      }],
      currentValue: investment.currentValue ?? investment.amount ?? 0,
      lastUpdated: investment.lastUpdated || investment.date || new Date().toISOString().split('T')[0],
      createdAt: investment.createdAt || investment.date || new Date().toISOString().split('T')[0],
      // PF-specific fields pass through if present
      ...(investment.tna !== undefined && { tna: investment.tna }),
      ...(investment.plazoDias !== undefined && { plazoDias: investment.plazoDias }),
      ...(investment.startDate !== undefined && { startDate: investment.startDate }),
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
    const monthKey = getCurrentMonthKey();

    const monthlySalary = monthlyData.salaries[monthKey]?.amount || 0;

    const monthlyExtraIncomes = monthlyData.extraIncomes
      .filter((income) => income.date.startsWith(monthKey))
      .reduce((sum, income) => sum + income.amount, 0);

    const monthlyExpenses = monthlyData.expenses
      .filter((expense) => expense.date.startsWith(monthKey))
      .reduce((sum, expense) => sum + expense.amount, 0);

    const monthlyInvestmentImpact = (monthlyData.investments || [])
      .filter((inv) => inv.status === "Activa")
      .flatMap((inv) => inv.movements)
      .filter((mov) => mov.date.startsWith(monthKey))
      .reduce((sum, mov) => {
        return mov.type === "aporte" ? sum + mov.amount : sum - mov.amount;
      }, 0);

    return {
      total: monthlySalary + monthlyExtraIncomes - monthlyExpenses,
      availableForUse:
        monthlySalary +
        monthlyExtraIncomes -
        monthlyExpenses -
        monthlyInvestmentImpact,
      blockedInInvestments: monthlyInvestmentImpact,
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

  const monthlyInvestmentImpact = (monthlyData.investments || [])
    .filter((inv) => inv.status === "Activa")
    .flatMap((inv) => inv.movements)
    .filter((mov) => mov.date.startsWith(getCurrentMonthKey()))
    .reduce((sum, mov) => {
      return mov.type === "aporte" ? sum + mov.amount : sum - mov.amount;
    }, 0);

  const availableMoney = monthlyData.salaries[getCurrentMonthKey()]
    ? monthlyData.salaries[getCurrentMonthKey()].amount -
      expensesTracker.totalExpenses -
      monthlyInvestmentImpact
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
    // New movement and value operations
    handleAddMovement: investmentsTracker.handleAddMovement,
    handleDeleteMovement: investmentsTracker.handleDeleteMovement,
    handleUpdateValue: investmentsTracker.handleUpdateValue,
    handleFinalizeInvestment: investmentsTracker.handleFinalizeInvestment,
    handleUpdatePFFields: investmentsTracker.handleUpdatePFFields,
  };
}
