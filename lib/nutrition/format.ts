import type { MealType, ServingType } from "@/types/models";

export const mealTypeLabels: Record<MealType, string> = {
  breakfast: "Сніданок",
  lunch: "Обід",
  dinner: "Вечеря",
  snack: "Перекус",
  other: "Інше",
};

export const visibleMealTypes: MealType[] = ["breakfast", "lunch", "dinner", "snack"];

export function servingTypeLabel(servingType: ServingType) {
  return servingType === "per_100g" ? "на 100 г" : "на 1 шт";
}

export function amountUnit(servingType?: ServingType) {
  return servingType === "per_piece" ? "шт" : "г";
}

export function formatAmount(amount: number, servingType?: ServingType) {
  return `${formatNumber(amount)} ${amountUnit(servingType)}`;
}

export function formatNumber(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(1).replace(/\.0$/, "");
}

export function formatMacro(value: number) {
  return `${formatNumber(Math.round(value * 10) / 10)} г`;
}

export function clampPercent(value: number) {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, Math.min(100, value));
}

export function formatPercent(value: number) {
  if (!Number.isFinite(value)) {
    return "0%";
  }

  return `${Math.round(value)}%`;
}
