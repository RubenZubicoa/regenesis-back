import type {
  CreateTechnicalSpecificationsInput,
  DailyRecall,
  DailyRecallEntry,
  EatingHabits,
  ExerciseHabits,
  Lifestyle,
  PersonalHistory,
  UpdateTechnicalSpecificationsInput,
} from "../entities/TechnicalSpecifications";
import * as clientRepository from "../repositories/client.repository";
import * as specRepository from "../repositories/technicalSpecifications.repository";

const REQUIRED_FIELDS: (keyof CreateTechnicalSpecificationsInput)[] = [
  "clientId",
  "personalHistory",
  "eatingHabits",
  "lifestyle",
  "exerciseHabits",
];

const PERSONAL_HISTORY_KEYS: (keyof PersonalHistory)[] = [
  "diseases",
  "injuries",
  "medications",
  "supplements",
  "allergies",
  "bowelHabit",
  "contraceptives",
];

const EATING_HABITS_KEYS: (keyof EatingHabits)[] = [
  "numberOfMeals",
  "snacks",
  "drinks",
  "bread",
  "favoriteFoods",
  "rejectedFoods",
];

const LIFESTYLE_KEYS: (keyof Lifestyle)[] = ["smoking", "alcohol", "sleep", "waterIntake"];

const EXERCISE_HABITS_KEYS: (keyof ExerciseHabits)[] = [
  "sport",
  "exerciseFrequency",
  "strengthLevel",
  "strengthTrainingFrequency",
  "material",
];

const DAILY_RECALL_MEAL_KEYS: (keyof DailyRecall)[] = [
  "breakfast",
  "morningSnack",
  "lunch",
  "afternoonSnack",
  "dinner",
];

const DAILY_RECALL_ENTRY_KEYS: (keyof DailyRecallEntry)[] = [
  "ingredients",
  "quantities",
  "timeAndPlace",
];

function assertCreatePayload(
  body: Partial<CreateTechnicalSpecificationsInput> & Record<string, unknown>,
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

function assertStringMap<T extends Record<string, string>>(
  value: unknown,
  field: string,
  keys: (keyof T)[],
): T {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw Object.assign(new Error(`${field} debe ser un objeto`), { status: 400 });
  }

  const source = value as Record<string, unknown>;
  const result = {} as T;
  for (const key of keys) {
    const raw = source[String(key)];
    result[key] = (raw === undefined || raw === null ? "" : String(raw).trim()) as T[keyof T];
  }
  return result;
}

function emptyDailyRecallEntry(): DailyRecallEntry {
  return { ingredients: "", quantities: "", timeAndPlace: "" };
}

function assertDailyRecall(value: unknown): DailyRecall {
  const source =
    value && typeof value === "object" && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : {};

  const result = {} as DailyRecall;
  for (const meal of DAILY_RECALL_MEAL_KEYS) {
    const raw = source[meal];
    result[meal] =
      raw && typeof raw === "object" && !Array.isArray(raw)
        ? assertStringMap<DailyRecallEntry>(raw, `dailyRecall.${meal}`, DAILY_RECALL_ENTRY_KEYS)
        : emptyDailyRecallEntry();
  }
  return result;
}

async function assertClientExists(clientId: string) {
  if (!clientId.trim()) {
    throw Object.assign(new Error("Id de cliente inválido"), { status: 400 });
  }

  const client = await clientRepository.findClientById(clientId);
  if (!client) {
    throw Object.assign(new Error("Cliente no encontrado"), { status: 404 });
  }
  return client;
}

export async function listSpecs(clientId?: string) {
  if (!clientId) {
    throw Object.assign(new Error("El parámetro clientId es obligatorio"), { status: 400 });
  }
  const spec = await getSpecByClientId(clientId);
  return spec ? [spec] : [];
}

export async function getSpecByClientId(clientId: string) {
  await assertClientExists(clientId);
  return specRepository.findSpecByClientId(clientId);
}

