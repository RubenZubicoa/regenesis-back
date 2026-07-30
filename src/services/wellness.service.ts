import { ObjectId } from "mongodb";

import type { CreateWellnessInput, UpdateWellnessInput } from "../entities/Wellness";
import * as clientRepository from "../repositories/client.repository";
import * as wellnessRepository from "../repositories/wellness.repository";
import * as wellnessMasterRepository from "../repositories/wellnessMaster.repository";

const REQUIRED_FIELDS: (keyof CreateWellnessInput)[] = [
  "clientId",
  "wellnessId",
  "value",
  "date",
];

function assertCreatePayload(
  body: Partial<CreateWellnessInput> & Record<string, unknown>,
): void {
  const missing = REQUIRED_FIELDS.filter((field) => {
    const value = body[field];
    return value === undefined || value === null || value === "";
  });

  if (missing.length > 0) {
    throw Object.assign(new Error(`Faltan campos obligatorios: ${missing.join(", ")}`), {
      status: 400,
    });
  }
}

function parseObjectId(value: unknown, field: string): ObjectId {
  if (value instanceof ObjectId) return value;
  if (typeof value === "string" && ObjectId.isValid(value)) {
    return new ObjectId(value);
  }
  throw Object.assign(new Error(`Id de ${field} inválido`), { status: 400 });
}

function parseDate(value: unknown): Date {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) {
    throw Object.assign(new Error("date inválida"), { status: 400 });
  }
  return date;
}

async function assertClientExists(clientId: ObjectId) {
  const client = await clientRepository.findClientById(clientId.toHexString());
  if (!client) {
    throw Object.assign(new Error("Cliente no encontrado"), { status: 400 });
  }
  return client;
}

async function assertWellnessMasterExists(masterId: ObjectId) {
  const master = await wellnessMasterRepository.findWellnessMasterById(masterId.toHexString());
  if (!master) {
    throw Object.assign(new Error("Tipo de bienestar no encontrado"), { status: 400 });
  }
  return master;
}

/** Lista registros de bienestar. Requiere `clientId` para filtrar por cliente. */
export async function listWellness(clientId?: string) {
  if (!clientId) {
    throw Object.assign(new Error("El parámetro clientId es obligatorio"), { status: 400 });
  }
  return getWellnessByClientId(clientId);
}

/** Registros de bienestar de un cliente concreto. Valida que el cliente exista. */
export async function getWellnessByClientId(clientId: string) {
  if (!ObjectId.isValid(clientId)) {
    throw Object.assign(new Error("Id de cliente inválido"), { status: 400 });
  }

  const client = await clientRepository.findClientById(clientId);
  if (!client) {
    throw Object.assign(new Error("Cliente no encontrado"), { status: 404 });
  }

  return wellnessRepository.findWellnessByClient(clientId);
}

export async function getWellnessById(id: string) {
  const wellness = await wellnessRepository.findWellnessById(id);
  if (!wellness) {
    throw Object.assign(new Error("Registro de bienestar no encontrado"), { status: 404 });
  }
  return wellness;
}

export async function createWellness(
  body: Partial<CreateWellnessInput> & Record<string, unknown>,
) {
  assertCreatePayload(body);

  const clientId = parseObjectId(body.clientId, "cliente");
  const wellnessId = parseObjectId(body.wellnessId, "tipo de bienestar");

  await assertClientExists(clientId);
  await assertWellnessMasterExists(wellnessId);

  const payload: CreateWellnessInput = {
    clientId,
    wellnessId,
    value: Number(body.value),
    date: parseDate(body.date),
  };

  if (Number.isNaN(payload.value)) {
    throw Object.assign(new Error("value debe ser numérico"), { status: 400 });
  }

  return wellnessRepository.insertWellness(payload);
}

export async function updateWellness(
  id: string,
  body: UpdateWellnessInput & Record<string, unknown>,
) {
  const current = await wellnessRepository.findWellnessById(id);
  if (!current) {
    throw Object.assign(new Error("Registro de bienestar no encontrado"), { status: 404 });
  }

  const update: UpdateWellnessInput = {};

  if (body.clientId !== undefined) {
    const clientId = parseObjectId(body.clientId, "cliente");
    await assertClientExists(clientId);
    update.clientId = clientId;
  }

  if (body.wellnessId !== undefined) {
    const wellnessId = parseObjectId(body.wellnessId, "tipo de bienestar");
    await assertWellnessMasterExists(wellnessId);
    update.wellnessId = wellnessId;
  }

  if (body.value !== undefined) {
    update.value = Number(body.value);
    if (Number.isNaN(update.value)) {
      throw Object.assign(new Error("value debe ser numérico"), { status: 400 });
    }
  }

  if (body.date !== undefined) {
    update.date = parseDate(body.date);
  }

  const updated = await wellnessRepository.updateWellnessById(id, update);
  if (!updated) {
    throw Object.assign(new Error("Registro de bienestar no encontrado"), { status: 404 });
  }
  return updated;
}

export async function deleteWellness(id: string) {
  const deleted = await wellnessRepository.deleteWellnessById(id);
  if (!deleted) {
    throw Object.assign(new Error("Registro de bienestar no encontrado"), { status: 404 });
  }
}

/** Inserta registros demo para el primer cliente si la colección está vacía. */
export async function seedDemoWellnessIfEmpty() {
  const existing = await wellnessRepository.findAllWellness();
  if (existing.length > 0) return;

  const clients = await clientRepository.findAllClients();
  const masters = await wellnessMasterRepository.findAllWellnessMasters();
  const client = clients[0];
  if (!client || masters.length === 0) {
    console.warn("No hay cliente o tipos de bienestar para seed de Wellness");
    return;
  }

  const byKey = Object.fromEntries(masters.map((m) => [m.key, m]));
  const demos = [
    { key: "energia", value: 82 },
    { key: "sueno", value: 74 },
    { key: "hambre", value: 38 },
    { key: "antojos", value: 40 },
  ];

  let created = 0;
  for (const demo of demos) {
    const master = byKey[demo.key];
    if (!master) continue;
    await wellnessRepository.insertWellness({
      clientId: client._id,
      wellnessId: master._id,
      value: demo.value,
      date: new Date("2026-07-20"),
    });
    created += 1;
  }

  if (created === 0) {
    console.warn(
      "Seed Wellness: no se insertó ningún registro (¿claves de WellnessMaster distintas?)",
    );
    return;
  }

  console.log(`Registros de bienestar demo creados (${created}) para cliente ${client.email}`);
}
