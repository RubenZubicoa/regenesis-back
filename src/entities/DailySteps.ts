import { ObjectId } from "mongodb";

export const DAILY_STEPS_COLLECTION = "DailySteps";

export interface Day {
  label: string;
  value: number;
}

export interface DailySteps {
  _id: ObjectId;
  /** Id del cliente (colección Client). */
  clientId: ObjectId;
  /** Número de semana del programa. */
  week: number;
  goal: number;
  days: Day[];
}

/** Datos para crear un registro de pasos (sin `_id`). */
export type CreateDailyStepsInput = Omit<DailySteps, "_id">;

/** Datos parciales para actualizar un registro de pasos. */
export type UpdateDailyStepsInput = Partial<CreateDailyStepsInput>;
