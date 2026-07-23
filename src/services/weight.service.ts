import { ObjectId } from "mongodb";

import type { CreateWeightInput, UpdateWeightInput } from "../entities/Weight";
import * as clientRepository from "../repositories/client.repository";
import * as weightRepository from "../repositories/weight.repository";

const REQUIRED_FIELDS: (keyof CreateWeightInput)[] = [
  "clientId",
  "labels",
  "data",
  "start",
  "current",
  "target",
  "unit",
];

function assertCreatePayload(
  body: Partial<CreateWeightInput> & Record<string, unknown>,
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

function assertNumber(value: unknown, field: string): number {
  const n = Number(value);
  if (Number.isNaN(n)) {
    throw Object.assign(new Error(`${field} debe ser numérico`), { status: 400 });
  }
  return n;
}

function assertStringArray(value: unknown, field: string): string[] {
  if (!Array.isArray(value) || !value.every((item) => typeof item === "string")) {
    throw Object.assign(new Error(`${field} debe ser un array de strings`), { status: 400 });
  }
  return value;
}

function assertNumberArray(value: unknown, field: string): number[] {
  if (!Array.isArray(value) || value.some((item) => Number.isNaN(Number(item)))) {
    throw Object.assign(new Error(`${field} debe ser un array de números`), { status: 400 });
  }
  return value.map(Number);
}

async function assertClientExists(clientId: ObjectId) {
  const client = await clientRepository.findClientById(clientId.toHexString());
  if (!client) {
    throw Object.assign(new Error("Cliente no encontrado"), { status: 400 });
  }
  return client;
}

export async function listWeights(clientId?: string) {
  if (clientId) {
    const weight = await getWeightByClientId(clientId);
    return weight ? [weight] : [];
  }
  return weightRepository.findAllWeights();
}

/** Serie de peso de un cliente concreto. */
export async function getWeightByClientId(clientId: string) {
  if (!ObjectId.isValid(clientId)) {
    throw Object.assign(new Error("Id de cliente inválido"), { status: 400 });
  }

  const client = await clientRepository.findClientById(clientId);
  if (!client) {
    throw Object.assign(new Error("Cliente no encontrado"), { status: 404 });
  }

  return weightRepository.findWeightByClientId(clientId);
}

export async function getWeightById(id: string) {
  const weight = await weightRepository.findWeightById(id);
  if (!weight) {
    throw Object.assign(new Error("Serie de peso no encontrada"), { status: 404 });
  }
  return weight;
}

export async function createWeight(
  body: Partial<CreateWeightInput> & Record<string, unknown>,
) {
  assertCreatePayload(body);

  const clientId = parseObjectId(body.clientId, "cliente");
  await assertClientExists(clientId);

  const existing = await weightRepository.findWeightByClientId(clientId.toHexString());
  if (existing) {
    throw Object.assign(new Error("El cliente ya tiene una serie de peso"), { status: 409 });
  }

  const labels = assertStringArray(body.labels, "labels");
  const data = assertNumberArray(body.data, "data");

  if (labels.length !== data.length) {
    throw Object.assign(new Error("labels y data deben tener la misma longitud"), {
      status: 400,
    });
  }

  const payload: CreateWeightInput = {
    clientId,
    labels,
    data,
    start: assertNumber(body.start, "start"),
    current: assertNumber(body.current, "current"),
    target: assertNumber(body.target, "target"),
    unit: String(body.unit),
  };

  return weightRepository.insertWeight(payload);
}

export async function updateWeight(
  id: string,
  body: UpdateWeightInput & Record<string, unknown>,
) {
  const current = await weightRepository.findWeightById(id);
  if (!current) {
    throw Object.assign(new Error("Serie de peso no encontrada"), { status: 404 });
  }

  const update: UpdateWeightInput = {};

  if (body.clientId !== undefined) {
    const clientId = parseObjectId(body.clientId, "cliente");
    await assertClientExists(clientId);
    const existing = await weightRepository.findWeightByClientId(clientId.toHexString());
    if (existing && existing._id.toHexString() !== id) {
      throw Object.assign(new Error("El cliente ya tiene una serie de peso"), { status: 409 });
    }
    update.clientId = clientId;
  }

  if (body.labels !== undefined) {
    update.labels = assertStringArray(body.labels, "labels");
  }

  if (body.data !== undefined) {
    update.data = assertNumberArray(body.data, "data");
  }

  const nextLabels = update.labels ?? current.labels;
  const nextData = update.data ?? current.data;
  if (nextLabels.length !== nextData.length) {
    throw Object.assign(new Error("labels y data deben tener la misma longitud"), {
      status: 400,
    });
  }

  if (body.start !== undefined) update.start = assertNumber(body.start, "start");
  if (body.current !== undefined) update.current = assertNumber(body.current, "current");
  if (body.target !== undefined) update.target = assertNumber(body.target, "target");
  if (body.unit !== undefined) update.unit = String(body.unit);

  const updated = await weightRepository.updateWeightById(id, update);
  if (!updated) {
    throw Object.assign(new Error("Serie de peso no encontrada"), { status: 404 });
  }
  return updated;
}

export async function deleteWeight(id: string) {
  const deleted = await weightRepository.deleteWeightById(id);
  if (!deleted) {
    throw Object.assign(new Error("Serie de peso no encontrada"), { status: 404 });
  }
}

/** Inserta la serie de peso demo para el primer cliente si la colección está vacía. */
export async function seedDemoWeightsIfEmpty() {
  const existing = await weightRepository.findAllWeights();
  if (existing.length > 0) return;

  const clients = await clientRepository.findAllClients();
  const client = clients[0];
  if (!client) {
    console.warn("No hay cliente para seed de Weight");
    return;
  }

  await weightRepository.insertWeight({
    clientId: client._id,
    labels: [
      "2026-06-11",
      "2026-06-18",
      "2026-06-25",
      "2026-07-02",
      "2026-07-09",
      "2026-07-16",
    ],
    data: [68.4, 67.9, 67.2, 66.8, 66.1, 65.4],
    start: 68.4,
    current: 65.4,
    target: 62,
    unit: "kg",
  });

  console.log(`Serie de peso demo creada para cliente ${client.email}`);
}
