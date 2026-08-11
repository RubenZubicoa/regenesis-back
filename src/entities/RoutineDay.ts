import { ObjectId } from "mongodb";

export const ROUTINE_DAY_COLLECTION = "RoutineDay";

export type { ExerciseType } from "./ExerciseMaster";

export interface RepRange {
  min: number;
  max: number;
}

/**
 * Ejercicio asignado a un día de rutina.
 * La identidad (nombre, imagen, explicación, tipo) vive en ExerciseMaster.
 */
export interface RoutineExercise {
  /** Id del ejercicio en ExerciseMaster. */
  exerciseId: ObjectId;
  /** Descripción de series, p. ej. "4 x 8-10" (fuerza) o "15 min" (cardio). */
  sets: string;
  rest: string;
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
  exercises: RoutineExercise[];
}

/** Datos para crear un día de rutina (sin `_id`). */
export type CreateRoutineDayInput = Omit<RoutineDay, "_id">;

/** Datos parciales para actualizar un día de rutina. */
export type UpdateRoutineDayInput = Partial<CreateRoutineDayInput>;
