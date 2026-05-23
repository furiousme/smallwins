"use client";

import { useCallback, useEffect } from "react";
import { getSettings } from "@/lib/db/settings";
import { getTodayEntries } from "@/lib/db/mealEntries";
import { useDexieLiveQuery } from "@/lib/hooks/useDexieLiveQuery";
import { maybeShowMealReminder } from "@/lib/reminders/reminderLogic";

export function ReminderScheduler() {
  const settingsQuery = useCallback(() => getSettings(), []);
  const { value: settings } = useDexieLiveQuery(settingsQuery, undefined);

  useEffect(() => {
    if (!settings?.reminders.enabled) {
      return;
    }

    const reminders = settings.reminders;
    let isActive = true;

    async function checkReminder() {
      const entries = await getTodayEntries();

      if (isActive) {
        maybeShowMealReminder(reminders, entries);
      }
    }

    void checkReminder();
    const intervalId = window.setInterval(() => void checkReminder(), 60_000);
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void checkReminder();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      isActive = false;
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [settings]);

  return null;
}
