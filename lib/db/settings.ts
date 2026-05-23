import { fallbackStorage } from "@/lib/db/localFallback";
import { hasIndexedDB } from "@/lib/db/support";
import { defaultThemeId } from "@/lib/themes/config";
import type { Settings } from "@/types/models";

const SETTINGS_ID = "app" as const;

export async function getSettings(): Promise<Settings> {
  if (!hasIndexedDB()) {
    const fallback = fallbackStorage.getSettings();

    if (fallback) {
      return fallback;
    }

    const created: Settings = {
      id: SETTINGS_ID,
      themeId: defaultThemeId,
      language: "uk",
      updatedAt: new Date().toISOString(),
    };

    fallbackStorage.setSettings(created);
    return created;
  }

  const { db } = await import("@/lib/db/schema");
  const existing = await db.settings.get(SETTINGS_ID);

  if (existing) {
    return existing;
  }

  const created: Settings = {
    id: SETTINGS_ID,
    themeId: defaultThemeId,
    language: "uk",
    updatedAt: new Date().toISOString(),
  };

  await db.settings.put(created);
  return created;
}

export async function updateTheme(themeId: string): Promise<Settings> {
  const settings = await getSettings();
  const updated: Settings = {
    ...settings,
    themeId,
    updatedAt: new Date().toISOString(),
  };

  if (hasIndexedDB()) {
    const { db } = await import("@/lib/db/schema");
    await db.settings.put(updated);
  } else {
    fallbackStorage.setSettings(updated);
  }

  return updated;
}
