import { ObjectId } from "mongodb";

import type {
  CardioLog,
  CreateWorkoutHistoryInput,
  ExerciseLog,
  ExerciseType,
  StrengthSetLog,
  UpdateWorkoutHistoryInput,
  WorkoutMedia,
} from "../entities/WorkoutHistory";
import * as clientRepository from "../repositories/client.repository";
import * as workoutHistoryRepository from "../repositories/workoutHistory.repository";
import { publishWorkout } from "./socialFeed.service";
import { parseShareInCommunity } from "../utils/shareInCommunity";

const REQUIRED_FIELDS: (keyof CreateWorkoutHistoryInput)[] = [
  "clientId",
  "week",
  "date",
  "day",
  "focus",
  "duration",
  "durationMinutes",
  "exercises",
];

function assertCreatePayload(
  body: Partial<CreateWorkoutHistoryInput> & Record<string, unknown>,
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

function assertExerciseType(value: unknown, index: number): ExerciseType {
  const type = String(value ?? "");
  if (type !== "strength" && type !== "cardio") {
    throw Object.assign(
      new Error(`exercises[${index}].type debe ser "strength" o "cardio"`),
      { status: 400 },
    );
  }
  return type;
}

function assertStrengthSets(value: unknown, index: number): StrengthSetLog[] {
  if (!Array.isArray(value)) {
    throw Object.assign(new Error(`exercises[${index}].strengthSets debe ser un array`), {
      status: 400,
    });
  }

  return value.map((entry, setIndex) => {
    if (!entry || typeof entry !== "object") {
      throw Object.assign(
        new Error(`exercises[${index}].strengthSets[${setIndex}] inválido`),
        { status: 400 },
      );
    }
    const item = entry as Record<string, unknown>;
    return {
      set: assertNumber(item.set, `exercises[${index}].strengthSets[${setIndex}].set`),
      weightKg: assertNumber(
        item.weightKg,
        `exercises[${index}].strengthSets[${setIndex}].weightKg`,
      ),
      reps: assertNumber(item.reps, `exercises[${index}].strengthSets[${setIndex}].reps`),
    };
  });
}

function assertCardio(value: unknown, index: number): CardioLog {
  if (!value || typeof value !== "object") {
    throw Object.assign(new Error(`exercises[${index}].cardio inválido`), { status: 400 });
  }
  const item = value as Record<string, unknown>;
  return {
    km: assertNumber(item.km, `exercises[${index}].cardio.km`),
    speedKmh: assertNumber(item.speedKmh, `exercises[${index}].cardio.speedKmh`),
    avgHr: assertNumber(item.avgHr, `exercises[${index}].cardio.avgHr`),
  };
}

function assertExercises(value: unknown): ExerciseLog[] {
  if (!Array.isArray(value) || value.length === 0) {
    throw Object.assign(new Error("exercises debe ser un array no vacío"), { status: 400 });
  }

  return value.map((entry, index) => {
    if (!entry || typeof entry !== "object") {
      throw Object.assign(new Error(`exercises[${index}] inválido`), { status: 400 });
    }
    const item = entry as Record<string, unknown>;
    const name = String(item.name ?? "").trim();
    const type = assertExerciseType(item.type, index);

    if (!name) {
      throw Object.assign(new Error(`exercises[${index}].name es obligatorio`), {
        status: 400,
      });
    }

    const exercise: ExerciseLog = { name, type };

    if (item.strengthSets !== undefined) {
      exercise.strengthSets = assertStrengthSets(item.strengthSets, index);
    }
    if (item.cardio !== undefined) {
      exercise.cardio = assertCardio(item.cardio, index);
    }

    return exercise;
  });
}

function assertMedia(value: unknown): WorkoutMedia[] {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value)) {
    throw Object.assign(new Error("media debe ser un array"), { status: 400 });
  }

  return value.map((entry, index) => {
    if (!entry || typeof entry !== "object") {
      throw Object.assign(new Error(`media[${index}] inválido`), { status: 400 });
    }
    const item = entry as Record<string, unknown>;
    const uri = String(item.uri ?? "").trim();
    const typeRaw = String(item.type ?? "").trim();
    const type = typeRaw === "video" ? "video" : typeRaw === "image" ? "image" : "";

    if (!uri) {
      throw Object.assign(new Error(`media[${index}].uri es obligatorio`), { status: 400 });
    }
    if (!type) {
      throw Object.assign(new Error(`media[${index}].type debe ser "image" o "video"`), {
        status: 400,
      });
    }

    const mimeType =
      item.mimeType !== undefined && item.mimeType !== null && String(item.mimeType).trim()
        ? String(item.mimeType).trim()
        : undefined;

    return { uri, type, ...(mimeType ? { mimeType } : {}) };
  });
}

