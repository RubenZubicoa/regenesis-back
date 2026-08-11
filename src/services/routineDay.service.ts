import { ObjectId } from "mongodb";

import type {
  CreateRoutineDayInput,
  Exercise,
  ExerciseType,
  UpdateRoutineDayInput,
} from "../entities/RoutineDay";
import * as clientRepository from "../repositories/client.repository";
import * as routineDayRepository from "../repositories/routineDay.repository";

const REQUIRED_FIELDS: (keyof CreateRoutineDayInput)[] = [
  "clientId",
  "day",
  "focus",
  "done",
  "duration",
  "exercises",
];

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

function assertExercises(value: unknown): Exercise[] {
  if (!Array.isArray(value) || value.length === 0) {
    throw Object.assign(new Error("exercises debe ser un array no vacío"), { status: 400 });
  }

  return value.map((entry, index) => {
    if (!entry || typeof entry !== "object") {
      throw Object.assign(new Error(`exercises[${index}] inválido`), { status: 400 });
    }
    const item = entry as Record<string, unknown>;
    const name = String(item.name ?? "").trim();
    const sets = String(item.sets ?? "").trim();
    const rest = String(item.rest ?? "").trim();
    const type = assertExerciseType(item.type, index);

    if (!name) {
      throw Object.assign(new Error(`exercises[${index}].name es obligatorio`), {
        status: 400,
      });
    }
    if (!sets) {
      throw Object.assign(new Error(`exercises[${index}].sets es obligatorio`), {
        status: 400,
      });
    }

    const exercise: Exercise = { name, sets, rest, type };

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
      if (typeof item.repRange !== "object") {
        throw Object.assign(new Error(`exercises[${index}].repRange inválido`), {
          status: 400,
        });
      }
      const range = item.repRange as Record<string, unknown>;
      const min = Number(range.min);
      const max = Number(range.max);
      if (Number.isNaN(min) || Number.isNaN(max)) {
        throw Object.assign(
          new Error(`exercises[${index}].repRange.min/max deben ser numéricos`),
          { status: 400 },
        );
      }
      exercise.repRange = { min, max };
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

    if (item.imageUrl !== undefined && item.imageUrl !== null && item.imageUrl !== "") {
      exercise.imageUrl = String(item.imageUrl).trim();
    }

    if (item.explanation !== undefined && item.explanation !== null && item.explanation !== "") {
      exercise.explanation = String(item.explanation).trim();
    }

    return exercise;
  });
}

async function assertClientExists(clientId: ObjectId) {
  const client = await clientRepository.findClientById(clientId.toHexString());
  if (!client) {
    throw Object.assign(new Error("Cliente no encontrado"), { status: 400 });
  }
  return client;
}

/** Lista días de rutina. Requiere `clientId`. */
export async function listRoutineDays(clientId?: string) {
  if (!clientId) {
    throw Object.assign(new Error("El parámetro clientId es obligatorio"), { status: 400 });
  }
  return getRoutineDaysByClientId(clientId);
}

/** Días de rutina de un cliente concreto. */
export async function getRoutineDaysByClientId(clientId: string) {
  if (!ObjectId.isValid(clientId)) {
    throw Object.assign(new Error("Id de cliente inválido"), { status: 400 });
  }

  const client = await clientRepository.findClientById(clientId);
  if (!client) {
    throw Object.assign(new Error("Cliente no encontrado"), { status: 404 });
  }

  return routineDayRepository.findRoutineDaysByClient(clientId);
}

export async function getRoutineDayById(id: string) {
  const record = await routineDayRepository.findRoutineDayById(id);
  if (!record) {
    throw Object.assign(new Error("Día de rutina no encontrado"), { status: 404 });
  }
  return record;
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
    exercises: assertExercises(body.exercises),
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

  return routineDayRepository.insertRoutineDay(payload);
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
    update.exercises = assertExercises(body.exercises);
  }

  const updated = await routineDayRepository.updateRoutineDayById(id, update);
  if (!updated) {
    throw Object.assign(new Error("Día de rutina no encontrado"), { status: 404 });
  }
  return updated;
}

