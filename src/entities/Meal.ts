import { ObjectId } from "mongodb";

export const MEAL_COLLECTION = "Meal";

/** Comida completa alternativa que el cliente puede elegir. */
export interface MealOption {
  /** Nombre de la comida, p. ej. "Avena con claras y plátano" */
  name: string;
  /** Calorías aproximadas de la comida completa. */
  kcal: number;
  /** Descripción breve de la composición (opcional). */
  description?: string;
}

export interface MealSlot {
  /** Nombre de la toma, p. ej. "Desayuno", "Media mañana", "Comida"… */
  label: string;
  /** Hora orientativa, p. ej. "08:00" */
  time: string;
  /** Icono Ionicons */
  icon: string;
  /** Comidas completas alternativas; el cliente elige una. */
  options: MealOption[];
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
