"use client";
import { useState } from "react";
import { format, getYear } from "date-fns";
import { useLocalStorage } from "./useLocalStorage";
import { useInvestmentsTracker } from "./useInvestmentsTracker";
import { useIncomes } from "./useIncomes";
import { useExpensesTracker } from "./useExpensesTracker";
import { useCurrencyEngine } from "./useCurrencyEngine";
import { useSalaryHistory, calculateAguinaldo, getAguinaldoPreview } from "./useSalaryHistory";
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

export interface UsdPurchase {
  id: string;
  date: string;           // yyyy-MM-dd
  arsAmount: number;      // ARS spent (0 for untracked)
  usdAmount: number;      // USD received
  purchaseRate: number;   // arsAmount / usdAmount (0 for untracked)
  origin: "tracked" | "untracked";
  description?: string;   // Required for untracked, optional for tracked
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
  usdPurchases: UsdPurchase[];
  salaryOverrides?: Record<string, { amount: number; usdRate: number }>;
  aguinaldoOverrides?: Record<string, { amount: number }>;
}



function migrateData(data: MonthlyData): MonthlyData {
  const currentVersion = (data as any)._migrationVersion || 0;
  const needsUsdReversal = !(currentVersion >= 3);

  const migrated = {
    ...data,
    expenses: data.expenses.map((expense) => {
      const base = {
        ...expense,
        currencyType: expense.currencyType || CurrencyType.ARS,
      };
      // Reverse USD->ARS conversion: restore original USD amount
      if (needsUsdReversal && base.currencyType === CurrencyType.USD && base.usdRate > 0) {
        base.amount = Math.round((base.amount / base.usdRate) * 100) / 100;
      }
      return base;
    }),
    extraIncomes: data.extraIncomes.map((income) => {
      const base = {
        ...income,
        currencyType: income.currencyType || CurrencyType.ARS,
      };
      // Reverse USD->ARS conversion: restore original USD amount
      if (needsUsdReversal && base.currencyType === CurrencyType.USD && base.usdRate > 0) {
        base.amount = Math.round((base.amount / base.usdRate) * 100) / 100;
      }
      return base;
    }),
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
    usdPurchases: (data as any).usdPurchases || [],
    salaryOverrides: (data as any).salaryOverrides || {},
    aguinaldoOverrides: (data as any).aguinaldoOverrides || {},
    _migrationVersion: 4,
  };

  // Migration v4: Convert per-month salaries to effective-date salary history
  if (currentVersion < 4) {
    try {
      const existingSalaryHistory = localStorage.getItem("salaryHistory");
      if (!existingSalaryHistory) {
        const salaries = data.salaries || {};
        const monthKeys = Object.keys(salaries).sort();
        const entries: Array<{ id: string; effectiveDate: string; amount: number; usdRate: number }> = [];

        let prevAmount: number | null = null;
        let prevUsdRate: number | null = null;

        for (const monthKey of monthKeys) {
          const { amount, usdRate } = salaries[monthKey];
          // Only create a new entry when salary changes
          if (amount !== prevAmount || usdRate !== prevUsdRate) {
            entries.push({
              id: crypto.randomUUID(),
              effectiveDate: monthKey,
              amount,
              usdRate,
            });
            prevAmount = amount;
            prevUsdRate = usdRate;
          }
        }

        localStorage.setItem("salaryHistory", JSON.stringify({ entries }));
      }

      // Initialize incomeConfig if not present
      const existingConfig = localStorage.getItem("incomeConfig");
      if (!existingConfig) {
        localStorage.setItem(
          "incomeConfig",
          JSON.stringify({ employmentType: "dependiente", payDay: 1 })
        );
      }
    } catch (e) {
      console.error("Migration v4 error:", e);
    }
  }

  return migrated as MonthlyData;
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
    usdPurchases: [],
  };

  const [monthlyData, setMonthlyData] = useLocalStorage(
    "monthlyData",
    initialData,
    migrateData
  );

  const salaryHistoryTracker = useSalaryHistory();

  const incomesTracker = useIncomes(
    monthlyData,
    setMonthlyData,
    selectedYear,
    selectedMonth,
    salaryHistoryTracker
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

    // Also check salary history entries for years
    salaryHistoryTracker.salaryHistory.entries.forEach((entry) => {
      const year = entry.effectiveDate.split("-")[0];
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

  const calculateDualBalances = () => {
    const monthKey = getCurrentMonthKey();
    let arsBalance = 0;
    let usdBalance = 0;

    // Salary: always ARS, month-scoped — resolve from salary history
    const salaryResolution = salaryHistoryTracker.getSalaryForMonth(
      monthKey,
      monthlyData.salaryOverrides || {}
    );
    arsBalance += salaryResolution.amount;

    // Extra incomes: ARS month-scoped, USD cumulative (all time)
    monthlyData.extraIncomes
      .filter((i) => i.date.startsWith(monthKey))
      .forEach((income) => {
        if (income.currencyType !== CurrencyType.USD) {
          arsBalance += income.amount;
        }
      });
    monthlyData.extraIncomes
      .filter((i) => i.currencyType === CurrencyType.USD)
      .forEach((income) => {
        usdBalance += income.amount;
      });

    // Expenses: ARS month-scoped, USD cumulative (all time)
    monthlyData.expenses
      .filter((e) => e.date.startsWith(monthKey))
      .forEach((expense) => {
        if (expense.currencyType !== CurrencyType.USD) {
          arsBalance -= expense.amount;
        }
      });
    monthlyData.expenses
      .filter((e) => e.currencyType === CurrencyType.USD)
      .forEach((expense) => {
        usdBalance -= expense.amount;
      });

    // USD purchases: cumulative across ALL time (USD is a running balance)
    // ARS deduction only for current month (tracked purchases reduce this month's ARS)
    (monthlyData.usdPurchases || []).forEach((purchase) => {
      usdBalance += purchase.usdAmount;
      if (purchase.origin === "tracked" && purchase.date.startsWith(monthKey)) {
        arsBalance -= purchase.arsAmount;
      }
    });

    // Investment movements: ARS month-scoped, USD cumulative
    (monthlyData.investments || []).forEach((inv) => {
      if (inv.currencyType === CurrencyType.USD) {
        // USD investment movements: cumulative (all time)
        inv.movements.forEach((mov) => {
          const impact = mov.type === "aporte" ? -mov.amount : mov.amount;
          usdBalance += impact;
        });
      } else {
        // ARS investment movements: month-scoped
        inv.movements
          .filter((mov) => mov.date.startsWith(monthKey))
          .forEach((mov) => {
            const impact = mov.type === "aporte" ? -mov.amount : mov.amount;
            arsBalance += impact;
          });
      }
    });

    // Investment current values for patrimonio
    const arsInvestments = (monthlyData.investments || [])
      .filter((i) => i.status === "Activa" && i.currencyType === CurrencyType.ARS)
      .reduce((sum, i) => sum + i.currentValue, 0);
    const usdInvestments = (monthlyData.investments || [])
      .filter((i) => i.status === "Activa" && i.currencyType === CurrencyType.USD)
      .reduce((sum, i) => sum + i.currentValue, 0);

    return { arsBalance, usdBalance, arsInvestments, usdInvestments };
  };

  const expensesTracker = useExpensesTracker(
    monthlyData,
    setMonthlyData,
    selectedYear,
    selectedMonth
  );

  const currencyEngine = useCurrencyEngine(monthlyData, setMonthlyData);

  const investmentsTracker = useInvestmentsTracker(
    monthlyData,
    setMonthlyData,
    selectedYear,
    selectedMonth
  );

  const dualBalances = calculateDualBalances();
  const availableMoney = dualBalances.arsBalance;

  const savings = availableMoney > 0 ? availableMoney : 0;

  // --- Aguinaldo management ---

  const setAguinaldoOverride = (monthKey: string, amount: number) => {
    setMonthlyData({
      ...monthlyData,
      aguinaldoOverrides: {
        ...(monthlyData.aguinaldoOverrides || {}),
        [monthKey]: { amount },
      },
    });
  };

  const clearAguinaldoOverride = (monthKey: string) => {
    const overrides = { ...(monthlyData.aguinaldoOverrides || {}) };
    delete overrides[monthKey];
    setMonthlyData({
      ...monthlyData,
      aguinaldoOverrides: overrides,
    });
  };

  const getAguinaldoForMonth = (monthKey: string): {
    amount: number;
    bestSalary: number;
    isOverride: boolean;
  } | null => {
    const month = parseInt(monthKey.split("-")[1], 10);
    // Aguinaldo only applies to June (6) and December (12)
    if (month !== 6 && month !== 12) return null;

    // Check override first
    const overrides = monthlyData.aguinaldoOverrides || {};
    if (overrides[monthKey]) {
      // Still need bestSalary for tooltip
      const auto = calculateAguinaldo(
        monthKey,
        salaryHistoryTracker.salaryHistory.entries,
        monthlyData.salaryOverrides || {}
      );
      return {
        amount: overrides[monthKey].amount,
        bestSalary: auto.bestSalary,
        isOverride: true,
      };
    }

    // Auto-calculate
    const auto = calculateAguinaldo(
      monthKey,
      salaryHistoryTracker.salaryHistory.entries,
      monthlyData.salaryOverrides || {}
    );
    return {
      amount: auto.amount,
      bestSalary: auto.bestSalary,
      isOverride: false,
    };
  };

  const getAguinaldoPreviewForMonth = (monthKey: string) => {
    return getAguinaldoPreview(
      monthKey,
      salaryHistoryTracker.salaryHistory.entries,
      monthlyData.salaryOverrides || {}
    );
  };

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
    calculateDualBalances,

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
    handleUpdateUsdRate: expensesTracker.handleUpdateUsdRate,

    // Funciones de useIncomes (rate editing)
    handleUpdateIncomeUsdRate: incomesTracker.handleUpdateIncomeUsdRate,

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

    // Funciones de useSalaryHistory
    salaryHistory: salaryHistoryTracker.salaryHistory,
    incomeConfig: salaryHistoryTracker.incomeConfig,
    setIncomeConfig: salaryHistoryTracker.setIncomeConfig,
    addSalaryEntry: salaryHistoryTracker.addSalaryEntry,
    updateSalaryEntry: salaryHistoryTracker.updateSalaryEntry,
    deleteSalaryEntry: salaryHistoryTracker.deleteSalaryEntry,
    getSalaryForMonth: salaryHistoryTracker.getSalaryForMonth,

    // Aguinaldo functions
    setAguinaldoOverride,
    clearAguinaldoOverride,
    getAguinaldoForMonth,
    getAguinaldoPreviewForMonth,

    // Funciones de useCurrencyEngine
    globalUsdRate: currencyEngine.globalUsdRate,
    setGlobalUsdRate: currencyEngine.setGlobalUsdRate,
    handleBuyUsd: currencyEngine.handleBuyUsd,
    handleRegisterUntrackedUsd: currencyEngine.handleRegisterUntrackedUsd,
    handleDeleteUsdPurchase: currencyEngine.handleDeleteUsdPurchase,
    calculateExchangeGainLoss: currencyEngine.calculateExchangeGainLoss,
  };
}
