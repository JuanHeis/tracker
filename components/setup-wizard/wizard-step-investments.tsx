"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import { Plus, Trash2 } from "lucide-react";
import type { WizardInvestment } from "@/hooks/useSetupWizard";
import {
  INVESTMENT_TYPES,
  type InvestmentType,
  CurrencyType,
  CURRENCY_ENFORCEMENT,
  currencySymbol,
} from "@/constants/investments";

interface WizardStepInvestmentsProps {
  investments: WizardInvestment[];
  onChange: (investments: WizardInvestment[]) => void;
  errors: Record<string, string>;
  onNext: () => void;
  onBack: () => void;
  onSkip: () => void;
}

export function WizardStepInvestments({
  investments = [],
  onChange,
  errors,
  onNext,
  onBack,
  onSkip,
}: WizardStepInvestmentsProps) {
  const [formType, setFormType] = useState<InvestmentType>("FCI");
  const [formName, setFormName] = useState("");
  const [formAmount, setFormAmount] = useState<number>(0);
  const [formCurrency, setFormCurrency] = useState<CurrencyType>(CurrencyType.ARS);
  const [formTna, setFormTna] = useState<number>(0);
  const [formPlazoDias, setFormPlazoDias] = useState<number>(0);
  const [formIsLiquid, setFormIsLiquid] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const enforcement = CURRENCY_ENFORCEMENT[formType];
  const currencyDisabled = enforcement !== null;

  const handleTypeChange = (type: InvestmentType) => {
    setFormType(type);
    const enforced = CURRENCY_ENFORCEMENT[type];
    if (enforced !== null) {
      setFormCurrency(enforced);
    }
  };

  const clearForm = () => {
    setFormName("");
    setFormAmount(0);
    setFormTna(0);
    setFormPlazoDias(0);
    setFormIsLiquid(false);
    setFormErrors({});
  };

  const handleAdd = () => {
    const errs: Record<string, string> = {};
    if (!formName.trim()) {
      errs.name = "El nombre es requerido";
    }
    if (!formAmount || formAmount <= 0) {
      errs.amount = "El monto debe ser mayor a 0";
    }
    if (formType === "Plazo Fijo") {
      if (!formTna || formTna <= 0) {
        errs.tna = "La TNA debe ser mayor a 0";
      }
      if (!formPlazoDias || formPlazoDias <= 0) {
        errs.plazoDias = "El plazo debe ser mayor a 0 dias";
      }
    }
    if (Object.keys(errs).length > 0) {
      setFormErrors(errs);
      return;
    }

    const newInvestment: WizardInvestment = {
      name: formName.trim(),
      type: formType,
      currencyType: enforcement ?? formCurrency,
      amount: formAmount,
      ...(formIsLiquid && { isLiquid: true }),
      ...(formType === "Plazo Fijo" && { tna: formTna, plazoDias: formPlazoDias }),
    };

    onChange([...investments, newInvestment]);
    clearForm();
  };

  const handleRemove = (index: number) => {
    onChange(investments.filter((_, i) => i !== index));
  };

  const formatAmount = (amount: number, currency: CurrencyType) => {
    return `${currencySymbol(currency)} ${amount.toLocaleString("es-AR", { minimumFractionDigits: 2 })}`;
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Inversiones existentes</CardTitle>
        <CardDescription>
          Agrega tus inversiones actuales. Podes omitir este paso.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {/* List of added investments */}
        {investments.length > 0 && (
          <div className="flex flex-col gap-2">
            {investments.map((inv, i) => (
              <div
                key={i}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Badge variant="secondary" className="shrink-0">
                    {inv.type}
                  </Badge>
                  {inv.isLiquid && (
                    <Badge variant="outline" className="shrink-0 text-xs">liquida</Badge>
                  )}
                  <span className="text-sm font-medium truncate">{inv.name}</span>
                  <span className="text-sm text-muted-foreground shrink-0">
                    {formatAmount(inv.amount, inv.currencyType)}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemove(i)}
                  className="shrink-0 ml-2"
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}
            {/* Show validation errors for existing investments */}
            {Object.keys(errors).length > 0 && (
              <div className="flex flex-col gap-1">
                {Object.entries(errors).map(([key, msg]) => (
                  <p key={key} className="text-sm text-red-500">{msg}</p>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Inline add form */}
        <div className="flex flex-col gap-3 rounded-lg border p-3 bg-muted/30">
          <p className="text-sm font-medium">Agregar inversion</p>

          {/* Type */}
          <div className="flex flex-col gap-1">
            <label htmlFor="inv-type" className="text-sm font-medium">
              Tipo
            </label>
            <Select value={formType} onValueChange={(v) => handleTypeChange(v as InvestmentType)}>
              <SelectTrigger>
                <SelectValue placeholder="Tipo de inversion" />
              </SelectTrigger>
              <SelectContent>
                {INVESTMENT_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Name */}
          <div className="flex flex-col gap-1">
            <label htmlFor="inv-name" className="text-sm font-medium">
              Nombre
            </label>
            <Input
              id="inv-name"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="Ej: Mercado Pago, Buenbit..."
            />
            {formErrors.name && (
              <p className="text-sm text-red-500">{formErrors.name}</p>
            )}
          </div>

          {/* Amount */}
          <div className="flex flex-col gap-1">
            <label htmlFor="inv-amount" className="text-sm font-medium">
              Monto actual
            </label>
            <Input
              id="inv-amount"
              type="number"
              min="0"
              step="0.01"
              value={formAmount || ""}
              onChange={(e) => setFormAmount(parseFloat(e.target.value) || 0)}
              placeholder="0.00"
            />
            {formErrors.amount && (
              <p className="text-sm text-red-500">{formErrors.amount}</p>
            )}
          </div>

          {/* Currency */}
          <div className="flex flex-col gap-1">
            <label htmlFor="inv-currency" className="text-sm font-medium">
              Moneda
            </label>
            <Select
              value={enforcement ?? formCurrency}
              onValueChange={(v) => setFormCurrency(v as CurrencyType)}
              disabled={currencyDisabled}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={CurrencyType.ARS}>ARS</SelectItem>
                <SelectItem value={CurrencyType.USD}>USD</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Disponibilidad inmediata */}
          <div className="flex flex-col gap-1">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formIsLiquid}
                onChange={(e) => setFormIsLiquid(e.target.checked)}
                className="h-4 w-4 rounded border-border accent-primary"
              />
              <span className="text-sm">Disponibilidad inmediata</span>
            </label>
            <p className="text-xs text-muted-foreground">
              Suma al liquido en vez de inversiones en el patrimonio
            </p>
          </div>

          {/* Plazo Fijo specific fields */}
          {formType === "Plazo Fijo" && (
            <>
              <div className="flex flex-col gap-1">
                <label htmlFor="inv-tna" className="text-sm font-medium">
                  TNA (%)
                </label>
                <Input
                  id="inv-tna"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formTna || ""}
                  onChange={(e) => setFormTna(parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                />
                {formErrors.tna && (
                  <p className="text-sm text-red-500">{formErrors.tna}</p>
                )}
              </div>
              <div className="flex flex-col gap-1">
                <label htmlFor="inv-plazo" className="text-sm font-medium">
                  Plazo (dias)
                </label>
                <Input
                  id="inv-plazo"
                  type="number"
                  min="1"
                  step="1"
                  value={formPlazoDias || ""}
                  onChange={(e) => setFormPlazoDias(parseInt(e.target.value) || 0)}
                  placeholder="30"
                />
                {formErrors.plazoDias && (
                  <p className="text-sm text-red-500">{formErrors.plazoDias}</p>
                )}
              </div>
            </>
          )}

          <Button
            variant="outline"
            onClick={handleAdd}
            className="w-full"
          >
            <Plus className="mr-2 h-4 w-4" />
            Agregar
          </Button>
        </div>

        {/* Footer buttons */}
        <div className="flex gap-2">
          <Button onClick={onBack} variant="outline" className="flex-1">
            Atras
          </Button>
          {investments.length > 0 ? (
            <>
              <Button onClick={onSkip} variant="outline" className="flex-1">
                Omitir
              </Button>
              <Button onClick={onNext} className="flex-1">
                Continuar
              </Button>
            </>
          ) : (
            <Button onClick={onSkip} className="flex-1">
              Omitir
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
