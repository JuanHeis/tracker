"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CurrencyInput } from "@/components/currency-input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { WizardData } from "@/hooks/useSetupWizard";

interface WizardStepIncomeProps {
  data: WizardData;
  onChange: (data: WizardData) => void;
  onNext: () => void;
  onBack?: () => void;
  onSkip?: () => void;
  errors?: Record<string, string>;
}

export function WizardStepIncome({
  data,
  onChange,
  onNext,
  onBack,
  onSkip,
  errors,
}: WizardStepIncomeProps) {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Ingreso Fijo</CardTitle>
        <CardDescription>
          Configura tu ingreso mensual. Podes omitir y configurarlo despues.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <label htmlFor="salaryAmount" className="text-sm font-medium">
            Monto mensual
          </label>
          <CurrencyInput
            id="salaryAmount"
            value={data.salaryAmount || ""}
            onValueChange={(n) =>
              onChange({
                ...data,
                salaryAmount: n || 0,
              })
            }
            placeholder="0.00"
          />
          {errors?.salaryAmount && (
            <p className="text-sm text-red-500">{errors.salaryAmount}</p>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">Tipo de empleo</label>
          <Select
            value={data.employmentType}
            onValueChange={(value: "dependiente" | "independiente") =>
              onChange({ ...data, employmentType: value })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="dependiente">Dependiente</SelectItem>
              <SelectItem value="independiente">Independiente</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="payDay" className="text-sm font-medium">
            Dia de cobro
          </label>
          <Input
            id="payDay"
            type="number"
            min="1"
            max="31"
            value={data.payDay || ""}
            onChange={(e) =>
              onChange({
                ...data,
                payDay: parseInt(e.target.value, 10) || 1,
              })
            }
            placeholder="1"
          />
          {errors?.payDay && (
            <p className="text-sm text-red-500">{errors.payDay}</p>
          )}
        </div>
        <div className="flex gap-2">
          {onBack && (
            <Button onClick={onBack} variant="outline" className="flex-1">
              Atras
            </Button>
          )}
          {onSkip && (
            <Button onClick={onSkip} variant="outline" className="flex-1">
              Omitir
            </Button>
          )}
          <Button onClick={onNext} className="flex-1">
            Siguiente
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
