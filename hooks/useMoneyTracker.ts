"use client";
import { useState, useEffect, useRef } from "react";
import { format, getYear, parse } from "date-fns";
import { useLocalStorage } from "./useLocalStorage";
import { useInvestmentsTracker } from "./useInvestmentsTracker";
import { useIncomes } from "./useIncomes";
import { useExpensesTracker } from "./useExpensesTracker";
import { useCurrencyEngine } from "./useCurrencyEngine";
import { useTransfers } from "./useTransfers";
import { useSalaryHistory, calculateAguinaldo, getAguinaldoPreview } from "./useSalaryHistory";
import { useRecurringExpenses } from "./useRecurringExpenses";
import { useBudgetTracker } from "./useBudgetTracker";
import { usePayPeriod, getFilterDateRange } from "./usePayPeriod";
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
  | "Gym"
  | "Seguros"
  | "Impuestos"
  | "Transporte"
  | "Salud";

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
  recurringId?: string;
  isPaid?: boolean;
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

export type TransferType =
  | "currency_ars_to_usd"    // ARS → USD conversion
  | "currency_usd_to_ars"    // USD → ARS conversion
  | "cash_out"               // Retiro a efectivo (tracked → untracked)
  | "cash_in"                // Deposito desde efectivo (untracked → tracked)
  | "adjustment_ars"         // Balance adjustment ARS
  | "adjustment_usd";        // Balance adjustment USD

