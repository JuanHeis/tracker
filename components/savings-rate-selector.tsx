"use client";

import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { SavingsRateConfig } from "@/lib/projection/savings-rate";
import { cn } from "@/lib/utils";

const formatArs = (value: number) =>
  new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(value);

type Mode = SavingsRateConfig["mode"];

const MODES: { value: Mode; label: string }[] = [
  { value: "auto", label: "Auto" },
  { value: "percentage", label: "% del sueldo" },
  { value: "fixed", label: "Monto fijo" },
];

interface SavingsRateSelectorProps {
  config: SavingsRateConfig;
  onConfigChange: (config: SavingsRateConfig) => void;
  estimate: number;
  currentSalary: number;
  averageNetFlow: number;
}

export function SavingsRateSelector({
  config,
  onConfigChange,
  estimate,
  currentSalary,
  averageNetFlow,
}: SavingsRateSelectorProps) {
  const currentMode = config.mode;

  const handleModeChange = (mode: Mode) => {
    switch (mode) {
      case "auto":
        onConfigChange({ mode: "auto" });
        break;
      case "percentage":
        onConfigChange({
          mode: "percentage",
          percentage: config.mode === "percentage" ? config.percentage : 20,
        });
        break;
      case "fixed":
        onConfigChange({
          mode: "fixed",
          amount: config.mode === "fixed" ? config.amount : 0,
        });
        break;
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">Tasa de ahorro</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Mode selector */}
        <div className="flex gap-1">
          {MODES.map(({ value, label }) => (
            <Button
              key={value}
              variant="ghost"
              size="sm"
              className={cn(
                "h-7 text-xs flex-1",
                currentMode === value
                  ? "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground"
                  : "bg-secondary"
              )}
              onClick={() => handleModeChange(value)}
            >
              {label}
            </Button>
          ))}
        </div>

        {/* Mode content */}
        {currentMode === "auto" && (
          <div className="space-y-1">
            <p className="text-sm">
              Promedio historico (6 meses): <span className="font-medium">{formatArs(estimate)}</span>
            </p>
            {averageNetFlow <= 0 && (
              <p className="text-xs text-muted-foreground">Sin datos historicos suficientes</p>
            )}
          </div>
        )}

        {currentMode === "percentage" && (
          <div className="space-y-3">
            {currentSalary === 0 ? (
              <p className="text-xs text-muted-foreground">
                Configura tu ingreso fijo para usar este modo
              </p>
            ) : (
              <>
                <Slider
                  value={[config.mode === "percentage" ? config.percentage : 20]}
                  onValueChange={([val]) =>
                    onConfigChange({ mode: "percentage", percentage: val })
                  }
                  min={0}
                  max={100}
                  step={1}
                />
                <p className="text-sm">
                  {config.mode === "percentage" ? config.percentage : 20}% ={" "}
                  <span className="font-medium">{formatArs(estimate)}</span>/mes
                </p>
              </>
            )}
          </div>
        )}

        {currentMode === "fixed" && (
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground">Ahorro mensual fijo</label>
            <Input
              type="number"
              min={0}
              value={config.mode === "fixed" ? config.amount : 0}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                onConfigChange({ mode: "fixed", amount: isNaN(val) ? 0 : val });
              }}
              className="h-8 text-sm"
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
