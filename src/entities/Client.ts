import { ObjectId } from "mongodb";

import { getCurrentWeek, getTotalWeeks } from "../utils/programProgress";

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
  /** Referencia al `_id` del programa en la colección Program. */
  program: ObjectId;
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

/** Serializa el cliente ocultando la contraseña y calculando semana actual. */
export function toPublicClient(client: Client): ClientPublic {
  const { contraseña: _password, ...rest } = client;
  const hasDates = Boolean(rest.startDate && rest.endDate);
  if (!hasDates) return rest;

  return {
    ...rest,
    totalWeeks: getTotalWeeks(rest.startDate, rest.endDate),
    week: getCurrentWeek(rest.startDate, rest.endDate),
  };
}