async function assertClientExists(clientId: ObjectId) {
  const client = await clientRepository.findClientById(clientId.toHexString());
  if (!client) {
    throw Object.assign(new Error("Cliente no encontrado"), { status: 400 });
  }
  return client;
}

/** Lista histórico. Requiere `clientId`. */
export async function listWorkoutHistory(clientId?: string) {
  if (!clientId) {
    throw Object.assign(new Error("El parámetro clientId es obligatorio"), { status: 400 });
  }
  return getWorkoutHistoryByClientId(clientId);
}

/** Histórico de un cliente concreto. */
export async function getWorkoutHistoryByClientId(clientId: string) {
  if (!ObjectId.isValid(clientId)) {
    throw Object.assign(new Error("Id de cliente inválido"), { status: 400 });
  }

  const client = await clientRepository.findClientById(clientId);
  if (!client) {
    throw Object.assign(new Error("Cliente no encontrado"), { status: 404 });
  }

  return workoutHistoryRepository.findWorkoutHistoryByClient(clientId);
}

export async function getWorkoutHistoryById(id: string) {
  const record = await workoutHistoryRepository.findWorkoutHistoryById(id);
  if (!record) {
    throw Object.assign(new Error("Registro de histórico no encontrado"), { status: 404 });
  }
  return record;
}

export async function createWorkoutHistory(
  body: Partial<CreateWorkoutHistoryInput> & Record<string, unknown>,
) {
  assertCreatePayload(body);

  const clientId = parseObjectId(body.clientId, "cliente");
  await assertClientExists(clientId);

  const payload: CreateWorkoutHistoryInput = {
    clientId,
    week: assertNumber(body.week, "week"),
    date: String(body.date).trim(),
    day: String(body.day).trim(),
    focus: String(body.focus).trim(),
    duration: String(body.duration).trim(),
    durationMinutes: assertNumber(body.durationMinutes, "durationMinutes"),
    exercises: assertExercises(body.exercises),
    ...(body.media !== undefined ? { media: assertMedia(body.media) } : {}),
  };

  if (!payload.date) {
    throw Object.assign(new Error("date es obligatorio"), { status: 400 });
  }
  if (!payload.day) {
    throw Object.assign(new Error("day es obligatorio"), { status: 400 });
  }
  if (!payload.focus) {
    throw Object.assign(new Error("focus es obligatorio"), { status: 400 });
  }
  if (!payload.duration) {
    throw Object.assign(new Error("duration es obligatorio"), { status: 400 });
  }

  const created = await workoutHistoryRepository.insertWorkoutHistory(payload);

  if (parseShareInCommunity(body)) {
    const client = await assertClientExists(clientId);
    await publishWorkout(client, created);
  }

  return created;
}

export async function updateWorkoutHistory(
  id: string,
  body: UpdateWorkoutHistoryInput & Record<string, unknown>,
) {
  const current = await workoutHistoryRepository.findWorkoutHistoryById(id);
  if (!current) {
    throw Object.assign(new Error("Registro de histórico no encontrado"), { status: 404 });
  }

  const update: UpdateWorkoutHistoryInput = {};

  if (body.clientId !== undefined) {
    const clientId = parseObjectId(body.clientId, "cliente");
    await assertClientExists(clientId);
    update.clientId = clientId;
  }

  if (body.week !== undefined) {
    update.week = assertNumber(body.week, "week");
  }

  if (body.date !== undefined) {
    const date = String(body.date).trim();
    if (!date) {
      throw Object.assign(new Error("date no puede estar vacío"), { status: 400 });
    }
    update.date = date;
  }

  if (body.day !== undefined) {
    const day = String(body.day).trim();
    if (!day) {
      throw Object.assign(new Error("day no puede estar vacío"), { status: 400 });
    }
    update.day = day;
  }

  if (body.focus !== undefined) {
    const focus = String(body.focus).trim();
    if (!focus) {
      throw Object.assign(new Error("focus no puede estar vacío"), { status: 400 });
    }
    update.focus = focus;
  }

  if (body.duration !== undefined) {
    const duration = String(body.duration).trim();
    if (!duration) {
      throw Object.assign(new Error("duration no puede estar vacío"), { status: 400 });
    }
    update.duration = duration;
  }

  if (body.durationMinutes !== undefined) {
    update.durationMinutes = assertNumber(body.durationMinutes, "durationMinutes");
  }

  if (body.exercises !== undefined) {
    update.exercises = assertExercises(body.exercises);
  }

  if (body.media !== undefined) {
    update.media = assertMedia(body.media);
  }

  const updated = await workoutHistoryRepository.updateWorkoutHistoryById(id, update);
  if (!updated) {
    throw Object.assign(new Error("Registro de histórico no encontrado"), { status: 404 });
  }
  return updated;
}

