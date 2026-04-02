"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { WizardData } from "@/hooks/useSetupWizard";

interface WizardStepBalanceProps {
  data: WizardData;
  onChange: (data: WizardData) => void;
  onNext: () => void;
  errors?: Record<string, string>;
}

export function WizardStepBalance({
  data,
  onChange,
  onNext,
  errors,
}: WizardStepBalanceProps) {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Saldo en Pesos (ARS)</CardTitle>
        <CardDescription>
          Ingresa tu saldo liquido actual en pesos argentinos.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <label htmlFor="arsBalance" className="text-sm font-medium">
            Saldo actual ARS
          </label>
          <Input
            id="arsBalance"
            type="number"
            min="0"
            step="0.01"
            value={data.arsBalance || ""}
            onChange={(e) =>
              onChange({ ...data, arsBalance: parseFloat(e.target.value) || 0 })
            }
            placeholder="0.00"
          />
          {errors?.arsBalance && (
            <p className="text-sm text-red-500">{errors.arsBalance}</p>
          )}
        </div>
        <Button onClick={onNext} className="w-full">
          Siguiente
        </Button>
      </CardContent>
    </Card>
  );
}
