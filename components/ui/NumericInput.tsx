"use client";

import { useEffect, useState } from "react";
import type { KeyboardEvent } from "react";

interface NumericInputProps {
  value: number;
  min?: number;
  autoFocus?: boolean;
  onBlur?: () => void;
  onKeyDown?: (event: KeyboardEvent<HTMLInputElement>) => void;
  onValueChange: (value: number) => void;
}

function formatValue(value: number) {
  return Number.isFinite(value) ? String(value) : "";
}

function normalizeEditingValue(value: string) {
  const normalized = value.replace(",", ".");
  const numericValue = normalized.replace(/[^\d.]/g, "");
  const [integerPart = "", ...decimalParts] = numericValue.split(".");
  const decimalPart = decimalParts.join("");
  const cleanedValue = decimalParts.length > 0 ? `${integerPart}.${decimalPart}` : integerPart;

  if (/^0+\d/.test(cleanedValue)) {
    return cleanedValue.replace(/^0+/, "");
  }

  return cleanedValue;
}

function parseNumericValue(value: string, min = 0) {
  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed < min) {
    return Number.NaN;
  }

  return parsed;
}

export function NumericInput({ value, min = 0, autoFocus, onBlur, onKeyDown, onValueChange }: NumericInputProps) {
  const [displayValue, setDisplayValue] = useState(formatValue(value));
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (!isFocused) {
      setDisplayValue(formatValue(value));
    }
  }, [isFocused, value]);

  return (
    <input
      value={displayValue}
      inputMode="decimal"
      min={min}
      type="text"
      autoFocus={autoFocus}
      onFocus={() => setIsFocused(true)}
      onKeyDown={onKeyDown}
      onChange={(event) => {
        const nextDisplayValue = normalizeEditingValue(event.target.value);
        setDisplayValue(nextDisplayValue);
        onValueChange(parseNumericValue(nextDisplayValue, min));
      }}
      onBlur={() => {
        setIsFocused(false);
        const parsed = parseNumericValue(displayValue, min);

        if (!Number.isFinite(parsed)) {
          setDisplayValue(String(min));
          onValueChange(min);
        }

        onBlur?.();
      }}
    />
  );
}
