"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { createFood, type FoodInput } from "@/lib/db/foods";
import type { ServingType } from "@/types/models";
import { BottomSheet } from "@/components/ui/BottomSheet";

interface FoodFormSheetProps {
  onClose: () => void;
}

const initialForm: FoodInput = {
  name: "",
  calories: 0,
  protein: 0,
  fat: 0,
  carbs: 0,
  servingType: "per_100g",
};

function parseNumber(value: string) {
  const parsed = Number(value.replace(",", "."));
  return Number.isFinite(parsed) ? parsed : Number.NaN;
}

export function FoodFormSheet({ onClose }: FoodFormSheetProps) {
  const [form, setForm] = useState({ ...initialForm });
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  function updateField(field: keyof FoodInput, value: string | ServingType) {
    setError("");
    setForm((current) => ({
      ...current,
      [field]: field === "name" || field === "servingType" ? value : parseNumber(value),
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!form.name.trim()) {
      setError("Додай назву страви.");
      return;
    }

    const values = [form.calories, form.protein, form.fat, form.carbs];

    if (values.some((value) => !Number.isFinite(value) || value < 0)) {
      setError("Усі значення мають бути числами від 0.");
      return;
    }

    setIsSaving(true);
    await createFood(form);
    setIsSaving(false);
    onClose();
  }

  return (
    <BottomSheet title="Нова страва" onClose={onClose}>
      <form className="food-form" onSubmit={(event) => void handleSubmit(event)}>
        <label className="form-field">
          <span>Назва страви</span>
          <input
            value={form.name}
            onChange={(event) => updateField("name", event.target.value)}
            placeholder="Наприклад, Грецький йогурт"
            autoFocus
          />
        </label>

        <div className="form-grid">
          <label className="form-field">
            <span>Калорії</span>
            <input
              value={Number.isNaN(form.calories) ? "" : form.calories}
              onChange={(event) => updateField("calories", event.target.value)}
              inputMode="decimal"
              min="0"
              type="number"
            />
          </label>
          <label className="form-field">
            <span>Білки</span>
            <input
              value={Number.isNaN(form.protein) ? "" : form.protein}
              onChange={(event) => updateField("protein", event.target.value)}
              inputMode="decimal"
              min="0"
              type="number"
            />
          </label>
          <label className="form-field">
            <span>Жири</span>
            <input
              value={Number.isNaN(form.fat) ? "" : form.fat}
              onChange={(event) => updateField("fat", event.target.value)}
              inputMode="decimal"
              min="0"
              type="number"
            />
          </label>
          <label className="form-field">
            <span>Вуглеводи</span>
            <input
              value={Number.isNaN(form.carbs) ? "" : form.carbs}
              onChange={(event) => updateField("carbs", event.target.value)}
              inputMode="decimal"
              min="0"
              type="number"
            />
          </label>
        </div>

        <div className="segmented-control" role="radiogroup" aria-label="Тип порції">
          <button
            type="button"
            className={form.servingType === "per_100g" ? "active" : ""}
            onClick={() => updateField("servingType", "per_100g")}
          >
            на 100 г
          </button>
          <button
            type="button"
            className={form.servingType === "per_piece" ? "active" : ""}
            onClick={() => updateField("servingType", "per_piece")}
          >
            на 1 шт
          </button>
        </div>

        <p className="form-error" aria-live="polite">
          {error}
        </p>

        <div className="sheet-actions">
          <button className="secondary-button" type="button" onClick={onClose}>
            Скасувати
          </button>
          <button className="primary-button" type="submit" disabled={isSaving}>
            {isSaving ? "Збереження..." : "Зберегти"}
          </button>
        </div>
      </form>
    </BottomSheet>
  );
}
