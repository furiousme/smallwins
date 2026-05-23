import { fallbackStorage } from "@/lib/db/localFallback";
import { hasIndexedDB } from "@/lib/db/support";
import { defaultThemeId } from "@/lib/themes/config";
import type { ReminderSettings, Settings } from "@/types/models";

const SETTINGS_ID = "app" as const;

export const defaultReminderSettings: ReminderSettings = {
  enabled: false,
  breakfastTime: "09:00",
  lunchTime: "14:00",
  dinnerTime: "19:00",
};

function normalizeSettings(settings: Settings): Settings {
  return {
    ...settings,
    reminders: {
      ...defaultReminderSettings,
      ...settings.reminders,
    },
  };
}

function createDefaultSettings(): Settings {
  return {
    id: SETTINGS_ID,
    themeId: defaultThemeId,
    language: "uk",
    reminders: defaultReminderSettings,
    updatedAt: new Date().toISOString(),
  };
}

export async function getSettings(): Promise<Settings> {
  if (!hasIndexedDB()) {
    const fallback = fallbackStorage.getSettings();

    if (fallback) {
      return normalizeSettings(fallback);
    }

    const created = createDefaultSettings();

    fallbackStorage.setSettings(created);
    return created;
  }

  const { db } = await import("@/lib/db/schema");
  const existing = await db.settings.get(SETTINGS_ID);

  if (existing) {
    const normalized = normalizeSettings(existing);

    if (!existing.reminders) {
      await db.settings.put(normalized);
    }

    return normalized;
  }

  const created = createDefaultSettings();

  await db.settings.put(created);
  return created;
}

async function saveSettings(settings: Settings): Promise<Settings> {
  if (hasIndexedDB()) {
    const { db } = await import("@/lib/db/schema");
    await db.settings.put(settings);
  } else {
    fallbackStorage.setSettings(settings);
  }

  return settings;
}

export async function updateTheme(themeId: string): Promise<Settings> {
  const settings = await getSettings();
  const updated: Settings = {
    ...settings,
    themeId,
    updatedAt: new Date().toISOString(),
  };

  return saveSettings(updated);
}

export async function updateReminderSettings(reminders: ReminderSettings): Promise<Settings> {
  const settings = await getSettings();
  const updated: Settings = {
    ...settings,
    reminders: {
      ...defaultReminderSettings,
      ...reminders,
    },
    updatedAt: new Date().toISOString(),
  };

  return saveSettings(updated);
}
