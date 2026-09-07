import { ObjectId, type WithId } from "mongodb";

import type { ExerciseMaster } from "../entities/ExerciseMaster";
import type { RepRange, RoutineExercise } from "../entities/RoutineDay";
import type {
  CreateRoutineMasterInput,
  RoutineMaster,
  UpdateRoutineMasterInput,
} from "../entities/RoutineMaster";
import * as exerciseMasterRepository from "../repositories/exerciseMaster.repository";
import * as routineMasterRepository from "../repositories/routineMaster.repository";
import type { HydratedRoutineExercise } from "./routineDay.service";

const REQUIRED_FIELDS: (keyof CreateRoutineMasterInput)[] = ["day", "focus", "duration", "exercises"];

export type HydratedRoutineMaster = Omit<WithId<RoutineMaster>, "exercises"> & {
  exercises: HydratedRoutineExercise[];
};

function assertCreatePayload(
  body: Partial<CreateRoutineMasterInput> & Record<string, unknown>,
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

    const master = await exerciseMasterRepository.findExerciseMasterById(exerciseId.toHexString());
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
        throw Object.assign(new Error(`exercises[${index}].repUnit debe ser "reps" o "s"`), {
          status: 400,
        });
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

async function hydrateRoutineMaster(
  master: WithId<RoutineMaster>,
): Promise<HydratedRoutineMaster> {
  const ids = (master.exercises ?? [])
    .map((ex) => ex.exerciseId)
    .filter((id): id is ObjectId => id instanceof ObjectId || ObjectId.isValid(String(id)))
    .map((id) => (id instanceof ObjectId ? id : new ObjectId(String(id))));

  const exercises = await exerciseMasterRepository.findExerciseMastersByIds(ids);
  const masterById = new Map(exercises.map((item) => [item._id.toHexString(), item]));

  return {
    ...master,
    exercises: (master.exercises ?? []).map((ex) => hydrateExercise(ex, masterById)),
  };
}

async function hydrateRoutineMasters(
  masters: WithId<RoutineMaster>[],
): Promise<HydratedRoutineMaster[]> {
  const allIds: ObjectId[] = [];
  for (const master of masters) {
    for (const ex of master.exercises ?? []) {
      if (ex.exerciseId instanceof ObjectId) {
        allIds.push(ex.exerciseId);
      } else if (ObjectId.isValid(String(ex.exerciseId))) {
        allIds.push(new ObjectId(String(ex.exerciseId)));
      }
    }
  }

  const exercises = await exerciseMasterRepository.findExerciseMastersByIds(allIds);
  const masterById = new Map(exercises.map((item) => [item._id.toHexString(), item]));

  return masters.map((master) => ({
    ...master,
    exercises: (master.exercises ?? []).map((ex) => hydrateExercise(ex, masterById)),
  }));
}

export async function listRoutineMasters() {
  const masters = await routineMasterRepository.findAllRoutineMasters();
  return hydrateRoutineMasters(masters);
}

export async function getRoutineMasterById(id: string) {
  const master = await routineMasterRepository.findRoutineMasterById(id);
  if (!master) {
    throw Object.assign(new Error("Rutina maestra no encontrada"), { status: 404 });
  }
  return hydrateRoutineMaster(master);
}

export async function createRoutineMaster(
  body: Partial<CreateRoutineMasterInput> & Record<string, unknown>,
) {
  assertCreatePayload(body);

  const payload: CreateRoutineMasterInput = {
    day: String(body.day).trim(),
    focus: String(body.focus).trim(),
    done: body.done === undefined ? false : Boolean(body.done),
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

  const created = await routineMasterRepository.insertRoutineMaster(payload);
  return hydrateRoutineMaster(created);
}

export async function updateRoutineMaster(
  id: string,
  body: UpdateRoutineMasterInput & Record<string, unknown>,
) {
  const current = await routineMasterRepository.findRoutineMasterById(id);
  if (!current) {
    throw Object.assign(new Error("Rutina maestra no encontrada"), { status: 404 });
  }

  const update: UpdateRoutineMasterInput = {};

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

  const updated = await routineMasterRepository.updateRoutineMasterById(id, update);
  if (!updated) {
    throw Object.assign(new Error("Rutina maestra no encontrada"), { status: 404 });
  }
  return hydrateRoutineMaster(updated);
}

export async function deleteRoutineMaster(id: string) {
  const deleted = await routineMasterRepository.deleteRoutineMasterById(id);
  if (!deleted) {
    throw Object.assign(new Error("Rutina maestra no encontrada"), { status: 404 });
  }
}
