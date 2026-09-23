import { ObjectId } from "mongodb";

import type {
  CreateDailyStepsInput,
  UpdateDailyStepsInput,
} from "../entities/DailySteps";
import * as clientRepository from "../repositories/client.repository";
import * as dailyStepsRepository from "../repositories/dailySteps.repository";
import { publishSteps } from "./socialFeed.service";
import { parseShareInCommunity } from "../utils/shareInCommunity";
import {
  getElapsedDaysInPeriod,
  sumStepsForPeriod,
  type StepsRankingPeriod,
} from "../utils/stepsRanking";

export type StepsRankingEntry = {
  clientId: string;
  fullName: string;
  avatar: string;
  steps: number;
  avgDaily: number;
};

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

const REQUIRED_FIELDS: (keyof CreateDailyStepsInput)[] = ["clientId", "date", "steps"];

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

function assertIsoDate(value: unknown, field: string): string {
  const date = String(value ?? "").trim();
  if (!ISO_DATE.test(date) || Number.isNaN(new Date(`${date}T00:00:00`).getTime())) {
    throw Object.assign(new Error(`${field} debe ser una fecha ISO (YYYY-MM-DD)`), {
      status: 400,
    });
  }
  return date;
}

function formatIsoDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

async function assertClientExists(clientId: ObjectId) {
  const client = await clientRepository.findClientById(clientId.toHexString());
  if (!client) {
    throw Object.assign(new Error("Cliente no encontrado"), { status: 400 });
  }
  return client;
}

async function assertUniqueClientDate(
  clientId: string,
  date: string,
  excludeId?: string,
) {
  const existing = await dailyStepsRepository.findDailyStepsByClientAndDate(clientId, date);
  if (existing && existing._id.toHexString() !== excludeId) {
    throw Object.assign(
      new Error(`El cliente ya tiene un registro de pasos para el ${date}`),
      { status: 409 },
    );
  }
}

/** Lista pasos. Requiere `clientId` para filtrar por cliente. */
export async function listDailySteps(clientId?: string) {
  if (!clientId) {
    throw Object.assign(new Error("El parámetro clientId es obligatorio"), { status: 400 });
  }
  return getDailyStepsByClientId(clientId);
}

/** Pasos diarios de un cliente concreto. */
export async function getDailyStepsByClientId(clientId: string) {
  if (!ObjectId.isValid(clientId)) {
    throw Object.assign(new Error("Id de cliente inválido"), { status: 400 });
  }

  const client = await clientRepository.findClientById(clientId);
  if (!client) {
    throw Object.assign(new Error("Cliente no encontrado"), { status: 404 });
  }

  return dailyStepsRepository.findDailyStepsByClient(clientId);
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
  const client = await assertClientExists(clientId);
  const date = assertIsoDate(body.date, "date");

  await assertUniqueClientDate(clientId.toHexString(), date);

  const payload: CreateDailyStepsInput = {
    clientId,
    date,
    steps: assertNumber(body.steps, "steps"),
  };

  if (body.goal !== undefined && body.goal !== null && String(body.goal).trim() !== "") {
    payload.goal = assertNumber(body.goal, "goal");
  }

  const created = await dailyStepsRepository.insertDailySteps(payload);

  if (parseShareInCommunity(body) && created.steps > 0) {
    await publishSteps(client, created);
  }

  return created;
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

  if (body.date !== undefined) {
    update.date = assertIsoDate(body.date, "date");
  }

  if (body.steps !== undefined) {
    update.steps = assertNumber(body.steps, "steps");
  }

  if (body.goal !== undefined) {
    update.goal = assertNumber(body.goal, "goal");
  }

  const nextClientId = (update.clientId ?? current.clientId).toHexString();
  const nextDate = update.date ?? current.date;
  await assertUniqueClientDate(nextClientId, nextDate, id);

  const updated = await dailyStepsRepository.updateDailyStepsById(id, update);
  if (!updated) {
    throw Object.assign(new Error("Registro de pasos no encontrado"), { status: 404 });
  }

  if (parseShareInCommunity(body) && updated.steps > 0) {
    const clientId =
      updated.clientId instanceof ObjectId
        ? updated.clientId.toHexString()
        : String(updated.clientId);
    const client = await clientRepository.findClientById(clientId);
    if (client) {
      await publishSteps(client, updated);
    }
  }

  return updated;
}

export async function deleteDailySteps(id: string) {
  const deleted = await dailyStepsRepository.deleteDailyStepsById(id);
  if (!deleted) {
    throw Object.assign(new Error("Registro de pasos no encontrado"), { status: 404 });
  }
}

function parseRankingPeriod(value: unknown): StepsRankingPeriod {
  if (value === "month") return "month";
  return "week";
}

/** Ranking comunitario de pasos por semana o mes calendario. */
export async function getStepsRanking(
  periodInput: unknown,
  refDate = new Date(),
): Promise<StepsRankingEntry[]> {
  const period = parseRankingPeriod(periodInput);
  const [clients, allRecords] = await Promise.all([
    clientRepository.findAllClients(),
    dailyStepsRepository.findAllDailySteps(),
  ]);

  const recordsByClient = new Map<string, typeof allRecords>();
  for (const record of allRecords) {
    const clientId =
      record.clientId instanceof ObjectId
        ? record.clientId.toHexString()
        : String(record.clientId);
    const list = recordsByClient.get(clientId) ?? [];
    list.push(record);
    recordsByClient.set(clientId, list);
  }

  const daysForAvg = getElapsedDaysInPeriod(period, refDate);

  const entries: StepsRankingEntry[] = clients
    .map((client) => {
      const clientId = client._id.toHexString();
      const records = recordsByClient.get(clientId) ?? [];
      const steps = sumStepsForPeriod(records, period, refDate);

      return {
        clientId,
        fullName: client.fullName,
        avatar: client.avatar ?? "",
        steps,
        avgDaily: Math.round(steps / Math.max(1, daysForAvg)),
      };
    })
    .filter((entry) => entry.steps > 0)
    .sort((a, b) => b.steps - a.steps);

  return entries;
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

  const demoSteps = [11240, 9850, 10320, 8760, 8420];
  const today = new Date();

  for (let index = 0; index < demoSteps.length; index += 1) {
    const date = formatIsoDate(addDays(today, index - (demoSteps.length - 1)));
    await dailyStepsRepository.insertDailySteps({
      clientId: client._id,
      date,
      steps: demoSteps[index] ?? 0,
      goal: 10000,
    });
  }

  console.log(`Pasos diarios demo creados para cliente ${client.email}`);
}
