import { ObjectId } from "mongodb";

export const MEASUREMENT_MASTER_COLLECTION = "MeasurementMaster";

export interface MeasurementMaster {
  _id: ObjectId;
  key: string;
  label: string;
  unit: string;
  icon: string;
}

/** Datos para crear un tipo de medida (sin `_id`). */
export type CreateMeasurementMasterInput = Omit<MeasurementMaster, "_id">;

/** Datos parciales para actualizar un tipo de medida. */
export type UpdateMeasurementMasterInput = Partial<CreateMeasurementMasterInput>;
