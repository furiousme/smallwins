"use client";

import { useCallback, useMemo, useState } from "react";
import { FoodFormSheet } from "@/components/foods/FoodFormSheet";
import { getFoods } from "@/lib/db/foods";
import { servingTypeLabel } from "@/lib/nutrition/format";
import { useDexieLiveQuery } from "@/lib/hooks/useDexieLiveQuery";

export function FoodsScreen() {
  const [query, setQuery] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const foodQuery = useCallback(() => getFoods(), []);
  const { value: foods, isLoading } = useDexieLiveQuery(foodQuery, []);
  const filteredFoods = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("uk");

    if (!normalizedQuery) {
      return foods;
    }

    return foods.filter((food) => food.name.toLocaleLowerCase("uk").includes(normalizedQuery));
  }, [foods, query]);

  return (
    <section className="screen foods-screen">
      <header className="section-header">
        <p>Бібліотека</p>
        <h1>Мої страви</h1>
      </header>

      <label className="search-field">
        <span className="sr-only">Пошук страв</span>
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Пошук страви" type="search" />
      </label>

      {isLoading ? <p className="muted">Завантаження...</p> : null}

      {!isLoading && filteredFoods.length === 0 ? (
        <article className="card empty-state">
          <div className="empty-icon" aria-hidden="true">
            +
          </div>
          <h2>{query ? "Нічого не знайшлось" : "Тут з’являться твої улюблені страви 🌿"}</h2>
          <p>{query ? "Спробуй іншу назву або додай страву вручну." : "Додай кілька базових продуктів, і щоденне логування стане швидким."}</p>
        </article>
      ) : null}

      <div className="food-list">
        {filteredFoods.map((food) => (
          <article key={food.id} className="soft-card food-card">
            <div>
              <h2>{food.name}</h2>
              <span>{servingTypeLabel(food.servingType)}</span>
            </div>
            <strong>{food.calories} ккал</strong>
            <p>
              Б {food.protein} г · Ж {food.fat} г · В {food.carbs} г
            </p>
          </article>
        ))}
      </div>

      <button className="fab-button" type="button" onClick={() => setIsCreating(true)} aria-label="Додати страву">
        +
      </button>

      {isCreating ? <FoodFormSheet onClose={() => setIsCreating(false)} /> : null}
    </section>
  );
}
