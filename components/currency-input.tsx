"use client";

import * as React from "react";
import { useState, useEffect, useCallback } from "react";
import { Input, type InputProps } from "@/components/ui/input";

function formatNumber(n: number): string {
  if (isNaN(n)) return "";
  return n.toLocaleString("es-AR");
}

function parseNumber(s: string): number {
  // Strip thousand separators (dots), replace decimal comma with dot
  const cleaned = s.replace(/\./g, "").replace(",", ".");
  return parseFloat(cleaned);
}

function stripToNumeric(s: string): string {
  // Allow digits, one comma or dot as decimal, and leading minus
  let result = "";
  let hasDecimal = false;
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (ch === "-" && i === 0) {
      result += ch;
    } else if (ch >= "0" && ch <= "9") {
      result += ch;
    } else if ((ch === "," || ch === ".") && !hasDecimal) {
      result += ","; // normalize to comma for display
      hasDecimal = true;
    }
  }
  return result;
}

export interface CurrencyInputProps
  extends Omit<InputProps, "type" | "onChange" | "value"> {
  value?: number | string;
  defaultValue?: number | string;
  onValueChange?: (value: number) => void;
  name?: string;
}

const CurrencyInput = React.forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ value, defaultValue, onValueChange, name, onBlur, onFocus, ...props }, ref) => {
    const [displayValue, setDisplayValue] = useState<string>(() => {
      if (defaultValue != null && defaultValue !== "" && defaultValue !== 0) {
        const num = Number(defaultValue);
        if (!isNaN(num)) return formatNumber(num);
      }
      return "";
    });

    const [numericValue, setNumericValue] = useState<number>(() => {
      if (defaultValue != null && defaultValue !== "") {
        return Number(defaultValue) || 0;
      }
      return 0;
    });

    // Controlled mode: sync displayValue when value prop changes
    useEffect(() => {
      if (value !== undefined) {
        const num = Number(value);
        if (value === "" || value === null) {
          setDisplayValue("");
          setNumericValue(0);
        } else if (!isNaN(num)) {
          setNumericValue(num);
          // Only update display if the numeric value actually changed
          // to avoid overwriting while user types
          setDisplayValue((prev) => {
            const prevNum = parseNumber(prev);
            if (prevNum === num) return prev;
            return num === 0 && prev === "" ? "" : formatNumber(num);
          });
        }
      }
    }, [value]);

    const handleChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const raw = e.target.value;

        if (raw === "" || raw === "-") {
          setDisplayValue(raw);
          setNumericValue(0);
          onValueChange?.(0);
          return;
        }

        const stripped = stripToNumeric(raw);
        setDisplayValue(stripped);

        const parsed = parseNumber(stripped);
        if (!isNaN(parsed)) {
          setNumericValue(parsed);
          onValueChange?.(parsed);
        }
      },
      [onValueChange]
    );

    const handleBlur = useCallback(
      (e: React.FocusEvent<HTMLInputElement>) => {
        // Re-format on blur
        const parsed = parseNumber(displayValue);
        if (!isNaN(parsed) && displayValue !== "" && displayValue !== "-") {
          // Preserve decimal part if user typed it
          const hasDecimal = displayValue.includes(",");
          if (hasDecimal) {
            const parts = displayValue.replace(/\./g, "").split(",");
            const intPart = parseInt(parts[0] || "0", 10);
            const decPart = parts[1] || "";
            const formatted = intPart.toLocaleString("es-AR");
            setDisplayValue(decPart ? `${formatted},${decPart}` : formatted);
          } else {
            setDisplayValue(formatNumber(parsed));
          }
        }
        onBlur?.(e);
      },
      [displayValue, onBlur]
    );

    const handleFocus = useCallback(
      (e: React.FocusEvent<HTMLInputElement>) => {
        // Select all text on focus for easy replacement
        e.target.select();
        onFocus?.(e);
      },
      [onFocus]
    );

    return (
      <>
        <Input
          ref={ref}
          type="text"
          inputMode="decimal"
          value={displayValue}
          onChange={handleChange}
          onBlur={handleBlur}
          onFocus={handleFocus}
          {...props}
        />
        {name && (
          <input type="hidden" name={name} value={numericValue} />
        )}
      </>
    );
  }
);

CurrencyInput.displayName = "CurrencyInput";

export { CurrencyInput };