export async function getSpecById(id: string) {
  const spec = await specRepository.findSpecById(id);
  if (!spec) {
    throw Object.assign(new Error("Ficha técnica no encontrada"), { status: 404 });
  }
  return spec;
}

export async function createSpec(
  body: Partial<CreateTechnicalSpecificationsInput> & Record<string, unknown>,
) {
  assertCreatePayload(body);

  const clientId = String(body.clientId).trim();
  await assertClientExists(clientId);

  const existing = await specRepository.findSpecByClientId(clientId);
  if (existing) {
    throw Object.assign(new Error("El cliente ya tiene una ficha técnica"), { status: 409 });
  }

  const payload: CreateTechnicalSpecificationsInput = {
    clientId,
    personalHistory: assertStringMap<PersonalHistory>(
      body.personalHistory,
      "personalHistory",
      PERSONAL_HISTORY_KEYS,
    ),
    eatingHabits: assertStringMap<EatingHabits>(
      body.eatingHabits,
      "eatingHabits",
      EATING_HABITS_KEYS,
    ),
    lifestyle: assertStringMap<Lifestyle>(body.lifestyle, "lifestyle", LIFESTYLE_KEYS),
    exerciseHabits: assertStringMap<ExerciseHabits>(
      body.exerciseHabits,
      "exerciseHabits",
      EXERCISE_HABITS_KEYS,
    ),
    dailyRecall: assertDailyRecall(body.dailyRecall),
    observations: String(body.observations ?? "").trim(),
  };

  return specRepository.insertSpec(payload);
}

export async function updateSpec(
  id: string,
  body: UpdateTechnicalSpecificationsInput & Record<string, unknown>,
) {
  const current = await specRepository.findSpecById(id);
  if (!current) {
    throw Object.assign(new Error("Ficha técnica no encontrada"), { status: 404 });
  }

  const update: UpdateTechnicalSpecificationsInput = {};

  if (body.clientId !== undefined) {
    const clientId = String(body.clientId).trim();
    await assertClientExists(clientId);
    const existing = await specRepository.findSpecByClientId(clientId);
    if (existing && existing._id.toHexString() !== id) {
      throw Object.assign(new Error("El cliente ya tiene una ficha técnica"), { status: 409 });
    }
    update.clientId = clientId;
  }

  if (body.personalHistory !== undefined) {
    update.personalHistory = assertStringMap<PersonalHistory>(
      body.personalHistory,
      "personalHistory",
      PERSONAL_HISTORY_KEYS,
    );
  }
  if (body.eatingHabits !== undefined) {
    update.eatingHabits = assertStringMap<EatingHabits>(
      body.eatingHabits,
      "eatingHabits",
      EATING_HABITS_KEYS,
    );
  }
  if (body.lifestyle !== undefined) {
    update.lifestyle = assertStringMap<Lifestyle>(body.lifestyle, "lifestyle", LIFESTYLE_KEYS);
  }
  if (body.exerciseHabits !== undefined) {
    update.exerciseHabits = assertStringMap<ExerciseHabits>(
      body.exerciseHabits,
      "exerciseHabits",
      EXERCISE_HABITS_KEYS,
    );
  }
  if (body.dailyRecall !== undefined) {
    update.dailyRecall = assertDailyRecall(body.dailyRecall);
  }
  if (body.observations !== undefined) {
    update.observations = String(body.observations ?? "").trim();
  }

  const updated = await specRepository.updateSpecById(id, update);
  if (!updated) {
    throw Object.assign(new Error("Ficha técnica no encontrada"), { status: 404 });
  }
  return updated;
}

export async function deleteSpec(id: string) {
  const deleted = await specRepository.deleteSpecById(id);
  if (!deleted) {
    throw Object.assign(new Error("Ficha técnica no encontrada"), { status: 404 });
  }
}
