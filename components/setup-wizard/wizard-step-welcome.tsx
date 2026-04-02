"use client";

import { Wallet, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface WizardStepWelcomeProps {
  onStartWizard: () => void;
  onImport: () => void;
}

export function WizardStepWelcome({
  onStartWizard,
  onImport,
}: WizardStepWelcomeProps) {
  return (
    <Card className="w-full">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">
          Bienvenido a Contador Personal
        </CardTitle>
        <CardDescription>
          Configura tu situacion financiera inicial para comenzar.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <Button onClick={onStartWizard} className="w-full gap-2" size="lg">
          <Wallet className="h-5 w-5" />
          Configurar desde cero
        </Button>
        <Button
          onClick={onImport}
          variant="outline"
          className="w-full gap-2"
          size="lg"
        >
          <Upload className="h-5 w-5" />
          Importar backup existente
        </Button>
      </CardContent>
    </Card>
  );
}
