"use client";

import { useCallback, useMemo, useState } from "react";
import { QuickAddSheet } from "@/components/dashboard/QuickAddSheet";
import {
  deleteMealEntry,
  duplicateMeal,
  duplicateMealEntry,
  duplicateYesterday,
  getTodayEntries,
  getTotals,
  updateMealEntryAmount,
} from "@/lib/db/mealEntries";
import { getDailyTarget } from "@/lib/db/targets";
import { amountUnit, clampPercent, formatAmount, formatMacro, formatNumber, mealTypeLabels, visibleMealTypes } from "@/lib/nutrition/format";
import { useDexieLiveQuery } from "@/lib/hooks/useDexieLiveQuery";
import type { MealEntry, MealType } from "@/types/models";

export function DashboardScreen() {
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [editingEntryId, setEditingEntryId] = useState<number | null>(null);
  const [collapsedMeals, setCollapsedMeals] = useState<MealType[]>([]);
  const [repeatMessage, setRepeatMessage] = useState("");
  const entriesQuery = useCallback(() => getTodayEntries(), []);
  const targetQuery = useCallback(() => getDailyTarget(), []);
  const { value: entries } = useDexieLiveQuery(entriesQuery, []);
  const { value: target } = useDexieLiveQuery(targetQuery, undefined);
  const totals = useMemo(() => getTotals(entries), [entries]);
  const groupedEntries = useMemo(() => {
    return entries.reduce<Record<MealType, MealEntry[]>>(
      (groups, entry) => {
        groups[entry.mealType].push(entry);
        return groups;
      },
      { breakfast: [], lunch: [], dinner: [], snack: [], other: [] },
    );
  }, [entries]);
  const calorieTarget = target?.calories ?? 0;
  const caloriePercent = calorieTarget ? clampPercent((totals.calories / calorieTarget) * 100) : 0;
  const caloriesLeft = calorieTarget ? Math.max(0, calorieTarget - totals.calories) : 0;
  const macros = [
    { label: "Білки", value: totals.protein, target: target?.protein ?? 0 },
    { label: "Жири", value: totals.fat, target: target?.fat ?? 0 },
    { label: "Вуглеводи", value: totals.carbs, target: target?.carbs ?? 0 },
  ];
  const todayDate = new Intl.DateTimeFormat("uk-UA", { weekday: "long", day: "numeric", month: "long" }).format(new Date());
  const microcopyOptions = ["Маленькі перемоги щодня 🌿", "Ти чудово справляєшся", "Ще один хороший день"];
  const microcopy = microcopyOptions[new Date().getDate() % microcopyOptions.length];

  function toggleMeal(mealType: MealType) {
    setCollapsedMeals((current) => (current.includes(mealType) ? current.filter((item) => item !== mealType) : [...current, mealType]));
  }

  async function handleRepeatYesterday() {
    const count = await duplicateYesterday();
    setRepeatMessage(count ? `Додано ${count} записів з учора.` : "Учора ще не було записів.");
  }

  async function handleRepeatMeal(mealType: MealType) {
    const count = await duplicateMeal(mealType);
    setRepeatMessage(count ? `Повторено: ${mealTypeLabels[mealType].toLocaleLowerCase("uk")}.` : "У цій групі поки немає записів.");
  }

  return (
    <section className="screen dashboard-screen">
      <header className="home-header">
        <div>
          <p>Привіт 🌿</p>
          <h1>Small Wins</h1>
          <span>
            {todayDate} · {microcopy}
          </span>
        </div>
      </header>

      <div className="quick-actions-strip">
        <button type="button" onClick={() => setIsQuickAddOpen(true)}>
          Швидко додати
        </button>
        <button type="button" onClick={() => void handleRepeatYesterday()}>
          Як учора
        </button>
      </div>
      {repeatMessage ? <p className="soft-feedback">{repeatMessage}</p> : null}

      <article className="card calories-card">
        <div className="calories-topline">
          <span>Калорії</span>
          <strong>{target ? `${Math.round(totals.calories)} / ${target.calories}` : `${Math.round(totals.calories)} ккал`}</strong>
        </div>
        <div className="calories-progress" aria-label="Прогрес калорій">
          <span style={{ width: `${caloriePercent}%` }} />
        </div>
        <div className="calories-summary">
          <div>
            <strong>{target ? caloriesLeft : "—"}</strong>
            <span>{target ? "залишилось" : "ціль не задана"}</span>
          </div>
          <div>
            <strong>{Math.round(caloriePercent)}%</strong>
            <span>плану</span>
          </div>
        </div>
      </article>

      <div className="macro-grid">
        {macros.map((macro) => (
          <article key={macro.label} className="soft-card macro-card">
            <span>{macro.label}</span>
            <strong>{formatMacro(macro.value)}</strong>
            <small>{macro.target ? `${Math.round(clampPercent((macro.value / macro.target) * 100))}%` : "ціль не задана"}</small>
            <div className="mini-progress" aria-hidden="true">
              <i style={{ width: `${macro.target ? clampPercent((macro.value / macro.target) * 100) : 0}%` }} />
            </div>
          </article>
        ))}
      </div>

      <button className="primary-button" type="button" onClick={() => setIsQuickAddOpen(true)}>
        + Додати їжу
      </button>

      <section className="today-log">
        <div className="section-heading">
          <h2>Сьогодні</h2>
          <span>{entries.length ? `${entries.length} записів` : "поки тихо"}</span>
        </div>

        {entries.length === 0 ? (
          <article className="soft-card day-note">
            <span>Лог дня</span>
            <p>Додай першу страву, і прогрес оновиться миттєво.</p>
          </article>
        ) : null}

        {visibleMealTypes.map((mealType) => {
          const mealEntries = groupedEntries[mealType];

          if (mealEntries.length === 0) {
            return null;
          }

          return (
            <article key={mealType} className="meal-group">
              <button type="button" className="meal-group-header" onClick={() => toggleMeal(mealType)}>
                <span>
                  {mealTypeLabels[mealType]} — {Math.round(getTotals(mealEntries).calories)} ккал
                </span>
                <small>{collapsedMeals.includes(mealType) ? "Розгорнути" : "Згорнути"}</small>
              </button>
              {!collapsedMeals.includes(mealType) ? (
                <div className="entry-list">
                  {mealEntries.map((entry) => (
                    <div key={entry.id} className="entry-row soft-card">
                      <div>
                        <strong>{entry.foodName}</strong>
                        {editingEntryId === entry.id ? (
                          <label className="inline-amount">
                            <input
                              defaultValue={entry.amount}
                              type="number"
                              inputMode="decimal"
                              min="0"
                              onBlur={(event) => {
                                void updateMealEntryAmount(entry, Number(event.target.value));
                                setEditingEntryId(null);
                              }}
                              onKeyDown={(event) => {
                                if (event.key === "Enter") {
                                  event.currentTarget.blur();
                                }
                              }}
                              autoFocus
                            />
                            <span>{amountUnit(entry.servingType)}</span>
                          </label>
                        ) : (
                          <button type="button" className="entry-meta" onClick={() => setEditingEntryId(entry.id ?? null)}>
                            {formatAmount(entry.amount, entry.servingType)}
                          </button>
                        )}
                        <small>
                          Б {formatNumber(entry.protein)} · Ж {formatNumber(entry.fat)} · В {formatNumber(entry.carbs)}
                        </small>
                      </div>
                      <div className="entry-side">
                        <strong>{Math.round(entry.calories)}</strong>
                        <span>ккал</span>
                        <button type="button" onClick={() => entry.id && void deleteMealEntry(entry.id)} aria-label={`Видалити ${entry.foodName}`}>
                          ×
                        </button>
                        <button type="button" onClick={() => void duplicateMealEntry(entry)} aria-label={`Повторити ${entry.foodName}`}>
                          ↻
                        </button>
                      </div>
                    </div>
                  ))}
                  <button className="repeat-meal-button" type="button" onClick={() => void handleRepeatMeal(mealType)}>
                    Повторити {mealTypeLabels[mealType].toLocaleLowerCase("uk")}
                  </button>
                </div>
              ) : null}
            </article>
          );
        })}
      </section>

      {isQuickAddOpen ? <QuickAddSheet onClose={() => setIsQuickAddOpen(false)} /> : null}
    </section>
  );
}
