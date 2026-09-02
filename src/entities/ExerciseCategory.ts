import { ObjectId } from "mongodb";

export const EXERCISE_CATEGORY_COLLECTION = "ExerciseCategory";

export interface ExerciseCategory {
  _id: ObjectId;
  key: string;
  label: string;
}

/** Datos para crear una categoría de ejercicio (sin `_id`). */
export type CreateExerciseCategoryInput = Omit<ExerciseCategory, "_id">;

/** Datos parciales para actualizar una categoría de ejercicio. */
export type UpdateExerciseCategoryInput = Partial<CreateExerciseCategoryInput>;