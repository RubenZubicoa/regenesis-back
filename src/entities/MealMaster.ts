import { Meal } from "./Meal";

export type MealMaster = Omit<Meal, "clientId"> & {
  nombre: string;
  descripcion: string;
};

export const MEAL_MASTER_COLLECTION = "MealMaster";

/** Datos para crear un plan de comidas maestro (sin `_id`). */
export type CreateMealMasterInput = Omit<MealMaster, "_id">;

/** Datos parciales para actualizar un plan de comidas maestro. */
export type UpdateMealMasterInput = Partial<CreateMealMasterInput>;