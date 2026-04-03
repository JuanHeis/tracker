"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { CurrencyInput } from "@/components/currency-input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CATEGORIES } from "@/constants/colors";
import type { Category } from "@/hooks/useMoneyTracker";

interface BudgetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  availableCategories: Category[];
  onSave: (category: Category, limit: number) => void;
  editingBudget?: { category: Category; limit: number } | null;
}

export function BudgetDialog({
  open,
  onOpenChange,
  availableCategories,
  onSave,
  editingBudget,
}: BudgetDialogProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [limitValue, setLimitValue] = useState<string>("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      if (editingBudget) {
        setSelectedCategory(editingBudget.category);
        setLimitValue(String(editingBudget.limit));
      } else {
        setSelectedCategory("");
        setLimitValue("");
      }
      setErrors({});
    }
  }, [open, editingBudget]);

  const handleSave = () => {
    const limit = parseFloat(limitValue);
    const newErrors: Record<string, string> = {};

    if (isNaN(limit) || limit <= 0) {
      newErrors.limit = "El limite debe ser mayor a 0";
    }

    const category = editingBudget
      ? editingBudget.category
      : (selectedCategory as Category);
    if (!category) {
      newErrors.category = "Selecciona una categoria";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSave(category, limit);
    onOpenChange(false);
  };

  const isValid =
    (editingBudget ? true : selectedCategory !== "") &&
    parseFloat(limitValue) > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {editingBudget ? "Editar presupuesto" : "Agregar presupuesto"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          {editingBudget ? (
            <div className="flex items-center gap-2">
              <div
                className="h-3 w-3 rounded-full shrink-0"
                style={{
                  backgroundColor:
                    CATEGORIES[editingBudget.category]?.color ?? "#888",
                }}
              />
              <span className="font-medium">{editingBudget.category}</span>
            </div>
          ) : (
            <div className="space-y-1">
              <label className="text-sm font-medium">Categoria</label>
              <Select
                value={selectedCategory}
                onValueChange={(val) => {
                  setSelectedCategory(val);
                  setErrors((prev) => { const next = { ...prev }; delete next.category; return next; });
                }}
              >
                <SelectTrigger className={cn(errors.category && "border-red-500")}>
                  <SelectValue placeholder="Seleccionar categoria" />
                </SelectTrigger>
                <SelectContent>
                  {availableCategories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      <div className="flex items-center gap-2">
                        <div
                          className="h-2 w-2 rounded-full shrink-0"
                          style={{
                            backgroundColor:
                              CATEGORIES[cat]?.color ?? "#888",
                          }}
                        />
                        {cat}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.category && (
                <p className="text-xs text-red-500">{errors.category}</p>
              )}
            </div>
          )}
          <div className="space-y-1">
            <label className="text-sm font-medium">
              Limite mensual (ARS)
            </label>
            <CurrencyInput
              value={parseFloat(limitValue) || ""}
              onValueChange={(n) => {
                setLimitValue(String(n));
                setErrors((prev) => { const next = { ...prev }; delete next.limit; return next; });
              }}
              placeholder="Ej: 50000"
              className={cn(errors.limit && "border-red-500")}
            />
            {errors.limit && (
              <p className="text-xs text-red-500">{errors.limit}</p>
            )}
          </div>
          <Button onClick={handleSave} disabled={!isValid} className="w-full">
            {editingBudget ? "Guardar" : "Crear presupuesto"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
