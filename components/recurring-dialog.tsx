"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { CATEGORIES } from "@/constants/colors";
import { CurrencyType } from "@/constants/investments";
import type { Category } from "@/hooks/useMoneyTracker";

interface RecurringDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (data: {
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
}: RecurringDialogProps) {
  const [selectedCurrency, setSelectedCurrency] = useState<CurrencyType>(
    CurrencyType.ARS
  );
  const [selectedCategory, setSelectedCategory] = useState<string>("");

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;
    const amount = Number(formData.get("amount"));

    if (!name || amount <= 0 || !selectedCategory) return;

    onAdd({
      name,
      amount,
      category: selectedCategory as Category,
      currencyType: selectedCurrency,
    });

    // Reset and close
    setSelectedCurrency(CurrencyType.ARS);
    setSelectedCategory("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nuevo gasto recurrente</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={handleSubmit}
          className="space-y-4"
          key={open ? "open" : "closed"}
        >
          <Input
            type="text"
            name="name"
            placeholder="Nombre (ej: Netflix, Alquiler)"
            required
          />
          <Input
            type="number"
            name="amount"
            placeholder="Monto mensual"
            step="0.01"
            min="0.01"
            required
          />
          <Select
              value={selectedCategory}
              onValueChange={setSelectedCategory}
            >
              <SelectTrigger>
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
              Agregar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
