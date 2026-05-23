import type { Food, NutritionTotals } from "@/types/models";

function multiplierFor(food: Food, amount: number) {
  return food.servingType === "per_100g" ? amount / 100 : amount;
}

export function calculateEntryNutrition(food: Food, amount: number): NutritionTotals {
  const multiplier = multiplierFor(food, amount);

  return {
    calories: Math.round(food.calories * multiplier),
    protein: Math.round(food.protein * multiplier * 10) / 10,
    fat: Math.round(food.fat * multiplier * 10) / 10,
    carbs: Math.round(food.carbs * multiplier * 10) / 10,
  };
}
