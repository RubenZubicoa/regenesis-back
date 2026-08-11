import { ObjectId } from "mongodb";

export const MEAL_COLLECTION = "Meal";

export interface MealItem {
  /** Nombre del alimento o preparación, p. ej. "Avena 50 g" */
  name: string;
  /** Calorías del alimento (opcional). */
  kcal?: number;
}

export interface MealSlot {
  /** Nombre de la toma, p. ej. "Desayuno", "Media mañana", "Comida"… */
  label: string;
  /** Hora orientativa, p. ej. "08:00" */
  time: string;
  /** Icono Ionicons */
  icon: string;
  /** Calorías totales de la toma (calculadas o estimadas). */
  kcal: number;
  /** Lista de alimentos que componen la toma. */
  items: MealItem[];
}

export interface Meal {
  _id: ObjectId;
  /** Id del cliente (colección Client). */
  clientId: ObjectId;
  /** Tomas del día (desayuno, media mañana, comida, merienda, cena…). */
  slots: MealSlot[];
}

/** Datos para crear el plan de comidas (sin `_id`). */
export type CreateMealInput = Omit<Meal, "_id">;

/** Datos parciales para actualizar el plan de comidas. */
export type UpdateMealInput = Partial<CreateMealInput>;
