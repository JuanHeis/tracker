"use client";
import { useMemo } from "react";
import { useLocalStorage } from "./useLocalStorage";
import {
  computeSavingsEstimate,
  DEFAULT_SAVINGS_CONFIG,
  SAVINGS_RATE_KEY,
  type SavingsRateConfig,
} from "@/lib/projection/savings-rate";

export function useSavingsRate(currentSalary: number, averageNetFlow: number) {
  const [config, setConfig] = useLocalStorage<SavingsRateConfig>(
    SAVINGS_RATE_KEY,
    DEFAULT_SAVINGS_CONFIG
  );

  const estimate = useMemo(
    () => computeSavingsEstimate({ config, currentSalary, averageNetFlow }),
    [config, currentSalary, averageNetFlow]
  );

  return { config, setConfig, estimate };
}
