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
  // Allow digits, comma as decimal separator, and leading minus
  // Dots are thousand separators (added by formatting) — strip them
  let result = "";
  let hasDecimal = false;
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (ch === "-" && i === 0) {
      result += ch;
    } else if (ch >= "0" && ch <= "9") {
      result += ch;
    } else if (ch === "," && !hasDecimal) {
      result += ",";
      hasDecimal = true;
    }
    // dots are ignored (thousand separators)
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

    const inputRef = React.useRef<HTMLInputElement | null>(null);

    const handleChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const raw = e.target.value;
        const el = e.target;

        if (raw === "" || raw === "-") {
          setDisplayValue(raw);
          setNumericValue(0);
          onValueChange?.(0);
          return;
        }

        const stripped = stripToNumeric(raw);
        const parsed = parseNumber(stripped);

        // Format the integer part live while preserving decimal input
        let formatted: string;
        const hasDecimal = stripped.includes(",");
        if (hasDecimal) {
          const parts = stripped.split(",");
          const intPart = parseInt(parts[0].replace(/\./g, "") || "0", 10);
          const decPart = parts[1] || "";
          const intFormatted = isNaN(intPart) ? "0" : intPart.toLocaleString("es-AR");
          formatted = `${intFormatted},${decPart}`;
        } else {
          const intVal = parseInt(stripped.replace(/\./g, ""), 10);
          formatted = isNaN(intVal) ? stripped : intVal.toLocaleString("es-AR");
        }

        // Calculate cursor position: count how many dots before cursor changed
        const cursorPos = el.selectionStart ?? raw.length;
        const dotsBefore = (raw.slice(0, cursorPos).match(/\./g) || []).length;
        const dotsAfter = (formatted.slice(0, cursorPos).match(/\./g) || []).length;
        const newCursor = cursorPos + (dotsAfter - dotsBefore);

        setDisplayValue(formatted);

        // Restore cursor position after React re-render
        requestAnimationFrame(() => {
          if (inputRef.current) {
            const pos = Math.max(0, Math.min(newCursor, formatted.length));
            inputRef.current.setSelectionRange(pos, pos);
          }
        });

        if (!isNaN(parsed)) {
          setNumericValue(parsed);
          onValueChange?.(parsed);
        }
      },
      [onValueChange]
    );

    const handleBlur = useCallback(
      (e: React.FocusEvent<HTMLInputElement>) => {
        // Clean up trailing comma or dangling decimal on blur
        if (displayValue.endsWith(",")) {
          setDisplayValue(displayValue.slice(0, -1));
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
          ref={(node) => {
            inputRef.current = node;
            if (typeof ref === "function") ref(node);
            else if (ref) (ref as React.MutableRefObject<HTMLInputElement | null>).current = node;
          }}
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
