import { ObjectId } from "mongodb";

import type { ExerciseCategory } from "../entities/ExerciseCategory";
import type {
  CreateExerciseMasterInput,
  ExerciseType,
  UpdateExerciseMasterInput,
} from "../entities/ExerciseMaster";
import * as exerciseCategoryRepository from "../repositories/exerciseCategory.repository";
import * as exerciseMasterRepository from "../repositories/exerciseMaster.repository";

const REQUIRED_FIELDS: (keyof CreateExerciseMasterInput)[] = ["name", "type"];

function assertCreatePayload(
  body: Partial<CreateExerciseMasterInput> & Record<string, unknown>,
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

function assertExerciseType(value: unknown): ExerciseType {
  const type = String(value ?? "");
  if (type !== "strength" && type !== "cardio") {
    throw Object.assign(new Error('type debe ser "strength" o "cardio"'), { status: 400 });
  }
  return type;
}

function hasCategoryValue(value: unknown): boolean {
  return value !== undefined && value !== null && value !== "";
}

async function resolveCategory(value: unknown): Promise<ExerciseCategory> {
  if (value instanceof ObjectId) {
    return assertCategoryById(value.toHexString());
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) {
      throw Object.assign(new Error("category inválida"), { status: 400 });
    }
    if (ObjectId.isValid(trimmed)) {
      return assertCategoryById(trimmed);
    }
    return assertCategoryByKey(trimmed);
  }

  if (typeof value === "object" && value !== null) {
    const obj = value as Record<string, unknown>;
    const rawId = obj._id ?? obj.id;
    if (rawId instanceof ObjectId) {
      return assertCategoryById(rawId.toHexString());
    }
    if (typeof rawId === "string" && ObjectId.isValid(rawId.trim())) {
      return assertCategoryById(rawId.trim());
    }
    if (typeof obj.key === "string" && obj.key.trim()) {
      return assertCategoryByKey(obj.key);
    }
  }

  throw Object.assign(new Error("category inválida"), { status: 400 });
}

async function assertCategoryById(id: string): Promise<ExerciseCategory> {
  const category = await exerciseCategoryRepository.findExerciseCategoryById(id);
  if (!category) {
    throw Object.assign(new Error("Categoría no encontrada"), { status: 400 });
  }
  return category;
}

async function assertCategoryByKey(key: string): Promise<ExerciseCategory> {
  const category = await exerciseCategoryRepository.findExerciseCategoryByKey(key);
  if (!category) {
    throw Object.assign(new Error("Categoría no encontrada"), { status: 400 });
  }
  return category;
}

