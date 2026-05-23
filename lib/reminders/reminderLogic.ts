import { showLocalNotification } from "@/lib/notifications/browserNotifications";
import { todayKey } from "@/lib/nutrition/date";
import type { MealEntry, MealType, ReminderSettings } from "@/types/models";

type ReminderMeal = Extract<MealType, "breakfast" | "lunch" | "dinner">;

const reminderMessages = [
  "Не забудь додати свій прийом їжі",
  "Турбота про себе починається з маленьких кроків",
  "Просто коротко залогуй свій прийом їжі ✨",
  "Можна швидко додати те, що вже було сьогодні",
];

const reminderMealLabels: Record<ReminderMeal, string> = {
  breakfast: "сніданок",
  lunch: "обід",
  dinner: "вечерю",
};

const reminderTimeKeys: Record<ReminderMeal, "breakfastTime" | "lunchTime" | "dinnerTime"> = {
  breakfast: "breakfastTime",
  lunch: "lunchTime",
  dinner: "dinnerTime",
};

const lastGlobalReminderKey = "small-wins:last-reminder-at";
const reminderWindowMinutes = 45;
const recentEntryMinutes = 90;
const globalCooldownMinutes = 120;

function minutesFromTime(time: string) {
  const [hours = "0", minutes = "0"] = time.split(":");
  return Number(hours) * 60 + Number(minutes);
}

function minutesNow(now: Date) {
  return now.getHours() * 60 + now.getMinutes();
}

function reminderStorageKey(mealType: ReminderMeal, date = todayKey()) {
  return `small-wins:reminder:${date}:${mealType}`;
}

function wasSentToday(mealType: ReminderMeal, date = todayKey()) {
  try {
    return window.localStorage.getItem(reminderStorageKey(mealType, date)) === "sent";
  } catch {
    return false;
  }
}

function markSent(mealType: ReminderMeal, now: Date) {
  try {
    window.localStorage.setItem(reminderStorageKey(mealType, todayKey(now)), "sent");
    window.localStorage.setItem(lastGlobalReminderKey, now.toISOString());
  } catch {
    // Reminders are best effort; unavailable storage should never interrupt the app.
  }
}

function isInsideReminderWindow(settings: ReminderSettings, mealType: ReminderMeal, now: Date) {
  const dueAt = minutesFromTime(settings[reminderTimeKeys[mealType]]);
  const distance = minutesNow(now) - dueAt;
  return distance >= 0 && distance <= reminderWindowMinutes;
}

function hasRecentEntry(entries: MealEntry[], now: Date) {
  const recentSince = now.getTime() - recentEntryMinutes * 60 * 1000;
  return entries.some((entry) => new Date(entry.createdAt).getTime() >= recentSince);
}

function isGloballyCoolingDown(now: Date) {
  try {
    const raw = window.localStorage.getItem(lastGlobalReminderKey);

    if (!raw) {
      return false;
    }

    return now.getTime() - new Date(raw).getTime() < globalCooldownMinutes * 60 * 1000;
  } catch {
    return false;
  }
}

function pickReminderMessage(mealType: ReminderMeal, now: Date) {
  const index = (now.getDate() + now.getHours() + mealType.length) % reminderMessages.length;
  return `${reminderMessages[index]}: ${reminderMealLabels[mealType]}.`;
}

export function maybeShowMealReminder(settings: ReminderSettings, entries: MealEntry[], now = new Date()) {
  if (!settings.enabled || typeof window === "undefined" || hasRecentEntry(entries, now) || isGloballyCoolingDown(now)) {
    return false;
  }

  const mealType = (["breakfast", "lunch", "dinner"] as ReminderMeal[]).find((type) => {
    return isInsideReminderWindow(settings, type, now) && !wasSentToday(type, todayKey(now));
  });

  if (!mealType) {
    return false;
  }

  const didShow = showLocalNotification("Час для маленької перемоги 🌿", pickReminderMessage(mealType, now));

  if (didShow) {
    markSent(mealType, now);
  }

  return didShow;
}
