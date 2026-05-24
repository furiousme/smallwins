"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { QuickAddSheet } from "@/components/dashboard/QuickAddSheet";
import { QuoteCard } from "@/components/dashboard/QuoteCard";
import { ProteinAwarenessCard } from "@/components/dashboard/ProteinAwarenessCard";
import { NumericInput } from "@/components/ui/NumericInput";
import {
  deleteMealEntry,
  duplicateMealEntry,
  duplicateYesterday,
  getTodayEntries,
  getTotals,
  updateMealEntryAmount,
} from "@/lib/db/mealEntries";
import { getDailyTarget } from "@/lib/db/targets";
import { amountUnit, clampPercent, formatAmount, formatMacro, formatNumber, formatPercent, mealTypeLabels, visibleMealTypes } from "@/lib/nutrition/format";
import { useDexieLiveQuery } from "@/lib/hooks/useDexieLiveQuery";
import type { MealEntry, MealType } from "@/types/models";

export function DashboardScreen() {
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [quickAddMode, setQuickAddMode] = useState<"foods" | "manual">("foods");
  const [editingEntryId, setEditingEntryId] = useState<number | null>(null);
  const [editingAmount, setEditingAmount] = useState(0);
  const [expandedMeal, setExpandedMeal] = useState<MealType | null>(null);
  const [repeatMessage, setRepeatMessage] = useState("");
  const lastEntrySignatureRef = useRef<string | null>(null);
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
  const caloriePercent = calorieTarget ? (totals.calories / calorieTarget) * 100 : 0;
  const caloriesLeft = calorieTarget ? Math.max(0, calorieTarget - totals.calories) : 0;
  const macros = [
    { label: "Білки", value: totals.protein, target: target?.protein ?? 0, percent: target?.protein ? (totals.protein / target.protein) * 100 : 0 },
    { label: "Жири", value: totals.fat, target: target?.fat ?? 0, percent: target?.fat ? (totals.fat / target.fat) * 100 : 0 },
    { label: "Вуглеводи", value: totals.carbs, target: target?.carbs ?? 0, percent: target?.carbs ? (totals.carbs / target.carbs) * 100 : 0 },
  ];
  const todayDate = new Intl.DateTimeFormat("uk-UA", { weekday: "long", day: "numeric", month: "long" }).format(new Date());
  const microcopyOptions = ["Маленькі перемоги щодня 🌿", "Ти чудово справляєшся", "Ще один хороший день"];
  const microcopy = microcopyOptions[new Date().getDate() % microcopyOptions.length];

  useEffect(() => {
    const latestEntry = entries[0];
    const latestSignature = latestEntry ? `${latestEntry.id ?? "new"}-${latestEntry.createdAt}` : "";

    if (lastEntrySignatureRef.current && latestSignature && latestSignature !== lastEntrySignatureRef.current) {
      setExpandedMeal(latestEntry.mealType);
    }

    lastEntrySignatureRef.current = latestSignature;
  }, [entries]);

  function toggleMeal(mealType: MealType) {
    setExpandedMeal((current) => (current === mealType ? null : mealType));
  }

  async function handleRepeatYesterday() {
    const count = await duplicateYesterday();
    setRepeatMessage(count ? `Додано ${count} записів з учора.` : "Учора ще не було записів.");
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

      <QuoteCard />

      <div className="quick-actions-strip">
        <button
          type="button"
          onClick={() => {
            setQuickAddMode("manual");
            setIsQuickAddOpen(true);
          }}
        >
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
          <span style={{ width: `${clampPercent(caloriePercent)}%` }} />
        </div>
        <div className="calories-summary">
          <div>
            <strong>{target ? caloriesLeft : "—"}</strong>
            <span>{target ? "залишилось" : "ціль не задана"}</span>
          </div>
          <div>
            <strong>{formatPercent(caloriePercent)}</strong>
            <span>плану</span>
          </div>
        </div>
      </article>

      <div className="macro-grid">
        {macros.map((macro) => (
          <article key={macro.label} className="soft-card macro-card">
            <span>{macro.label}</span>
            <strong>{formatMacro(macro.value)}</strong>
            <small>{macro.target ? formatPercent(macro.percent) : "ціль не задана"}</small>
            <div className="mini-progress" aria-hidden="true">
              <i style={{ width: `${macro.target ? clampPercent(macro.percent) : 0}%` }} />
            </div>
          </article>
        ))}
      </div>

      <ProteinAwarenessCard totals={totals} target={target} />

      <button
        className="primary-button"
        type="button"
        onClick={() => {
          setQuickAddMode("foods");
          setIsQuickAddOpen(true);
        }}
      >
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

          const isExpanded = expandedMeal === mealType;

          return (
            <article key={mealType} className="meal-group">
              <button type="button" className="meal-group-header" onClick={() => toggleMeal(mealType)}>
                <span>
                  {mealTypeLabels[mealType]} — {Math.round(getTotals(mealEntries).calories)} ккал
                </span>
                <small>{isExpanded ? "Згорнути" : "Розгорнути"}</small>
              </button>
              {isExpanded ? (
                <div className="entry-list">
                  {mealEntries.map((entry) => (
                    <div key={entry.id} className="entry-row soft-card">
                      <div>
                        <strong>{entry.foodName}</strong>
                        {editingEntryId === entry.id ? (
                          <label className="inline-amount">
                            <NumericInput
                              value={editingAmount}
                              autoFocus
                              onValueChange={setEditingAmount}
                              onKeyDown={(event) => {
                                if (event.key === "Enter") {
                                  event.currentTarget.blur();
                                }
                              }}
                              onBlur={() => {
                                void updateMealEntryAmount(entry, Number.isFinite(editingAmount) ? editingAmount : 0);
                                setExpandedMeal(entry.mealType);
                                setEditingEntryId(null);
                              }}
                            />
                            <span>{amountUnit(entry.servingType)}</span>
                          </label>
                        ) : (
                        <button
                          type="button"
                          className="entry-meta"
                          onClick={() => {
                            setEditingAmount(entry.amount);
                            setEditingEntryId(entry.id ?? null);
                          }}
                        >
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
                </div>
              ) : null}
            </article>
          );
        })}
      </section>

      {isQuickAddOpen ? <QuickAddSheet mode={quickAddMode} onClose={() => setIsQuickAddOpen(false)} /> : null}
    </section>
  );
}