export const DEMO_EXERCISE_MASTERS: CreateExerciseMasterInput[] = [
  {
    name: "Press banca",
    type: "strength",
    imageUrl: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400&h=400&fit=crop",
    explanation:
      "Acuéstate en el banco con los pies firmes en el suelo. Baja la barra controlada hasta el pecho y empuja hacia arriba sin arquear la espalda en exceso. Escápulas retraídas y muñecas alineadas.",
  },
  {
    name: "Remo con barra",
    type: "strength",
    imageUrl: "https://images.unsplash.com/photo-1603287681836-b174ce5074c2?w=400&h=400&fit=crop",
    explanation:
      "Inclina el torso ~45°, espalda neutra. Tira de la barra hacia el abdomen bajo, apretando los omóplatos. Evita balancear el cuerpo: el movimiento debe salir de la espalda.",
  },
  {
    name: "Press militar",
    type: "strength",
    imageUrl: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=400&h=400&fit=crop",
    explanation:
      "De pie, core activo. Empuja la barra desde los hombros hacia arriba hasta extender los brazos. Baja con control. No arquees la lumbar: aprieta glúteos y abdomen.",
  },
  {
    name: "Curl bíceps",
    type: "strength",
    imageUrl: "https://images.unsplash.com/photo-1581009146145-b5ef0631f4db?w=400&h=400&fit=crop",
    explanation:
      "Codos pegados al torso. Sube el peso flexionando el codo sin balancear el tronco. Baja despacio. Mantén las muñecas neutras durante todo el recorrido.",
  },
  {
    name: "Sentadilla",
    type: "strength",
    imageUrl: "https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=400&h=400&fit=crop",
    explanation:
      "Pies a la anchura de hombros, pecho alto. Baja como si te sentaras en una silla, rodillas siguiendo la dirección de los pies. Empuja el suelo para subir. Core firme.",
  },
  {
    name: "Peso muerto rumano",
    type: "strength",
    imageUrl: "https://images.unsplash.com/photo-1517963879433-6ad2b056d712?w=400&h=400&fit=crop",
    explanation:
      "Piernas casi extendidas, bisagra de cadera. Baja la barra rozando los muslos con espalda recta. Siente el estiramiento en isquios y vuelve empujando la cadera hacia delante.",
  },
  {
    name: "Zancadas",
    type: "strength",
    imageUrl: "https://images.unsplash.com/photo-1434682881908-b43d0e9dff48?w=400&h=400&fit=crop",
    explanation:
      "Da un paso largo hacia delante y baja hasta que ambas rodillas formen ~90°. El torso permanece erguido. Empuja con el talón delantero para volver. Alterna piernas.",
  },
  {
    name: "Gemelos",
    type: "strength",
    imageUrl: "https://images.unsplash.com/photo-1599058945522-28d584b6f14f?w=400&h=400&fit=crop",
    explanation:
      "De pie sobre el borde de un escalón o en máquina. Sube de puntillas al máximo y baja controlado hasta estirar el gemelo. Evita rebotar en la parte baja.",
  },
  {
    name: "Hip thrust",
    type: "strength",
    imageUrl: "https://images.unsplash.com/photo-1518611012118-696072aa579a?w=400&h=400&fit=crop",
    explanation:
      "Espalda apoyada en el banco, barra sobre las caderas. Empuja la cadera hacia arriba hasta alinear torso y muslos. Aprieta glúteos arriba y baja sin perder el control.",
  },
  {
    name: "Dominadas asistidas",
    type: "strength",
    imageUrl: "https://images.unsplash.com/photo-1598971639058-fab3c3109a00?w=400&h=400&fit=crop",
    explanation:
      "Agarre pronado, hombros activos. Tira del cuerpo hacia arriba hasta que la barbilla pase la barra, y baja con control. Usa la asistencia necesaria para completar las reps con buena forma.",
  },
  {
    name: "Fondos",
    type: "strength",
    imageUrl: "https://images.unsplash.com/photo-1599058917212-d750089bc07e?w=400&h=400&fit=crop",
    explanation:
      "En paralelas o banco, baja flexionando codos hasta ~90° y empuja para subir. Mantén el pecho ligeramente inclinado hacia delante y los hombros lejos de las orejas.",
  },
  {
    name: "Plancha",
    type: "strength",
    imageUrl: "https://images.unsplash.com/photo-1566241142559-40e1dab266c6?w=400&h=400&fit=crop",
    explanation:
      "Apoya antebrazos y puntas de los pies. Cuerpo en línea recta: no dejes caer ni subir la cadera. Aprieta abdomen y glúteos. Respira de forma constante.",
  },
  {
    name: "Elevaciones de piernas",
    type: "strength",
    imageUrl: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=400&fit=crop",
    explanation:
      "Tumbado o colgado, sube las piernas con control usando el abdomen (no el impulso). Baja despacio sin archivar la lumbar. Mantén la pelvis estable.",
  },
  {
    name: "Rueda abdominal",
    type: "strength",
    imageUrl: "https://images.unsplash.com/photo-1599058917765-a780eda07a3e?w=400&h=400&fit=crop",
    explanation:
      "De rodillas, rueda hacia delante extendiendo los brazos sin perder la tensión del core. Vuelve empujando el suelo con los brazos. No dejes caer la lumbar.",
  },
  {
    name: "Carrera continua",
    type: "cardio",
    imageUrl: "https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=400&h=400&fit=crop",
    explanation:
      "Mantén un ritmo cómodo y constante. Postura erguida, zancada natural y respiración rítmica. Si es necesario, combina trote y caminata para completar la distancia.",
  },
  {
    name: "Cinta / HIIT",
    type: "cardio",
    imageUrl: "https://images.unsplash.com/photo-1538805060514-733d3e042d9d?w=400&h=400&fit=crop",
    explanation:
      "Alterna intervalos intensos (p. ej. 30–45 s rápidos) con recuperación activa. Sujétate solo si lo necesitas. Prioriza técnica de carrera y control de la respiración.",
  },
];

