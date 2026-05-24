import { fallbackStorage } from "@/lib/db/localFallback";
import { hasIndexedDB } from "@/lib/db/support";
import { getDailyTarget } from "@/lib/db/targets";
import { getTotals } from "@/lib/db/mealEntries";
import { clampPercent } from "@/lib/nutrition/format";
import { todayKey } from "@/lib/nutrition/date";
import type { DailyTarget, NutritionTotals } from "@/types/models";

export interface WeeklyDayProgress {
  date: string;
  weekday: string;
  label: string;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  entryCount: number;
  hasEntries: boolean;
  withinCalories: boolean;
  reachedProtein: boolean;
  caloriePercent: number;
}

export interface WeeklyMacroProgress {
  label: string;
  value: number;
  target: number;
  percent: number;
}

export interface WeeklyConsistency {
  loggedDays: number;
  loggingStreak: number;
  daysWithinCalories: number;
  proteinDays: number;
}

export interface WeeklyProgress {
  days: WeeklyDayProgress[];
  macros: WeeklyMacroProgress[];
  consistency: WeeklyConsistency;
  insights: string[];
  target?: DailyTarget;
  title: string;
  rangeLabel: string;
}

function addDays(date: Date, days: number) {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate;
}

function getWindowDates(weekOffset: number) {
  const endDate = addDays(new Date(), weekOffset * -7);
  const startDate = addDays(endDate, -6);

  return Array.from({ length: 7 }, (_, index) => addDays(startDate, index));
}

function formatWeekday(date: Date) {
  return new Intl.DateTimeFormat("uk-UA", { weekday: "short" }).format(date).replace(".", "");
}

function formatDateLabel(date: Date) {
  return new Intl.DateTimeFormat("uk-UA", { day: "numeric", month: "short" }).format(date).replace(".", "");
}

function getRangeLabel(dates: Date[]) {
  const formatter = new Intl.DateTimeFormat("uk-UA", { day: "numeric", month: "short" });
  return `${formatter.format(dates[0]).replace(".", "")} – ${formatter.format(dates[dates.length - 1]).replace(".", "")}`;
}

function getWeekTitle(weekOffset: number) {
  if (weekOffset === 0) {
    return "Цей тиждень";
  }

  if (weekOffset === 1) {
    return "Минулого тижня";
  }

  return `${weekOffset} тижні тому`;
}

async function getEntriesBetween(startDate: string, endDate: string) {
  if (!hasIndexedDB()) {
    return fallbackStorage.getEntriesBetween(startDate, endDate);
  }

  const { db } = await import("@/lib/db/schema");
  return db.mealEntries.where("date").between(startDate, endDate, true, true).toArray();
}

function getMacroAverage(days: WeeklyDayProgress[], key: keyof Pick<NutritionTotals, "protein" | "fat" | "carbs">) {
  return days.reduce((total, day) => total + day[key], 0) / days.length;
}

function getLoggingStreak(days: WeeklyDayProgress[]) {
  let streak = 0;

  for (let index = days.length - 1; index >= 0; index -= 1) {
    if (!days[index].hasEntries) {
      break;
    }

    streak += 1;
  }

  return streak;
}

function buildInsights(days: WeeklyDayProgress[], consistency: WeeklyConsistency, target?: DailyTarget) {
  const insights: string[] = [];

  if (consistency.loggedDays > 0) {
    insights.push(`Ти логувала їжу ${consistency.loggedDays} із 7 днів ✨`);
  }

  if (consistency.loggingStreak >= 2) {
    insights.push(`${consistency.loggingStreak} дні поспіль із записами — ритм уже складається 🌿`);
  }

  if (target?.protein && consistency.proteinDays > 0) {
    insights.push(`${consistency.proteinDays} дні з достатнім білком. Спокійна, хороша сталість.`);
  }

  if (target?.calories && consistency.daysWithinCalories > 0) {
    insights.push(`${consistency.daysWithinCalories} дні були близько до калорійної цілі.`);
  }

  if (insights.length === 0) {
    insights.push("Маленькі кроки поступово складаються у великі зміни.");
  }

  const quietDays = days.filter((day) => !day.hasEntries).length;

  if (quietDays >= 4) {
    insights.push("Цей тиждень ще тихий. Достатньо почати з одного простого запису.");
  }

  return insights.slice(0, 3);
}

export async function getWeeklyProgress(weekOffset = 0): Promise<WeeklyProgress> {
  const dates = getWindowDates(weekOffset);
  const startDate = todayKey(dates[0]);
  const endDate = todayKey(dates[dates.length - 1]);
  const [entries, target] = await Promise.all([getEntriesBetween(startDate, endDate), getDailyTarget()]);
  const entriesByDate = entries.reduce<Record<string, typeof entries>>((groups, entry) => {
    groups[entry.date] = [...(groups[entry.date] ?? []), entry];
    return groups;
  }, {});
  const totalsByDate = Object.fromEntries(
    Object.entries(entriesByDate).map(([date, dateEntries]) => [date, getTotals(dateEntries)]),
  ) as Record<string, NutritionTotals>;
  const maxCalories = Math.max(target?.calories ?? 0, ...Object.values(totalsByDate).map((totals) => totals.calories), 1);

  const days = dates.map<WeeklyDayProgress>((date) => {
    const dateKey = todayKey(date);
    const dayEntries = entriesByDate[dateKey] ?? [];
    const totals = totalsByDate[dateKey] ?? { calories: 0, protein: 0, fat: 0, carbs: 0 };
    const calorieGoal = target?.calories ?? maxCalories;

    return {
      date: dateKey,
      weekday: formatWeekday(date),
      label: formatDateLabel(date),
      calories: totals.calories,
      protein: totals.protein,
      fat: totals.fat,
      carbs: totals.carbs,
      entryCount: dayEntries.length,
      hasEntries: dayEntries.length > 0,
      withinCalories: Boolean(target?.calories && totals.calories >= target.calories * 0.8 && totals.calories <= target.calories * 1.1),
      reachedProtein: Boolean(target?.protein && totals.protein >= target.protein * 0.85),
      caloriePercent: clampPercent((totals.calories / calorieGoal) * 100),
    };
  });

  const consistency: WeeklyConsistency = {
    loggedDays: days.filter((day) => day.hasEntries).length,
    loggingStreak: getLoggingStreak(days),
    daysWithinCalories: days.filter((day) => day.withinCalories).length,
    proteinDays: days.filter((day) => day.reachedProtein).length,
  };

  const macros: WeeklyMacroProgress[] = [
    { label: "Білки", value: getMacroAverage(days, "protein"), target: target?.protein ?? 0, percent: 0 },
    { label: "Жири", value: getMacroAverage(days, "fat"), target: target?.fat ?? 0, percent: 0 },
    { label: "Вуглеводи", value: getMacroAverage(days, "carbs"), target: target?.carbs ?? 0, percent: 0 },
  ].map((macro) => ({
    ...macro,
    percent: macro.target ? (macro.value / macro.target) * 100 : 0,
  }));

  return {
    days,
    macros,
    consistency,
    insights: buildInsights(days, consistency, target),
    target,
    title: getWeekTitle(weekOffset),
    rangeLabel: getRangeLabel(dates),
  };
}
