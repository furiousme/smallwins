"use client";

import { useState } from "react";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { FoodFormSheet } from "@/components/foods/FoodFormSheet";
import { createMealEntry } from "@/lib/db/mealEntries";
import { deleteFood } from "@/lib/db/foods";
import { formatMacro, servingTypeLabel } from "@/lib/nutrition/format";
import type { Food } from "@/types/models";

interface FoodDetailsSheetProps {
  food: Food;
  onClose: () => void;
}

export function FoodDetailsSheet({ food, onClose }: FoodDetailsSheetProps) {
  const [isEditing, setIsEditing] = useState(false);
  const createdDate = new Intl.DateTimeFormat("uk-UA", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(food.createdAt));

  async function handleDelete() {
    if (!food.id) {
      return;
    }

    const confirmed = window.confirm("Видалити цю страву? Записи в щоденнику залишаться без змін.");

    if (!confirmed) {
      return;
    }

    await deleteFood(food.id);
    onClose();
  }

  async function quickAdd() {
    await createMealEntry({
      food,
      amount: food.servingType === "per_piece" ? 1 : 100,
      mealType: "snack",
    });
    onClose();
  }

  if (isEditing) {
    return <FoodFormSheet food={food} onClose={onClose} />;
  }

  return (
    <BottomSheet title={food.name} onClose={onClose}>
      <div className="food-details">
        <section className="food-hero soft-card">
          <span>{servingTypeLabel(food.servingType)}</span>
          <strong>{food.calories} ккал</strong>
          <p>
            Б {formatMacro(food.protein)} · Ж {formatMacro(food.fat)} · В {formatMacro(food.carbs)}
          </p>
        </section>

        <div className="detail-grid">
          <article className="soft-card stat-tile">
            <span>Додавань</span>
            <strong>{food.usageCount ?? 0}</strong>
          </article>
          <article className="soft-card stat-tile">
            <span>Створено</span>
            <strong>{createdDate}</strong>
          </article>
        </div>

        {(food.usageCount ?? 0) > 2 ? <p className="frequent-note">Часто зʼявляється у твоєму дні 🌿</p> : null}

        <div className="sheet-actions triple">
          <button className="secondary-button" type="button" onClick={() => setIsEditing(true)}>
            Редагувати
          </button>
          <button className="secondary-button danger-button" type="button" onClick={() => void handleDelete()}>
            Видалити
          </button>
          <button className="primary-button" type="button" onClick={() => void quickAdd()}>
            Додати
          </button>
        </div>
      </div>
    </BottomSheet>
  );
}
