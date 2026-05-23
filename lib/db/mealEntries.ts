import { fallbackStorage } from "@/lib/db/localFallback";
import { hasIndexedDB } from "@/lib/db/support";
import { touchFoodUsage } from "@/lib/db/foods";
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
    const id = fallbackStorage.createEntry(input.food, Math.max(0, input.amount), input.mealType, input.date);
    if (input.food.id) {
      fallbackStorage.touchFoodUsage(input.food.id);
    }
    return id;
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

  const id = await db.mealEntries.add(entry);

  if (input.food.id) {
    await touchFoodUsage(input.food.id);
  }

  return id;
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

export async function duplicateMealEntry(entry: MealEntry, date = todayKey()) {
  const duplicated: MealEntry = {
    ...entry,
    id: undefined,
    date,
    createdAt: new Date().toISOString(),
  };

  if (!hasIndexedDB()) {
    return fallbackStorage.addEntrySnapshot(duplicated);
  }

  const { db } = await import("@/lib/db/schema");
  return db.mealEntries.add(duplicated);
}

export async function duplicateMeal(mealType: MealType, sourceDate = todayKey(), targetDate = todayKey()) {
  const entries = (await getTodayEntries(sourceDate)).filter((entry) => entry.mealType === mealType);

  for (const entry of entries) {
    await duplicateMealEntry(entry, targetDate);
  }

  return entries.length;
}

export async function duplicateYesterday() {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  const entries = await getTodayEntries(todayKey(yesterday));

  for (const entry of entries) {
    await duplicateMealEntry(entry);
  }

  return entries.length;
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
