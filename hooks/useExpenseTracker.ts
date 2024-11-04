import { useState, useEffect } from "react";
import { format, parse, startOfMonth, endOfMonth, getYear } from "date-fns";

// Types
type Category =
  | "Alquiler"
  | "Supermercado"
  | "Entretenimiento"
  | "Salidas"
  | "Vacaciones"
  | "Servicios"
  | "Vestimenta"
  | "Subscripciones"
  | "Insumos"
  | "Otros";

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
  Insumos: { color: "bg-cyan-500" },
  Otros: { color: "bg-slate-500" },
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
  const [selectedYear, setSelectedYear] = useState(getYear(new Date()).toString());
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [editingIncome, setEditingIncome] = useState<ExtraIncome | null>(null);

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

  const getAvailableYears = () => {
    const years = new Set<string>();
    const currentYear = getYear(new Date());
    
    // Añadir el año actual y el anterior por defecto
    years.add(currentYear.toString());
    years.add((currentYear - 1).toString());

    // Añadir años de los datos existentes
    Object.keys(monthlyData.salaries).forEach(monthKey => {
      const year = monthKey.split('-')[0];
      years.add(year);
    });

    monthlyData.expenses.forEach(expense => {
      const year = expense.date.split('-')[0];
      years.add(year);
    });

    monthlyData.extraIncomes.forEach(income => {
      const year = income.date.split('-')[0];
      years.add(year);
    });

    return Array.from(years).sort().reverse();
  };

  const filteredExpenses = monthlyData.expenses.filter((expense) => {
    const expenseDate = parse(expense.date, "yyyy-MM-dd", new Date());
    const monthStart = startOfMonth(parse(`${selectedYear}-${selectedMonth.split('-')[1]}`, "yyyy-MM", new Date()));
    const monthEnd = endOfMonth(monthStart);
    return expenseDate >= monthStart && expenseDate <= monthEnd;
  });

  const totalExpenses = filteredExpenses.reduce(
    (sum, expense) => sum + expense.amount,
    0
  );

  const getCurrentMonthKey = () => `${selectedYear}-${selectedMonth.split('-')[1]}`;

  const availableMoney = monthlyData.salaries[getCurrentMonthKey()]
    ? monthlyData.salaries[getCurrentMonthKey()].amount - totalExpenses
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
    const monthStart = startOfMonth(parse(`${selectedYear}-${selectedMonth.split('-')[1]}`, "yyyy-MM", new Date()));
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

  const handleEditExpense = (expenseToEdit: Expense) => {
    setEditingExpense(expenseToEdit);
    setOpen(true);
  };

  const handleUpdateExpense = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    if (!editingExpense) return;

    const updatedExpense = {
      ...editingExpense,
      date: formData.get("date") as string,
      name: formData.get("name") as string,
      amount: Number(formData.get("amount")),
      usdRate: Number(formData.get("usdRate")),
      category: formData.get("category") as Category,
    };

    const updatedData = {
      ...monthlyData,
      expenses: monthlyData.expenses.map((expense) =>
        expense.id === editingExpense.id ? updatedExpense : expense
      ),
    };

    setMonthlyData(updatedData);
    localStorage.setItem("monthlyData", JSON.stringify(updatedData));
    setOpen(false);
    setEditingExpense(null);
    e.currentTarget.reset();
  };

  const handleCloseModal = () => {
    setOpen(false);
    setEditingExpense(null);
  };

  const handleEditIncome = (incomeToEdit: ExtraIncome) => {
    setEditingIncome(incomeToEdit);
    setOpenExtraIncome(true);
  };

  const handleUpdateIncome = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    if (!editingIncome) return;

    const updatedIncome = {
      ...editingIncome,
      date: formData.get("date") as string,
      name: formData.get("name") as string,
      amount: Number(formData.get("amount")),
      usdRate: Number(formData.get("usdRate")),
    };

    const updatedData = {
      ...monthlyData,
      extraIncomes: monthlyData.extraIncomes.map((income) =>
        income.id === editingIncome.id ? updatedIncome : income
      ),
    };

    setMonthlyData(updatedData);
    localStorage.setItem("monthlyData", JSON.stringify(updatedData));
    setOpenExtraIncome(false);
    setEditingIncome(null);
    e.currentTarget.reset();
  };

  const handleCloseIncomeModal = () => {
    setOpenExtraIncome(false);
    setEditingIncome(null);
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
    setOpen: handleCloseModal,
    defaultDate,
    defaultIncomeDate,
    handleOpenModal,
    handleOpenIncomeModal,
    openExtraIncome,
    setOpenExtraIncome: handleCloseIncomeModal,
    handleAddExpense,
    handleSetSalary,
    handleDeleteExpense,
    handleAddExtraIncome,
    calculateTotalAvailable,
    handleDeleteIncome,
    filteredIncomes,
    selectedYear,
    setSelectedYear,
    getAvailableYears,
    editingExpense,
    setEditingExpense,
    handleEditExpense,
    handleUpdateExpense,
    editingIncome,
    setEditingIncome,
    handleEditIncome,
    handleUpdateIncome,
  };
}

export type { Category, Expense, ExtraIncome, MonthlyData }; 