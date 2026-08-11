import { ObjectId } from "mongodb";

export const EXERCISE_MASTER_COLLECTION = "ExerciseMaster";

export type ExerciseType = "strength" | "cardio";

export interface ExerciseMaster {
  _id: ObjectId;
  /** Nombre único del ejercicio, p. ej. "Press banca". */
  name: string;
  type: ExerciseType;
  /** URL de imagen ilustrativa. */
  imageUrl?: string;
  /** Explicación técnica de ejecución. */
  explanation?: string;
}

/** Datos para crear un ejercicio maestro (sin `_id`). */
export type CreateExerciseMasterInput = Omit<ExerciseMaster, "_id">;

/** Datos parciales para actualizar un ejercicio maestro. */
export type UpdateExerciseMasterInput = Partial<CreateExerciseMasterInput>;