export interface Transfer {
  id: string;
  date: string;              // yyyy-MM-dd
  type: TransferType;
  // Currency conversion fields (currency_ars_to_usd, currency_usd_to_ars)
  arsAmount?: number;        // ARS side of conversion
  usdAmount?: number;        // USD side of conversion
  exchangeRate?: number;     // Effective rate (arsAmount / usdAmount)
  // Cash and adjustment fields
  amount?: number;           // For cash_in/out and adjustments
  currency?: "ARS" | "USD";  // For cash_in/out
  // Metadata
  description?: string;      // Auto-generated or user note (cash_in allows text note)
  createdAt: string;         // ISO timestamp for ordering
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
  transfers?: Transfer[];
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
    _migrationVersion: 6,
  };

  // Migration v5: Initialize transfers array
  if (currentVersion < 5) {
    migrated.transfers = (migrated as any).transfers || [];
  }

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
  const { viewMode, setViewMode } = usePayPeriod();
  const payDay = salaryHistoryTracker.incomeConfig.payDay;

  const incomesTracker = useIncomes(
    monthlyData,
    setMonthlyData,
    selectedYear,
    selectedMonth,
    salaryHistoryTracker,
    viewMode,
    payDay
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
    let arsInvestmentContributions = 0;

    // Date range for ARS scoping (respects view mode)
    const { start: arsStart, end: arsEnd } = getFilterDateRange(monthKey, viewMode, payDay);
    const isInArsRange = (dateStr: string) => {
      const d = parse(dateStr, "yyyy-MM-dd", new Date());
      return d >= arsStart && d <= arsEnd;
    };

    // Salary: always ARS, month-scoped — resolve from salary history
    const salaryResolution = salaryHistoryTracker.getSalaryForMonth(
      monthKey,
      monthlyData.salaryOverrides || {}
    );
    arsBalance += salaryResolution.amount;

    // Extra incomes: ARS scoped by view mode, USD cumulative (all time)
    monthlyData.extraIncomes
      .filter((i) => isInArsRange(i.date))
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

    // Expenses: ARS scoped by view mode, USD cumulative (all time)
    monthlyData.expenses
      .filter((e) => isInArsRange(e.date))
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
    // ARS deduction scoped by view mode (tracked purchases reduce this period's ARS)
    (monthlyData.usdPurchases || []).forEach((purchase) => {
      usdBalance += purchase.usdAmount;
      if (purchase.origin === "tracked" && isInArsRange(purchase.date)) {
        arsBalance -= purchase.arsAmount;
      }
    });

    // Investment movements: ARS scoped by view mode, USD cumulative
    (monthlyData.investments || []).forEach((inv) => {
      if (inv.currencyType === CurrencyType.USD) {
        // USD investment movements: cumulative (all time)
        inv.movements.forEach((mov) => {
          const impact = mov.type === "aporte" ? -mov.amount : mov.amount;
          usdBalance += impact;
        });
      } else {
        // ARS investment movements: scoped by view mode
        inv.movements
          .filter((mov) => isInArsRange(mov.date))
          .forEach((mov) => {
            const impact = mov.type === "aporte" ? -mov.amount : mov.amount;
            arsBalance += impact;
            if (mov.type === "aporte") arsInvestmentContributions += mov.amount;
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

    // Transfers and adjustments
    (monthlyData.transfers || []).forEach((transfer) => {
      switch (transfer.type) {
        case "currency_ars_to_usd":
          // Patrimonio-neutral: ARS down, USD up
          if (isInArsRange(transfer.date)) arsBalance -= transfer.arsAmount!;
          usdBalance += transfer.usdAmount!;
          break;
        case "currency_usd_to_ars":
          // Patrimonio-neutral: USD down, ARS up
          usdBalance -= transfer.usdAmount!;
          if (isInArsRange(transfer.date)) arsBalance += transfer.arsAmount!;
          break;
        case "cash_out":
          // Reduces patrimonio — money leaves tracked world
          if (transfer.currency === "ARS" && isInArsRange(transfer.date)) {
            arsBalance -= transfer.amount!;
          } else if (transfer.currency === "USD") {
            usdBalance -= transfer.amount!;
          }
          break;
        case "cash_in":
          // Increases patrimonio — money enters tracked world
          if (transfer.currency === "ARS" && isInArsRange(transfer.date)) {
            arsBalance += transfer.amount!;
          } else if (transfer.currency === "USD") {
            usdBalance += transfer.amount!;
          }
          break;
        case "adjustment_ars":
          if (isInArsRange(transfer.date)) arsBalance += transfer.amount!;
          break;
        case "adjustment_usd":
          usdBalance += transfer.amount!;
          break;
      }
    });

    return { arsBalance, usdBalance, arsInvestments, usdInvestments, arsInvestmentContributions };
  };

  const expensesTracker = useExpensesTracker(
    monthlyData,
    setMonthlyData,
    selectedYear,
    selectedMonth,
    viewMode,
    payDay
  );

  const currencyEngine = useCurrencyEngine(monthlyData, setMonthlyData);

  // --- Recurring expenses ---
  const recurringTracker = useRecurringExpenses();
  const hasGeneratedRef = useRef(false);

  useEffect(() => {
    if (hasGeneratedRef.current) return;
    if (recurringTracker.recurringExpenses.length === 0) return;

    const newExpenses = recurringTracker.generateMissingInstances(
      monthlyData.expenses,
      currencyEngine.globalUsdRate,
      recurringTracker.recurringExpenses
    );

    if (newExpenses.length > 0) {
      setMonthlyData({
        ...monthlyData,
        expenses: [...monthlyData.expenses, ...newExpenses],
      });
    }

    hasGeneratedRef.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recurringTracker.recurringExpenses]);

  const toggleExpensePaid = (expenseId: string) => {
    setMonthlyData({
      ...monthlyData,
      expenses: monthlyData.expenses.map((expense) =>
        expense.id === expenseId
          ? { ...expense, isPaid: !expense.isPaid }
          : expense
      ),
    });
  };

  const transfersTracker = useTransfers(
    monthlyData,
    setMonthlyData,
    selectedYear,
    selectedMonth,
    viewMode,
    payDay
  );

  const budgetTracker = useBudgetTracker(
    monthlyData.expenses,
    `${selectedYear}-${selectedMonth.split("-")[1]}`,
    viewMode,
    payDay
  );

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

    // View mode (pay period / calendar month)
    viewMode,
    setViewMode,

    // Funciones de useTransfers
    handleAddTransfer: transfersTracker.handleAddTransfer,
    handleUpdateTransfer: transfersTracker.handleUpdateTransfer,
    handleDeleteTransfer: transfersTracker.handleDeleteTransfer,
    filteredTransfers: transfersTracker.filteredTransfers,
    handleCreateAdjustment: transfersTracker.handleCreateAdjustment,

    // Funciones de useRecurringExpenses
    recurringExpenses: recurringTracker.recurringExpenses,
    addRecurring: recurringTracker.addRecurring,
    updateRecurringStatus: recurringTracker.updateStatus,
    toggleExpensePaid,

    // Budget functions
    budgetData: budgetTracker.budgetData,
    budgetProgress: budgetTracker.budgetProgress,
    totalBudgeted: budgetTracker.totalBudgeted,
    totalSpent: budgetTracker.totalSpent,
    addBudget: budgetTracker.addBudget,
    updateBudget: budgetTracker.updateBudget,
    deleteBudget: budgetTracker.deleteBudget,
    categoriesWithoutBudget: budgetTracker.categoriesWithoutBudget,

    // Funciones de useCurrencyEngine
    globalUsdRate: currencyEngine.globalUsdRate,
    setGlobalUsdRate: currencyEngine.setGlobalUsdRate,
    handleBuyUsd: currencyEngine.handleBuyUsd,
    handleRegisterUntrackedUsd: currencyEngine.handleRegisterUntrackedUsd,
    handleDeleteUsdPurchase: currencyEngine.handleDeleteUsdPurchase,
    calculateExchangeGainLoss: currencyEngine.calculateExchangeGainLoss,
  };
}