export async function listExerciseMasters() {
  return exerciseMasterRepository.findAllExerciseMasters();
}

export async function getExerciseMasterById(id: string) {
  const master = await exerciseMasterRepository.findExerciseMasterById(id);
  if (!master) {
    throw Object.assign(new Error("Ejercicio no encontrado"), { status: 404 });
  }
  return master;
}

export async function createExerciseMaster(
  body: Partial<CreateExerciseMasterInput> & Record<string, unknown>,
) {
  assertCreatePayload(body);

  const name = String(body.name).trim();
  const type = assertExerciseType(body.type);
  const existing = await exerciseMasterRepository.findExerciseMasterByName(name);
  if (existing) {
    throw Object.assign(new Error("Ya existe un ejercicio con ese nombre"), { status: 409 });
  }

  const rawCategory = (body as Record<string, unknown>).category;
  const category = hasCategoryValue(rawCategory) ? await resolveCategory(rawCategory) : undefined;

  return exerciseMasterRepository.insertExerciseMaster({
    name,
    type,
    ...(body.imageUrl ? { imageUrl: String(body.imageUrl).trim() } : {}),
    ...(body.explanation ? { explanation: String(body.explanation).trim() } : {}),
    ...(category ? { category } : {}),
  });
}

export async function updateExerciseMaster(
  id: string,
  body: UpdateExerciseMasterInput & Record<string, unknown>,
) {
  const current = await exerciseMasterRepository.findExerciseMasterById(id);
  if (!current) {
    throw Object.assign(new Error("Ejercicio no encontrado"), { status: 404 });
  }

  const update: UpdateExerciseMasterInput = {};

  if (body.name !== undefined) {
    const name = String(body.name).trim();
    if (!name) {
      throw Object.assign(new Error("name no puede estar vacío"), { status: 400 });
    }
    const existing = await exerciseMasterRepository.findExerciseMasterByName(name);
    if (existing && existing._id.toHexString() !== id) {
      throw Object.assign(new Error("Ya existe un ejercicio con ese nombre"), { status: 409 });
    }
    update.name = name;
  }

  if (body.type !== undefined) {
    update.type = assertExerciseType(body.type);
  }

  if (body.imageUrl !== undefined) {
    update.imageUrl = String(body.imageUrl ?? "").trim() || undefined;
  }

  if (body.explanation !== undefined) {
    update.explanation = String(body.explanation ?? "").trim() || undefined;
  }

  const rawCategory = (body as Record<string, unknown>).category;
  if (rawCategory !== undefined) {
    if (!hasCategoryValue(rawCategory)) {
      update.category = undefined;
    } else {
      update.category = await resolveCategory(rawCategory);
    }
  }

  const updated = await exerciseMasterRepository.updateExerciseMasterById(id, update);
  if (!updated) {
    throw Object.assign(new Error("Ejercicio no encontrado"), { status: 404 });
  }
  return updated;
}

export async function deleteExerciseMaster(id: string) {
  const deleted = await exerciseMasterRepository.deleteExerciseMasterById(id);
  if (!deleted) {
    throw Object.assign(new Error("Ejercicio no encontrado"), { status: 404 });
  }
}

/** Inserta ejercicios maestros demo si la colección está vacía. */
export async function seedDemoExerciseMastersIfEmpty() {
  const existing = await exerciseMasterRepository.findAllExerciseMasters();
  if (existing.length > 0) return existing;

  const inserted = await exerciseMasterRepository.insertManyExerciseMasters(DEMO_EXERCISE_MASTERS);
  console.log(`ExerciseMaster demo: ${inserted.length} ejercicios creados`);
  return inserted;
}

/**
 * Devuelve mapa name(lower) -> master.
 * Crea maestros faltantes a partir de demos o de datos embebidos.
 */
export async function ensureExerciseMastersByName(
  extras: CreateExerciseMasterInput[] = [],
) {
  await seedDemoExerciseMastersIfEmpty();

  for (const extra of extras) {
    const found = await exerciseMasterRepository.findExerciseMasterByName(extra.name);
    if (!found) {
      await exerciseMasterRepository.insertExerciseMaster(extra);
    }
  }

  const all = await exerciseMasterRepository.findAllExerciseMasters();
  return Object.fromEntries(all.map((m) => [m.name.trim().toLowerCase(), m]));
}
