import { ObjectId } from "mongodb";

export const MACROS_COLLECTION = "Macros";

export interface MacroItem {
  key: string;
  label: string;
  shortLabel: string;
  grams: number;
  target: number;
  tone: string;
}

export interface Macros {
  _id: ObjectId;
  /** Id del cliente (colección Client). */
  clientId: ObjectId;
  calories: number;
  target: number;
  items: MacroItem[];
}

/** Datos para crear macros (sin `_id`). */
export type CreateMacrosInput = Omit<Macros, "_id">;

/** Datos parciales para actualizar macros. */
export type UpdateMacrosInput = Partial<CreateMacrosInput>;
