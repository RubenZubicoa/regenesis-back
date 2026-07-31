import { ObjectId } from "mongodb";

export const WORKOUT_HISTORY_COLLECTION = "WorkoutHistory";

export type ExerciseType = "strength" | "cardio";

export type StrengthSetLog = {
  set: number;
  weightKg: number;
  reps: number;
};

export type CardioLog = {
  km: number;
  speedKmh: number;
  avgHr: number;
};

export type ExerciseLog = {
  name: string;
  type: ExerciseType;
  strengthSets?: StrengthSetLog[];
  cardio?: CardioLog;
};

export interface WorkoutHistory {
  _id: ObjectId;
  /** Id del cliente (colección Client). */
  clientId: ObjectId;
  week: number;
  date: string;
  day: string;
  focus: string;
  duration: string;
  durationMinutes: number;
  exercises: ExerciseLog[];
}

/** Datos para crear un registro de histórico (sin `_id`). */
export type CreateWorkoutHistoryInput = Omit<WorkoutHistory, "_id">;

/** Datos parciales para actualizar un registro de histórico. */
export type UpdateWorkoutHistoryInput = Partial<CreateWorkoutHistoryInput>;
