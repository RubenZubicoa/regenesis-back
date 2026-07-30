import { ObjectId } from "mongodb";

export const WELLNESS_MASTER_COLLECTION = "WellnessMaster";

export interface WellnessMaster {
  _id: ObjectId;
  key: string;
  label: string;
  icon: string;
  tone: string;
}

/** Datos para crear un tipo de bienestar (sin `_id`). */
export type CreateWellnessMasterInput = Omit<WellnessMaster, "_id">;

/** Datos parciales para actualizar un tipo de bienestar. */
export type UpdateWellnessMasterInput = Partial<CreateWellnessMasterInput>;
