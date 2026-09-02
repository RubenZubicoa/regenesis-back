import { ObjectId, type WithId } from "mongodb";

import type { ExerciseCategory } from "../entities/ExerciseCategory";
import type { ExerciseMaster, ExerciseType } from "../entities/ExerciseMaster";
import type {
  CreateRoutineDayInput,
  RepRange,
  RoutineDay,
  RoutineExercise,
  UpdateRoutineDayInput,
} from "../entities/RoutineDay";
import * as clientRepository from "../repositories/client.repository";
import * as exerciseMasterRepository from "../repositories/exerciseMaster.repository";
import * as routineDayRepository from "../repositories/routineDay.repository";
import { ensureExerciseMastersByName } from "./exerciseMaster.service";

const REQUIRED_FIELDS: (keyof CreateRoutineDayInput)[] = [
  "clientId",
  "day",
  "focus",
  "done",
  "duration",
  "exercises",
];

/** Ejercicio de rutina con datos del maestro expandido (respuesta API). */
export type HydratedRoutineExercise = RoutineExercise & {
  name: string;
  type: ExerciseType;
  imageUrl?: string;
  explanation?: string;
  category?: ExerciseCategory;
};

export type HydratedRoutineDay = Omit<WithId<RoutineDay>, "exercises"> & {
  exercises: HydratedRoutineExercise[];
};

