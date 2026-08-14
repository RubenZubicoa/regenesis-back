import { ObjectId } from "mongodb";

import type { CreateMeasurementInput, UpdateMeasurementInput } from "../entities/Measurement";
import * as clientRepository from "../repositories/client.repository";
import * as measurementRepository from "../repositories/measurement.repository";
import * as measurementMasterRepository from "../repositories/measurementMaster.repository";
import { publishMeasurement } from "./socialFeed.service";
import { parseShareInCommunity } from "../utils/shareInCommunity";

const REQUIRED_FIELDS: (keyof CreateMeasurementInput)[] = [
  "client",
  "MeasurementId",
  "value",
  "delta",
  "date",
];

function assertCreatePayload(
  body: Partial<CreateMeasurementInput> & Record<string, unknown>,
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

async function assertClientExists(clientId: ObjectId) {
  const client = await clientRepository.findClientById(clientId.toHexString());
  if (!client) {
    throw Object.assign(new Error("Cliente no encontrado"), { status: 400 });
  }
  return client;
}

async function assertMeasurementMasterExists(masterId: ObjectId) {
  const master = await measurementMasterRepository.findMeasurementMasterById(
    masterId.toHexString(),
  );
  if (!master) {
    throw Object.assign(new Error("Tipo de medida no encontrado"), { status: 400 });
  }
  return master;
}

export async function listMeasurements(clientId?: string) {
  if (clientId) {
    return getMeasurementsByClientId(clientId);
  }
  return measurementRepository.findAllMeasurements();
}

/** Medidas de un cliente concreto. Valida que el cliente exista. */
export async function getMeasurementsByClientId(clientId: string) {
  if (!ObjectId.isValid(clientId)) {
    throw Object.assign(new Error("Id de cliente inválido"), { status: 400 });
  }

  const client = await clientRepository.findClientById(clientId);
  if (!client) {
    throw Object.assign(new Error("Cliente no encontrado"), { status: 404 });
  }

  return measurementRepository.findMeasurementsByClient(clientId);
}

export async function getMeasurementById(id: string) {
  const measurement = await measurementRepository.findMeasurementById(id);
  if (!measurement) {
    throw Object.assign(new Error("Medida no encontrada"), { status: 404 });
  }
  return measurement;
}

export async function createMeasurement(
  body: Partial<CreateMeasurementInput> & Record<string, unknown>,
) {
  assertCreatePayload(body);

  const clientId = parseObjectId(body.client, "cliente");
  const measurementMasterId = parseObjectId(body.MeasurementId, "tipo de medida");

  await assertClientExists(clientId);
  await assertMeasurementMasterExists(measurementMasterId);

  const payload: CreateMeasurementInput = {
    client: clientId,
    MeasurementId: measurementMasterId,
    value: Number(body.value),
    delta: Number(body.delta),
    date: String(body.date),
  };

  if (Number.isNaN(payload.value) || Number.isNaN(payload.delta)) {
    throw Object.assign(new Error("value y delta deben ser numéricos"), { status: 400 });
  }

  const created = await measurementRepository.insertMeasurement(payload);

  if (parseShareInCommunity(body)) {
    const client = await assertClientExists(clientId);
    const master = await assertMeasurementMasterExists(measurementMasterId);
    await publishMeasurement(client, created, master);
  }

  return created;
}

export async function updateMeasurement(
  id: string,
  body: UpdateMeasurementInput & Record<string, unknown>,
) {
  const current = await measurementRepository.findMeasurementById(id);
  if (!current) {
    throw Object.assign(new Error("Medida no encontrada"), { status: 404 });
  }

  const update: UpdateMeasurementInput = {};

  if (body.client !== undefined) {
    const clientId = parseObjectId(body.client, "cliente");
    await assertClientExists(clientId);
    update.client = clientId;
  }

  if (body.MeasurementId !== undefined) {
    const masterId = parseObjectId(body.MeasurementId, "tipo de medida");
    await assertMeasurementMasterExists(masterId);
    update.MeasurementId = masterId;
  }

  if (body.value !== undefined) {
    update.value = Number(body.value);
    if (Number.isNaN(update.value)) {
      throw Object.assign(new Error("value debe ser numérico"), { status: 400 });
    }
  }

  if (body.delta !== undefined) {
    update.delta = Number(body.delta);
    if (Number.isNaN(update.delta)) {
      throw Object.assign(new Error("delta debe ser numérico"), { status: 400 });
    }
  }

  if (body.date !== undefined) {
    update.date = String(body.date);
  }

  const updated = await measurementRepository.updateMeasurementById(id, update);
  if (!updated) {
    throw Object.assign(new Error("Medida no encontrada"), { status: 404 });
  }
  return updated;
}

export async function deleteMeasurement(id: string) {
  const deleted = await measurementRepository.deleteMeasurementById(id);
  if (!deleted) {
    throw Object.assign(new Error("Medida no encontrada"), { status: 404 });
  }
}

/** Inserta medidas demo para el primer cliente si la colección está vacía. */
export async function seedDemoMeasurementsIfEmpty() {
  const existing = await measurementRepository.findAllMeasurements();
  if (existing.length > 0) return;

  const clients = await clientRepository.findAllClients();
  const masters = await measurementMasterRepository.findAllMeasurementMasters();
  const client = clients[0];
  if (!client || masters.length === 0) {
    console.warn("No hay cliente o tipos de medida para seed de Measurement");
    return;
  }

  const byKey = Object.fromEntries(masters.map((m) => [m.key, m]));
  const demos = [
    { key: "cintura", value: 74, delta: -6 },
    { key: "cadera", value: 96, delta: -3 },
    { key: "pecho", value: 90, delta: -2 },
    { key: "brazo", value: 29, delta: 1 },
  ];

  for (const demo of demos) {
    const master = byKey[demo.key];
    if (!master) continue;
    await measurementRepository.insertMeasurement({
      client: client._id,
      MeasurementId: master._id,
      value: demo.value,
      delta: demo.delta,
      date: "2026-07-20",
    });
  }

  console.log(`Medidas demo creadas para cliente ${client.email}`);
}
