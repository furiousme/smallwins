import { fallbackStorage } from "@/lib/db/localFallback";
import { hasIndexedDB } from "@/lib/db/support";
import type { DailyTarget } from "@/types/models";

export type DailyTargetInput = Omit<DailyTarget, "id" | "updatedAt">;

const TARGET_ID = 1;

export async function getDailyTarget() {
  if (!hasIndexedDB()) {
    return fallbackStorage.getTarget();
  }

  const { db } = await import("@/lib/db/schema");
  return db.dailyTargets.get(TARGET_ID);
}

export async function upsertDailyTarget(input: DailyTargetInput) {
  const target: DailyTarget = {
    id: TARGET_ID,
    calories: Math.max(0, input.calories),
    protein: Math.max(0, input.protein),
    fat: Math.max(0, input.fat),
    carbs: Math.max(0, input.carbs),
    updatedAt: new Date().toISOString(),
  };

  if (!hasIndexedDB()) {
    fallbackStorage.setTarget(target);
    return target;
  }

  const { db } = await import("@/lib/db/schema");
  await db.dailyTargets.put(target);
  return target;
}
