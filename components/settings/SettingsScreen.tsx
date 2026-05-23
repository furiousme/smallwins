"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { themes } from "@/lib/themes/config";
import { exportLocalData, importLocalData } from "@/lib/db/backup";
import { getDailyTarget, upsertDailyTarget } from "@/lib/db/targets";
import { useDexieLiveQuery } from "@/lib/hooks/useDexieLiveQuery";
import { NumericInput } from "@/components/ui/NumericInput";

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
  const [backupMessage, setBackupMessage] = useState("");
  const importInputRef = useRef<HTMLInputElement | null>(null);

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

  async function handleExport() {
    const backup = await exportLocalData();
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `small-wins-backup-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    setBackupMessage("Резервну копію створено.");
  }

  async function handleImport(file?: File) {
    if (!file) {
      return;
    }

    try {
      await importLocalData(await file.text());
      setBackupMessage("Дані імпортовано успішно.");
    } catch {
      setBackupMessage("Не вдалося імпортувати файл. Перевір формат JSON.");
    } finally {
      if (importInputRef.current) {
        importInputRef.current.value = "";
      }
    }
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

        <div className="theme-preview-list" role="radiogroup" aria-label="Вибір теми">
          {themes.map((theme) => (
            <button
              key={theme.id}
              type="button"
              className={themeId === theme.id ? "theme-preview active" : "theme-preview"}
              onClick={() => {
                void onThemeChange(theme.id);
              }}
              role="radio"
              aria-checked={themeId === theme.id}
            >
              <span className="theme-preview-top" style={{ background: theme.colors.primary }} />
              <span>{theme.name}</span>
              <small style={{ background: theme.colors.accent }} />
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
              <NumericInput value={targetForm.calories} onValueChange={(value) => updateTargetField("calories", String(value))} />
            </label>
            <label className="form-field">
              <span>Білки</span>
              <NumericInput value={targetForm.protein} onValueChange={(value) => updateTargetField("protein", String(value))} />
            </label>
            <label className="form-field">
              <span>Жири</span>
              <NumericInput value={targetForm.fat} onValueChange={(value) => updateTargetField("fat", String(value))} />
            </label>
            <label className="form-field">
              <span>Вуглеводи</span>
              <NumericInput value={targetForm.carbs} onValueChange={(value) => updateTargetField("carbs", String(value))} />
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

      <section className="soft-card settings-section compact">
        <div className="section-heading">
          <h2>Мова</h2>
          <span>Українська</span>
        </div>
        <p>Інші мови можна буде додати пізніше. Зараз інтерфейс повністю українською.</p>
      </section>

      <section className="card settings-section">
        <div className="section-heading">
          <h2>Резервна копія</h2>
          <span>JSON</span>
        </div>
        <p>Експортуй локальні дані перед зміною пристрою або великими правками.</p>
        <div className="backup-actions">
          <button className="secondary-button" type="button" onClick={() => void handleExport()}>
            Експорт даних
          </button>
          <button className="secondary-button" type="button" onClick={() => importInputRef.current?.click()}>
            Імпорт даних
          </button>
        </div>
        <input
          ref={importInputRef}
          className="sr-only"
          type="file"
          accept="application/json,.json"
          onChange={(event) => void handleImport(event.target.files?.[0])}
        />
        <p className="save-message" aria-live="polite">
          {backupMessage}
        </p>
      </section>

      <section className="soft-card settings-section compact app-info">
        <div className="section-heading">
          <h2>Small Wins</h2>
          <span>Локально</span>
        </div>
        <p>Приватний трекер харчування без серверів, акаунтів і зайвого шуму.</p>
      </section>

      <button className="secondary-button logout-button" type="button" onClick={() => void onLogout()}>
        Вийти
      </button>
    </section>
  );
}
