"use client";

import { useRef, useState } from "react";
import { useSetupWizard } from "@/hooks/useSetupWizard";
import { useDataPersistence } from "@/hooks/useDataPersistence";
import { WizardStepWelcome } from "./wizard-step-welcome";
import { WizardStepBalance } from "./wizard-step-balance";
import { WizardStepUsd } from "./wizard-step-usd";
import { WizardStepIncome } from "./wizard-step-income";
import { WizardStepSummary } from "./wizard-step-summary";
import { cn } from "@/lib/utils";

interface SetupWizardProps {
  onComplete: () => void;
}

export function SetupWizard({ onComplete }: SetupWizardProps) {
  const {
    wizardData,
    setWizardData,
    currentStep,
    setCurrentStep,
    goNext,
    goBack,
    validateCurrentStep,
    commit,
  } = useSetupWizard();

  const { importData } = useDataPersistence();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleNext = () => {
    const validationErrors = validateCurrentStep();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    setErrors({});
    goNext();
  };

  const handleSkip = () => {
    setErrors({});
    goNext();
  };

  const handleConfirm = () => {
    commit();
    window.location.reload();
  };

  const handleImport = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const result = await importData(file);
    if (!result.success) {
      alert(result.error);
    }
    // importData calls window.location.reload() on success
  };

  const TOTAL_STEPS = 4;

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Progress indicator — only show on steps 1-4 */}
        {currentStep >= 1 && (
          <div className="mb-4 flex flex-col items-center gap-2">
            <p className="text-sm text-muted-foreground">
              Paso {currentStep} de {TOTAL_STEPS}
            </p>
            <div className="flex gap-2">
              {Array.from({ length: TOTAL_STEPS }, (_, i) => (
                <div
                  key={i}
                  className={cn(
                    "h-2 w-8 rounded-full transition-colors",
                    i + 1 <= currentStep
                      ? "bg-primary"
                      : "bg-muted"
                  )}
                />
              ))}
            </div>
          </div>
        )}

        {/* Step rendering */}
        {currentStep === 0 && (
          <WizardStepWelcome
            onStartWizard={() => goNext()}
            onImport={handleImport}
          />
        )}
        {currentStep === 1 && (
          <WizardStepBalance
            data={wizardData}
            onChange={setWizardData}
            onNext={handleNext}
            errors={errors}
          />
        )}
        {currentStep === 2 && (
          <WizardStepUsd
            data={wizardData}
            onChange={setWizardData}
            onNext={handleNext}
            onBack={goBack}
            onSkip={handleSkip}
            errors={errors}
          />
        )}
        {currentStep === 3 && (
          <WizardStepIncome
            data={wizardData}
            onChange={setWizardData}
            onNext={handleNext}
            onBack={goBack}
            onSkip={handleSkip}
            errors={errors}
          />
        )}
        {currentStep === 4 && (
          <WizardStepSummary
            data={wizardData}
            onConfirm={handleConfirm}
            onEdit={setCurrentStep}
          />
        )}

        {/* Hidden file input for import */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>
    </div>
  );
}
