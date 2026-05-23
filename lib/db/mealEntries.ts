import { fallbackStorage } from "@/lib/db/localFallback";
import { hasIndexedDB } from "@/lib/db/support";
import { calculateEntryNutrition } from "@/lib/nutrition/calc";
import { todayKey } from "@/lib/nutrition/date";
import type { Food, MealEntry, MealType, NutritionTotals } from "@/types/models";

export interface MealEntryInput {
  food: Food;
  amount: number;
  mealType: MealType;
  date?: string;
}

export async function createMealEntry(input: MealEntryInput) {
  if (!hasIndexedDB()) {
    return fallbackStorage.createEntry(input.food, Math.max(0, input.amount), input.mealType);
  }

  const amount = Math.max(0, input.amount);
  const { db } = await import("@/lib/db/schema");
  const totals = calculateEntryNutrition(input.food, amount);
  const entry: MealEntry = {
    foodId: input.food.id,
    foodName: input.food.name,
    amount,
    servingType: input.food.servingType,
    mealType: input.mealType,
    date: input.date ?? todayKey(),
    ...totals,
    createdAt: new Date().toISOString(),
  };

  return db.mealEntries.add(entry);
}

export async function updateMealEntryAmount(entry: MealEntry, amount: number) {
  if (!hasIndexedDB()) {
    fallbackStorage.updateEntryAmount(entry, Math.max(0, amount));
    return;
  }

  const { db } = await import("@/lib/db/schema");
  const food = entry.foodId ? await db.foods.get(entry.foodId) : null;
  const safeAmount = Math.max(0, amount);
  const totals = food
    ? calculateEntryNutrition(food, safeAmount)
    : {
        calories: entry.calories,
        protein: entry.protein,
        fat: entry.fat,
        carbs: entry.carbs,
      };

  await db.mealEntries.update(entry.id!, {
    amount: safeAmount,
    ...totals,
  });
}

export async function deleteMealEntry(id: number) {
  if (!hasIndexedDB()) {
    fallbackStorage.deleteEntry(id);
    return;
  }

  const { db } = await import("@/lib/db/schema");
  await db.mealEntries.delete(id);
}

export async function getTodayEntries(date = todayKey()) {
  if (!hasIndexedDB()) {
    return fallbackStorage.getEntries(date);
  }

  const { db } = await import("@/lib/db/schema");
  const entries = await db.mealEntries.where("date").equals(date).toArray();
  return entries.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getRecentFoods(limit = 6) {
  if (!hasIndexedDB()) {
    return fallbackStorage.getRecentFoods(limit);
  }

  const { db } = await import("@/lib/db/schema");
  const entries = await db.mealEntries.orderBy("createdAt").reverse().limit(40).toArray();
  const foodIds = Array.from(new Set(entries.map((entry) => entry.foodId).filter((id): id is number => typeof id === "number")));
  const foods = await Promise.all(foodIds.slice(0, limit).map((id) => db.foods.get(id)));

  return foods.filter((food): food is Food => Boolean(food));
}

export function getTotals(entries: MealEntry[]): NutritionTotals {
  return entries.reduce<NutritionTotals>(
    (totals, entry) => ({
      calories: totals.calories + entry.calories,
      protein: totals.protein + entry.protein,
      fat: totals.fat + entry.fat,
      carbs: totals.carbs + entry.carbs,
    }),
    { calories: 0, protein: 0, fat: 0, carbs: 0 },
  );
}

export async function getTodayTotals(date = todayKey()) {
  return getTotals(await getTodayEntries(date));
}
