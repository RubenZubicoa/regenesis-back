import { ObjectId } from "mongodb";

export const SUPPLEMENTS_COLLECTION = "Supplements";

export interface SupplementElement {
  name: string;
  dose: string;
  when: string;
  icon: string;
}

export interface Supplements {
  _id: ObjectId;
  /** Id del cliente (colección Client). */
  clientId: ObjectId;
  elements: SupplementElement[];
}

/** Datos para crear suplementos (sin `_id`). */
export type CreateSupplementsInput = Omit<Supplements, "_id">;

/** Datos parciales para actualizar suplementos. */
export type UpdateSupplementsInput = Partial<CreateSupplementsInput>;
