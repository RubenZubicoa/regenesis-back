import { ObjectId } from "mongodb";

export const TRAINER_COLLECTION = "Trainer";

export interface Trainer {
  _id: ObjectId;
  email: string;
  contraseña: string;
}

/** Datos para crear un entrenador (sin `_id`). */
export type CreateTrainerInput = Omit<Trainer, "_id">;

/** Entrenador sin contraseña, para respuestas de la API. */
export type TrainerPublic = Omit<Trainer, "contraseña">;

export function toPublicTrainer(trainer: Trainer): TrainerPublic {
  const { contraseña: _password, ...rest } = trainer;
  return rest;
}