export async function deleteRoutineDay(id: string) {
  const deleted = await routineDayRepository.deleteRoutineDayById(id);
  if (!deleted) {
    throw Object.assign(new Error("Día de rutina no encontrado"), { status: 404 });
  }
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

  await routineDayRepository.insertManyRoutineDays([
    {
      clientId: client._id,
      day: "Día A",
      focus: "Tren superior",
      done: true,
      duration: "55 min",
      exercises: [
        {
          name: "Press banca",
          sets: "4 x 8-10",
          rest: "90s",
          type: "strength",
          seriesCount: 4,
          repRange: { min: 8, max: 10 },
          imageUrl: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400&h=400&fit=crop",
          explanation:
            "Acuéstate en el banco con los pies firmes en el suelo. Baja la barra controlada hasta el pecho y empuja hacia arriba sin arquear la espalda en exceso. Escápulas retraídas y muñecas alineadas.",
        },
        {
          name: "Remo con barra",
          sets: "4 x 8-12",
          rest: "90s",
          type: "strength",
          seriesCount: 4,
          repRange: { min: 8, max: 12 },
          imageUrl: "https://images.unsplash.com/photo-1603287681836-b174ce5074c2?w=400&h=400&fit=crop",
          explanation:
            "Inclina el torso ~45°, espalda neutra. Tira de la barra hacia el abdomen bajo, apretando los omóplatos. Evita balancear el cuerpo: el movimiento debe salir de la espalda.",
        },
        {
          name: "Press militar",
          sets: "3 x 8-10",
          rest: "60s",
          type: "strength",
          seriesCount: 3,
          repRange: { min: 8, max: 10 },
          imageUrl: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=400&h=400&fit=crop",
          explanation:
            "De pie, core activo. Empuja la barra desde los hombros hacia arriba hasta extender los brazos. Baja con control. No arquees la lumbar: aprieta glúteos y abdomen.",
        },
        {
          name: "Curl bíceps",
          sets: "3 x 10-12",
          rest: "45s",
          type: "strength",
          seriesCount: 3,
          repRange: { min: 10, max: 12 },
          imageUrl: "https://images.unsplash.com/photo-1581009146145-b5ef0631f4db?w=400&h=400&fit=crop",
          explanation:
            "Codos pegados al torso. Sube el peso flexionando el codo sin balancear el tronco. Baja despacio. Mantén las muñecas neutras durante todo el recorrido.",
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
          name: "Sentadilla",
          sets: "4 x 6-8",
          rest: "120s",
          type: "strength",
          seriesCount: 4,
          repRange: { min: 6, max: 8 },
          imageUrl: "https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=400&h=400&fit=crop",
          explanation:
            "Pies a la anchura de hombros, pecho alto. Baja como si te sentaras en una silla, rodillas siguiendo la dirección de los pies. Empuja el suelo para subir. Core firme.",
        },
        {
          name: "Peso muerto rumano",
          sets: "4 x 8-10",
          rest: "90s",
          type: "strength",
          seriesCount: 4,
          repRange: { min: 8, max: 10 },
          imageUrl: "https://images.unsplash.com/photo-1517963879433-6ad2b056d712?w=400&h=400&fit=crop",
          explanation:
            "Piernas casi extendidas, bisagra de cadera. Baja la barra rozando los muslos con espalda recta. Siente el estiramiento en isquios y vuelve empujando la cadera hacia delante.",
        },
        {
          name: "Zancadas",
          sets: "3 x 10-12",
          rest: "60s",
          type: "strength",
          seriesCount: 3,
          repRange: { min: 10, max: 12 },
          imageUrl: "https://images.unsplash.com/photo-1434682881908-b43d0e9dff48?w=400&h=400&fit=crop",
          explanation:
            "Da un paso largo hacia delante y baja hasta que ambas rodillas formen ~90°. El torso permanece erguido. Empuja con el talón delantero para volver. Alterna piernas.",
        },
        {
          name: "Gemelos",
          sets: "4 x 12-15",
          rest: "45s",
          type: "strength",
          seriesCount: 4,
          repRange: { min: 12, max: 15 },
          imageUrl: "https://images.unsplash.com/photo-1599058945522-28d584b6f14f?w=400&h=400&fit=crop",
          explanation:
            "De pie sobre el borde de un escalón o en máquina. Sube de puntillas al máximo y baja controlado hasta estirar el gemelo. Evita rebotar en la parte baja.",
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
          name: "Hip thrust",
          sets: "4 x 8-12",
          rest: "90s",
          type: "strength",
          seriesCount: 4,
          repRange: { min: 8, max: 12 },
          imageUrl: "https://images.unsplash.com/photo-1518611012118-696072aa579a?w=400&h=400&fit=crop",
          explanation:
            "Espalda apoyada en el banco, barra sobre las caderas. Empuja la cadera hacia arriba hasta alinear torso y muslos. Aprieta glúteos arriba y baja sin perder el control.",
        },
        {
          name: "Dominadas asistidas",
          sets: "3 x 6-8",
          rest: "90s",
          type: "strength",
          seriesCount: 3,
          repRange: { min: 6, max: 8 },
          imageUrl: "https://images.unsplash.com/photo-1598971639058-fab3c3109a00?w=400&h=400&fit=crop",
          explanation:
            "Agarre pronado, hombros activos. Tira del cuerpo hacia arriba hasta que la barbilla pase la barra, y baja con control. Usa la asistencia necesaria para completar las reps con buena forma.",
        },
        {
          name: "Fondos",
          sets: "3 x 8-12",
          rest: "60s",
          type: "strength",
          seriesCount: 3,
          repRange: { min: 8, max: 12 },
          imageUrl: "https://images.unsplash.com/photo-1599058917212-d750089bc07e?w=400&h=400&fit=crop",
          explanation:
            "En paralelas o banco, baja flexionando codos hasta ~90° y empuja para subir. Mantén el pecho ligeramente inclinado hacia delante y los hombros lejos de las orejas.",
        },
        {
          name: "Plancha",
          sets: "3 x 40-45s",
          rest: "30s",
          type: "strength",
          seriesCount: 3,
          repRange: { min: 40, max: 45 },
          repUnit: "s",
          imageUrl: "https://images.unsplash.com/photo-1566241142559-40e1dab266c6?w=400&h=400&fit=crop",
          explanation:
            "Apoya antebrazos y puntas de los pies. Cuerpo en línea recta: no dejes caer ni subir la cadera. Aprieta abdomen y glúteos. Respira de forma constante.",
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
          name: "Elevaciones de piernas",
          sets: "4 x 10-12",
          rest: "45s",
          type: "strength",
          seriesCount: 4,
          repRange: { min: 10, max: 12 },
          imageUrl: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=400&fit=crop",
          explanation:
            "Tumbado o colgado, sube las piernas con control usando el abdomen (no el impulso). Baja despacio sin archivar la lumbar. Mantén la pelvis estable.",
        },
        {
          name: "Rueda abdominal",
          sets: "3 x 8-10",
          rest: "60s",
          type: "strength",
          seriesCount: 3,
          repRange: { min: 8, max: 10 },
          imageUrl: "https://images.unsplash.com/photo-1599058917765-a780eda07a3e?w=400&h=400&fit=crop",
          explanation:
            "De rodillas, rueda hacia delante extendiendo los brazos sin perder la tensión del core. Vuelve empujando el suelo con los brazos. No dejes caer la lumbar.",
        },
        {
          name: "Carrera continua",
          sets: "5 km",
          rest: "—",
          type: "cardio",
          targetKm: 5,
          imageUrl: "https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=400&h=400&fit=crop",
          explanation:
            "Mantén un ritmo cómodo y constante. Postura erguida, zancada natural y respiración rítmica. Si es necesario, combina trote y caminata para completar la distancia.",
        },
        {
          name: "Cinta / HIIT",
          sets: "15 min",
          rest: "—",
          type: "cardio",
          targetKm: 3,
          imageUrl: "https://images.unsplash.com/photo-1538805060514-733d3e042d9d?w=400&h=400&fit=crop",
          explanation:
            "Alterna intervalos intensos (p. ej. 30–45 s rápidos) con recuperación activa. Sujétate solo si lo necesitas. Prioriza técnica de carrera y control de la respiración.",
        },
      ],
    },
  ]);

  console.log(`Rutina demo (4 días) creada para cliente ${client.email}`);
}
