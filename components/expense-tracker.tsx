"use client";

import { useState, useEffect } from "react";
import {
  Plus,
  DollarSign,
  PieChart,
  Table as TableIcon,
  ChartNoAxesCombined,
  Coins,
  Settings,
  ArrowLeftRight,
} from "lucide-react";
import { format, lastDayOfMonth } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ResumenCard } from "@/components/resumen-card";
import { PatrimonioCard } from "@/components/patrimonio-card";
import { ConfigCard } from "@/components/config-card";
import { ExpensesTable } from "@/components/expenses-table";
import { CATEGORIES } from "@/constants/colors";
import IncomeTable from "./income-table";
import ChartsContainer from "./charts-container";
import { InvestmentsTable } from "@/components/investments-table";
import { InvestmentDialog } from "@/components/investment-dialog";
import { useMoneyTracker } from "@/hooks/useMoneyTracker";
import { CurrencyType } from "@/hooks/useMoneyTracker";
import type { ViewMode } from "@/hooks/usePayPeriod";
import { TransferDialog } from "@/components/transfer-dialog";
import { AdjustmentDialog } from "@/components/adjustment-dialog";
import { MovementsTable } from "@/components/movements-table";
import { UsdPurchaseDialog } from "./usd-purchase-dialog";
import { ExchangeSummary } from "./exchange-summary";
import { ThemeToggle } from "./theme-toggle";
import { cn } from "@/lib/utils";

function validateField(
  name: string,
  value: string
): string | undefined {
  const num = parseFloat(value);
  if (name === "amount") {
    if (isNaN(num) || num <= 0) return "El monto debe ser mayor a 0";
  }
  if (name === "usdRate") {
    if (isNaN(num) || num <= 0) return "La cotizacion USD debe ser mayor a 0";
  }
  return undefined;
}

