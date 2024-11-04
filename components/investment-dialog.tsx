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
import { Investment } from "@/hooks/useMoneyTracker";

interface InvestmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  defaultValues?: {
    date: string;
    name: string;
    amount: number;
    usdRate: number;
    type: string;
    expectedEndDate?: string;
  };
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
  defaultValues,
  defaultInvestmentDate,
  editingInvestment,
}: InvestmentDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {defaultValues ? "Editar Inversión" : "Nueva Inversión"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <Input
            type="date"
            name="date"
            defaultValue={defaultInvestmentDate}
            required
          />
          <Input
            type="text"
            name="name"
            placeholder="Nombre"
            defaultValue={defaultValues?.name}
            required
          />
          <Input
            type="number"
            name="amount"
            placeholder="Monto"
            defaultValue={defaultValues?.amount}
            required
          />
          <Input
            type="number"
            name="usdRate"
            placeholder="Tasa USD"
            defaultValue={defaultValues?.usdRate}
            required
          />
          <Select name="type" defaultValue={defaultValues?.type}>
            <SelectTrigger>
              <SelectValue placeholder="Tipo de inversión" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="FCI">FCI</SelectItem>
              <SelectItem value="PlazoFijo">Plazo Fijo</SelectItem>
              <SelectItem value="Crypto">Crypto</SelectItem>
              <SelectItem value="Acciones">Acciones</SelectItem>
              <SelectItem value="Otros">Otros</SelectItem>
            </SelectContent>
          </Select>
          <Input
            type="date"
            name="expectedEndDate"
            placeholder="Fecha estimada de finalización"
            defaultValue={defaultValues?.expectedEndDate}
          />
          <Button type="submit">
            {defaultValues ? "Actualizar" : "Agregar"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
