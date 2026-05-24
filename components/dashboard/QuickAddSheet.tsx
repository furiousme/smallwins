"use client";

import { useCallback, useMemo, useState } from "react";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { NumericInput } from "@/components/ui/NumericInput";
import { createManualMealEntry, createMealEntry, getRecentFoods } from "@/lib/db/mealEntries";
import { getFoods, getFrequentFoods } from "@/lib/db/foods";
import { amountUnit, mealTypeLabels, servingTypeLabel } from "@/lib/nutrition/format";
import { useDexieLiveQuery } from "@/lib/hooks/useDexieLiveQuery";
import type { Food, MealType } from "@/types/models";

interface QuickAddSheetProps {
  onClose: () => void;
  mode?: "foods" | "manual";
}

const defaultMealTypes: MealType[] = ["breakfast", "lunch", "dinner", "snack"];

function defaultAmount(food: Food) {
  return food.servingType === "per_piece" ? 1 : 100;
}

export function QuickAddSheet({ onClose, mode = "foods" }: QuickAddSheetProps) {
  const [query, setQuery] = useState("");
  const [selectedFood, setSelectedFood] = useState<Food | null>(null);
  const [amount, setAmount] = useState(100);
  const [mealType, setMealType] = useState<MealType>("snack");
  const [manualForm, setManualForm] = useState({
    foodName: "",
    calories: 0,
    protein: 0,
    fat: 0,
    carbs: 0,
  });
  const [isSaving, setIsSaving] = useState(false);
  const foodsQuery = useCallback(() => getFoods(), []);
  const recentQuery = useCallback(() => getRecentFoods(), []);
  const frequentQuery = useCallback(() => getFrequentFoods(), []);
  const { value: foods } = useDexieLiveQuery(foodsQuery, []);
  const { value: recentFoods } = useDexieLiveQuery(recentQuery, []);
  const { value: frequentFoods } = useDexieLiveQuery(frequentQuery, []);
  const filteredFoods = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("uk");

    if (!normalizedQuery) {
      return foods.slice(0, 6);
    }

    return foods.filter((food) => food.name.toLocaleLowerCase("uk").includes(normalizedQuery));
  }, [foods, query]);
  const canSaveManualEntry =
    manualForm.foodName.trim().length > 0 &&
    Number.isFinite(manualForm.calories) &&
    manualForm.calories > 0 &&
    [manualForm.protein, manualForm.fat, manualForm.carbs].every((value) => Number.isFinite(value) && value >= 0);

  function selectFood(food: Food) {
    setSelectedFood(food);
    setAmount(defaultAmount(food));
  }

  async function handleAdd() {
    if (!selectedFood || !Number.isFinite(amount) || amount <= 0) {
      return;
    }

    setIsSaving(true);
    await createMealEntry({ food: selectedFood, amount, mealType });
    setIsSaving(false);
    onClose();
  }

  function updateManualField(field: keyof typeof manualForm, value: string | number) {
    setManualForm((current) => ({
      ...current,
      [field]: field === "foodName" ? String(value) : Number(value),
    }));
  }

  async function handleManualAdd() {
    const values = [manualForm.calories, manualForm.protein, manualForm.fat, manualForm.carbs];

    if (!canSaveManualEntry || values.some((value) => !Number.isFinite(value) || value < 0)) {
      return;
    }

    setIsSaving(true);
    await createManualMealEntry({
      ...manualForm,
      mealType,
    });
    setIsSaving(false);
    onClose();
  }

  if (mode === "manual") {
    return (
      <BottomSheet title="Швидкий запис" onClose={onClose}>
        <div className="quick-add manual-add">
          <p className="sheet-helper">Додай калорії та макроси без збереження нової страви.</p>

          <label className="form-field">
            <span>Назва</span>
            <input
              value={manualForm.foodName}
              onChange={(event) => updateManualField("foodName", event.target.value)}
              placeholder="Наприклад, перекус"
              autoFocus
            />
          </label>

          <div className="form-grid">
            <label className="form-field">
              <span>Калорії</span>
              <NumericInput value={manualForm.calories} onValueChange={(value) => updateManualField("calories", value)} />
            </label>
            <label className="form-field">
              <span>Білки</span>
              <NumericInput value={manualForm.protein} onValueChange={(value) => updateManualField("protein", value)} />
            </label>
            <label className="form-field">
              <span>Жири</span>
              <NumericInput value={manualForm.fat} onValueChange={(value) => updateManualField("fat", value)} />
            </label>
            <label className="form-field">
              <span>Вуглеводи</span>
              <NumericInput value={manualForm.carbs} onValueChange={(value) => updateManualField("carbs", value)} />
            </label>
          </div>

          <div className="segmented-control meal-control" role="radiogroup" aria-label="Прийом їжі">
            {defaultMealTypes.map((type) => (
              <button key={type} type="button" className={mealType === type ? "active" : ""} onClick={() => setMealType(type)}>
                {mealTypeLabels[type]}
              </button>
            ))}
          </div>

          <div className="sheet-actions">
            <button className="secondary-button" type="button" onClick={onClose}>
              Скасувати
            </button>
            <button
              className="primary-button"
              type="button"
              onClick={() => void handleManualAdd()}
              disabled={isSaving || !canSaveManualEntry}
            >
              {isSaving ? "Додавання..." : "Додати"}
            </button>
          </div>
        </div>
      </BottomSheet>
    );
  }

  return (
    <BottomSheet title={selectedFood ? selectedFood.name : "Додати їжу"} onClose={onClose}>
      {!selectedFood ? (
        <div className="quick-add">
          <label className="search-field compact">
            <span className="sr-only">Пошук їжі</span>
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Знайти страву" type="search" autoFocus />
          </label>

          {query ? <div className="quick-section-title">Результати</div> : null}
          {query && filteredFoods.length === 0 ? (
            <div className="sheet-empty">Поки немає страв для швидкого додавання.</div>
          ) : null}

          {query ? (
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
          ) : (
            <>
              {frequentFoods.length ? (
                <>
                  <div className="quick-section-title">Часто додаєш</div>
                  <div className="quick-chip-scroll">
                    {frequentFoods.map((food) => (
                      <button key={food.id} type="button" className="quick-chip-card" onClick={() => selectFood(food)}>
                        <strong>{food.name}</strong>
                        <span>{food.usageCount ?? 0} разів</span>
                      </button>
                    ))}
                  </div>
                </>
              ) : null}

              <div className="quick-section-title">Нещодавно</div>
              {(recentFoods.length ? recentFoods : filteredFoods).length === 0 ? (
                <div className="sheet-empty">Поки немає страв для швидкого додавання.</div>
              ) : (
                <div className="quick-food-list">
                  {(recentFoods.length ? recentFoods : filteredFoods).map((food) => (
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
            </>
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
            <NumericInput value={amount} onValueChange={(value) => setAmount(Number.isFinite(value) ? Math.max(0, value) : value)} />
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
            <button className="primary-button" type="button" onClick={() => void handleAdd()} disabled={isSaving || !Number.isFinite(amount) || amount <= 0}>
              {isSaving ? "Додавання..." : "Додати"}
            </button>
          </div>
        </div>
      )}
    </BottomSheet>
  );
}