export function ExpenseTracker() {
  const {
    activeTab,
    setActiveTab,
    monthlyData,
    // Salary history
    salaryHistory,
    incomeConfig,
    setIncomeConfig,
    addSalaryEntry,
    updateSalaryEntry,
    deleteSalaryEntry,
    getSalaryForMonth,
    selectedMonth,
    setSelectedMonth,
    filteredExpenses,
    totalExpenses,
    availableMoney,
    savings,
    open,
    setOpen,
    openExtraIncome,
    setOpenExtraIncome,
    handleAddExpense,
    handleSetSalary, // kept for legacy compat if needed
    handleDeleteExpense,
    handleAddExtraIncome,
    calculateDualBalances,
    globalUsdRate,
    setGlobalUsdRate,
    handleDeleteIncome,
    filteredIncomes,
    defaultDate,
    handleOpenModal,
    defaultIncomeDate,
    handleOpenIncomeModal,
    selectedYear,
    setSelectedYear,
    getAvailableYears,
    handleEditExpense,
    editingExpense,
    handleUpdateExpense,
    editingIncome,
    handleEditIncome,
    handleUpdateIncome,
    filteredInvestments,
    handleEditInvestment,
    handleDeleteInvestment,
    handleOpenInvestmentModal,
    handleCloseInvestmentModal,
    openInvestment,
    setOpenInvestment,
    defaultInvestmentDate,
    editingInvestment,
    handleAddInvestment,
    handleUpdateInvestment,
    // New investment operations (wired for 02-04 InvestmentsTable rewrite)
    handleAddMovement,
    handleDeleteMovement,
    handleUpdateValue,
    handleFinalizeInvestment,
    handleUpdatePFFields,
    // Aguinaldo operations
    setAguinaldoOverride,
    clearAguinaldoOverride,
    getAguinaldoForMonth,
    getAguinaldoPreviewForMonth,
    // USD purchase operations
    handleBuyUsd,
    handleRegisterUntrackedUsd,
    handleDeleteUsdPurchase,
    calculateExchangeGainLoss,
    // Retroactive rate editing
    handleUpdateUsdRate,
    handleUpdateIncomeUsdRate,
    // View mode
    viewMode,
    setViewMode,
    // Transfers
    handleAddTransfer,
    handleDeleteTransfer,
    handleCreateAdjustment,
    filteredTransfers,
  } = useMoneyTracker();

  // Aguinaldo computed props (dependiente only)
  const aguinaldoData = incomeConfig.employmentType === "dependiente"
    ? getAguinaldoForMonth(selectedMonth)
    : null;
  const aguinaldoPreviewData = incomeConfig.employmentType === "dependiente"
    ? getAguinaldoPreviewForMonth(selectedMonth)
    : null;

  // Compute Resumen card line items from existing hook data
  const currentMonthSalary = getSalaryForMonth(selectedMonth, monthlyData.salaryOverrides || {});
  const dualBalancesForCards = calculateDualBalances();

  // Otros ingresos: sum of ARS extra incomes for current period
  const otrosIngresosArs = filteredIncomes
    .filter((i: any) => i.currencyType !== CurrencyType.USD)
    .reduce((sum: number, i: any) => sum + i.amount, 0);

  // Pendiente de cobro logic
  const today = new Date();
  const currentRealMonth = format(today, "yyyy-MM");
  const isCurrentMonth = selectedMonth === currentRealMonth;
  const payDayThisMonth = Math.min(incomeConfig.payDay, lastDayOfMonth(today).getDate());
  const isPendiente = viewMode === "mes" && isCurrentMonth && today.getDate() < payDayThisMonth;

  // USD purchase dialog state
  const [usdPurchaseOpen, setUsdPurchaseOpen] = useState(false);

  // Transfer dialog state
  const [openTransferDialog, setOpenTransferDialog] = useState(false);

  // Adjustment dialog state
  const [openAdjustmentDialog, setOpenAdjustmentDialog] = useState(false);

  // Form validation state
  const [expenseErrors, setExpenseErrors] = useState<Record<string, string>>({});
  const [incomeErrors, setIncomeErrors] = useState<Record<string, string>>({});

  // Settings dialog state
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  // Last used USD rate from localStorage
  const [lastUsedUsdRate, setLastUsedUsdRate] = useState<string>("");

  useEffect(() => {
    const stored = localStorage.getItem("lastUsedUsdRate");
    if (stored) setLastUsedUsdRate(stored);
  }, []);

  // Reset errors when dialogs close
  useEffect(() => {
    if (!open) setExpenseErrors({});
  }, [open]);

  useEffect(() => {
    if (!openExtraIncome) setIncomeErrors({});
  }, [openExtraIncome]);

  const handleExpenseBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const error = validateField(name, value);
    setExpenseErrors((prev) => {
      const next = { ...prev };
      if (error) next[name] = error;
      else delete next[name];
      return next;
    });
  };

  const handleIncomeBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const error = validateField(name, value);
    setIncomeErrors((prev) => {
      const next = { ...prev };
      if (error) next[name] = error;
      else delete next[name];
      return next;
    });
  };

  const handleExpenseSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    const formData = new FormData(e.currentTarget);
    const usdRate = parseFloat(formData.get("usdRate") as string);
    if (usdRate > 0) {
      localStorage.setItem("lastUsedUsdRate", String(usdRate));
      setLastUsedUsdRate(String(usdRate));
    }
    if (editingExpense) {
      handleUpdateExpense(e);
    } else {
      handleAddExpense(e);
    }
  };

  const handleIncomeSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    const formData = new FormData(e.currentTarget);
    const usdRate = parseFloat(formData.get("usdRate") as string);
    if (usdRate > 0) {
      localStorage.setItem("lastUsedUsdRate", String(usdRate));
      setLastUsedUsdRate(String(usdRate));
    }
    if (editingIncome) {
      handleUpdateIncome(e);
    } else {
      handleAddExtraIncome(e);
    }
  };

  const handleResetAllData = () => {
    localStorage.removeItem("monthlyData");
    localStorage.removeItem("lastUsedUsdRate");
    window.location.reload();
  };

  const expenseHasErrors = Object.keys(expenseErrors).length > 0;
  const incomeHasErrors = Object.keys(incomeErrors).length > 0;

  return (
    <div className=" p-4 ">
      <div className="mx-auto max-w-7xl space-y-8 ">
        <div className="flex items-center gap-10">
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-auto"
          >
            <TabsList>
              <TabsTrigger value="table">
                <Coins className="mr-2 h-4 w-4" />
                Gastos
              </TabsTrigger>
              <TabsTrigger value="incomes">
                <DollarSign className="mr-2 h-4 w-4" />
                Ingresos
              </TabsTrigger>
              <TabsTrigger value="investments">
                <ChartNoAxesCombined className="mr-2 h-4 w-4" />
                Inversiones
              </TabsTrigger>
              <TabsTrigger value="charts">
                <PieChart className="mr-2 h-4 w-4" />
                Charts
              </TabsTrigger>
              <TabsTrigger value="movements">
                <ArrowLeftRight className="h-4 w-4 mr-1" />
                Movimientos
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="flex gap-2 ">
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="w-[120px] bg-background">
                <SelectValue placeholder="Ano" />
              </SelectTrigger>
              <SelectContent>
                {getAvailableYears().map((year) => (
                  <SelectItem key={year} value={year}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-[180px] bg-background">
                <SelectValue className="" placeholder="Seleccionar mes" />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 12 }, (_, i) => {
                  const date = new Date(Number(selectedYear), i, 1);
                  return (
                    <SelectItem key={i} value={format(date, "yyyy-MM")}>
                      {format(date, "MMMM yyyy")}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)}>
              <TabsList className="grid w-[200px] grid-cols-2">
                <TabsTrigger value="periodo">Periodo</TabsTrigger>
                <TabsTrigger value="mes">Mes</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Dialog
              open={settingsOpen}
              onOpenChange={(open) => {
                setSettingsOpen(open);
                if (!open) setConfirmReset(false);
              }}
            >
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Settings className="h-5 w-5" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Configuracion</DialogTitle>
                  <DialogDescription>
                    Opciones generales de la aplicacion
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  {!confirmReset ? (
                    <Button
                      variant="destructive"
                      onClick={() => setConfirmReset(true)}
                    >
                      Borrar todos los datos
                    </Button>
                  ) : (
                    <div className="space-y-3 rounded-md border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950">
                      <p className="text-sm font-medium text-red-800 dark:text-red-200">
                        Estas seguro? Esto eliminara todos tus datos financieros.
                      </p>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setConfirmReset(false)}
                        >
                          Cancelar
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={handleResetAllData}
                        >
                          Confirmar
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>
            <ThemeToggle />
          </div>
        </div>

        <div className="grid gap-8 md:grid-cols-[1fr_300px]">
          <Tabs value={activeTab} className="space-y-4">
            <TabsContent value="table" className="mt-0">
              <Card>
                <CardHeader className="flex flex-row items-start justify-between">
                  <CardTitle>Gastos del Mes</CardTitle>
                </CardHeader>
                <CardContent>
                  <ExpensesTable
                    expenses={filteredExpenses}
                    onDeleteExpense={handleDeleteExpense}
                    onEditExpense={handleEditExpense}
                    onUpdateUsdRate={handleUpdateUsdRate}
                  />
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="incomes" className="mt-0">
              <Card>
                <CardHeader className="flex flex-row items-start justify-between">
                  <CardTitle>Otros ingresos del Mes</CardTitle>
                </CardHeader>
                <CardContent>
                  <IncomeTable
                    incomes={filteredIncomes}
                    onDeleteIncome={handleDeleteIncome}
                    onEditIncome={handleEditIncome}
                    onUpdateUsdRate={handleUpdateIncomeUsdRate}
                  />
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="investments" className="mt-0">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle>Inversiones</CardTitle>
                </CardHeader>
                <CardContent>
                  <InvestmentsTable
                    investments={filteredInvestments}
                    onEdit={handleEditInvestment}
                    onDelete={handleDeleteInvestment}
                    onAddMovement={handleAddMovement}
                    onDeleteMovement={handleDeleteMovement}
                    onUpdateValue={handleUpdateValue}
                    onFinalize={handleFinalizeInvestment}
                    onUpdatePFFields={handleUpdatePFFields}
                  />
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="charts" className="mt-0">
              <Card>
                <CardHeader>
                  <CardTitle>Graficos</CardTitle>
                  <CardDescription>
                    Visualizacion de gastos por categoria
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <ChartsContainer
                    monthlyData={monthlyData}
                    selectedYear={selectedYear}
                  />
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="movements" className="mt-0">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle>Movimientos</CardTitle>
                  <Button size="sm" onClick={() => setOpenTransferDialog(true)}>
                    <ArrowLeftRight className="h-4 w-4 mr-1" />
                    Nuevo movimiento
                  </Button>
                </CardHeader>
                <CardContent>
                  <MovementsTable
                    transfers={filteredTransfers}
                    onDeleteTransfer={handleDeleteTransfer}
                    globalUsdRate={globalUsdRate}
                  />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <div className="flex flex-col gap-4">
            <ResumenCard
              ingresoFijo={currentMonthSalary.amount}
              ingresoFijoIsOverride={currentMonthSalary.isOverride}
              otrosIngresos={otrosIngresosArs}
              aguinaldoAmount={aguinaldoData?.amount ?? null}
              aguinaldoInfo={
                aguinaldoData
                  ? { bestSalary: aguinaldoData.bestSalary, isOverride: aguinaldoData.isOverride }
                  : null
              }
              totalGastos={totalExpenses}
              aportesInversiones={dualBalancesForCards.arsInvestmentContributions}
              disponible={availableMoney}
              isPendiente={isPendiente}
              payDay={incomeConfig.payDay}
              aguinaldoPreview={aguinaldoPreviewData}
              onSetAguinaldoOverride={setAguinaldoOverride}
              onClearAguinaldoOverride={clearAguinaldoOverride}
              selectedMonth={selectedMonth}
            />
            <PatrimonioCard
              arsBalance={dualBalancesForCards.arsBalance}
              usdBalance={dualBalancesForCards.usdBalance}
              arsInvestments={dualBalancesForCards.arsInvestments}
              usdInvestments={dualBalancesForCards.usdInvestments}
              globalUsdRate={globalUsdRate}
            />
            <ConfigCard
              incomeConfig={incomeConfig}
              onUpdateIncomeConfig={setIncomeConfig}
              globalUsdRate={globalUsdRate}
              onSetGlobalUsdRate={setGlobalUsdRate}
              salaryHistory={salaryHistory.entries}
              onAddSalaryEntry={addSalaryEntry}
              onUpdateSalaryEntry={updateSalaryEntry}
              onDeleteSalaryEntry={deleteSalaryEntry}
              selectedMonth={selectedMonth}
              onAdjustBalance={() => setOpenAdjustmentDialog(true)}
            />

            <ExchangeSummary
              usdPurchases={monthlyData.usdPurchases || []}
              globalUsdRate={globalUsdRate}
              exchangeGainLoss={calculateExchangeGainLoss()}
              onDelete={handleDeleteUsdPurchase}
            />

            <div className="flex flex-col gap-2">
              <Button
                variant="outline"
                onClick={() => setUsdPurchaseOpen(true)}
              >
                <DollarSign className="mr-2 h-4 w-4" />
                Comprar/Registrar USD
              </Button>
              <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                  <Button onClick={handleOpenModal}>
                    <Plus className="mr-2 h-4 w-4" />
                    {editingExpense ? "Editar Gasto" : "Gasto"}
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>
                      {editingExpense ? "Editar Gasto" : "Agregar Nuevo Gasto"}
                    </DialogTitle>
                  </DialogHeader>
                  <form
                    onSubmit={handleExpenseSubmit}
                    className="space-y-4"
                    key={open ? "open" : "closed"}
                  >
                    <Input
                      type="date"
                      name="date"
                      defaultValue={
                        editingExpense ? editingExpense.date : defaultDate
                      }
                      required
                    />
                    <Input
                      placeholder="Nombre del gasto"
                      name="name"
                      defaultValue={editingExpense?.name}
                      required
                    />
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <Input
                          type="number"
                          placeholder="Monto"
                          name="amount"
                          step="0.01"
                          defaultValue={editingExpense?.amount}
                          onBlur={handleExpenseBlur}
                          className={cn(expenseErrors.amount && "border-red-500")}
                          required
                        />
                        {expenseErrors.amount && (
                          <p className="mt-1 text-xs text-red-500">
                            {expenseErrors.amount}
                          </p>
                        )}
                      </div>
                      <div>
                        <Input
                          type="number"
                          placeholder="Valor USD"
                          name="usdRate"
                          step="0.01"
                          defaultValue={
                            editingExpense?.usdRate ??
                            (lastUsedUsdRate || undefined)
                          }
                          onBlur={handleExpenseBlur}
                          className={cn(
                            expenseErrors.usdRate && "border-red-500"
                          )}
                          required
                        />
                        {expenseErrors.usdRate && (
                          <p className="mt-1 text-xs text-red-500">
                            {expenseErrors.usdRate}
                          </p>
                        )}
                      </div>
                      <Select
                        name="currencyType"
                        defaultValue={
                          editingExpense?.currencyType || CurrencyType.ARS
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Moneda" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={CurrencyType.ARS}>ARS</SelectItem>
                          <SelectItem value={CurrencyType.USD}>USD</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex gap-2">
                      <Select
                        name="category"
                        defaultValue={editingExpense?.category}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Categoria" />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.keys(CATEGORIES).map((category) => (
                            <SelectItem key={category} value={category}>
                              {category}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input
                        type="number"
                        placeholder="Cuotas (opcional)"
                        name="installments"
                        min="1"
                        defaultValue={editingExpense?.installments?.total}
                      />
                    </div>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span tabIndex={0} className="inline-block">
                            <Button
                              type="submit"
                              disabled={expenseHasErrors}
                              className={cn(
                                expenseHasErrors && "pointer-events-none"
                              )}
                            >
                              {editingExpense ? "Guardar Cambios" : "Agregar"}
                            </Button>
                          </span>
                        </TooltipTrigger>
                        {expenseHasErrors && (
                          <TooltipContent>
                            <p>Corrige los campos marcados en rojo</p>
                          </TooltipContent>
                        )}
                      </Tooltip>
                    </TooltipProvider>
                  </form>
                </DialogContent>
              </Dialog>

              <Dialog open={openExtraIncome} onOpenChange={setOpenExtraIncome}>
                <DialogTrigger asChild>
                  <Button variant="outline" onClick={handleOpenIncomeModal}>
                    <Plus className="mr-2 h-4 w-4" />
                    {editingIncome ? "Editar Ingreso" : "Otros ingresos"}
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>
                      {editingIncome
                        ? "Editar Ingreso"
                        : "Agregar Nuevo Ingreso"}
                    </DialogTitle>
                  </DialogHeader>
                  <form
                    onSubmit={handleIncomeSubmit}
                    className="space-y-4"
                    key={openExtraIncome ? "open" : "closed"}
                  >
                    <Input
                      type="date"
                      name="date"
                      defaultValue={
                        editingIncome ? editingIncome.date : defaultIncomeDate
                      }
                      required
                    />
                    <Input
                      placeholder="Descripcion (ej: Regalo, Ahorro)"
                      name="name"
                      defaultValue={editingIncome?.name}
                      required
                    />
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <Input
                          type="number"
                          placeholder="Monto"
                          name="amount"
                          step="0.01"
                          defaultValue={editingIncome?.amount}
                          onBlur={handleIncomeBlur}
                          className={cn(incomeErrors.amount && "border-red-500")}
                          required
                        />
                        {incomeErrors.amount && (
                          <p className="mt-1 text-xs text-red-500">
                            {incomeErrors.amount}
                          </p>
                        )}
                      </div>
                      <div>
                        <Input
                          type="number"
                          placeholder="Valor USD"
                          name="usdRate"
                          step="0.01"
                          defaultValue={
                            editingIncome?.usdRate ??
                            (lastUsedUsdRate || undefined)
                          }
                          onBlur={handleIncomeBlur}
                          className={cn(
                            incomeErrors.usdRate && "border-red-500"
                          )}
                          required
                        />
                        {incomeErrors.usdRate && (
                          <p className="mt-1 text-xs text-red-500">
                            {incomeErrors.usdRate}
                          </p>
                        )}
                      </div>
                      <Select
                        name="currencyType"
                        defaultValue={
                          editingIncome?.currencyType || CurrencyType.ARS
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Moneda" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={CurrencyType.ARS}>ARS</SelectItem>
                          <SelectItem value={CurrencyType.USD}>USD</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span tabIndex={0} className="inline-block">
                            <Button
                              type="submit"
                              disabled={incomeHasErrors}
                              className={cn(
                                incomeHasErrors && "pointer-events-none"
                              )}
                            >
                              {editingIncome ? "Guardar Cambios" : "Agregar"}
                            </Button>
                          </span>
                        </TooltipTrigger>
                        {incomeHasErrors && (
                          <TooltipContent>
                            <p>Corrige los campos marcados en rojo</p>
                          </TooltipContent>
                        )}
                      </Tooltip>
                    </TooltipProvider>
                  </form>
                </DialogContent>
              </Dialog>
              <Button variant="outline" onClick={handleOpenInvestmentModal}>
                <Plus className="mr-2 h-4 w-4" />
                Inversion
              </Button>
            </div>
          </div>
        </div>
      </div>
      <InvestmentDialog
        open={openInvestment}
        onOpenChange={setOpenInvestment}
        onAdd={handleAddInvestment}
        onUpdate={handleUpdateInvestment}
        onClose={handleCloseInvestmentModal}
        defaultInvestmentDate={defaultInvestmentDate}
        editingInvestment={editingInvestment}
      />
      <UsdPurchaseDialog
        open={usdPurchaseOpen}
        onOpenChange={setUsdPurchaseOpen}
        onBuyUsd={handleBuyUsd}
        onRegisterUntracked={handleRegisterUntrackedUsd}
        defaultDate={defaultDate}
        globalUsdRate={globalUsdRate}
      />
      <TransferDialog
        open={openTransferDialog}
        onOpenChange={setOpenTransferDialog}
        onAddTransfer={handleAddTransfer}
        defaultDate={defaultDate}
        globalUsdRate={globalUsdRate}
      />
      <AdjustmentDialog
        open={openAdjustmentDialog}
        onOpenChange={setOpenAdjustmentDialog}
        onCreateAdjustment={handleCreateAdjustment}
        arsBalance={dualBalancesForCards.arsBalance}
        usdBalance={dualBalancesForCards.usdBalance}
      />
    </div>
  );
}
