"use client";

import { useCallback, useState } from "react";
import type { CSSProperties } from "react";
import { getWeeklyProgress } from "@/lib/progress/weeklyProgress";
import { clampPercent, formatMacro, formatNumber, formatPercent } from "@/lib/nutrition/format";
import { useDexieLiveQuery } from "@/lib/hooks/useDexieLiveQuery";

function chartStyle(percent: number): CSSProperties {
  return { "--bar-height": `${Math.max(7, percent)}%` } as CSSProperties;
}

export function ProgressScreen() {
  const [weekOffset, setWeekOffset] = useState(0);
  const progressQuery = useCallback(() => getWeeklyProgress(weekOffset), [weekOffset]);
  const { value: progress, isLoading } = useDexieLiveQuery(progressQuery, undefined);
  const hasData = progress ? progress.consistency.loggedDays > 0 : false;

  return (
    <section className="screen progress-screen">
      <header>
        <p>Твій ритм</p>
        <h1>Прогрес</h1>
      </header>

      <div className="week-switcher" aria-label="Перемикач тижнів">
        <button type="button" onClick={() => setWeekOffset((current) => current + 1)}>
          ←
        </button>
        <div>
          <strong>{progress?.title ?? "Цей тиждень"}</strong>
          <span>{progress?.rangeLabel ?? "Останні 7 днів"}</span>
        </div>
        <button type="button" onClick={() => setWeekOffset((current) => Math.max(0, current - 1))} disabled={weekOffset === 0}>
          →
        </button>
      </div>

      {isLoading || !progress ? (
        <section className="progress-skeleton soft-card" aria-label="Завантаження прогресу" />
      ) : null}

      {progress && !hasData ? (
        <article className="progress-empty card">
          <span>🌿</span>
          <h2>Тут з’явиться твій прогрес</h2>
          <p>Почни логувати прийоми їжі, щоб бачити свій ритм. Маленькі кроки поступово складаються у великі зміни.</p>
        </article>
      ) : null}

      {progress && hasData ? (
        <>
          <section className="weekly-hero card">
            <div className="section-heading">
              <h2>Калорії за тиждень</h2>
              <span>{progress.target ? `ціль ${progress.target.calories} ккал` : "без цілі"}</span>
            </div>

            <div className="weekly-bars" aria-label="Калорії за останні 7 днів">
              {progress.days.map((day) => (
                <div key={day.date} className={day.withinCalories ? "weekly-bar-day balanced" : "weekly-bar-day"}>
                  <div className="weekly-bar-track">
                    {progress.target ? <i className="target-line" style={{ bottom: `${clampPercent((progress.target.calories / Math.max(progress.target.calories, day.calories, 1)) * 100)}%` }} /> : null}
                    <span style={chartStyle(day.caloriePercent)} />
                  </div>
                  <strong>{day.weekday}</strong>
                  <small>{Math.round(day.calories)}</small>
                </div>
              ))}
            </div>
          </section>

          <section className="macro-balance-card soft-card">
            <div className="section-heading">
              <h2>Баланс макросів</h2>
              <span>середнє за день</span>
            </div>
            <div className="weekly-macro-list">
              {progress.macros.map((macro) => (
                <article key={macro.label} className="weekly-macro-row">
                  <div>
                    <strong>{macro.label}</strong>
                    <span>
                      {formatMacro(macro.value)}
                      {macro.target ? ` з ${formatMacro(macro.target)}` : ""}
                    </span>
                  </div>
                  <div className="weekly-macro-meter" aria-hidden="true">
                    <i style={{ width: `${clampPercent(macro.percent)}%` }} />
                  </div>
                  <small>{macro.target ? formatPercent(macro.percent) : "ціль не задана"}</small>
                </article>
              ))}
            </div>
          </section>

          <section className="consistency-grid">
            <article className="consistency-card card">
              <span>Записи</span>
              <strong>{progress.consistency.loggedDays}/7</strong>
              <p>{progress.consistency.loggingStreak ? `${progress.consistency.loggingStreak} дні поспіль із записами 🌿` : "Ритм починається м’яко"}</p>
            </article>
            <article className="consistency-card soft-card">
              <span>Білок</span>
              <strong>{progress.consistency.proteinDays}</strong>
              <p>дні з достатнім білком</p>
            </article>
            <article className="consistency-card soft-card">
              <span>Ціль</span>
              <strong>{progress.consistency.daysWithinCalories}</strong>
              <p>дні близько до калорійної цілі</p>
            </article>
          </section>

          <section className="weekly-insights card">
            <div className="section-heading">
              <h2>Що видно цього тижня</h2>
              <span>без тиску</span>
            </div>
            <div className="insight-list">
              {progress.insights.map((insight) => (
                <p key={insight}>{insight}</p>
              ))}
            </div>
          </section>

          <p className="progress-footnote">
            Середній день: {formatNumber(progress.days.reduce((sum, day) => sum + day.calories, 0) / 7)} ккал. Це просто орієнтир, не оцінка.
          </p>
        </>
      ) : null}
    </section>
  );
}
