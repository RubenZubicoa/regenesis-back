import { ObjectId } from "mongodb";

export const WELLNESS_COLLECTION = "Wellness";

export interface Wellness {
  _id: ObjectId;
  /** Id del cliente (colección Client). */
  clientId: ObjectId;
  /** Id del tipo de bienestar (colección WellnessMaster). */
  wellnessId: ObjectId;
  value: number;
  date: Date;
}

/** Datos para crear un registro de bienestar (sin `_id`). */
export type CreateWellnessInput = Omit<Wellness, "_id">;

/** Datos parciales para actualizar un registro de bienestar. */
export type UpdateWellnessInput = Partial<CreateWellnessInput>;
