import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

interface ChartControlsProps {
  horizonMonths: number;
  onHorizonChange: (months: number) => void;
  visibleScenarios: { optimista: boolean; base: boolean; pesimista: boolean };
  onToggleScenario: (scenario: "optimista" | "base" | "pesimista") => void;
}

export function ChartControls({
  horizonMonths,
  onHorizonChange,
  visibleScenarios,
  onToggleScenario,
}: ChartControlsProps) {
  return (
    <div className="flex items-center justify-between gap-4 flex-wrap">
      <Select
        value={String(horizonMonths)}
        onValueChange={(v) => onHorizonChange(Number(v))}
      >
        <SelectTrigger className="w-[140px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="3">3 meses</SelectItem>
          <SelectItem value="6">6 meses</SelectItem>
          <SelectItem value="12">12 meses</SelectItem>
          <SelectItem value="24">24 meses</SelectItem>
        </SelectContent>
      </Select>

      <div className="flex gap-2">
        <Button
          size="sm"
          variant={visibleScenarios.optimista ? "default" : "outline"}
          onClick={() => onToggleScenario("optimista")}
        >
          Optimista
        </Button>
        <Button
          size="sm"
          variant={visibleScenarios.base ? "default" : "outline"}
          onClick={() => onToggleScenario("base")}
        >
          Base
        </Button>
        <Button
          size="sm"
          variant={visibleScenarios.pesimista ? "default" : "outline"}
          onClick={() => onToggleScenario("pesimista")}
        >
          Pesimista
        </Button>
      </div>
    </div>
  );
}
