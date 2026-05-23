export type ServingType = "per_100g" | "per_piece";
export type MealType = "breakfast" | "lunch" | "dinner" | "snack" | "other";
export type Language = "uk";

export interface Food {
  id?: number;
  name: string;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  servingType: ServingType;
  createdAt: string;
  updatedAt: string;
}

export interface MealEntry {
  id?: number;
  foodId?: number;
  foodName: string;
  amount: number;
  mealType: MealType;
  date: string;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  createdAt: string;
}

export interface DailyTarget {
  id?: number;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  updatedAt: string;
}

export interface Settings {
  id: "app";
  themeId: string;
  language: Language;
  updatedAt: string;
}

export interface AuthSession {
  id: "current";
  token: string;
  expiresAt: string;
  createdAt: string;
}
