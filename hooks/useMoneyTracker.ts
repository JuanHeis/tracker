"use client";
import { useState, useEffect, useRef } from "react";
import { format, getYear, parse } from "date-fns";
import { useLocalStorage } from "./useLocalStorage";
import { useInvestmentsTracker } from "./useInvestmentsTracker";
import { useIncomes } from "./useIncomes";
import { useExpensesTracker } from "./useExpensesTracker";
import { useCurrencyEngine } from "./useCurrencyEngine";
import { useTransfers } from "./useTransfers";
import { useLoans } from "./useLoans";
import { useSalaryHistory, calculateAguinaldo, getAguinaldoPreview } from "./useSalaryHistory";
import { useRecurringExpenses } from "./useRecurringExpenses";
import { useBudgetTracker } from "./useBudgetTracker";
import { usePayPeriod, getFilterDateRange } from "./usePayPeriod";
import { type InvestmentType, CurrencyType } from "@/constants/investments";

// Re-export CurrencyType from constants so existing consumers don't break
export { CurrencyType } from "@/constants/investments";

export type Category =
  | "Alquiler"
  | "Comida"
  | "Electronica"
  | "Entretenimiento"
  | "Estudio"
  | "Gym"
  | "Hogar"
  | "Impuestos"
  | "Insumos"
  | "Mascotas"
  | "Otros"
  | "Reembolso"
  | "Regalos"
  | "Salidas"
  | "Salud"
  | "Seguros"
  | "Servicios"
  | "Subscripciones"
  | "Supermercado"
  | "Telefonia"
  | "Transporte"
  | "Vacaciones"
  | "Vestimenta"
  | "Viajes";

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
  isInitial?: boolean;   // true for wizard-loaded patrimony (not counted as monthly outflow)
  pendingIngreso?: boolean;   // true = retiro requested but funds not yet received
  receivedAmount?: number;    // actual amount received (may differ from amount due to exchange rate)
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
  isLiquid?: boolean;    // If true, currentValue counts as liquid cash in patrimonio
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

export type LoanType = "preste" | "debo";

export type LoanStatus = "Pendiente" | "Cobrado" | "Pagado" | "Perdonado";

export interface LoanPayment {
  id: string;
  date: string;          // yyyy-MM-dd
  amount: number;        // Always positive, same currency as loan
  createdAt: string;     // ISO timestamp
}

