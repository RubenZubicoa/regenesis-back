import { ObjectId } from "mongodb";

import type {
  CreateMealInput,
  MealItem,
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

function assertItems(value: unknown, slotIndex: number): MealItem[] {
  if (!Array.isArray(value)) {
    throw Object.assign(new Error(`slots[${slotIndex}].items debe ser un array`), { status: 400 });
  }
  return value.map((entry, i) => {
    if (!entry || typeof entry !== "object") {
      throw Object.assign(new Error(`slots[${slotIndex}].items[${i}] inválido`), { status: 400 });
    }
    const item = entry as Record<string, unknown>;
    const name = String(item.name ?? "").trim();
    if (!name) {
      throw Object.assign(new Error(`slots[${slotIndex}].items[${i}].name es obligatorio`), {
        status: 400,
      });
    }
    const kcal = item.kcal !== undefined ? Number(item.kcal) : undefined;
    return { name, ...(kcal !== undefined && !isNaN(kcal) ? { kcal } : {}) };
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
    const kcal = Number(slot.kcal ?? 0);

    if (!label) {
      throw Object.assign(new Error(`slots[${index}].label es obligatorio`), { status: 400 });
    }
    if (!time) {
      throw Object.assign(new Error(`slots[${index}].time es obligatorio`), { status: 400 });
    }

    const items = assertItems(slot.items ?? [], index);

    return { label, time, icon, kcal, items };
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
    slots: [
      {
        label: "Desayuno",
        time: "08:00",
        icon: "cafe-outline",
        kcal: 420,
        items: [
          { name: "Avena 50 g", kcal: 180 },
          { name: "Claras de huevo 4 uds", kcal: 70 },
          { name: "Plátano mediano", kcal: 90 },
          { name: "Canela al gusto", kcal: 0 },
        ],
      },
      {
        label: "Media mañana",
        time: "11:00",
        icon: "nutrition-outline",
        kcal: 210,
        items: [
          { name: "Manzana verde", kcal: 80 },
          { name: "Almendras 20 g", kcal: 130 },
        ],
      },
      {
        label: "Comida",
        time: "14:00",
        icon: "restaurant-outline",
        kcal: 620,
        items: [
          { name: "Pechuga de pollo 180 g", kcal: 270 },
          { name: "Arroz integral 100 g (cocido)", kcal: 130 },
          { name: "Brócoli al vapor 150 g", kcal: 50 },
          { name: "Aceite de oliva 10 ml", kcal: 90 },
          { name: "Limón y especias al gusto", kcal: 0 },
        ],
      },
      {
        label: "Merienda",
        time: "17:30",
        icon: "cafe-outline",
        kcal: 240,
        items: [
          { name: "Yogur griego 0% 150 g", kcal: 90 },
          { name: "Nueces 15 g", kcal: 100 },
          { name: "Miel 5 g", kcal: 15 },
          { name: "Frutos rojos 50 g", kcal: 35 },
        ],
      },
      {
        label: "Cena",
        time: "21:00",
        icon: "fish-outline",
        kcal: 480,
        items: [
          { name: "Salmón al horno 200 g", kcal: 280 },
          { name: "Ensalada mixta", kcal: 60 },
          { name: "Aceite de oliva 10 ml", kcal: 90 },
          { name: "Pan integral 30 g", kcal: 75 },
        ],
      },
    ],
  });

  console.log(`Comidas demo creadas para cliente ${client.email}`);
}
