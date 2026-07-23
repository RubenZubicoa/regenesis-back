import { ObjectId } from "mongodb";

export const WEIGHT_COLLECTION = "Weight";

export interface Weight {
  _id: ObjectId;
  /** Id del cliente (colección Client). */
  clientId: ObjectId;
  /** Fechas ISO de cada registro de peso. */
  labels: string[];
  data: number[];
  start: number;
  current: number;
  target: number;
  unit: string;
}

/** Datos para crear una serie de peso (sin `_id`). */
export type CreateWeightInput = Omit<Weight, "_id">;

/** Datos parciales para actualizar una serie de peso. */
export type UpdateWeightInput = Partial<CreateWeightInput>;
