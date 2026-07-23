import { ObjectId } from "mongodb";

export const CLIENT_COLLECTION = "Client";

export interface Client {
  _id: ObjectId;
  name: string;
  fullName: string;
  email: string;
  telefono: string;
  contraseña: string;
  goal: string;
  coach: string;
  plan: string;
  program: number;
  startDate: string;
  endDate: string;
  week: number;
  totalWeeks: number;
  phase: number;
  totalPhases: number;
  avatar: string;
}

/** Datos para crear un cliente (sin `_id`). */
export type CreateClientInput = Omit<Client, "_id">;

/** Datos parciales para actualizar un cliente. */
export type UpdateClientInput = Partial<CreateClientInput>;

/** Cliente sin contraseña, para respuestas de la API. */
export type ClientPublic = Omit<Client, "contraseña">;

export function toPublicClient(client: Client): ClientPublic {
  const { contraseña: _password, ...rest } = client;
  return rest;
}
