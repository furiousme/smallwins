"use client";

import { useCallback, useEffect, useState } from "react";
import type { FormEvent } from "react";
import { themes } from "@/lib/themes/config";
import { getDailyTarget, upsertDailyTarget } from "@/lib/db/targets";
import { useDexieLiveQuery } from "@/lib/hooks/useDexieLiveQuery";

interface SettingsScreenProps {
  themeId: string;
  onThemeChange: (themeId: string) => Promise<void>;
  onLogout: () => Promise<void>;
}

export function SettingsScreen({ themeId, onThemeChange, onLogout }: SettingsScreenProps) {
  const targetQuery = useCallback(() => getDailyTarget(), []);
  const { value: target } = useDexieLiveQuery(targetQuery, undefined);
  const [targetForm, setTargetForm] = useState({
    calories: 0,
    protein: 0,
    fat: 0,
    carbs: 0,
  });
  const [saveMessage, setSaveMessage] = useState("");

  useEffect(() => {
    if (!target) {
      return;
    }

    setTargetForm({
      calories: target.calories,
      protein: target.protein,
      fat: target.fat,
      carbs: target.carbs,
    });
  }, [target]);

  function updateTargetField(field: keyof typeof targetForm, value: string) {
    setSaveMessage("");
    const parsed = Number(value);
    setTargetForm((current) => ({
      ...current,
      [field]: Number.isFinite(parsed) ? Math.max(0, parsed) : 0,
    }));
  }

  async function saveTargets(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await upsertDailyTarget(targetForm);
    setSaveMessage("Цілі збережено");
  }

  return (
    <section className="screen settings-screen">
      <header>
        <p>Особистий простір</p>
        <h1>Налаштування</h1>
      </header>

      <section className="card settings-section">
        <div className="section-heading">
          <h2>Тема</h2>
          <span>Збережено локально</span>
        </div>

        <div className="theme-list" role="radiogroup" aria-label="Вибір теми">
          {themes.map((theme) => (
            <button
              key={theme.id}
              type="button"
              className={themeId === theme.id ? "theme-option active" : "theme-option"}
              onClick={() => {
                void onThemeChange(theme.id);
              }}
              role="radio"
              aria-checked={themeId === theme.id}
            >
              <span className="theme-swatch" style={{ background: theme.swatch }} />
              <span>{theme.name}</span>
              <small>{themeId === theme.id ? "Активна" : "Обрати"}</small>
            </button>
          ))}
        </div>
      </section>

      <section className="soft-card settings-section compact">
        <div className="section-heading">
          <h2>Денні цілі</h2>
          <span>Локально</span>
        </div>

        <form className="targets-form" onSubmit={(event) => void saveTargets(event)}>
          <div className="form-grid">
            <label className="form-field">
              <span>Калорії</span>
              <input
                value={targetForm.calories}
                onChange={(event) => updateTargetField("calories", event.target.value)}
                type="number"
                inputMode="decimal"
                min="0"
              />
            </label>
            <label className="form-field">
              <span>Білки</span>
              <input
                value={targetForm.protein}
                onChange={(event) => updateTargetField("protein", event.target.value)}
                type="number"
                inputMode="decimal"
                min="0"
              />
            </label>
            <label className="form-field">
              <span>Жири</span>
              <input
                value={targetForm.fat}
                onChange={(event) => updateTargetField("fat", event.target.value)}
                type="number"
                inputMode="decimal"
                min="0"
              />
            </label>
            <label className="form-field">
              <span>Вуглеводи</span>
              <input
                value={targetForm.carbs}
                onChange={(event) => updateTargetField("carbs", event.target.value)}
                type="number"
                inputMode="decimal"
                min="0"
              />
            </label>
          </div>
          <button className="primary-button compact-button" type="submit">
            Зберегти цілі
          </button>
          <p className="save-message" aria-live="polite">
            {saveMessage}
          </p>
        </form>
      </section>

      <button className="secondary-button logout-button" type="button" onClick={() => void onLogout()}>
        Вийти
      </button>
    </section>
  );
}
