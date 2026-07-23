import { ObjectId } from "mongodb";

export const MEASUREMENT_COLLECTION = "Measurement";

export interface Measurement {
  _id: ObjectId;
  /** Id del cliente (colección Client). */
  client: ObjectId;
  /** Id del tipo de medida (colección MeasurementMaster). */
  MeasurementId: ObjectId;
  value: number;
  delta: number;
  date: string;
}

/** Datos para crear una medida (sin `_id`). */
export type CreateMeasurementInput = Omit<Measurement, "_id">;

/** Datos parciales para actualizar una medida. */
export type UpdateMeasurementInput = Partial<CreateMeasurementInput>;
