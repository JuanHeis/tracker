import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { CurrencyType, Investment } from "@/hooks/useMoneyTracker";
import {
  INVESTMENT_TYPES,
  CURRENCY_ENFORCEMENT,
  type InvestmentType,
} from "@/constants/investments";

interface InvestmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (data: {
    name: string;
    type: InvestmentType;
    currencyType: CurrencyType;
    initialAmount: number;
    date: string;
    tna?: number;
    plazoDias?: number;
  }) => void;
  onUpdate: (
    investmentId: string,
    updates: {
      name?: string;
      tna?: number;
      plazoDias?: number;
    }
  ) => void;
  onClose: () => void;
  defaultInvestmentDate: string;
  editingInvestment: Investment | null;
}

export function InvestmentDialog({
  open,
  onOpenChange,
  onAdd,
  onUpdate,
  onClose,
  defaultInvestmentDate,
  editingInvestment,
}: InvestmentDialogProps) {
  const [selectedType, setSelectedType] = useState<InvestmentType | "">(
    editingInvestment?.type ?? ""
  );
  const [selectedCurrency, setSelectedCurrency] = useState<CurrencyType>(
    editingInvestment?.currencyType ?? CurrencyType.ARS
  );

  // Sync state when editingInvestment changes or dialog opens
  useEffect(() => {
    if (editingInvestment) {
      setSelectedType(editingInvestment.type);
      setSelectedCurrency(editingInvestment.currencyType);
    } else {
      setSelectedType("");
      setSelectedCurrency(CurrencyType.ARS);
    }
  }, [editingInvestment, open]);

  // Enforce currency when type changes
  useEffect(() => {
    if (selectedType && !editingInvestment) {
      const enforced = CURRENCY_ENFORCEMENT[selectedType as InvestmentType];
      if (enforced !== null) {
        setSelectedCurrency(enforced);
      }
    }
  }, [selectedType, editingInvestment]);

  const isPlazoFijo = selectedType === "Plazo Fijo";
  const isCurrencyEnforced =
    selectedType !== "" &&
    CURRENCY_ENFORCEMENT[selectedType as InvestmentType] !== null;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    if (editingInvestment) {
      const updates: { name?: string; tna?: number; plazoDias?: number } = {
        name: formData.get("name") as string,
      };
      if (editingInvestment.type === "Plazo Fijo") {
        const tnaVal = formData.get("tna");
        const plazoVal = formData.get("plazoDias");
        if (tnaVal) updates.tna = Number(tnaVal);
        if (plazoVal) updates.plazoDias = Number(plazoVal);
      }
      onUpdate(editingInvestment.id, updates);
    } else {
      const data: Parameters<typeof onAdd>[0] = {
        name: formData.get("name") as string,
        type: selectedType as InvestmentType,
        currencyType: selectedCurrency,
        initialAmount: Number(formData.get("amount")),
        date: formData.get("date") as string,
      };
      if (isPlazoFijo) {
        data.tna = Number(formData.get("tna"));
        data.plazoDias = Number(formData.get("plazoDias"));
      }
      onAdd(data);
    }

    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {editingInvestment ? "Editar Inversion" : "Nueva Inversion"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4" key={open ? "open" : "closed"}>
          {!editingInvestment && (
            <Input
              type="date"
              name="date"
              defaultValue={defaultInvestmentDate}
              required
            />
          )}
          <Input
            type="text"
            name="name"
            placeholder="Nombre"
            defaultValue={editingInvestment?.name}
            required
          />
          {!editingInvestment && (
            <Input
              type="number"
              name="amount"
              placeholder="Monto inicial"
              step="0.01"
              min="0"
              required
            />
          )}
          <Select
            value={selectedType}
            onValueChange={(val) => setSelectedType(val as InvestmentType)}
            disabled={!!editingInvestment}
          >
            <SelectTrigger>
              <SelectValue placeholder="Tipo de inversion" />
            </SelectTrigger>
            <SelectContent>
              {INVESTMENT_TYPES.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={selectedCurrency}
            onValueChange={(val) => setSelectedCurrency(val as CurrencyType)}
            disabled={!!editingInvestment || isCurrencyEnforced}
          >
            <SelectTrigger>
              <SelectValue placeholder="Moneda" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={CurrencyType.ARS}>ARS</SelectItem>
              <SelectItem value={CurrencyType.USD}>USD</SelectItem>
            </SelectContent>
          </Select>
          {isPlazoFijo && (
            <>
              <Input
                type="number"
                name="tna"
                placeholder="TNA anual (%)"
                step="0.01"
                min="0"
                defaultValue={editingInvestment?.tna}
                required
              />
              <Input
                type="number"
                name="plazoDias"
                placeholder="Plazo (dias)"
                min="1"
                defaultValue={editingInvestment?.plazoDias}
                required
              />
            </>
          )}
          <Button type="submit" disabled={selectedType === ""}>
            {editingInvestment ? "Actualizar" : "Agregar"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
