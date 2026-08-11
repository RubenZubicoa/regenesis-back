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

/** Foto o vídeo adjunto a una sesión de entrenamiento. */
export type WorkoutMedia = {
  /** URI local o URL remota. */
  uri: string;
  type: "image" | "video";
  mimeType?: string;
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
  /** Fotos/vídeos opcionales de la sesión. */
  media?: WorkoutMedia[];
}

/** Datos para crear un registro de histórico (sin `_id`). */
export type CreateWorkoutHistoryInput = Omit<WorkoutHistory, "_id">;

/** Datos parciales para actualizar un registro de histórico. */
export type UpdateWorkoutHistoryInput = Partial<CreateWorkoutHistoryInput>;
