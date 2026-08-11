import { ObjectId } from "mongodb";

import type {
  CreateMealInput,
  MealOption,
  MealSlot,
  UpdateMealInput,
} from "../entities/Meal";
import * as clientRepository from "../repositories/client.repository";
import * as mealRepository from "../repositories/meal.repository";

const REQUIRED_FIELDS: (keyof CreateMealInput)[] = ["clientId", "slots"];

function assertCreatePayload(
  body: Partial<CreateMealInput> & Record<string, unknown>,
): void {
  const missing = REQUIRED_FIELDS.filter((field) => {
    const value = body[field];
    return value === undefined || value === null;
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

function assertOptions(value: unknown, slotIndex: number): MealOption[] {
  if (!Array.isArray(value)) {
    throw Object.assign(new Error(`slots[${slotIndex}].options debe ser un array`), {
      status: 400,
    });
  }
  if (value.length === 0) {
    throw Object.assign(new Error(`slots[${slotIndex}].options no puede estar vacío`), {
      status: 400,
    });
  }

  return value.map((entry, i) => {
    if (!entry || typeof entry !== "object") {
      throw Object.assign(new Error(`slots[${slotIndex}].options[${i}] inválido`), {
        status: 400,
      });
    }
    const item = entry as Record<string, unknown>;
    const name = String(item.name ?? "").trim();
    if (!name) {
      throw Object.assign(new Error(`slots[${slotIndex}].options[${i}].name es obligatorio`), {
        status: 400,
      });
    }
    const kcal = Number(item.kcal ?? 0);
    if (isNaN(kcal) || kcal < 0) {
      throw Object.assign(new Error(`slots[${slotIndex}].options[${i}].kcal inválido`), {
        status: 400,
      });
    }
    const description =
      item.description !== undefined ? String(item.description).trim() : undefined;

    return {
      name,
      kcal,
      ...(description ? { description } : {}),
    };
  });
}

function assertSlots(value: unknown): MealSlot[] {
  if (!Array.isArray(value)) {
    throw Object.assign(new Error("slots debe ser un array"), { status: 400 });
  }

  return value.map((entry, index) => {
    if (!entry || typeof entry !== "object") {
      throw Object.assign(new Error(`slots[${index}] inválido`), { status: 400 });
    }
    const slot = entry as Record<string, unknown>;
    const label = String(slot.label ?? "").trim();
    const time = String(slot.time ?? "").trim();
    const icon = String(slot.icon ?? "restaurant-outline").trim();

    if (!label) {
      throw Object.assign(new Error(`slots[${index}].label es obligatorio`), { status: 400 });
    }
    if (!time) {
      throw Object.assign(new Error(`slots[${index}].time es obligatorio`), { status: 400 });
    }

    // Compatibilidad: si llegan `items` antiguos sin `options`, se tratan como opciones.
    const optionsRaw =
      slot.options !== undefined
        ? slot.options
        : Array.isArray(slot.items)
          ? slot.items
          : [];

    return {
      label,
      time,
      icon,
      options: assertOptions(optionsRaw, index),
    };
  });
}

async function assertClientExists(clientId: ObjectId) {
  const client = await clientRepository.findClientById(clientId.toHexString());
  if (!client) {
    throw Object.assign(new Error("Cliente no encontrado"), { status: 400 });
  }
  return client;
}

/** Devuelve el plan de comidas de un cliente (en array para consistencia de API). */
export async function listMeals(clientId?: string) {
  if (!clientId) {
    throw Object.assign(new Error("El parámetro clientId es obligatorio"), { status: 400 });
  }
  const meal = await getMealByClientId(clientId);
  return meal ? [meal] : [];
}

/** Plan de comidas de un cliente concreto. */
export async function getMealByClientId(clientId: string) {
  if (!ObjectId.isValid(clientId)) {
    throw Object.assign(new Error("Id de cliente inválido"), { status: 400 });
  }

  const client = await clientRepository.findClientById(clientId);
  if (!client) {
    throw Object.assign(new Error("Cliente no encontrado"), { status: 404 });
  }

  return mealRepository.findMealByClientId(clientId);
}

export async function getMealById(id: string) {
  const record = await mealRepository.findMealById(id);
  if (!record) {
    throw Object.assign(new Error("Plan de comidas no encontrado"), { status: 404 });
  }
  return record;
}

export async function createMeal(
  body: Partial<CreateMealInput> & Record<string, unknown>,
) {
  assertCreatePayload(body);

  const clientId = parseObjectId(body.clientId, "cliente");
  await assertClientExists(clientId);

  const existing = await mealRepository.findMealByClientId(clientId.toHexString());
  if (existing) {
    throw Object.assign(new Error("El cliente ya tiene un plan de comidas"), { status: 409 });
  }

  const payload: CreateMealInput = {
    clientId,
    slots: assertSlots(body.slots),
  };

  return mealRepository.insertMeal(payload);
}

export async function updateMeal(
  id: string,
  body: UpdateMealInput & Record<string, unknown>,
) {
  const current = await mealRepository.findMealById(id);
  if (!current) {
    throw Object.assign(new Error("Plan de comidas no encontrado"), { status: 404 });
  }

  const update: UpdateMealInput = {};

  if (body.clientId !== undefined) {
    const clientId = parseObjectId(body.clientId, "cliente");
    await assertClientExists(clientId);
    const existing = await mealRepository.findMealByClientId(clientId.toHexString());
    if (existing && existing._id.toHexString() !== id) {
      throw Object.assign(new Error("El cliente ya tiene un plan de comidas"), { status: 409 });
    }
    update.clientId = clientId;
  }

  if (body.slots !== undefined) {
    update.slots = assertSlots(body.slots);
  }

  const updated = await mealRepository.updateMealById(id, update);
  if (!updated) {
    throw Object.assign(new Error("Plan de comidas no encontrado"), { status: 404 });
  }
  return updated;
}

export async function deleteMeal(id: string) {
  const deleted = await mealRepository.deleteMealById(id);
  if (!deleted) {
    throw Object.assign(new Error("Plan de comidas no encontrado"), { status: 404 });
  }
}

const DEMO_SLOTS: MealSlot[] = [
  {
    label: "Desayuno",
    time: "08:00",
    icon: "cafe-outline",
    options: [
      {
        name: "Avena con claras y plátano",
        kcal: 420,
        description: "Avena 50 g, 4 claras, plátano y canela",
      },
      {
        name: "Tostadas con aguacate y huevo",
        kcal: 440,
        description: "2 tostadas integrales, medio aguacate y 2 huevos revueltos",
      },
      {
        name: "Yogur proteico con fruta y granola",
        kcal: 400,
        description: "Yogur griego 0%, frutos rojos y granola casera 30 g",
      },
    ],
  },
  {
    label: "Media mañana",
    time: "11:00",
    icon: "nutrition-outline",
    options: [
      {
        name: "Manzana con almendras",
        kcal: 210,
        description: "1 manzana verde y 20 g de almendras",
      },
      {
        name: "Batido de proteína con leche",
        kcal: 220,
        description: "1 scoop whey y 250 ml leche semidesnatada",
      },
      {
        name: "Tortitas de maíz con pavo",
        kcal: 200,
        description: "2 tortitas y 40 g de pechuga de pavo",
      },
    ],
  },
  {
    label: "Comida",
    time: "14:00",
    icon: "restaurant-outline",
    options: [
      {
        name: "Pollo con arroz y verduras",
        kcal: 620,
        description: "Pechuga 180 g, arroz integral y brócoli al vapor",
      },
      {
        name: "Pescado blanco con patata y ensalada",
        kcal: 580,
        description: "Merluza al horno, patata cocida y ensalada mixta",
      },
      {
        name: "Bowl de quinoa con garbanzos y verduras",
        kcal: 600,
        description: "Quinoa, garbanzos, pimiento, pepino y aceite de oliva",
      },
    ],
  },
  {
    label: "Merienda",
    time: "17:30",
    icon: "cafe-outline",
    options: [
      {
        name: "Yogur griego con nueces y miel",
        kcal: 240,
        description: "Yogur 0% 150 g, nueces 15 g y miel",
      },
      {
        name: "Batido de cacao y plátano",
        kcal: 250,
        description: "Proteína sabor cacao, medio plátano y leche",
      },
      {
        name: "Cottage con piña",
        kcal: 220,
        description: "Queso cottage 150 g y piña natural 100 g",
      },
    ],
  },
  {
    label: "Cena",
    time: "21:00",
    icon: "fish-outline",
    options: [
      {
        name: "Salmón al horno con ensalada",
        kcal: 480,
        description: "Salmón 200 g, ensalada mixta y pan integral",
      },
      {
        name: "Tortilla francesa con verduras",
        kcal: 420,
        description: "3 huevos, espinacas, champiñones y tomate",
      },
      {
        name: "Pavo a la plancha con calabacín",
        kcal: 450,
        description: "Pechuga de pavo 180 g y calabacín salteado",
      },
    ],
  },
];

/** Inserta comidas demo para el primer cliente si la colección está vacía. */
export async function seedDemoMealsIfEmpty() {
  const existing = await mealRepository.findAllMeals();
  if (existing.length > 0) return;

  const clients = await clientRepository.findAllClients();
  const client = clients[0];
  if (!client) {
    console.warn("No hay cliente para seed de Meal");
    return;
  }

  await mealRepository.insertMeal({
    clientId: client._id,
    slots: DEMO_SLOTS,
  });

  console.log(`Comidas demo creadas para cliente ${client.email}`);
}

export { DEMO_SLOTS };
