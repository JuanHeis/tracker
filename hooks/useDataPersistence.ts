import { format } from "date-fns";

export const STORAGE_KEYS = [
  "monthlyData",
  "globalUsdRate",
  "salaryHistory",
  "incomeConfig",
  "recurringExpenses",
  "budgetData",
  "lastUsedUsdRate",
  "customAnnualRates",
] as const;

const JSON_KEYS = [
  "monthlyData",
  "salaryHistory",
  "incomeConfig",
  "recurringExpenses",
  "budgetData",
  "customAnnualRates",
] as const;

const NUMERIC_KEYS = ["globalUsdRate", "lastUsedUsdRate"] as const;

interface ExportEnvelope {
  appName: "expense-tracker";
  exportVersion: 1;
  exportDate: string;
  data: Record<string, unknown>;
}

type ValidationResult =
  | { valid: true; envelope: ExportEnvelope }
  | { valid: false; error: string };

function validateEnvelope(data: unknown): ValidationResult {
  if (typeof data !== "object" || data === null) {
    return { valid: false, error: "El archivo no contiene un objeto valido" };
  }

  const obj = data as Record<string, unknown>;

  if (obj.appName !== "expense-tracker") {
    return {
      valid: false,
      error: "El archivo no es un backup de expense-tracker",
    };
  }

  if (typeof obj.exportVersion !== "number") {
    return { valid: false, error: "Version de exportacion invalida" };
  }

  if (typeof obj.data !== "object" || obj.data === null) {
    return { valid: false, error: "El archivo no contiene datos" };
  }

  const dataObj = obj.data as Record<string, unknown>;
  const missingKeys = STORAGE_KEYS.filter((key) => !(key in dataObj));

  // Optional keys that can be missing from older exports — default them gracefully
  const OPTIONAL_KEYS = ["customAnnualRates"] as const;
  const criticalMissing = missingKeys.filter(
    (k) => !(OPTIONAL_KEYS as readonly string[]).includes(k)
  );

  if (criticalMissing.length > 0) {
    return {
      valid: false,
      error: `Faltan datos requeridos: ${criticalMissing.join(", ")}`,
    };
  }

  // Fill in optional keys with defaults
  for (const key of missingKeys) {
    if (key === "customAnnualRates") {
      dataObj[key] = {};
    }
  }

  return { valid: true, envelope: data as ExportEnvelope };
}

function exportData(): void {
  const data: Record<string, unknown> = {};

  for (const key of JSON_KEYS) {
    const raw = localStorage.getItem(key);
    data[key] = raw ? JSON.parse(raw) : null;
  }

  for (const key of NUMERIC_KEYS) {
    const raw = localStorage.getItem(key);
    data[key] = raw ? parseFloat(raw) : 0;
  }

  const envelope: ExportEnvelope = {
    appName: "expense-tracker",
    exportVersion: 1,
    exportDate: new Date().toISOString(),
    data,
  };

  const blob = new Blob([JSON.stringify(envelope, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const filename = `expense-tracker-backup-${format(new Date(), "yyyy-MM-dd")}.json`;

  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();

  URL.revokeObjectURL(url);
}

async function importData(
  file: File
): Promise<{ success: true } | { success: false; error: string }> {
  return new Promise((resolve) => {
    const reader = new FileReader();

    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result as string);
        const validation = validateEnvelope(parsed);

        if (!validation.valid) {
          resolve({ success: false, error: validation.error });
          return;
        }

        const { data } = validation.envelope;

        for (const key of JSON_KEYS) {
          const value = data[key];
          localStorage.setItem(key, value != null ? JSON.stringify(value) : "");
        }

        for (const key of NUMERIC_KEYS) {
          const value = data[key];
          localStorage.setItem(key, String(value ?? 0));
        }

        window.location.reload();
        resolve({ success: true });
      } catch {
        resolve({
          success: false,
          error: "El archivo no es un JSON valido",
        });
      }
    };

    reader.onerror = () => {
      resolve({ success: false, error: "Error al leer el archivo" });
    };

    reader.readAsText(file);
  });
}

export function useDataPersistence() {
  return { exportData, importData };
}
