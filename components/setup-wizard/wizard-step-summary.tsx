"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { WizardData } from "@/hooks/useSetupWizard";
import { currencySymbol } from "@/constants/investments";

interface WizardStepSummaryProps {
  data: WizardData;
  onConfirm: () => void;
  onEdit: (step: number) => void;
}

function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

export function WizardStepSummary({
  data,
  onConfirm,
  onEdit,
}: WizardStepSummaryProps) {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Resumen de Configuracion</CardTitle>
        <CardDescription>
          Revisa los datos antes de confirmar.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {/* ARS Balance */}
        <div className="flex items-center justify-between rounded-lg border p-3">
          <div>
            <p className="text-sm font-medium">Saldo ARS</p>
            <p className="text-lg">
              {data.arsBalance > 0
                ? formatCurrency(data.arsBalance, "ARS")
                : "No configurado"}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(1)}
          >
            Editar
          </Button>
        </div>

        {/* USD */}
        <div className="flex items-center justify-between rounded-lg border p-3">
          <div>
            <p className="text-sm font-medium">Dolares USD</p>
            {data.usdAmount > 0 ? (
              <p className="text-lg">
                {formatCurrency(data.usdAmount, "USD")} (cotizacion:{" "}
                {formatCurrency(data.globalUsdRate, "ARS")})
              </p>
            ) : (
              <p className="text-lg text-muted-foreground">Omitido</p>
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(2)}
          >
            Editar
          </Button>
        </div>

        {/* Income */}
        <div className="flex items-center justify-between rounded-lg border p-3">
          <div>
            <p className="text-sm font-medium">Ingreso fijo</p>
            {data.salaryAmount > 0 ? (
              <p className="text-lg">
                {formatCurrency(data.salaryAmount, "ARS")} -{" "}
                {data.employmentType === "dependiente"
                  ? "Dependiente"
                  : "Independiente"}{" "}
                - Dia {data.payDay}
              </p>
            ) : (
              <p className="text-lg text-muted-foreground">Omitido</p>
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(3)}
          >
            Editar
          </Button>
        </div>

        {/* Investments */}
        <div className="flex items-center justify-between rounded-lg border p-3">
          <div>
            <p className="text-sm font-medium">Inversiones</p>
            {data.investments.length > 0 ? (
              <div className="flex flex-col gap-1 mt-1">
                {data.investments.map((inv, i) => (
                  <p key={i} className="text-sm">
                    {inv.type} - {inv.name}:{" "}
                    {currencySymbol(inv.currencyType)}{" "}
                    {inv.amount.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                  </p>
                ))}
              </div>
            ) : (
              <p className="text-lg text-muted-foreground">Sin inversiones cargadas</p>
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(4)}
          >
            Editar
          </Button>
        </div>

        <Button onClick={onConfirm} className="w-full" size="lg">
          Confirmar y comenzar
        </Button>
        <p className="text-center text-sm text-muted-foreground">
          Al confirmar se guardaran los datos y se abrira la aplicacion.
        </p>
      </CardContent>
    </Card>
  );
}
