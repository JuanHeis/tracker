"use client";

import { Button } from "@/components/ui/button";
import { CurrencyInput } from "@/components/currency-input";
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
          <CurrencyInput
            id="usdAmount"
            value={data.usdAmount || ""}
            onValueChange={(n) =>
              onChange({ ...data, usdAmount: n || 0 })
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
          <CurrencyInput
            id="globalUsdRate"
            value={data.globalUsdRate || ""}
            onValueChange={(n) =>
              onChange({
                ...data,
                globalUsdRate: n || 0,
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
