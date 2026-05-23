"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { createFood, updateFood, type FoodInput } from "@/lib/db/foods";
import type { Food, ServingType } from "@/types/models";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { NumericInput } from "@/components/ui/NumericInput";

interface FoodFormSheetProps {
  food?: Food;
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

export function FoodFormSheet({ food, onClose }: FoodFormSheetProps) {
  const [form, setForm] = useState<FoodInput>(
    food
      ? {
          name: food.name,
          calories: food.calories,
          protein: food.protein,
          fat: food.fat,
          carbs: food.carbs,
          servingType: food.servingType,
        }
      : { ...initialForm },
  );
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
    if (food?.id) {
      await updateFood(food.id, form);
    } else {
      await createFood(form);
    }
    setIsSaving(false);
    onClose();
  }

  return (
    <BottomSheet title={food ? "Редагувати страву" : "Нова страва"} onClose={onClose}>
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
            <NumericInput value={form.calories} onValueChange={(value) => updateField("calories", String(value))} />
          </label>
          <label className="form-field">
            <span>Білки</span>
            <NumericInput value={form.protein} onValueChange={(value) => updateField("protein", String(value))} />
          </label>
          <label className="form-field">
            <span>Жири</span>
            <NumericInput value={form.fat} onValueChange={(value) => updateField("fat", String(value))} />
          </label>
          <label className="form-field">
            <span>Вуглеводи</span>
            <NumericInput value={form.carbs} onValueChange={(value) => updateField("carbs", String(value))} />
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
