import { emitLocalStorageChange } from "@/lib/db/support";
import { calculateEntryNutrition } from "@/lib/nutrition/calc";
import { todayKey } from "@/lib/nutrition/date";
import type { AuthSession, DailyTarget, Food, MealEntry, MealType, Settings } from "@/types/models";

const keys = {
  foods: "small-wins:fallback:foods",
  entries: "small-wins:fallback:entries",
  target: "small-wins:fallback:target",
  settings: "small-wins:fallback:settings",
  session: "small-wins:fallback:session",
};

const memoryStore = new Map<string, string>();

function getItem(key: string) {
  try {
    return window.localStorage.getItem(key) ?? memoryStore.get(key) ?? null;
  } catch {
    return memoryStore.get(key) ?? null;
  }
}

function setItem(key: string, value: string) {
  memoryStore.set(key, value);

  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Some embedded browsers disable localStorage; memory keeps the session usable.
  }
}

function removeItem(key: string) {
  memoryStore.delete(key);

  try {
    window.localStorage.removeItem(key);
  } catch {
    // Ignore unavailable localStorage.
  }
}

function readJson<T>(key: string, fallback: T): T {
  const raw = getItem(key);

  if (!raw) {
    return fallback;
  }

  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T) {
  setItem(key, JSON.stringify(value));
  emitLocalStorageChange();
}

export const fallbackStorage = {
  getFoods() {
    return readJson<Food[]>(keys.foods, []).sort((a, b) => a.name.localeCompare(b.name, "uk"));
  },
  createFood(input: Omit<Food, "id" | "createdAt" | "updatedAt">) {
    const foods = fallbackStorage.getFoods();
    const now = new Date().toISOString();
    const nextFood: Food = {
      ...input,
      id: Date.now(),
      createdAt: now,
      updatedAt: now,
    };
    writeJson(keys.foods, [...foods, nextFood]);
    return nextFood.id;
  },
  getEntries(date = todayKey()) {
    return readJson<MealEntry[]>(keys.entries, [])
      .filter((entry) => entry.date === date)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },
  createEntry(food: Food, amount: number, mealType: MealType) {
    const entries = readJson<MealEntry[]>(keys.entries, []);
    const totals = calculateEntryNutrition(food, amount);
    const nextEntry: MealEntry = {
      id: Date.now(),
      foodId: food.id,
      foodName: food.name,
      servingType: food.servingType,
      amount,
      mealType,
      date: todayKey(),
      ...totals,
      createdAt: new Date().toISOString(),
    };
    writeJson(keys.entries, [...entries, nextEntry]);
    return nextEntry.id;
  },
  updateEntryAmount(entry: MealEntry, amount: number) {
    const foods = fallbackStorage.getFoods();
    const food = foods.find((item) => item.id === entry.foodId);
    const entries = readJson<MealEntry[]>(keys.entries, []);
    const totals = food
      ? calculateEntryNutrition(food, amount)
      : { calories: entry.calories, protein: entry.protein, fat: entry.fat, carbs: entry.carbs };

    writeJson(
      keys.entries,
      entries.map((item) => (item.id === entry.id ? { ...item, amount, ...totals } : item)),
    );
  },
  deleteEntry(id: number) {
    writeJson(
      keys.entries,
      readJson<MealEntry[]>(keys.entries, []).filter((entry) => entry.id !== id),
    );
  },
  getRecentFoods(limit = 6) {
    const foods = fallbackStorage.getFoods();
    const entries = readJson<MealEntry[]>(keys.entries, []).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    const ids = Array.from(new Set(entries.map((entry) => entry.foodId).filter((id): id is number => typeof id === "number")));
    return ids.map((id) => foods.find((food) => food.id === id)).filter((food): food is Food => Boolean(food)).slice(0, limit);
  },
  getTarget() {
    return readJson<DailyTarget | undefined>(keys.target, undefined);
  },
  setTarget(target: DailyTarget) {
    writeJson(keys.target, target);
  },
  getSettings() {
    return readJson<Settings | undefined>(keys.settings, undefined);
  },
  setSettings(settings: Settings) {
    writeJson(keys.settings, settings);
  },
  getSession() {
    return readJson<AuthSession | undefined>(keys.session, undefined);
  },
  setSession(session: AuthSession) {
    writeJson(keys.session, session);
  },
  clearSession() {
    removeItem(keys.session);
    emitLocalStorageChange();
  },
};
