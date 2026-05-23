import { db } from "@/lib/db/schema";
import { defaultThemeId } from "@/lib/themes/config";
import type { Settings } from "@/types/models";

const SETTINGS_ID = "app" as const;

export async function getSettings(): Promise<Settings> {
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

  await db.settings.put(updated);
  return updated;
}