export interface Loan {
  id: string;
  type: LoanType;        // "preste" = I lent (asset), "debo" = I owe (liability)
  persona: string;       // Required, free text
  amount: number;        // Original amount, immutable after creation
  currencyType: CurrencyType;  // ARS or USD, immutable after creation
  date: string;          // yyyy-MM-dd
  note?: string;         // Optional free text
  status: LoanStatus;    // Auto-transitions when remaining = 0
  payments: LoanPayment[];
  createdAt: string;     // ISO timestamp
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
  loans?: Loan[];
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
      ...(investment.isLiquid && { isLiquid: true }),
      ...(investment.tna !== undefined && { tna: investment.tna }),
      ...(investment.plazoDias !== undefined && { plazoDias: investment.plazoDias }),
      ...(investment.startDate !== undefined && { startDate: investment.startDate }),
    })),
    usdPurchases: (data as any).usdPurchases || [],
    salaryOverrides: (data as any).salaryOverrides || {},
    aguinaldoOverrides: (data as any).aguinaldoOverrides || {},
    _migrationVersion: 8,
  };

  // Migration v8: isLiquid field on investments (defaulting handled in map above)

  // Migration v7: Initialize loans array
  if (currentVersion < 7) {
    migrated.loans = (migrated as any).loans || [];
  }

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
    // Period-scoped balances (ARS: pay-period filtered, USD: pay-period filtered)
    let arsBalance = 0;
    let usdBalancePeriod = 0;
    // Accumulated balances (ARS: full month no date filter, USD: cumulative all time)
    let arsBalanceAccumulated = 0;
    let usdBalance = 0;
    let arsInvestmentContributions = 0;

    // Date range for period scoping (respects view mode)
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
    arsBalanceAccumulated += salaryResolution.amount;

    // Extra incomes: ARS period-scoped + accumulated, USD period-scoped + accumulated
    monthlyData.extraIncomes.forEach((income) => {
      if (income.currencyType !== CurrencyType.USD) {
        arsBalanceAccumulated += income.amount;
        if (isInArsRange(income.date)) arsBalance += income.amount;
      } else {
        usdBalance += income.amount;
        if (isInArsRange(income.date)) usdBalancePeriod += income.amount;
      }
    });

    // Expenses: ARS period-scoped + accumulated, USD period-scoped + accumulated
    monthlyData.expenses.forEach((expense) => {
      if (expense.currencyType !== CurrencyType.USD) {
        arsBalanceAccumulated -= expense.amount;
        if (isInArsRange(expense.date)) arsBalance -= expense.amount;
      } else {
        usdBalance -= expense.amount;
        if (isInArsRange(expense.date)) usdBalancePeriod -= expense.amount;
      }
    });

    // USD purchases: USD cumulative + period, ARS deduction period-scoped + accumulated
    (monthlyData.usdPurchases || []).forEach((purchase) => {
      usdBalance += purchase.usdAmount;
      if (isInArsRange(purchase.date)) usdBalancePeriod += purchase.usdAmount;
      if (purchase.origin === "tracked") {
        arsBalanceAccumulated -= purchase.arsAmount;
        if (isInArsRange(purchase.date)) arsBalance -= purchase.arsAmount;
      }
    });

    // Investment movements: both period and accumulated for each currency
    // Skip pending retiros — money not yet received as liquid cash
    (monthlyData.investments || []).forEach((inv) => {
      if (inv.currencyType === CurrencyType.USD) {
        inv.movements.filter((mov) => !mov.isInitial && !mov.pendingIngreso).forEach((mov) => {
          const retiroAmount = mov.receivedAmount ?? mov.amount;
          const impact = mov.type === "aporte" ? -mov.amount : retiroAmount;
          usdBalance += impact;
          if (isInArsRange(mov.date)) usdBalancePeriod += impact;
        });
      } else {
        inv.movements.filter((mov) => !mov.isInitial && !mov.pendingIngreso).forEach((mov) => {
          const retiroAmount = mov.receivedAmount ?? mov.amount;
          const impact = mov.type === "aporte" ? -mov.amount : retiroAmount;
          arsBalanceAccumulated += impact;
          if (mov.type === "aporte") arsInvestmentContributions += mov.amount;
          if (isInArsRange(mov.date)) {
            arsBalance += impact;
          }
        });
      }
    });

    // Investment current values for patrimonio
    // Liquid investments (isLiquid=true) add to balances instead of arsInvestments/usdInvestments
    let arsInvestments = 0;
    let usdInvestments = 0;
    (monthlyData.investments || [])
      .filter((i) => i.status === "Activa")
      .forEach((i) => {
        if (i.isLiquid) {
          if (i.currencyType === CurrencyType.ARS) {
            arsBalance += i.currentValue;
            arsBalanceAccumulated += i.currentValue;
          } else {
            usdBalance += i.currentValue;
            usdBalancePeriod += i.currentValue;
          }
        } else {
          if (i.currencyType === CurrencyType.ARS) arsInvestments += i.currentValue;
          else usdInvestments += i.currentValue;
        }
      });

    // Transfers and adjustments: both period and accumulated for each currency
    (monthlyData.transfers || []).forEach((transfer) => {
      switch (transfer.type) {
        case "currency_ars_to_usd":
          arsBalanceAccumulated -= transfer.arsAmount!;
          if (isInArsRange(transfer.date)) arsBalance -= transfer.arsAmount!;
          usdBalance += transfer.usdAmount!;
          if (isInArsRange(transfer.date)) usdBalancePeriod += transfer.usdAmount!;
          break;
        case "currency_usd_to_ars":
          usdBalance -= transfer.usdAmount!;
          if (isInArsRange(transfer.date)) usdBalancePeriod -= transfer.usdAmount!;
          arsBalanceAccumulated += transfer.arsAmount!;
          if (isInArsRange(transfer.date)) arsBalance += transfer.arsAmount!;
          break;
        case "cash_out":
          if (transfer.currency === "ARS") {
            arsBalanceAccumulated -= transfer.amount!;
            if (isInArsRange(transfer.date)) arsBalance -= transfer.amount!;
          } else if (transfer.currency === "USD") {
            usdBalance -= transfer.amount!;
            if (isInArsRange(transfer.date)) usdBalancePeriod -= transfer.amount!;
          }
          break;
        case "cash_in":
          if (transfer.currency === "ARS") {
            arsBalanceAccumulated += transfer.amount!;
            if (isInArsRange(transfer.date)) arsBalance += transfer.amount!;
          } else if (transfer.currency === "USD") {
            usdBalance += transfer.amount!;
            if (isInArsRange(transfer.date)) usdBalancePeriod += transfer.amount!;
          }
          break;
        case "adjustment_ars":
          arsBalanceAccumulated += transfer.amount!;
          if (isInArsRange(transfer.date)) arsBalance += transfer.amount!;
          break;
        case "adjustment_usd":
          usdBalance += transfer.amount!;
          if (isInArsRange(transfer.date)) usdBalancePeriod += transfer.amount!;
          break;
      }
    });

    // Loans: lending reduces liquid, collecting restores it
    // Debts: paying reduces liquid (borrowing itself doesn't change liquid)
    (monthlyData.loans || []).forEach((loan) => {
      if (loan.type === "preste") {
        if (loan.currencyType === CurrencyType.USD) {
          usdBalance -= loan.amount;
          if (isInArsRange(loan.date)) usdBalancePeriod -= loan.amount;
          loan.payments.forEach(p => {
            usdBalance += p.amount;
            if (isInArsRange(p.date)) usdBalancePeriod += p.amount;
          });
        } else {
          arsBalanceAccumulated -= loan.amount;
          if (isInArsRange(loan.date)) arsBalance -= loan.amount;
          loan.payments.forEach(p => {
            arsBalanceAccumulated += p.amount;
            if (isInArsRange(p.date)) arsBalance += p.amount;
          });
        }
      } else {
        if (loan.currencyType === CurrencyType.USD) {
          loan.payments.forEach(p => {
            usdBalance -= p.amount;
            if (isInArsRange(p.date)) usdBalancePeriod -= p.amount;
          });  // USD debo: accumulated always, period only if in range
        } else {
          loan.payments.forEach(p => {
            arsBalanceAccumulated -= p.amount;
            if (isInArsRange(p.date)) arsBalance -= p.amount;
          });
        }
      }
    });

    // Loan values for patrimonio (separate from liquid)
    // Remaining = original - sum(payments). NEVER store remaining as a field.
    const arsLoansGiven = (monthlyData.loans || [])
      .filter(l => l.type === "preste" && l.status !== "Perdonado" && l.currencyType === CurrencyType.ARS)
      .reduce((sum, l) => sum + (l.amount - l.payments.reduce((s, p) => s + p.amount, 0)), 0);
    const usdLoansGiven = (monthlyData.loans || [])
      .filter(l => l.type === "preste" && l.status !== "Perdonado" && l.currencyType === CurrencyType.USD)
      .reduce((sum, l) => sum + (l.amount - l.payments.reduce((s, p) => s + p.amount, 0)), 0);
    const arsDebts = (monthlyData.loans || [])
      .filter(l => l.type === "debo" && l.status !== "Pagado" && l.currencyType === CurrencyType.ARS)
      .reduce((sum, l) => sum + (l.amount - l.payments.reduce((s, p) => s + p.amount, 0)), 0);
    const usdDebts = (monthlyData.loans || [])
      .filter(l => l.type === "debo" && l.status !== "Pagado" && l.currencyType === CurrencyType.USD)
      .reduce((sum, l) => sum + (l.amount - l.payments.reduce((s, p) => s + p.amount, 0)), 0);

    return {
      // New symmetric fields
      arsBalancePeriod: arsBalance,
      arsBalanceAccumulated,
      usdBalancePeriod,
      usdBalanceAccumulated: usdBalance,
      // Backward-compatible aliases (period ARS / accumulated USD = current behavior)
      arsBalance,
      usdBalance,
      // Rest unchanged
      arsInvestments, usdInvestments, arsInvestmentContributions,
      arsLoansGiven, usdLoansGiven, arsDebts, usdDebts
    };
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

  const loansTracker = useLoans(
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
    porPagarArs: expensesTracker.porPagarArs,
    porPagarUsd: expensesTracker.porPagarUsd,
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
    handleConfirmRetiro: investmentsTracker.handleConfirmRetiro,
    handleEditMovement: investmentsTracker.handleEditMovement,
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

    // Funciones de useLoans
    filteredLoans: loansTracker.filteredLoans,
    handleAddLoan: loansTracker.handleAddLoan,
    handleAddLoanPayment: loansTracker.handleAddLoanPayment,
    handleEditLoan: loansTracker.handleEditLoan,
    handleDeleteLoan: loansTracker.handleDeleteLoan,
    handleForgiveLoan: loansTracker.handleForgiveLoan,

    // Funciones de useRecurringExpenses
    recurringExpenses: recurringTracker.recurringExpenses,
    addRecurring: recurringTracker.addRecurring,
    updateRecurringStatus: recurringTracker.updateStatus,
    updateRecurring: recurringTracker.updateRecurring,
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
