"use client";

import { useHydration } from "@/hooks/useHydration";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface PatrimonioCardProps {
  arsBalancePeriod: number;
  arsBalanceAccumulated: number;
  usdBalancePeriod: number;
  usdBalanceAccumulated: number;
  arsInvestments: number;
  usdInvestments: number;
  arsLoansGiven: number;
  usdLoansGiven: number;
  arsDebts: number;
  usdDebts: number;
  globalUsdRate: number;
  balanceViewMode: "periodo" | "acumulado";
  onBalanceViewModeChange: (mode: "periodo" | "acumulado") => void;
}

export function PatrimonioCard({
  arsBalancePeriod,
  arsBalanceAccumulated,
  usdBalancePeriod,
  usdBalanceAccumulated,
  arsInvestments,
  usdInvestments,
  arsLoansGiven,
  usdLoansGiven,
  arsDebts,
  usdDebts,
  globalUsdRate,
  balanceViewMode,
  onBalanceViewModeChange,
}: PatrimonioCardProps) {
  const isHydrated = useHydration();

  const arsBalance = balanceViewMode === "periodo" ? arsBalancePeriod : arsBalanceAccumulated;
  const usdBalance = balanceViewMode === "periodo" ? usdBalancePeriod : usdBalanceAccumulated;

  const formatArs = (amount: number) => {
    if (!isHydrated) return "---";
    return `$ ${amount.toLocaleString()}`;
  };

  const formatUsd = (amount: number) => {
    if (!isHydrated) return "---";
    return `US$ ${amount.toLocaleString()}`;
  };

  const patrimonio =
    globalUsdRate > 0
      ? arsBalance
        + usdBalance * globalUsdRate
        + arsInvestments
        + usdInvestments * globalUsdRate
        + arsLoansGiven
        + usdLoansGiven * globalUsdRate
        - arsDebts
        - usdDebts * globalUsdRate
      : 0;

  const arsTooltip = balanceViewMode === "periodo"
    ? "Saldo liquido en pesos del periodo actual"
    : "Saldo liquido acumulado en pesos (mes completo)";
  const usdTooltip = balanceViewMode === "periodo"
    ? "Saldo en dolares del periodo actual"
    : "Saldo acumulado en dolares (todos los meses)";

  return (
    <Card className="h-fit">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle>Patrimonio Total</CardTitle>
        <div className="flex gap-1">
          <Button
            variant={balanceViewMode === "periodo" ? "default" : "outline"}
            size="sm"
            className="h-6 text-xs px-2"
            onClick={() => onBalanceViewModeChange("periodo")}
          >
            Periodo
          </Button>
          <Button
            variant={balanceViewMode === "acumulado" ? "default" : "outline"}
            size="sm"
            className="h-6 text-xs px-2"
            onClick={() => onBalanceViewModeChange("acumulado")}
          >
            Acumulado
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <TooltipProvider>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span>Liquido ARS:</span>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="font-medium cursor-help">{formatArs(arsBalance)}</span>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{arsTooltip}</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <div className="flex justify-between">
              <span>Liquido USD:</span>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="font-medium cursor-help">{formatUsd(usdBalance)}</span>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{usdTooltip}</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <div className="flex justify-between">
              <span>Inversiones ARS:</span>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="font-medium text-blue-500 dark:text-blue-400 cursor-help">
                    {formatArs(arsInvestments)}
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Valor actual de inversiones activas en ARS</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <div className="flex justify-between">
              <span>Inversiones USD:</span>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="font-medium text-blue-500 dark:text-blue-400 cursor-help">
                    {formatUsd(usdInvestments)}
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Valor actual de inversiones activas en USD</p>
                </TooltipContent>
              </Tooltip>
            </div>
            {(arsLoansGiven > 0 || usdLoansGiven > 0) && (
              <div className="flex justify-between">
                <span>Prestamos dados:</span>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="font-medium text-green-500 dark:text-green-400 cursor-help">
                      {formatArs(arsLoansGiven + usdLoansGiven * globalUsdRate)}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Dinero prestado pendiente de cobro</p>
                    {arsLoansGiven > 0 && <p>ARS: {formatArs(arsLoansGiven)}</p>}
                    {usdLoansGiven > 0 && (
                      <p>USD: US$ {usdLoansGiven.toLocaleString()} x ${globalUsdRate.toLocaleString()} = {formatArs(usdLoansGiven * globalUsdRate)}</p>
                    )}
                  </TooltipContent>
                </Tooltip>
              </div>
            )}
            {(arsDebts > 0 || usdDebts > 0) && (
              <div className="flex justify-between">
                <span>Deudas:</span>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="font-medium text-red-500 dark:text-red-400 cursor-help">
                      - {formatArs(arsDebts + usdDebts * globalUsdRate)}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Dinero adeudado pendiente de pago</p>
                    {arsDebts > 0 && <p>ARS: {formatArs(arsDebts)}</p>}
                    {usdDebts > 0 && (
                      <p>USD: US$ {usdDebts.toLocaleString()} x ${globalUsdRate.toLocaleString()} = {formatArs(usdDebts * globalUsdRate)}</p>
                    )}
                  </TooltipContent>
                </Tooltip>
              </div>
            )}
            <hr className="border-border" />
            {globalUsdRate > 0 ? (
              <Tooltip>
                <TooltipTrigger className="w-full">
                  <div className="flex justify-between w-full">
                    <span className="font-semibold">Patrimonio Total:</span>
                    <span className="font-bold cursor-help">{formatArs(patrimonio)}</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent className="max-w-sm">
                  <p className="font-bold mb-1">Patrimonio Total ({balanceViewMode === "periodo" ? "Periodo" : "Acumulado"})</p>
                  <p>Liquido ARS: {formatArs(arsBalance)}</p>
                  <p>Liquido USD: US$ {usdBalance.toLocaleString()} x ${globalUsdRate.toLocaleString()} = {formatArs(usdBalance * globalUsdRate)}</p>
                  <p className="text-blue-400">Inv. ARS: {formatArs(arsInvestments)}</p>
                  <p className="text-blue-400">Inv. USD: US$ {usdInvestments.toLocaleString()} x ${globalUsdRate.toLocaleString()} = {formatArs(usdInvestments * globalUsdRate)}</p>
                  {(arsLoansGiven > 0 || usdLoansGiven > 0) && (
                    <p className="text-green-400">Prestamos: {formatArs(arsLoansGiven)}{usdLoansGiven > 0 ? ` + US$ ${usdLoansGiven.toLocaleString()} x $${globalUsdRate.toLocaleString()} = ${formatArs(arsLoansGiven + usdLoansGiven * globalUsdRate)}` : ""}</p>
                  )}
                  {(arsDebts > 0 || usdDebts > 0) && (
                    <p className="text-red-400">Deudas: - {formatArs(arsDebts)}{usdDebts > 0 ? ` - US$ ${usdDebts.toLocaleString()} x $${globalUsdRate.toLocaleString()} = - ${formatArs(arsDebts + usdDebts * globalUsdRate)}` : ""}</p>
                  )}
                  <hr className="my-1 border-border" />
                  <p className="font-bold">= {formatArs(patrimonio)}</p>
                </TooltipContent>
              </Tooltip>
            ) : (
              <p className="text-sm text-amber-600 dark:text-amber-400">
                Configure cotizacion USD para ver patrimonio total
              </p>
            )}
          </div>
        </TooltipProvider>
      </CardContent>
    </Card>
  );
}
