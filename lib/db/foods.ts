import { fallbackStorage } from "@/lib/db/localFallback";
import { hasIndexedDB } from "@/lib/db/support";
import type { ServingType } from "@/types/models";

export interface FoodInput {
  name: string;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  servingType: ServingType;
}

function normalizeFoodInput(input: FoodInput): FoodInput {
  return {
    ...input,
    name: input.name.trim(),
    calories: Math.max(0, input.calories),
    protein: Math.max(0, input.protein),
    fat: Math.max(0, input.fat),
    carbs: Math.max(0, input.carbs),
  };
}

export async function createFood(input: FoodInput) {
  if (!hasIndexedDB()) {
    return fallbackStorage.createFood(normalizeFoodInput(input));
  }

  const { db } = await import("@/lib/db/schema");
  const now = new Date().toISOString();
  const food = normalizeFoodInput(input);

  return db.foods.add({
    ...food,
    usageCount: 0,
    createdAt: now,
    updatedAt: now,
  });
}

export async function updateFood(id: number, input: FoodInput) {
  if (!hasIndexedDB()) {
    fallbackStorage.updateFood(id, normalizeFoodInput(input));
    return;
  }

  const { db } = await import("@/lib/db/schema");
  const food = normalizeFoodInput(input);

  await db.foods.update(id, {
    ...food,
    updatedAt: new Date().toISOString(),
  });
}

export async function deleteFood(id: number) {
  if (!hasIndexedDB()) {
    fallbackStorage.deleteFood(id);
    return;
  }

  const { db } = await import("@/lib/db/schema");
  await db.foods.delete(id);
}

export async function touchFoodUsage(foodId: number) {
  if (!hasIndexedDB()) {
    fallbackStorage.touchFoodUsage(foodId);
    return;
  }

  const { db } = await import("@/lib/db/schema");
  const food = await db.foods.get(foodId);

  if (!food) {
    return;
  }

  await db.foods.update(foodId, {
    usageCount: (food.usageCount ?? 0) + 1,
    lastUsedAt: new Date().toISOString(),
  });
}

export async function getFrequentFoods(limit = 6) {
  const foods = await getFoods();

  return foods
    .filter((food) => (food.usageCount ?? 0) > 0)
    .sort((a, b) => {
      const usageDiff = (b.usageCount ?? 0) - (a.usageCount ?? 0);
      return usageDiff || (b.lastUsedAt ?? "").localeCompare(a.lastUsedAt ?? "");
    })
    .slice(0, limit);
}

export async function getFoods() {
  if (!hasIndexedDB()) {
    return fallbackStorage.getFoods();
  }

  const { db } = await import("@/lib/db/schema");
  const foods = await db.foods.orderBy("updatedAt").reverse().toArray();
  return foods.sort((a, b) => a.name.localeCompare(b.name, "uk"));
}

export async function searchFoods(query: string) {
  const normalizedQuery = query.trim().toLocaleLowerCase("uk");
  const foods = await getFoods();

  if (!normalizedQuery) {
    return foods;
  }

  return foods.filter((food) => food.name.toLocaleLowerCase("uk").includes(normalizedQuery));
}
