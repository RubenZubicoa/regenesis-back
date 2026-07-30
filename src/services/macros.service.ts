import { ObjectId } from "mongodb";

import type {
  CreateMacrosInput,
  MacroItem,
  UpdateMacrosInput,
} from "../entities/Macros";
import * as clientRepository from "../repositories/client.repository";
import * as macrosRepository from "../repositories/macros.repository";

const REQUIRED_FIELDS: (keyof CreateMacrosInput)[] = [
  "clientId",
  "calories",
  "target",
  "items",
];

function assertCreatePayload(
  body: Partial<CreateMacrosInput> & Record<string, unknown>,
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

function assertItems(value: unknown): MacroItem[] {
  if (!Array.isArray(value) || value.length === 0) {
    throw Object.assign(new Error("items debe ser un array no vacío"), { status: 400 });
  }

  return value.map((entry, index) => {
    if (!entry || typeof entry !== "object") {
      throw Object.assign(new Error(`items[${index}] inválido`), { status: 400 });
    }
    const item = entry as Record<string, unknown>;
    const key = String(item.key ?? "").trim();
    const label = String(item.label ?? "").trim();
    const shortLabel = String(item.shortLabel ?? "").trim();
    const tone = String(item.tone ?? "primary").trim();
    const grams = Number(item.grams);
    const target = Number(item.target);

    if (!key) {
      throw Object.assign(new Error(`items[${index}].key es obligatorio`), { status: 400 });
    }
    if (!label) {
      throw Object.assign(new Error(`items[${index}].label es obligatorio`), { status: 400 });
    }
    if (!shortLabel) {
      throw Object.assign(new Error(`items[${index}].shortLabel es obligatorio`), {
        status: 400,
      });
    }
    if (Number.isNaN(grams)) {
      throw Object.assign(new Error(`items[${index}].grams debe ser numérico`), {
        status: 400,
      });
    }
    if (Number.isNaN(target)) {
      throw Object.assign(new Error(`items[${index}].target debe ser numérico`), {
        status: 400,
      });
    }

    return { key, label, shortLabel, grams, target, tone };
  });
}

async function assertClientExists(clientId: ObjectId) {
  const client = await clientRepository.findClientById(clientId.toHexString());
  if (!client) {
    throw Object.assign(new Error("Cliente no encontrado"), { status: 400 });
  }
  return client;
}

/** Lista macros. Requiere `clientId`. */
export async function listMacros(clientId?: string) {
  if (!clientId) {
    throw Object.assign(new Error("El parámetro clientId es obligatorio"), { status: 400 });
  }
  const macros = await getMacrosByClientId(clientId);
  return macros ? [macros] : [];
}

/** Macros de un cliente concreto. */
export async function getMacrosByClientId(clientId: string) {
  if (!ObjectId.isValid(clientId)) {
    throw Object.assign(new Error("Id de cliente inválido"), { status: 400 });
  }

  const client = await clientRepository.findClientById(clientId);
  if (!client) {
    throw Object.assign(new Error("Cliente no encontrado"), { status: 404 });
  }

  return macrosRepository.findMacrosByClientId(clientId);
}

export async function getMacrosById(id: string) {
  const record = await macrosRepository.findMacrosById(id);
  if (!record) {
    throw Object.assign(new Error("Macros no encontrados"), { status: 404 });
  }
  return record;
}

export async function createMacros(
  body: Partial<CreateMacrosInput> & Record<string, unknown>,
) {
  assertCreatePayload(body);

  const clientId = parseObjectId(body.clientId, "cliente");
  await assertClientExists(clientId);

  const existing = await macrosRepository.findMacrosByClientId(clientId.toHexString());
  if (existing) {
    throw Object.assign(new Error("El cliente ya tiene un registro de macros"), {
      status: 409,
    });
  }

  const payload: CreateMacrosInput = {
    clientId,
    calories: assertNumber(body.calories, "calories"),
    target: assertNumber(body.target, "target"),
    items: assertItems(body.items),
  };

  return macrosRepository.insertMacros(payload);
}

export async function updateMacros(
  id: string,
  body: UpdateMacrosInput & Record<string, unknown>,
) {
  const current = await macrosRepository.findMacrosById(id);
  if (!current) {
    throw Object.assign(new Error("Macros no encontrados"), { status: 404 });
  }

  const update: UpdateMacrosInput = {};

  if (body.clientId !== undefined) {
    const clientId = parseObjectId(body.clientId, "cliente");
    await assertClientExists(clientId);
    const existing = await macrosRepository.findMacrosByClientId(clientId.toHexString());
    if (existing && existing._id.toHexString() !== id) {
      throw Object.assign(new Error("El cliente ya tiene un registro de macros"), {
        status: 409,
      });
    }
    update.clientId = clientId;
  }

  if (body.calories !== undefined) {
    update.calories = assertNumber(body.calories, "calories");
  }
  if (body.target !== undefined) {
    update.target = assertNumber(body.target, "target");
  }
  if (body.items !== undefined) {
    update.items = assertItems(body.items);
  }

  const updated = await macrosRepository.updateMacrosById(id, update);
  if (!updated) {
    throw Object.assign(new Error("Macros no encontrados"), { status: 404 });
  }
  return updated;
}

export async function deleteMacros(id: string) {
  const deleted = await macrosRepository.deleteMacrosById(id);
  if (!deleted) {
    throw Object.assign(new Error("Macros no encontrados"), { status: 404 });
  }
}

/** Inserta macros demo para el primer cliente si la colección está vacía. */
export async function seedDemoMacrosIfEmpty() {
  const existing = await macrosRepository.findAllMacros();
  if (existing.length > 0) return;

  const clients = await clientRepository.findAllClients();
  const client = clients[0];
  if (!client) {
    console.warn("No hay cliente para seed de Macros");
    return;
  }

  await macrosRepository.insertMacros({
    clientId: client._id,
    calories: 1850,
    target: 1900,
    items: [
      {
        key: "prot",
        label: "Proteínas",
        shortLabel: "Proteínas",
        grams: 140,
        target: 150,
        tone: "primary",
      },
      {
        key: "carbs",
        label: "Carbohidratos",
        shortLabel: "Carbohidratos",
        grams: 180,
        target: 200,
        tone: "gold",
      },
      {
        key: "fats",
        label: "Grasas",
        shortLabel: "Grasas",
        grams: 55,
        target: 60,
        tone: "teal",
      },
    ],
  });

  console.log(`Macros demo creados para cliente ${client.email}`);
}
