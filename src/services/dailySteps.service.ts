import { ObjectId } from "mongodb";

import type {
  CreateDailyStepsInput,
  Day,
  UpdateDailyStepsInput,
} from "../entities/DailySteps";
import * as clientRepository from "../repositories/client.repository";
import * as dailyStepsRepository from "../repositories/dailySteps.repository";
import { getCurrentWeek } from "../utils/programProgress";

const EMPTY_WEEK_DAYS = [
  { label: "L", value: 0 },
  { label: "M", value: 0 },
  { label: "X", value: 0 },
  { label: "J", value: 0 },
  { label: "V", value: 0 },
  { label: "S", value: 0 },
  { label: "D", value: 0 },
];

const REQUIRED_FIELDS: (keyof CreateDailyStepsInput)[] = [
  "clientId",
  "week",
  "goal",
  "days",
];

function assertCreatePayload(
  body: Partial<CreateDailyStepsInput> & Record<string, unknown>,
): void {
  const missing = REQUIRED_FIELDS.filter((field) => {
    const value = body[field];
    return value === undefined || value === null || (typeof value === "string" && value === "");
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

function assertDays(value: unknown): Day[] {
  if (!Array.isArray(value) || value.length === 0) {
    throw Object.assign(new Error("days debe ser un array no vacío"), { status: 400 });
  }

  return value.map((item, index) => {
    if (!item || typeof item !== "object") {
      throw Object.assign(new Error(`days[${index}] inválido`), { status: 400 });
    }
    const day = item as Record<string, unknown>;
    const label = String(day.label ?? "");
    const dayValue = Number(day.value);
    if (!label) {
      throw Object.assign(new Error(`days[${index}].label es obligatorio`), { status: 400 });
    }
    if (Number.isNaN(dayValue)) {
      throw Object.assign(new Error(`days[${index}].value debe ser numérico`), {
        status: 400,
      });
    }
    return { label, value: dayValue };
  });
}

async function assertClientExists(clientId: ObjectId) {
  const client = await clientRepository.findClientById(clientId.toHexString());
  if (!client) {
    throw Object.assign(new Error("Cliente no encontrado"), { status: 400 });
  }
  return client;
}

/** Lista pasos. Requiere `clientId` para filtrar por cliente. */
export async function listDailySteps(clientId?: string) {
  if (!clientId) {
    throw Object.assign(new Error("El parámetro clientId es obligatorio"), { status: 400 });
  }
  return getDailyStepsByClientId(clientId);
}

/** Pasos de un cliente concreto. Asegura registro de la semana actual. */
export async function getDailyStepsByClientId(clientId: string) {
  if (!ObjectId.isValid(clientId)) {
    throw Object.assign(new Error("Id de cliente inválido"), { status: 400 });
  }

  const client = await clientRepository.findClientById(clientId);
  if (!client) {
    throw Object.assign(new Error("Cliente no encontrado"), { status: 404 });
  }

  const currentWeek = getCurrentWeek(client.startDate, client.endDate);
  let records = await dailyStepsRepository.findDailyStepsByClient(clientId);
  const hasCurrentWeek = records.some((record) => record.week === currentWeek);

  if (!hasCurrentWeek) {
    const previous = [...records].sort((a, b) => b.week - a.week)[0];
    await dailyStepsRepository.insertDailySteps({
      clientId: client._id,
      week: currentWeek,
      goal: previous?.goal ?? 10000,
      days: EMPTY_WEEK_DAYS.map((day) => ({ ...day })),
    });
    records = await dailyStepsRepository.findDailyStepsByClient(clientId);
  }

  return records;
}

export async function getDailyStepsById(id: string) {
  const record = await dailyStepsRepository.findDailyStepsById(id);
  if (!record) {
    throw Object.assign(new Error("Registro de pasos no encontrado"), { status: 404 });
  }
  return record;
}

export async function createDailySteps(
  body: Partial<CreateDailyStepsInput> & Record<string, unknown>,
) {
  assertCreatePayload(body);

  const clientId = parseObjectId(body.clientId, "cliente");
  await assertClientExists(clientId);

  const week = assertNumber(body.week, "week");
  const existing = await dailyStepsRepository.findDailyStepsByClientAndWeek(
    clientId.toHexString(),
    week,
  );
  if (existing) {
    throw Object.assign(
      new Error(`El cliente ya tiene un registro de pasos para la semana ${week}`),
      { status: 409 },
    );
  }

  const payload: CreateDailyStepsInput = {
    clientId,
    week,
    goal: assertNumber(body.goal, "goal"),
    days: assertDays(body.days),
  };

  return dailyStepsRepository.insertDailySteps(payload);
}

export async function updateDailySteps(
  id: string,
  body: UpdateDailyStepsInput & Record<string, unknown>,
) {
  const current = await dailyStepsRepository.findDailyStepsById(id);
  if (!current) {
    throw Object.assign(new Error("Registro de pasos no encontrado"), { status: 404 });
  }

  const update: UpdateDailyStepsInput = {};

  if (body.clientId !== undefined) {
    const clientId = parseObjectId(body.clientId, "cliente");
    await assertClientExists(clientId);
    update.clientId = clientId;
  }

  if (body.week !== undefined) {
    update.week = assertNumber(body.week, "week");
  }

  if (body.goal !== undefined) {
    update.goal = assertNumber(body.goal, "goal");
  }

  if (body.days !== undefined) {
    update.days = assertDays(body.days);
  }

  const nextClientId = (update.clientId ?? current.clientId).toHexString();
  const nextWeek = update.week ?? current.week;
  const existing = await dailyStepsRepository.findDailyStepsByClientAndWeek(
    nextClientId,
    nextWeek,
  );
  if (existing && existing._id.toHexString() !== id) {
    throw Object.assign(
      new Error(`El cliente ya tiene un registro de pasos para la semana ${nextWeek}`),
      { status: 409 },
    );
  }

  const updated = await dailyStepsRepository.updateDailyStepsById(id, update);
  if (!updated) {
    throw Object.assign(new Error("Registro de pasos no encontrado"), { status: 404 });
  }
  return updated;
}

export async function deleteDailySteps(id: string) {
  const deleted = await dailyStepsRepository.deleteDailyStepsById(id);
  if (!deleted) {
    throw Object.assign(new Error("Registro de pasos no encontrado"), { status: 404 });
  }
}

/** Inserta pasos demo para el primer cliente si la colección está vacía. */
export async function seedDemoDailyStepsIfEmpty() {
  const existing = await dailyStepsRepository.findAllDailySteps();
  if (existing.length > 0) return;

  const clients = await clientRepository.findAllClients();
  const client = clients[0];
  if (!client) {
    console.warn("No hay cliente para seed de DailySteps");
    return;
  }

  await dailyStepsRepository.insertDailySteps({
    clientId: client._id,
    week: getCurrentWeek(client.startDate, client.endDate),
    goal: 10000,
    days: [
      { label: "L", value: 11240 },
      { label: "M", value: 9850 },
      { label: "X", value: 10320 },
      { label: "J", value: 8760 },
      { label: "V", value: 8420 },
      { label: "S", value: 0 },
      { label: "D", value: 0 },
    ],
  });

  console.log(`Pasos diarios demo creados para cliente ${client.email}`);
}
