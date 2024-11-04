import { useState, useEffect } from "react";
import { format, parse, startOfMonth, endOfMonth } from "date-fns";

// Types
type Category =
  | "Alquiler"
  | "Supermercado"
  | "Entretenimiento"
  | "Salidas"
  | "Vacaciones"
  | "Servicios"
  | "Vestimenta"
  | "Subscripciones";

interface Expense {
  id: string;
  date: string;
  name: string;
  amount: number;
  usdRate: number;
  category: Category;
  installments?: {
    total: number;
    current: number;
    startDate: string;
  };
}

interface ExtraIncome {
  id: string;
  date: string;
  name: string;
  amount: number;
  usdRate: number;
}

interface MonthlyData {
  salaries: {
    [key: string]: {
      amount: number;
      usdRate: number;
    };
  };
  expenses: Expense[];
  extraIncomes: ExtraIncome[];
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
};

export function useExpenseTracker() {
  const [activeTab, setActiveTab] = useState("table");
  const [monthlyData, setMonthlyData] = useState<MonthlyData>({
    salaries: {},
    expenses: [],
    extraIncomes: [],
  });
  const [showSalaryForm, setShowSalaryForm] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), "yyyy-MM"));
  const [open, setOpen] = useState(false);
  const [openExtraIncome, setOpenExtraIncome] = useState(false);
  const [defaultDate, setDefaultDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [defaultIncomeDate, setDefaultIncomeDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  useEffect(() => {
    const loadInitialData = () => {
      const savedData = localStorage.getItem("monthlyData");
      if (savedData) {
        try {
          const parsedData = JSON.parse(savedData);
          if (
            parsedData &&
            typeof parsedData.salaries === "object" &&
            Array.isArray(parsedData.expenses)
          ) {
            setMonthlyData({
              ...parsedData,
              extraIncomes: parsedData.extraIncomes || [],
              expenses: parsedData.expenses || [],
            });
            setShowSalaryForm(!parsedData.salaries);
          }
        } catch (error) {
          console.error("Error loading initial data:", error);
        }
      }
    };

    loadInitialData();
  }, []);

  const filteredExpenses = monthlyData.expenses.filter((expense) => {
    const expenseDate = parse(expense.date, "yyyy-MM-dd", new Date());
    const monthStart = startOfMonth(parse(selectedMonth, "yyyy-MM", new Date()));
    const monthEnd = endOfMonth(monthStart);
    return expenseDate >= monthStart && expenseDate <= monthEnd;
  });

  const totalExpenses = filteredExpenses.reduce(
    (sum, expense) => sum + expense.amount,
    0
  );

  const availableMoney = monthlyData.salaries[selectedMonth]
    ? monthlyData.salaries[selectedMonth].amount - totalExpenses
    : 0;

  const savings = availableMoney > 0 ? availableMoney : 0;

  const handleAddExpense = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const baseExpense = {
      id: crypto.randomUUID(),
      date: formData.get("date") as string,
      name: formData.get("name") as string,
      amount: Number(formData.get("amount")),
      usdRate: Number(formData.get("usdRate")),
      category: formData.get("category") as Category,
    };

    const installments = Number(formData.get("installments"));
    let newExpenses: Expense[] = [];

    if (installments > 1) {
      // Crear gastos para cada cuota
      for (let i = 0; i < installments; i++) {
        const installmentDate = new Date(baseExpense.date);
        installmentDate.setMonth(installmentDate.getMonth() + i);

        newExpenses.push({
          ...baseExpense,
          id: crypto.randomUUID(),
          date: format(installmentDate, 'yyyy-MM-dd'),
          installments: {
            total: installments,
            current: i + 1,
            startDate: baseExpense.date,
          }
        });
      }
    } else {
      newExpenses = [baseExpense];
    }

    const updatedData = {
      ...monthlyData,
      expenses: [...monthlyData.expenses, ...newExpenses],
    };

    setMonthlyData(updatedData);
    localStorage.setItem("monthlyData", JSON.stringify(updatedData));
    setOpen(false);
    e.currentTarget.reset();
  };

  const handleSetSalary = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const updatedData = {
      ...monthlyData,
      salaries: {
        ...monthlyData.salaries,
        [selectedMonth]: {
          amount: Number(formData.get("salary")),
          usdRate: Number(formData.get("usdRate")),
        },
      },
    };

    setMonthlyData(updatedData);
    localStorage.setItem("monthlyData", JSON.stringify(updatedData));
    setShowSalaryForm(false);
  };

  const handleDeleteExpense = (expenseId: string) => {
    const updatedData = {
      ...monthlyData,
      expenses: monthlyData.expenses.filter((expense) => expense.id !== expenseId),
    };
    setMonthlyData(updatedData);
    localStorage.setItem("monthlyData", JSON.stringify(updatedData));
  };

  const handleAddExtraIncome = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newIncome: ExtraIncome = {
      id: crypto.randomUUID(),
      date: formData.get("date") as string,
      name: formData.get("name") as string,
      amount: Number(formData.get("amount")),
      usdRate: Number(formData.get("usdRate")),
    };

    const updatedData = {
      ...monthlyData,
      extraIncomes: [...monthlyData.extraIncomes, newIncome],
    };

    setMonthlyData(updatedData);
    localStorage.setItem("monthlyData", JSON.stringify(updatedData));
    setOpenExtraIncome(false);
    e.currentTarget.reset();
  };

  const calculateTotalAvailable = () => {
    const totalSalaries = Object.values(monthlyData.salaries).reduce(
      (sum, salary) => sum + salary.amount,
      0
    );
    const totalExtraIncomes = (monthlyData.extraIncomes || []).reduce(
      (sum, income) => sum + income.amount,
      0
    );
    const totalExpenses = (monthlyData.expenses || []).reduce(
      (sum, expense) => sum + expense.amount,
      0
    );
    return totalSalaries + totalExtraIncomes - totalExpenses;
  };

  const handleDeleteIncome = (incomeId: string) => {
    const updatedData = {
      ...monthlyData,
      extraIncomes: monthlyData.extraIncomes.filter(
        (income) => income.id !== incomeId
      ),
    };
    setMonthlyData(updatedData);
    localStorage.setItem("monthlyData", JSON.stringify(updatedData));
  };

  const filteredIncomes = monthlyData.extraIncomes.filter((income) => {
    const incomeDate = parse(income.date, "yyyy-MM-dd", new Date());
    const monthStart = startOfMonth(parse(selectedMonth, "yyyy-MM", new Date()));
    const monthEnd = endOfMonth(monthStart);
    return incomeDate >= monthStart && incomeDate <= monthEnd;
  });

  const handleOpenModal = () => {
    setDefaultDate(format(new Date(), 'yyyy-MM-dd'));
    setOpen(true);
  };

  const handleOpenIncomeModal = () => {
    setDefaultIncomeDate(format(new Date(), 'yyyy-MM-dd'));
    setOpenExtraIncome(true);
  };

  return {
    activeTab,
    setActiveTab,
    monthlyData,
    showSalaryForm,
    setShowSalaryForm,
    selectedMonth,
    setSelectedMonth,
    filteredExpenses,
    totalExpenses,
    availableMoney,
    savings,
    open,
    setOpen,
    defaultDate,
    defaultIncomeDate,
    handleOpenModal,
    handleOpenIncomeModal,
    openExtraIncome,
    setOpenExtraIncome,
    handleAddExpense,
    handleSetSalary,
    handleDeleteExpense,
    handleAddExtraIncome,
    calculateTotalAvailable,
    handleDeleteIncome,
    filteredIncomes,
  };
}

export type { Category, Expense, ExtraIncome, MonthlyData }; 