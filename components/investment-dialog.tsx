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
import { INVESTMENT_TYPES } from "@/constants/investments";

interface InvestmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  onClose: () => void;
  onEdit: (investment: Investment) => void;
  defaultInvestmentDate: string;
  editingInvestment: Investment | null;
}

export function InvestmentDialog({
  open,
  onOpenChange,
  onSubmit,
  onClose,
  onEdit,
  defaultInvestmentDate,
  editingInvestment,
}: InvestmentDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {editingInvestment ? "Editar Inversión" : "Nueva Inversión"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <Input
            type="date"
            name="date"
            defaultValue={editingInvestment?.date ?? defaultInvestmentDate}
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
            defaultValue={editingInvestment?.amount}
            required
          />
          <Input
            type="number"
            name="usdRate"
            placeholder="Tasa USD"
            defaultValue={editingInvestment?.usdRate}
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
          <Input
            type="date"
            name="expectedEndDate"
            placeholder="Fecha estimada de finalización"
            defaultValue={editingInvestment?.expectedEndDate}
          />
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
