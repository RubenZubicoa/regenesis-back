import { ObjectId } from "mongodb";

export const PROGRAM_COLLECTION = "Program";

export interface Program {
  _id: ObjectId;
  name: string;
  description: string;
}

/** Datos para crear un programa (sin `_id`). */
export type CreateProgramInput = Omit<Program, "_id">;

/** Datos parciales para actualizar un programa. */
export type UpdateProgramInput = Partial<CreateProgramInput>;
