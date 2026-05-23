import type { DailyTarget, NutritionTotals } from "@/types/models";

const proteinMessages = [
  "Сьогодні білка поки небагато 🌿",
  "Можливо, варто додати щось білкове",
  "Трохи білка зараз може добре підтримати енергію",
  "Маленький білковий перекус теж рахується ✨",
];

export function getProteinAwarenessMessage(totals: NutritionTotals, target?: DailyTarget, now = new Date()) {
  if (!target?.protein || now.getHours() < 17) {
    return null;
  }

  const proteinProgress = totals.protein / target.protein;

  if (proteinProgress >= 0.55) {
    return null;
  }

  const index = (now.getDate() + Math.round(totals.protein)) % proteinMessages.length;
  return proteinMessages[index];
}
