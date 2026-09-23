import { ObjectId } from "mongodb";

export const DAILY_STEPS_COLLECTION = "DailySteps";

export interface DailySteps {
  _id: ObjectId;
  /** Id del cliente (colección Client). */
  clientId: ObjectId;
  /** Fecha del registro (ISO YYYY-MM-DD). */
  date: string;
  /** Pasos de ese día. */
  steps: number;
  /** Objetivo diario de pasos. */
  goal?: number;
}

/** Datos para crear un registro de pasos (sin `_id`). */
export type CreateDailyStepsInput = Omit<DailySteps, "_id">;

/** Datos parciales para actualizar un registro de pasos. */
export type UpdateDailyStepsInput = Partial<CreateDailyStepsInput>;
