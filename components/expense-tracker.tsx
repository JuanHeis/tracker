"use client";

import { Plus, DollarSign, PieChart, Table as TableIcon } from "lucide-react";
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
import { useExpenseTracker, CATEGORIES } from "@/hooks/useExpenseTracker";
import IncomeTable from "./income-table";

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
  } = useExpenseTracker();

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-7xl space-y-4">
        <div className="flex items-center justify-between">
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
              <TabsTrigger value="charts">
                <PieChart className="mr-2 h-4 w-4" />
                Charts
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Seleccionar mes" />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 12 }, (_, i) => {
                const date = new Date(new Date().getFullYear(), i, 1);
                return (
                  <SelectItem
                    className="text-primary"
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
                  />
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="incomes" className="mt-0">
              <IncomeTable
                incomes={filteredIncomes}
                onDeleteIncome={handleDeleteIncome}
              />
            </TabsContent>
            <TabsContent value="charts" className="mt-0">
              <Card>
                <CardHeader>
                  <CardTitle>Gráficos</CardTitle>
                  <CardDescription>
                    Visualización de gastos por categoría
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    Próximamente
                  </div>
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
                <CardTitle>Total Disponible (Todos los meses)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>Total Disponible:</span>
                    <span className="font-medium">
                      ARS {calculateTotalAvailable().toLocaleString()}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex flex-col gap-2">
              <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                  <Button onClick={handleOpenModal}>
                    <Plus className="mr-2 h-4 w-4" />
                    Nuevo Gasto
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Agregar Nuevo Gasto</DialogTitle>
                  </DialogHeader>
                  <form
                    onSubmit={handleAddExpense}
                    className="space-y-4"
                    key={open ? "open" : "closed"}
                  >
                    <Input
                      type="date"
                      name="date"
                      defaultValue={defaultDate}
                      required
                    />
                    <Input
                      placeholder="Nombre del gasto"
                      name="name"
                      required
                    />
                    <Input
                      type="number"
                      placeholder="Monto (ARS)"
                      name="amount"
                      step="0.01"
                      required
                    />
                    <Input
                      type="number"
                      placeholder="Valor USD"
                      name="usdRate"
                      step="0.01"
                      required
                    />
                    <Select name="category" required>
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
                    />
                    <Button type="submit">Agregar</Button>
                  </form>
                </DialogContent>
              </Dialog>

              <Dialog open={openExtraIncome} onOpenChange={setOpenExtraIncome}>
                <DialogTrigger asChild>
                  <Button variant="outline" onClick={handleOpenIncomeModal}>
                    <Plus className="mr-2 h-4 w-4" />
                    Nuevo Ingreso Extra
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Agregar Nuevo Ingreso Extra</DialogTitle>
                  </DialogHeader>
                  <form
                    onSubmit={handleAddExtraIncome}
                    className="space-y-4"
                    key={openExtraIncome ? "open" : "closed"}
                  >
                    <Input 
                      type="date" 
                      name="date" 
                      defaultValue={defaultIncomeDate}
                      required 
                    />
                    <Input
                      placeholder="Descripción (ej: Regalo, Ahorro)"
                      name="name"
                      required
                    />
                    <Input
                      type="number"
                      placeholder="Monto (ARS)"
                      name="amount"
                      step="0.01"
                      required
                    />
                    <Input
                      type="number"
                      placeholder="Valor USD"
                      name="usdRate"
                      step="0.01"
                      required
                    />
                    <Button type="submit">Agregar</Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
