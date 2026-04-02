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

interface WizardStepUsdProps {
  data: WizardData;
  onChange: (data: WizardData) => void;
  onNext: () => void;
  onBack?: () => void;
  onSkip?: () => void;
  errors?: Record<string, string>;
}

export function WizardStepUsd({
  data,
  onChange,
  onNext,
  onBack,
  onSkip,
  errors,
}: WizardStepUsdProps) {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Dolares (USD)</CardTitle>
        <CardDescription>
          Ingresa tus tenencias en dolares y la cotizacion actual. Podes omitir
          este paso.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <label htmlFor="usdAmount" className="text-sm font-medium">
            Monto en USD
          </label>
          <Input
            id="usdAmount"
            type="number"
            min="0"
            step="0.01"
            value={data.usdAmount || ""}
            onChange={(e) =>
              onChange({ ...data, usdAmount: parseFloat(e.target.value) || 0 })
            }
            placeholder="0.00"
          />
          {errors?.usdAmount && (
            <p className="text-sm text-red-500">{errors.usdAmount}</p>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="globalUsdRate" className="text-sm font-medium">
            Cotizacion USD actual
          </label>
          <Input
            id="globalUsdRate"
            type="number"
            min="0"
            step="0.01"
            value={data.globalUsdRate || ""}
            onChange={(e) =>
              onChange({
                ...data,
                globalUsdRate: parseFloat(e.target.value) || 0,
              })
            }
            placeholder="0.00"
          />
          {errors?.globalUsdRate && (
            <p className="text-sm text-red-500">{errors.globalUsdRate}</p>
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
