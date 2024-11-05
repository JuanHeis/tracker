"use client";

import {
  Plus,
  DollarSign,
  PieChart,
  Table as TableIcon,
  ChartNoAxesCombined,
} from "lucide-react";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SalaryCard } from "@/components/salary-card";
import { ExpensesTable } from "@/components/expenses-table";
import { CATEGORIES } from "@/hooks/useMoneyTracker";
import IncomeTable from "./income-table";
import ChartsContainer from "./charts-container";
import { InvestmentsTable } from "@/components/investments-table";
import { InvestmentDialog } from "@/components/investment-dialog";
import { useMoneyTracker } from "@/hooks/useMoneyTracker";
import { CurrencyType } from "@/hooks/useMoneyTracker";
import { TotalAmounts } from "./total-amounts";

export function ExpenseTracker() {
  const {
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
    openExtraIncome,
    setOpenExtraIncome,
    handleAddExpense,
    handleSetSalary,
    handleDeleteExpense,
    handleAddExtraIncome,
    calculateTotalAvailable,
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
  } = useMoneyTracker();

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-7xl space-y-4">
        <div className="flex items-center gap-10">
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-[400px]"
          >
            <TabsList>
              <TabsTrigger value="table">
                <TableIcon className="mr-2 h-4 w-4" />
                Tabla
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
            </TabsList>
          </Tabs>
          <div className="flex gap-2">
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Año" />
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
              <SelectTrigger className="w-[180px]">
                <SelectValue className="" placeholder="Seleccionar mes" />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 12 }, (_, i) => {
                  const date = new Date(Number(selectedYear), i, 1);
                  return (
                    <SelectItem
                      className=""
                      key={i}
                      value={format(date, "yyyy-MM")}
                    >
                      {format(date, "MMMM yyyy")}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-[1fr_300px]">
          <Tabs value={activeTab} className="space-y-4">
            <TabsContent value="table" className="mt-0">
              <Card>
                <CardHeader className="flex flex-row items-start justify-between">
                  <CardTitle>Gastos del Mes</CardTitle>
                </CardHeader>
                <CardContent>
                  <ExpensesTable
                    expenses={filteredExpenses}
                    categories={CATEGORIES}
                    onDeleteExpense={handleDeleteExpense}
                    onEditExpense={handleEditExpense}
                  />
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="incomes" className="mt-0">
              <Card>
                <CardHeader className="flex flex-row items-start justify-between">
                  <CardTitle>Ingresos extras del Mes</CardTitle>
                </CardHeader>
                <CardContent>
                  <IncomeTable
                    incomes={filteredIncomes}
                    onDeleteIncome={handleDeleteIncome}
                    onEditIncome={handleEditIncome}
                  />
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="investments" className="mt-0">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Inversiones
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <InvestmentsTable
                    investments={filteredInvestments}
                    onEdit={handleEditInvestment}
                    onDelete={handleDeleteInvestment}
                  />
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="charts" className="mt-0">
              <Card>
                <CardHeader>
                  <CardTitle>Gráficos</CardTitle>
                  <CardDescription>
                    Visualización de gastos por categoría
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
          </Tabs>

          <div className="flex flex-col gap-4">
            <SalaryCard
              selectedMonth={selectedMonth}
              monthlyData={monthlyData}
              showSalaryForm={showSalaryForm}
              totalExpenses={totalExpenses}
              availableMoney={availableMoney}
              savings={savings}
              onSalarySubmit={handleSetSalary}
              onShowFormChange={setShowSalaryForm}
            />
            <Card className="h-fit">
              <CardHeader>
                <CardTitle>Dinero disponible (Todos los meses)</CardTitle>
              </CardHeader>
              <TotalAmounts
                availableForUse={calculateTotalAvailable().availableForUse}
                blockedInInvestments={
                  calculateTotalAvailable().blockedInInvestments
                }
                total={calculateTotalAvailable().total}
              />
            </Card>

            <div className="flex flex-col gap-2">
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
                    onSubmit={
                      editingExpense ? handleUpdateExpense : handleAddExpense
                    }
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
                      <Input
                        type="number"
                        placeholder="Monto"
                        name="amount"
                        step="0.01"
                        defaultValue={editingExpense?.amount}
                        required
                      />
                      <Input
                        type="number"
                        placeholder="Valor USD"
                        name="usdRate"
                        step="0.01"
                        defaultValue={editingExpense?.usdRate}
                        required
                      />
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
                          <SelectValue placeholder="Categoría" />
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
                        disabled={!!editingExpense}
                      />
                    </div>
                    <Button type="submit">
                      {editingExpense ? "Guardar Cambios" : "Agregar"}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>

              <Dialog open={openExtraIncome} onOpenChange={setOpenExtraIncome}>
                <DialogTrigger asChild>
                  <Button variant="outline" onClick={handleOpenIncomeModal}>
                    <Plus className="mr-2 h-4 w-4" />
                    {editingIncome ? "Editar Ingreso" : "Ingresos Extra"}
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>
                      {editingIncome
                        ? "Editar Ingreso"
                        : "Agregar Nuevo Ingreso Extra"}
                    </DialogTitle>
                  </DialogHeader>
                  <form
                    onSubmit={
                      editingIncome ? handleUpdateIncome : handleAddExtraIncome
                    }
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
                      placeholder="Descripción (ej: Regalo, Ahorro)"
                      name="name"
                      defaultValue={editingIncome?.name}
                      required
                    />
                    <div className="grid grid-cols-3 gap-2">
                      <Input
                        type="number"
                        placeholder="Monto"
                        name="amount"
                        step="0.01"
                        defaultValue={editingIncome?.amount}
                        required
                      />
                      <Input
                        type="number"
                        placeholder="Valor USD"
                        name="usdRate"
                        step="0.01"
                        defaultValue={editingIncome?.usdRate}
                        required
                      />
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
                    <Button type="submit">
                      {editingIncome ? "Guardar Cambios" : "Agregar"}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
              <Button variant="outline" onClick={handleOpenInvestmentModal}>
                <Plus className="mr-2 h-4 w-4" />
                Inversión
              </Button>
            </div>
          </div>
        </div>
      </div>
      <InvestmentDialog
        open={openInvestment}
        onOpenChange={setOpenInvestment}
        onSubmit={
          editingInvestment ? handleUpdateInvestment : handleAddInvestment
        }
        onClose={handleCloseInvestmentModal}
        onEdit={handleEditInvestment}
        defaultInvestmentDate={defaultInvestmentDate}
        editingInvestment={editingInvestment}
      />
    </div>
  );
}
