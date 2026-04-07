"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { CurrencyInput } from "./currency-input";
import { Button } from "./ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { cn } from "@/lib/utils";
import { CATEGORIES } from "@/constants/colors";
import { CurrencyType } from "@/constants/investments";
import type { Category } from "@/hooks/useMoneyTracker";
import type { RecurringExpense } from "@/hooks/useRecurringExpenses";

interface RecurringDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (data: {
    name: string;
    amount: number;
    category: Category;
    currencyType: CurrencyType;
  }) => void;
  editingRecurring?: RecurringExpense | null;
  onEdit?: (id: string, data: {
    name: string;
    amount: number;
    category: Category;
    currencyType: CurrencyType;
  }) => void;
}

export function RecurringDialog({
  open,
  onOpenChange,
  onAdd,
  editingRecurring,
  onEdit,
}: RecurringDialogProps) {
  const [selectedCurrency, setSelectedCurrency] = useState<CurrencyType>(
    CurrencyType.ARS
  );
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isEditing = !!editingRecurring;

  // Sync state when editingRecurring changes
  useEffect(() => {
    if (editingRecurring) {
      setSelectedCurrency(editingRecurring.currencyType);
      setSelectedCategory(editingRecurring.category);
    }
  }, [editingRecurring]);

  // Reset when dialog closes
  useEffect(() => {
    if (!open) {
      setSelectedCurrency(CurrencyType.ARS);
      setSelectedCategory("");
      setErrors({});
    }
  }, [open]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = (formData.get("name") as string) || "";
    const amount = Number(formData.get("amount"));

    const newErrors: Record<string, string> = {};
    if (!name.trim()) {
      newErrors.name = "El nombre es requerido";
    }
    if (isNaN(amount) || amount <= 0) {
      newErrors.amount = "El monto debe ser mayor a 0";
    }
    if (!selectedCategory) {
      newErrors.category = "Selecciona una categoria";
    }
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const data = {
      name: name.trim(),
      amount,
      category: selectedCategory as Category,
      currencyType: selectedCurrency,
    };

    if (isEditing && onEdit) {
      onEdit(editingRecurring.id, data);
    } else {
      onAdd(data);
    }

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar gasto recurrente" : "Nuevo gasto recurrente"}</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={handleSubmit}
          className="space-y-4"
          key={open ? "open" : "closed"}
        >
          <div className="space-y-1">
            <Input
              type="text"
              name="name"
              placeholder="Nombre (ej: Netflix, Alquiler)"
              defaultValue={isEditing ? editingRecurring.name : undefined}
              className={cn(errors.name && "border-red-500")}
              onChange={() => setErrors((prev) => { const next = { ...prev }; delete next.name; return next; })}
              required
            />
            {errors.name && (
              <p className="text-xs text-red-500">{errors.name}</p>
            )}
          </div>
          <div className="space-y-1">
            <CurrencyInput
              name="amount"
              placeholder="Monto mensual"
              defaultValue={isEditing ? editingRecurring.amount : undefined}
              className={cn(errors.amount && "border-red-500")}
              onValueChange={() => setErrors((prev) => { const next = { ...prev }; delete next.amount; return next; })}
              required
            />
            {errors.amount && (
              <p className="text-xs text-red-500">{errors.amount}</p>
            )}
          </div>
          <div className="space-y-1">
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
                {Object.keys(CATEGORIES).map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.category && (
              <p className="text-xs text-red-500">{errors.category}</p>
            )}
          </div>
          <div className="flex gap-2">
              <Button
                type="button"
                variant={
                  selectedCurrency === CurrencyType.ARS ? "default" : "outline"
                }
                className="flex-1"
                onClick={() => setSelectedCurrency(CurrencyType.ARS)}
              >
                ARS
              </Button>
              <Button
                type="button"
                variant={
                  selectedCurrency === CurrencyType.USD ? "default" : "outline"
                }
                className="flex-1"
                onClick={() => setSelectedCurrency(CurrencyType.USD)}
              >
                USD
              </Button>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={!selectedCategory}>
              {isEditing ? "Guardar" : "Agregar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