function assertCreatePayload(
  body: Partial<CreateRoutineDayInput> & Record<string, unknown>,
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

function assertRepRange(value: unknown, index: number): RepRange {
  if (!value || typeof value !== "object") {
    throw Object.assign(new Error(`exercises[${index}].repRange inválido`), { status: 400 });
  }
  const range = value as Record<string, unknown>;
  const min = Number(range.min);
  const max = Number(range.max);
  if (Number.isNaN(min) || Number.isNaN(max)) {
    throw Object.assign(
      new Error(`exercises[${index}].repRange.min/max deben ser numéricos`),
      { status: 400 },
    );
  }
  return { min, max };
}

async function assertRoutineExercises(value: unknown): Promise<RoutineExercise[]> {
  if (!Array.isArray(value) || value.length === 0) {
    throw Object.assign(new Error("exercises debe ser un array no vacío"), { status: 400 });
  }

  const result: RoutineExercise[] = [];

  for (let index = 0; index < value.length; index += 1) {
    const entry = value[index];
    if (!entry || typeof entry !== "object") {
      throw Object.assign(new Error(`exercises[${index}] inválido`), { status: 400 });
    }
    const item = entry as Record<string, unknown>;

    const exerciseId = parseObjectId(
      item.exerciseId ?? item.ExerciseId ?? item.exerciseMasterId,
      `exercises[${index}].exerciseId`,
    );

    const master = await exerciseMasterRepository.findExerciseMasterById(
      exerciseId.toHexString(),
    );
    if (!master) {
      throw Object.assign(
        new Error(`exercises[${index}]: ejercicio maestro no encontrado`),
        { status: 400 },
      );
    }

    const sets = String(item.sets ?? "").trim();
    const rest = String(item.rest ?? "").trim();
    if (!sets) {
      throw Object.assign(new Error(`exercises[${index}].sets es obligatorio`), {
        status: 400,
      });
    }

    const exercise: RoutineExercise = { exerciseId, sets, rest };

    if (item.seriesCount !== undefined && item.seriesCount !== null && item.seriesCount !== "") {
      const seriesCount = Number(item.seriesCount);
      if (Number.isNaN(seriesCount)) {
        throw Object.assign(new Error(`exercises[${index}].seriesCount debe ser numérico`), {
          status: 400,
        });
      }
      exercise.seriesCount = seriesCount;
    }

    if (item.repRange !== undefined && item.repRange !== null) {
      exercise.repRange = assertRepRange(item.repRange, index);
    }

    if (item.repUnit !== undefined && item.repUnit !== null && item.repUnit !== "") {
      const repUnit = String(item.repUnit);
      if (repUnit !== "reps" && repUnit !== "s") {
        throw Object.assign(
          new Error(`exercises[${index}].repUnit debe ser "reps" o "s"`),
          { status: 400 },
        );
      }
      exercise.repUnit = repUnit;
    }

    if (item.targetKm !== undefined && item.targetKm !== null && item.targetKm !== "") {
      const targetKm = Number(item.targetKm);
      if (Number.isNaN(targetKm)) {
        throw Object.assign(new Error(`exercises[${index}].targetKm debe ser numérico`), {
          status: 400,
        });
      }
      exercise.targetKm = targetKm;
    }

    result.push(exercise);
  }

  return result;
}

async function assertClientExists(clientId: ObjectId) {
  const client = await clientRepository.findClientById(clientId.toHexString());
  if (!client) {
    throw Object.assign(new Error("Cliente no encontrado"), { status: 400 });
  }
  return client;
}

function hydrateExercise(
  assignment: RoutineExercise,
  masterById: Map<string, WithId<ExerciseMaster>>,
): HydratedRoutineExercise {
  const id =
    assignment.exerciseId instanceof ObjectId
      ? assignment.exerciseId.toHexString()
      : String(assignment.exerciseId);
  const master = masterById.get(id);

  return {
    exerciseId: assignment.exerciseId,
    sets: assignment.sets,
    rest: assignment.rest,
    ...(assignment.seriesCount !== undefined ? { seriesCount: assignment.seriesCount } : {}),
    ...(assignment.repRange ? { repRange: assignment.repRange } : {}),
    ...(assignment.repUnit ? { repUnit: assignment.repUnit } : {}),
    ...(assignment.targetKm !== undefined ? { targetKm: assignment.targetKm } : {}),
    name: master?.name ?? "Ejercicio",
    type: master?.type ?? "strength",
    ...(master?.imageUrl ? { imageUrl: master.imageUrl } : {}),
    ...(master?.explanation ? { explanation: master.explanation } : {}),
    ...(master?.category ? { category: master.category } : {}),
  };
}

async function hydrateRoutineDay(day: WithId<RoutineDay>): Promise<HydratedRoutineDay> {
  const ids = (day.exercises ?? [])
    .map((ex) => ex.exerciseId)
    .filter((id): id is ObjectId => id instanceof ObjectId || ObjectId.isValid(String(id)))
    .map((id) => (id instanceof ObjectId ? id : new ObjectId(String(id))));

  const masters = await exerciseMasterRepository.findExerciseMastersByIds(ids);
  const masterById = new Map(masters.map((m) => [m._id.toHexString(), m]));

  return {
    ...day,
    exercises: (day.exercises ?? []).map((ex) => hydrateExercise(ex, masterById)),
  };
}

async function hydrateRoutineDays(days: WithId<RoutineDay>[]): Promise<HydratedRoutineDay[]> {
  const allIds: ObjectId[] = [];
  for (const day of days) {
    for (const ex of day.exercises ?? []) {
      if (ex.exerciseId instanceof ObjectId) {
        allIds.push(ex.exerciseId);
      } else if (ObjectId.isValid(String(ex.exerciseId))) {
        allIds.push(new ObjectId(String(ex.exerciseId)));
      }
    }
  }

  const masters = await exerciseMasterRepository.findExerciseMastersByIds(allIds);
  const masterById = new Map(masters.map((m) => [m._id.toHexString(), m]));

  return days.map((day) => ({
    ...day,
    exercises: (day.exercises ?? []).map((ex) => hydrateExercise(ex, masterById)),
  }));
}

/** Lista días de rutina. Requiere `clientId`. */
export async function listRoutineDays(clientId?: string) {
  if (!clientId) {
    throw Object.assign(new Error("El parámetro clientId es obligatorio"), { status: 400 });
  }
  return getRoutineDaysByClientId(clientId);
}

/** Días de rutina de un cliente concreto (ejercicios hidratados). */
export async function getRoutineDaysByClientId(clientId: string) {
  if (!ObjectId.isValid(clientId)) {
    throw Object.assign(new Error("Id de cliente inválido"), { status: 400 });
  }

  const client = await clientRepository.findClientById(clientId);
  if (!client) {
    throw Object.assign(new Error("Cliente no encontrado"), { status: 404 });
  }

  const days = await routineDayRepository.findRoutineDaysByClient(clientId);
  return hydrateRoutineDays(days);
}

export async function getRoutineDayById(id: string) {
  const record = await routineDayRepository.findRoutineDayById(id);
  if (!record) {
    throw Object.assign(new Error("Día de rutina no encontrado"), { status: 404 });
  }
  return hydrateRoutineDay(record);
}

export async function createRoutineDay(
  body: Partial<CreateRoutineDayInput> & Record<string, unknown>,
) {
  assertCreatePayload(body);

  const clientId = parseObjectId(body.clientId, "cliente");
  await assertClientExists(clientId);

  const payload: CreateRoutineDayInput = {
    clientId,
    day: String(body.day).trim(),
    focus: String(body.focus).trim(),
    done: Boolean(body.done),
    duration: String(body.duration).trim(),
    exercises: await assertRoutineExercises(body.exercises),
  };

  if (!payload.day) {
    throw Object.assign(new Error("day es obligatorio"), { status: 400 });
  }
  if (!payload.focus) {
    throw Object.assign(new Error("focus es obligatorio"), { status: 400 });
  }
  if (!payload.duration) {
    throw Object.assign(new Error("duration es obligatorio"), { status: 400 });
  }

  const created = await routineDayRepository.insertRoutineDay(payload);
  return hydrateRoutineDay(created);
}

export async function updateRoutineDay(
  id: string,
  body: UpdateRoutineDayInput & Record<string, unknown>,
) {
  const current = await routineDayRepository.findRoutineDayById(id);
  if (!current) {
    throw Object.assign(new Error("Día de rutina no encontrado"), { status: 404 });
  }

  const update: UpdateRoutineDayInput = {};

  if (body.clientId !== undefined) {
    const clientId = parseObjectId(body.clientId, "cliente");
    await assertClientExists(clientId);
    update.clientId = clientId;
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

  if (body.done !== undefined) {
    update.done = Boolean(body.done);
  }

  if (body.duration !== undefined) {
    const duration = String(body.duration).trim();
    if (!duration) {
      throw Object.assign(new Error("duration no puede estar vacío"), { status: 400 });
    }
    update.duration = duration;
  }

  if (body.exercises !== undefined) {
    update.exercises = await assertRoutineExercises(body.exercises);
  }

  const updated = await routineDayRepository.updateRoutineDayById(id, update);
  if (!updated) {
    throw Object.assign(new Error("Día de rutina no encontrado"), { status: 404 });
  }
  return hydrateRoutineDay(updated);
}

export async function deleteRoutineDay(id: string) {
  const deleted = await routineDayRepository.deleteRoutineDayById(id);
  if (!deleted) {
    throw Object.assign(new Error("Día de rutina no encontrado"), { status: 404 });
  }
}

/**
 * Migra ejercicios embebidos (name/type/image…) a ExerciseMaster + exerciseId.
 * Idempotente: solo toca entradas sin exerciseId válido.
 */
export async function migrateRoutineExercisesToMaster(): Promise<number> {
  type LegacyExercise = Partial<RoutineExercise> & {
    name?: string;
    type?: ExerciseType;
    imageUrl?: string;
    explanation?: string;
  };

  const days = await routineDayRepository.findAllRoutineDays();
  let migrated = 0;

  const extras = days.flatMap((day) =>
    ((day.exercises ?? []) as LegacyExercise[])
      .filter((ex) => !ex.exerciseId && !!ex.name)
      .map((ex) => ({
        name: String(ex.name),
        type: ex.type === "cardio" ? ("cardio" as const) : ("strength" as const),
        ...(ex.imageUrl ? { imageUrl: ex.imageUrl } : {}),
        ...(ex.explanation ? { explanation: ex.explanation } : {}),
      })),
  );

  const byName = await ensureExerciseMastersByName(extras);

  for (const day of days) {
    const exercises = (day.exercises ?? []) as LegacyExercise[];
    let changed = false;

    const next: RoutineExercise[] = [];

    for (const anyEx of exercises) {
      if (anyEx.exerciseId && ObjectId.isValid(String(anyEx.exerciseId))) {
        // Ya migrado: no tocar (conserva name/type denormalizados si existen).
        next.push({
          exerciseId:
            anyEx.exerciseId instanceof ObjectId
              ? anyEx.exerciseId
              : new ObjectId(String(anyEx.exerciseId)),
          sets: String(anyEx.sets ?? ""),
          rest: String(anyEx.rest ?? ""),
          ...(anyEx.seriesCount !== undefined ? { seriesCount: anyEx.seriesCount } : {}),
          ...(anyEx.repRange ? { repRange: anyEx.repRange } : {}),
          ...(anyEx.repUnit ? { repUnit: anyEx.repUnit } : {}),
          ...(anyEx.targetKm !== undefined ? { targetKm: anyEx.targetKm } : {}),
          ...(anyEx.name ? { name: anyEx.name } : {}),
          ...(anyEx.type ? { type: anyEx.type } : {}),
          ...(anyEx.imageUrl ? { imageUrl: anyEx.imageUrl } : {}),
          ...(anyEx.explanation ? { explanation: anyEx.explanation } : {}),
        } as RoutineExercise);
        continue;
      }

      const master = anyEx.name ? byName[anyEx.name.trim().toLowerCase()] : undefined;
      if (!master) {
        console.warn(
          `No se pudo migrar ejercicio embebido en ${day.day ?? day._id}: ${anyEx.name ?? "(sin nombre)"}`,
        );
        continue;
      }

      changed = true;
      migrated += 1;
      next.push({
        exerciseId: master._id,
        sets: String(anyEx.sets ?? ""),
        rest: String(anyEx.rest ?? ""),
        ...(anyEx.seriesCount !== undefined ? { seriesCount: anyEx.seriesCount } : {}),
        ...(anyEx.repRange ? { repRange: anyEx.repRange } : {}),
        ...(anyEx.repUnit ? { repUnit: anyEx.repUnit } : {}),
        ...(anyEx.targetKm !== undefined ? { targetKm: anyEx.targetKm } : {}),
        name: master.name,
        type: master.type,
        ...(master.imageUrl ? { imageUrl: master.imageUrl } : {}),
        ...(master.explanation ? { explanation: master.explanation } : {}),
      } as RoutineExercise);
    }

    if (changed) {
      await routineDayRepository.updateRoutineDayById(day._id.toHexString(), {
        exercises: next,
      });
    }
  }

  return migrated;
}

/** Inserta la rutina demo (4 días) para el primer cliente si la colección está vacía. */
export async function seedDemoRoutineDaysIfEmpty() {
  const existing = await routineDayRepository.findAllRoutineDays();
  if (existing.length > 0) return;

  const clients = await clientRepository.findAllClients();
  const client = clients[0];
  if (!client) {
    console.warn("No hay cliente para seed de RoutineDay");
    return;
  }

  const byName = await ensureExerciseMastersByName();
  const idOf = (name: string) => {
    const master = byName[name.toLowerCase()];
    if (!master) {
      throw new Error(`ExerciseMaster no encontrado para seed: ${name}`);
    }
    return master._id;
  };

  await routineDayRepository.insertManyRoutineDays([
    {
      clientId: client._id,
      day: "Día A",
      focus: "Tren superior",
      done: true,
      duration: "55 min",
      exercises: [
        {
          exerciseId: idOf("Press banca"),
          sets: "4 x 8-10",
          rest: "90s",
          seriesCount: 4,
          repRange: { min: 8, max: 10 },
        },
        {
          exerciseId: idOf("Remo con barra"),
          sets: "4 x 8-12",
          rest: "90s",
          seriesCount: 4,
          repRange: { min: 8, max: 12 },
        },
        {
          exerciseId: idOf("Press militar"),
          sets: "3 x 8-10",
          rest: "60s",
          seriesCount: 3,
          repRange: { min: 8, max: 10 },
        },
        {
          exerciseId: idOf("Curl bíceps"),
          sets: "3 x 10-12",
          rest: "45s",
          seriesCount: 3,
          repRange: { min: 10, max: 12 },
        },
      ],
    },
    {
      clientId: client._id,
      day: "Día B",
      focus: "Tren inferior",
      done: true,
      duration: "60 min",
      exercises: [
        {
          exerciseId: idOf("Sentadilla"),
          sets: "4 x 6-8",
          rest: "120s",
          seriesCount: 4,
          repRange: { min: 6, max: 8 },
        },
        {
          exerciseId: idOf("Peso muerto rumano"),
          sets: "4 x 8-10",
          rest: "90s",
          seriesCount: 4,
          repRange: { min: 8, max: 10 },
        },
        {
          exerciseId: idOf("Zancadas"),
          sets: "3 x 10-12",
          rest: "60s",
          seriesCount: 3,
          repRange: { min: 10, max: 12 },
        },
        {
          exerciseId: idOf("Gemelos"),
          sets: "4 x 12-15",
          rest: "45s",
          seriesCount: 4,
          repRange: { min: 12, max: 15 },
        },
      ],
    },
    {
      clientId: client._id,
      day: "Día C",
      focus: "Full body",
      done: true,
      duration: "50 min",
      exercises: [
        {
          exerciseId: idOf("Hip thrust"),
          sets: "4 x 8-12",
          rest: "90s",
          seriesCount: 4,
          repRange: { min: 8, max: 12 },
        },
        {
          exerciseId: idOf("Dominadas asistidas"),
          sets: "3 x 6-8",
          rest: "90s",
          seriesCount: 3,
          repRange: { min: 6, max: 8 },
        },
        {
          exerciseId: idOf("Fondos"),
          sets: "3 x 8-12",
          rest: "60s",
          seriesCount: 3,
          repRange: { min: 8, max: 12 },
        },
        {
          exerciseId: idOf("Plancha"),
          sets: "3 x 40-45s",
          rest: "30s",
          seriesCount: 3,
          repRange: { min: 40, max: 45 },
          repUnit: "s",
        },
      ],
    },
    {
      clientId: client._id,
      day: "Día D",
      focus: "Core y cardio",
      done: false,
      duration: "45 min",
      exercises: [
        {
          exerciseId: idOf("Elevaciones de piernas"),
          sets: "4 x 10-12",
          rest: "45s",
          seriesCount: 4,
          repRange: { min: 10, max: 12 },
        },
        {
          exerciseId: idOf("Rueda abdominal"),
          sets: "3 x 8-10",
          rest: "60s",
          seriesCount: 3,
          repRange: { min: 8, max: 10 },
        },
        {
          exerciseId: idOf("Carrera continua"),
          sets: "5 km",
          rest: "—",
          targetKm: 5,
        },
        {
          exerciseId: idOf("Cinta / HIIT"),
          sets: "15 min",
          rest: "—",
          targetKm: 3,
        },
      ],
    },
  ]);

  console.log(`Rutina demo (4 días) creada para cliente ${client.email}`);
}
