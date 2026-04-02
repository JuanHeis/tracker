"use client";

import { useState } from "react";
import { Plus, Target } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FormattedAmount } from "@/components/formatted-amount";
import { BudgetRow } from "@/components/budget-row";
import { BudgetDialog } from "@/components/budget-dialog";
import type { Category } from "@/hooks/useMoneyTracker";
import type { BudgetProgress } from "@/hooks/useBudgetTracker";

interface BudgetTabProps {
  budgetProgress: BudgetProgress[];
  totalBudgeted: number;
  totalSpent: number;
  categoriesWithoutBudget: Category[];
  onAdd: (category: Category, limit: number) => void;
  onUpdate: (category: Category, limit: number) => void;
  onDelete: (category: Category) => void;
}

export function BudgetTab({
  budgetProgress,
  totalBudgeted,
  totalSpent,
  categoriesWithoutBudget,
  onAdd,
  onUpdate,
  onDelete,
}: BudgetTabProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<{
    category: Category;
    limit: number;
  } | null>(null);

  const handleEdit = (category: Category, currentLimit: number) => {
    setEditingBudget({ category, limit: currentLimit });
    setDialogOpen(true);
  };

  const handleSave = (category: Category, limit: number) => {
    if (editingBudget) {
      onUpdate(category, limit);
    } else {
      onAdd(category, limit);
    }
    setEditingBudget(null);
  };

  const handleOpenCreate = () => {
    setEditingBudget(null);
    setDialogOpen(true);
  };

  const disponible = totalBudgeted - totalSpent;
  const aggregatePercentage =
    totalBudgeted > 0 ? (totalSpent / totalBudgeted) * 100 : 0;
  const aggregateBarColor =
    aggregatePercentage >= 100
      ? "rgb(239 68 68)"
      : aggregatePercentage >= 80
        ? "rgb(245 158 11)"
        : "rgb(59 130 246)";

  const hasBudgets = budgetProgress.length > 0;

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle>Presupuestos</CardTitle>
          <Button
            size="sm"
            variant="outline"
            onClick={handleOpenCreate}
            disabled={categoriesWithoutBudget.length === 0}
          >
            <Plus className="h-4 w-4 mr-1" />
            Agregar presupuesto
          </Button>
        </CardHeader>
        <CardContent>
          {hasBudgets ? (
            <div className="space-y-4">
              {/* Summary header */}
              <div className="space-y-2 rounded-lg border p-3">
                <div className="flex items-center gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">
                      Total presupuestado:{" "}
                    </span>
                    <FormattedAmount
                      value={totalBudgeted}
                      currency="$"
                      className="font-medium"
                    />
                  </div>
                  <span className="text-muted-foreground">|</span>
                  <div>
                    <span className="text-muted-foreground">Gastado: </span>
                    <FormattedAmount
                      value={totalSpent}
                      currency="$"
                      className="font-medium"
                    />
                  </div>
                  <span className="text-muted-foreground">|</span>
                  <div>
                    <span className="text-muted-foreground">
                      Disponible:{" "}
                    </span>
                    <FormattedAmount
                      value={disponible}
                      currency="$"
                      className={`font-medium ${
                        disponible >= 0 ? "text-green-600" : "text-red-500"
                      }`}
                    />
                  </div>
                </div>
                <div className="h-2 w-full rounded-full bg-muted">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${Math.min(aggregatePercentage, 100)}%`,
                      backgroundColor: aggregateBarColor,
                    }}
                  />
                </div>
              </div>

              {/* Budget rows */}
              <div className="divide-y">
                {budgetProgress.map((bp) => (
                  <BudgetRow
                    key={bp.category}
                    progress={bp}
                    onEdit={handleEdit}
                    onDelete={onDelete}
                  />
                ))}
              </div>
            </div>
          ) : (
            /* Empty state */
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Target className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">
                Sin presupuestos definidos
              </h3>
              <p className="text-muted-foreground mb-4">
                Define limites de gasto por categoria para controlar tus
                finanzas
              </p>
              <Button onClick={handleOpenCreate}>
                <Plus className="h-4 w-4 mr-1" /> Crear primer presupuesto
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <BudgetDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditingBudget(null);
        }}
        availableCategories={categoriesWithoutBudget}
        onSave={handleSave}
        editingBudget={editingBudget}
      />
    </>
  );
}
