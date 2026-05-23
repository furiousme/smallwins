import { fallbackStorage } from "@/lib/db/localFallback";
import { hasIndexedDB } from "@/lib/db/support";
import type { AuthSession, DailyTarget, Food, MealEntry, Settings } from "@/types/models";

export interface SmallWinsBackup {
  version: 1;
  exportedAt: string;
  foods: Food[];
  mealEntries: MealEntry[];
  dailyTargets: DailyTarget[];
  settings?: Settings;
  authSession?: AuthSession;
}

function isBackup(value: unknown): value is SmallWinsBackup {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<SmallWinsBackup>;
  return Array.isArray(candidate.foods) && Array.isArray(candidate.mealEntries) && Array.isArray(candidate.dailyTargets);
}

export async function exportLocalData(): Promise<SmallWinsBackup> {
  if (!hasIndexedDB()) {
    return fallbackStorage.exportAll();
  }

  const { db } = await import("@/lib/db/schema");
  const [foods, mealEntries, dailyTargets, settings, authSession] = await Promise.all([
    db.foods.toArray(),
    db.mealEntries.toArray(),
    db.dailyTargets.toArray(),
    db.settings.get("app"),
    db.authSession.get("current"),
  ]);

  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    foods,
    mealEntries,
    dailyTargets,
    settings,
    authSession,
  };
}

export async function importLocalData(rawJson: string) {
  const parsed = JSON.parse(rawJson) as unknown;

  if (!isBackup(parsed)) {
    throw new Error("INVALID_BACKUP");
  }

  if (!hasIndexedDB()) {
    fallbackStorage.importAll(parsed);
    return;
  }

  const { db } = await import("@/lib/db/schema");
  await db.transaction("rw", [db.foods, db.mealEntries, db.dailyTargets, db.settings, db.authSession], async () => {
    await Promise.all([db.foods.clear(), db.mealEntries.clear(), db.dailyTargets.clear()]);
    await db.foods.bulkPut(parsed.foods);
    await db.mealEntries.bulkPut(parsed.mealEntries);
    await db.dailyTargets.bulkPut(parsed.dailyTargets);

    if (parsed.settings) {
      await db.settings.put(parsed.settings);
    }

    if (parsed.authSession) {
      await db.authSession.put(parsed.authSession);
    }
  });
}
