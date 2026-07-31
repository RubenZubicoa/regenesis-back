import { ObjectId } from "mongodb";

export const ROUTINE_DAY_COLLECTION = "RoutineDay";

export type ExerciseType = "strength" | "cardio";

export interface RepRange {
  min: number;
  max: number;
}

export interface Exercise {
  name: string;
  /** Descripción de series, p. ej. "4 x 8-10" (fuerza) o "15 min" (cardio). */
  sets: string;
  rest: string;
  type: ExerciseType;
  /** Nº de series a registrar (solo fuerza). */
  seriesCount?: number;
  /** Rango de repeticiones objetivo por serie (solo fuerza). */
  repRange?: RepRange;
  /** Unidad del rango: repeticiones o segundos (p. ej. plancha). */
  repUnit?: "reps" | "s";
  /** Objetivos de cardio. */
  targetKm?: number;
}

export interface RoutineDay {
  _id: ObjectId;
  /** Id del cliente (colección Client). */
  clientId: ObjectId;
  day: string;
  focus: string;
  done: boolean;
  duration: string;
  exercises: Exercise[];
}

/** Datos para crear un día de rutina (sin `_id`). */
export type CreateRoutineDayInput = Omit<RoutineDay, "_id">;

/** Datos parciales para actualizar un día de rutina. */
export type UpdateRoutineDayInput = Partial<CreateRoutineDayInput>;
