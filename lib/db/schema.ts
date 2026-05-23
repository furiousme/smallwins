import Dexie, { type Table } from "dexie";
import type { AuthSession, DailyTarget, Food, MealEntry, Settings } from "@/types/models";

export class SmallWinsDatabase extends Dexie {
  foods!: Table<Food, number>;
  mealEntries!: Table<MealEntry, number>;
  dailyTargets!: Table<DailyTarget, number>;
  settings!: Table<Settings, "app">;
  authSession!: Table<AuthSession, "current">;

  constructor() {
    super("smallWinsLocalDatabase");

    this.version(1).stores({
      foods: "++id, name, createdAt, updatedAt",
      mealEntries: "++id, date, mealType, foodId, createdAt",
      dailyTargets: "++id, updatedAt",
      settings: "id, themeId, updatedAt",
      authSession: "id, token, expiresAt, createdAt",
    });

    this.version(2).stores({
      foods: "++id, name, createdAt, updatedAt",
      mealEntries: "++id, date, mealType, foodId, createdAt",
      dailyTargets: "++id, updatedAt",
      settings: "id, themeId, updatedAt",
      authSession: "id, token, expiresAt, createdAt",
    });

    this.version(3).stores({
      foods: "++id, name, createdAt, updatedAt",
      mealEntries: "++id, date, mealType, foodId, createdAt",
      dailyTargets: "++id, updatedAt",
      settings: "id, themeId, updatedAt",
      authSession: "id, token, expiresAt, createdAt",
    });

    this.version(4).stores({
      foods: "++id, name, usageCount, lastUsedAt, createdAt, updatedAt",
      mealEntries: "++id, date, mealType, foodId, createdAt",
      dailyTargets: "++id, updatedAt",
      settings: "id, themeId, updatedAt",
      authSession: "id, token, expiresAt, createdAt",
    });
  }
}

export const db = new SmallWinsDatabase();
