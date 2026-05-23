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
    createdAt: now,
    updatedAt: now,
  });
}

export async function updateFood(id: number, input: FoodInput) {
  if (!hasIndexedDB()) {
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
    return;
  }

  const { db } = await import("@/lib/db/schema");
  await db.foods.delete(id);
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
