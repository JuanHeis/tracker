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
import { INVESTMENT_TYPES, type InvestmentType } from "@/constants/investments";

interface InvestmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (data: {
    name: string;
    type: InvestmentType;
    currencyType: CurrencyType;
    initialAmount: number;
    date: string;
  }) => void;
  onUpdate: (investmentId: string, updates: {
    name?: string;
    type?: InvestmentType;
    currencyType?: CurrencyType;
  }) => void;
  onClose: () => void;
  onEdit: (investment: Investment) => void;
  defaultInvestmentDate: string;
  editingInvestment: Investment | null;
}

export function InvestmentDialog({
  open,
  onOpenChange,
  onAdd,
  onUpdate,
  onClose,
  onEdit,
  defaultInvestmentDate,
  editingInvestment,
}: InvestmentDialogProps) {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    if (editingInvestment) {
      onUpdate(editingInvestment.id, {
        name: formData.get("name") as string,
        type: formData.get("type") as InvestmentType,
        currencyType: (formData.get("currencyType") as CurrencyType) || CurrencyType.ARS,
      });
    } else {
      onAdd({
        name: formData.get("name") as string,
        type: formData.get("type") as InvestmentType,
        currencyType: (formData.get("currencyType") as CurrencyType) || CurrencyType.ARS,
        initialAmount: Number(formData.get("amount")),
        date: formData.get("date") as string,
      });
    }

    onClose();
    e.currentTarget.reset();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {editingInvestment ? "Editar Inversión" : "Nueva Inversión"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="date"
            name="date"
            defaultValue={editingInvestment?.createdAt ?? defaultInvestmentDate}
            required
          />
          <Input
            type="text"
            name="name"
            placeholder="Nombre"
            defaultValue={editingInvestment?.name}
            required
          />
          <Input
            type="number"
            name="amount"
            placeholder="Monto"
            defaultValue={editingInvestment?.currentValue}
            required
          />
          <Select name="type" defaultValue={editingInvestment?.type}>
            <SelectTrigger>
              <SelectValue placeholder="Tipo de inversión" />
            </SelectTrigger>
            <SelectContent>
              {INVESTMENT_TYPES.map((type) => (
                <SelectItem key={type} value={type}>{type}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select name="currencyType" defaultValue={editingInvestment?.currencyType ?? CurrencyType.ARS}>
            <SelectTrigger>
              <SelectValue placeholder="Moneda" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={CurrencyType.ARS}>ARS</SelectItem>
              <SelectItem value={CurrencyType.USD}>USD</SelectItem>
            </SelectContent>
          </Select>
          <Button type="submit">
            {editingInvestment ? "Actualizar" : "Agregar"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
