import { Investment } from "@/hooks/useMoneyTracker";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { useHydration } from "@/hooks/useHydration";

interface InvestmentsTableProps {
  investments: Investment[];
  onEdit: (investment: Investment) => void;
  onDelete: (id: string) => void;
}

export function InvestmentsTable({
  investments,
  onEdit,
  onDelete,
}: InvestmentsTableProps) {
  const isHydrated = useHydration();

  if (!isHydrated) {
    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Fecha</TableHead>
            <TableHead>Nombre</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Monto</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell colSpan={6} className="h-24 text-center">
              Cargando...
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    );
  }
  if (isHydrated) {
    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Fecha</TableHead>
            <TableHead>Nombre</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Monto</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {investments.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="h-24 text-center">
                No hay inversiones registradas
              </TableCell>
            </TableRow>
          )}
          {investments.map((investment) => (
            <TableRow key={investment.id}>
              <TableCell>
                {format(new Date(investment.date), "dd/MM/yyyy")}
              </TableCell>
              <TableCell>{investment.name}</TableCell>
              <TableCell>{investment.type}</TableCell>
              <TableCell>${investment.amount.toLocaleString()}</TableCell>
              <TableCell>{investment.status}</TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEdit(investment)}
                  >
                    Editar
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => onDelete(investment.id)}
                  >
                    Eliminar
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  }
}
