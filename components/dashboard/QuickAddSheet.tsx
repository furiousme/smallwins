"use client";

import { useCallback, useMemo, useState } from "react";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { createMealEntry, getRecentFoods } from "@/lib/db/mealEntries";
import { getFoods } from "@/lib/db/foods";
import { amountUnit, mealTypeLabels, servingTypeLabel } from "@/lib/nutrition/format";
import { useDexieLiveQuery } from "@/lib/hooks/useDexieLiveQuery";
import type { Food, MealType } from "@/types/models";

interface QuickAddSheetProps {
  onClose: () => void;
}

const defaultMealTypes: MealType[] = ["breakfast", "lunch", "dinner", "snack"];

function defaultAmount(food: Food) {
  return food.servingType === "per_piece" ? 1 : 100;
}

export function QuickAddSheet({ onClose }: QuickAddSheetProps) {
  const [query, setQuery] = useState("");
  const [selectedFood, setSelectedFood] = useState<Food | null>(null);
  const [amount, setAmount] = useState(100);
  const [mealType, setMealType] = useState<MealType>("snack");
  const [isSaving, setIsSaving] = useState(false);
  const foodsQuery = useCallback(() => getFoods(), []);
  const recentQuery = useCallback(() => getRecentFoods(), []);
  const { value: foods } = useDexieLiveQuery(foodsQuery, []);
  const { value: recentFoods } = useDexieLiveQuery(recentQuery, []);
  const filteredFoods = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("uk");
    const source = normalizedQuery ? foods : recentFoods.length ? recentFoods : foods.slice(0, 6);

    if (!normalizedQuery) {
      return source;
    }

    return foods.filter((food) => food.name.toLocaleLowerCase("uk").includes(normalizedQuery));
  }, [foods, query, recentFoods]);

  function selectFood(food: Food) {
    setSelectedFood(food);
    setAmount(defaultAmount(food));
  }

  async function handleAdd() {
    if (!selectedFood || amount <= 0) {
      return;
    }

    setIsSaving(true);
    await createMealEntry({ food: selectedFood, amount, mealType });
    setIsSaving(false);
    onClose();
  }

  return (
    <BottomSheet title={selectedFood ? selectedFood.name : "Додати їжу"} onClose={onClose}>
      {!selectedFood ? (
        <div className="quick-add">
          <label className="search-field compact">
            <span className="sr-only">Пошук їжі</span>
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Знайти страву" type="search" autoFocus />
          </label>

          <div className="quick-section-title">{query ? "Результати" : "Нещодавні"}</div>
          {filteredFoods.length === 0 ? (
            <div className="sheet-empty">Поки немає страв для швидкого додавання.</div>
          ) : (
            <div className="quick-food-list">
              {filteredFoods.map((food) => (
                <button key={food.id} type="button" className="quick-food-option" onClick={() => selectFood(food)}>
                  <span>
                    <strong>{food.name}</strong>
                    <small>{servingTypeLabel(food.servingType)}</small>
                  </span>
                  <em>{food.calories} ккал</em>
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="quick-add">
          <div className="selected-food-card soft-card">
            <span>{servingTypeLabel(selectedFood.servingType)}</span>
            <strong>{selectedFood.calories} ккал</strong>
            <small>
              Б {selectedFood.protein} г · Ж {selectedFood.fat} г · В {selectedFood.carbs} г
            </small>
          </div>

          <label className="form-field">
            <span>Кількість, {amountUnit(selectedFood.servingType)}</span>
            <input
              value={amount}
              onChange={(event) => setAmount(Math.max(0, Number(event.target.value)))}
              inputMode="decimal"
              min="0"
              type="number"
            />
          </label>

          <div className="amount-chips">
            {(selectedFood.servingType === "per_piece" ? [1, 2, 3] : [100, 150, 250]).map((preset) => (
              <button key={preset} type="button" onClick={() => setAmount(preset)}>
                {preset} {amountUnit(selectedFood.servingType)}
              </button>
            ))}
          </div>

          <div className="segmented-control meal-control" role="radiogroup" aria-label="Прийом їжі">
            {defaultMealTypes.map((type) => (
              <button key={type} type="button" className={mealType === type ? "active" : ""} onClick={() => setMealType(type)}>
                {mealTypeLabels[type]}
              </button>
            ))}
          </div>

          <div className="sheet-actions">
            <button className="secondary-button" type="button" onClick={() => setSelectedFood(null)}>
              Назад
            </button>
            <button className="primary-button" type="button" onClick={() => void handleAdd()} disabled={isSaving || amount <= 0}>
              {isSaving ? "Додавання..." : "Додати"}
            </button>
          </div>
        </div>
      )}
    </BottomSheet>
  );
}