export async function deleteWorkoutHistory(id: string) {
  const deleted = await workoutHistoryRepository.deleteWorkoutHistoryById(id);
  if (!deleted) {
    throw Object.assign(new Error("Registro de histórico no encontrado"), { status: 404 });
  }
}

/** Inserta histórico demo para el primer cliente si la colección está vacía. */
export async function seedDemoWorkoutHistoryIfEmpty() {
  const existing = await workoutHistoryRepository.findAllWorkoutHistory();
  if (existing.length > 0) return;

  const clients = await clientRepository.findAllClients();
  const client = clients[0];
  if (!client) {
    console.warn("No hay cliente para seed de WorkoutHistory");
    return;
  }

  await workoutHistoryRepository.insertManyWorkoutHistory([
    {
      clientId: client._id,
      week: 6,
      date: "Lun 26 may",
      day: "Día C",
      focus: "Full body",
      duration: "52 min",
      durationMinutes: 52,
      exercises: [
        {
          name: "Hip thrust",
          type: "strength",
          strengthSets: [
            { set: 1, weightKg: 80, reps: 10 },
            { set: 2, weightKg: 80, reps: 10 },
            { set: 3, weightKg: 85, reps: 9 },
            { set: 4, weightKg: 85, reps: 8 },
          ],
        },
        {
          name: "Dominadas asistidas",
          type: "strength",
          strengthSets: [
            { set: 1, weightKg: 0, reps: 7 },
            { set: 2, weightKg: 0, reps: 7 },
            { set: 3, weightKg: 0, reps: 6 },
          ],
        },
        {
          name: "Fondos",
          type: "strength",
          strengthSets: [
            { set: 1, weightKg: 0, reps: 10 },
            { set: 2, weightKg: 0, reps: 9 },
            { set: 3, weightKg: 0, reps: 9 },
          ],
        },
        {
          name: "Plancha",
          type: "strength",
          strengthSets: [
            { set: 1, weightKg: 0, reps: 42 },
            { set: 2, weightKg: 0, reps: 45 },
            { set: 3, weightKg: 0, reps: 43 },
          ],
        },
      ],
    },
    {
      clientId: client._id,
      week: 6,
      date: "Vie 23 may",
      day: "Día B",
      focus: "Tren inferior",
      duration: "58 min",
      durationMinutes: 58,
      exercises: [
        {
          name: "Sentadilla",
          type: "strength",
          strengthSets: [
            { set: 1, weightKg: 70, reps: 8 },
            { set: 2, weightKg: 70, reps: 8 },
            { set: 3, weightKg: 75, reps: 7 },
            { set: 4, weightKg: 75, reps: 6 },
          ],
        },
        {
          name: "Peso muerto rumano",
          type: "strength",
          strengthSets: [
            { set: 1, weightKg: 60, reps: 10 },
            { set: 2, weightKg: 60, reps: 10 },
            { set: 3, weightKg: 62.5, reps: 9 },
            { set: 4, weightKg: 62.5, reps: 9 },
          ],
        },
        {
          name: "Zancadas",
          type: "strength",
          strengthSets: [
            { set: 1, weightKg: 20, reps: 12 },
            { set: 2, weightKg: 20, reps: 12 },
            { set: 3, weightKg: 22.5, reps: 11 },
          ],
        },
        {
          name: "Gemelos",
          type: "strength",
          strengthSets: [
            { set: 1, weightKg: 40, reps: 15 },
            { set: 2, weightKg: 40, reps: 14 },
            { set: 3, weightKg: 45, reps: 13 },
            { set: 4, weightKg: 45, reps: 12 },
          ],
        },
      ],
    },
    {
      clientId: client._id,
      week: 6,
      date: "Mié 21 may",
      day: "Día A",
      focus: "Tren superior",
      duration: "54 min",
      durationMinutes: 54,
      exercises: [
        {
          name: "Press banca",
          type: "strength",
          strengthSets: [
            { set: 1, weightKg: 50, reps: 10 },
            { set: 2, weightKg: 52.5, reps: 9 },
            { set: 3, weightKg: 52.5, reps: 9 },
            { set: 4, weightKg: 55, reps: 8 },
          ],
        },
        {
          name: "Remo con barra",
          type: "strength",
          strengthSets: [
            { set: 1, weightKg: 45, reps: 10 },
            { set: 2, weightKg: 47.5, reps: 10 },
            { set: 3, weightKg: 47.5, reps: 9 },
            { set: 4, weightKg: 50, reps: 8 },
          ],
        },
        {
          name: "Press militar",
          type: "strength",
          strengthSets: [
            { set: 1, weightKg: 30, reps: 10 },
            { set: 2, weightKg: 32.5, reps: 9 },
            { set: 3, weightKg: 32.5, reps: 8 },
          ],
        },
        {
          name: "Curl bíceps",
          type: "strength",
          strengthSets: [
            { set: 1, weightKg: 12, reps: 12 },
            { set: 2, weightKg: 12, reps: 11 },
            { set: 3, weightKg: 14, reps: 10 },
          ],
        },
      ],
    },
    {
      clientId: client._id,
      week: 5,
      date: "Lun 19 may",
      day: "Día D",
      focus: "Core y cardio",
      duration: "47 min",
      durationMinutes: 47,
      exercises: [
        {
          name: "Elevaciones de piernas",
          type: "strength",
          strengthSets: [
            { set: 1, weightKg: 0, reps: 12 },
            { set: 2, weightKg: 0, reps: 11 },
            { set: 3, weightKg: 0, reps: 11 },
            { set: 4, weightKg: 0, reps: 10 },
          ],
        },
        {
          name: "Rueda abdominal",
          type: "strength",
          strengthSets: [
            { set: 1, weightKg: 0, reps: 10 },
            { set: 2, weightKg: 0, reps: 9 },
            { set: 3, weightKg: 0, reps: 8 },
          ],
        },
        {
          name: "Carrera continua",
          type: "cardio",
          cardio: { km: 5.2, speedKmh: 9.8, avgHr: 148 },
        },
        {
          name: "Cinta / HIIT",
          type: "cardio",
          cardio: { km: 2.8, speedKmh: 11.2, avgHr: 162 },
        },
      ],
    },
    {
      clientId: client._id,
      week: 5,
      date: "Vie 16 may",
      day: "Día C",
      focus: "Full body",
      duration: "51 min",
      durationMinutes: 51,
      exercises: [
        {
          name: "Hip thrust",
          type: "strength",
          strengthSets: [
            { set: 1, weightKg: 75, reps: 10 },
            { set: 2, weightKg: 75, reps: 10 },
            { set: 3, weightKg: 80, reps: 9 },
            { set: 4, weightKg: 80, reps: 8 },
          ],
        },
        {
          name: "Dominadas asistidas",
          type: "strength",
          strengthSets: [
            { set: 1, weightKg: 0, reps: 6 },
            { set: 2, weightKg: 0, reps: 6 },
            { set: 3, weightKg: 0, reps: 5 },
          ],
        },
        {
          name: "Fondos",
          type: "strength",
          strengthSets: [
            { set: 1, weightKg: 0, reps: 9 },
            { set: 2, weightKg: 0, reps: 8 },
            { set: 3, weightKg: 0, reps: 8 },
          ],
        },
        {
          name: "Plancha",
          type: "strength",
          strengthSets: [
            { set: 1, weightKg: 0, reps: 40 },
            { set: 2, weightKg: 0, reps: 42 },
            { set: 3, weightKg: 0, reps: 40 },
          ],
        },
      ],
    },
    {
      clientId: client._id,
      week: 4,
      date: "Mié 7 may",
      day: "Día A",
      focus: "Tren superior",
      duration: "56 min",
      durationMinutes: 56,
      exercises: [
        {
          name: "Press banca",
          type: "strength",
          strengthSets: [
            { set: 1, weightKg: 47.5, reps: 9 },
            { set: 2, weightKg: 50, reps: 8 },
            { set: 3, weightKg: 50, reps: 8 },
            { set: 4, weightKg: 52.5, reps: 7 },
          ],
        },
        {
          name: "Remo con barra",
          type: "strength",
          strengthSets: [
            { set: 1, weightKg: 42.5, reps: 10 },
            { set: 2, weightKg: 45, reps: 9 },
            { set: 3, weightKg: 45, reps: 9 },
            { set: 4, weightKg: 47.5, reps: 8 },
          ],
        },
        {
          name: "Press militar",
          type: "strength",
          strengthSets: [
            { set: 1, weightKg: 27.5, reps: 10 },
            { set: 2, weightKg: 30, reps: 9 },
            { set: 3, weightKg: 30, reps: 8 },
          ],
        },
        {
          name: "Curl bíceps",
          type: "strength",
          strengthSets: [
            { set: 1, weightKg: 10, reps: 12 },
            { set: 2, weightKg: 12, reps: 11 },
            { set: 3, weightKg: 12, reps: 10 },
          ],
        },
      ],
    },
  ]);

  console.log(`Histórico demo (6 sesiones) creado para cliente ${client.email}`);
}
