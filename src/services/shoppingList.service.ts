import { ObjectId } from "mongodb";

import type {
  CreateShoppingListInput,
  ShoppingListItem,
  UpdateShoppingListInput,
} from "../entities/ShoppingList";
import * as clientRepository from "../repositories/client.repository";
import * as shoppingListRepository from "../repositories/shoppingList.repository";

const REQUIRED_FIELDS: (keyof CreateShoppingListInput)[] = ["clientId", "list"];

function assertCreatePayload(
  body: Partial<CreateShoppingListInput> & Record<string, unknown>,
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

function assertList(value: unknown): ShoppingListItem[] {
  if (!Array.isArray(value)) {
    throw Object.assign(new Error("list debe ser un array"), { status: 400 });
  }

  return value.map((entry, index) => {
    if (!entry || typeof entry !== "object") {
      throw Object.assign(new Error(`list[${index}] inválido`), { status: 400 });
    }
    const item = entry as Record<string, unknown>;
    const name = String(item.item ?? "").trim();
    const qty = String(item.qty ?? "").trim();
    if (!name) {
      throw Object.assign(new Error(`list[${index}].item es obligatorio`), { status: 400 });
    }
    if (!qty) {
      throw Object.assign(new Error(`list[${index}].qty es obligatorio`), { status: 400 });
    }
    return {
      item: name,
      qty,
      done: Boolean(item.done),
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

/** Lista de la compra. Requiere `clientId`. */
export async function listShoppingLists(clientId?: string) {
  if (!clientId) {
    throw Object.assign(new Error("El parámetro clientId es obligatorio"), { status: 400 });
  }
  const list = await getShoppingListByClientId(clientId);
  return list ? [list] : [];
}

/** Lista de la compra de un cliente concreto. */
export async function getShoppingListByClientId(clientId: string) {
  if (!ObjectId.isValid(clientId)) {
    throw Object.assign(new Error("Id de cliente inválido"), { status: 400 });
  }

  const client = await clientRepository.findClientById(clientId);
  if (!client) {
    throw Object.assign(new Error("Cliente no encontrado"), { status: 404 });
  }

  return shoppingListRepository.findShoppingListByClientId(clientId);
}

export async function getShoppingListById(id: string) {
  const record = await shoppingListRepository.findShoppingListById(id);
  if (!record) {
    throw Object.assign(new Error("Lista de la compra no encontrada"), { status: 404 });
  }
  return record;
}

export async function createShoppingList(
  body: Partial<CreateShoppingListInput> & Record<string, unknown>,
) {
  assertCreatePayload(body);

  const clientId = parseObjectId(body.clientId, "cliente");
  await assertClientExists(clientId);

  const existing = await shoppingListRepository.findShoppingListByClientId(
    clientId.toHexString(),
  );
  if (existing) {
    throw Object.assign(new Error("El cliente ya tiene una lista de la compra"), {
      status: 409,
    });
  }

  const payload: CreateShoppingListInput = {
    clientId,
    list: assertList(body.list),
  };

  return shoppingListRepository.insertShoppingList(payload);
}

export async function updateShoppingList(
  id: string,
  body: UpdateShoppingListInput & Record<string, unknown>,
) {
  const current = await shoppingListRepository.findShoppingListById(id);
  if (!current) {
    throw Object.assign(new Error("Lista de la compra no encontrada"), { status: 404 });
  }

  const update: UpdateShoppingListInput = {};

  if (body.clientId !== undefined) {
    const clientId = parseObjectId(body.clientId, "cliente");
    await assertClientExists(clientId);
    const existing = await shoppingListRepository.findShoppingListByClientId(
      clientId.toHexString(),
    );
    if (existing && existing._id.toHexString() !== id) {
      throw Object.assign(new Error("El cliente ya tiene una lista de la compra"), {
        status: 409,
      });
    }
    update.clientId = clientId;
  }

  if (body.list !== undefined) {
    update.list = assertList(body.list);
  }

  const updated = await shoppingListRepository.updateShoppingListById(id, update);
  if (!updated) {
    throw Object.assign(new Error("Lista de la compra no encontrada"), { status: 404 });
  }
  return updated;
}

export async function deleteShoppingList(id: string) {
  const deleted = await shoppingListRepository.deleteShoppingListById(id);
  if (!deleted) {
    throw Object.assign(new Error("Lista de la compra no encontrada"), { status: 404 });
  }
}

/** Inserta lista demo para el primer cliente si la colección está vacía. */
export async function seedDemoShoppingListIfEmpty() {
  const existing = await shoppingListRepository.findAllShoppingLists();
  if (existing.length > 0) return;

  const clients = await clientRepository.findAllClients();
  const client = clients[0];
  if (!client) {
    console.warn("No hay cliente para seed de ShoppingList");
    return;
  }

  await shoppingListRepository.insertShoppingList({
    clientId: client._id,
    list: [
      { item: "Pechuga de pollo", qty: "1 kg", done: true },
      { item: "Arroz integral", qty: "500 g", done: true },
      { item: "Salmón fresco", qty: "400 g", done: false },
      { item: "Yogur griego", qty: "4 uds", done: false },
      { item: "Espinacas", qty: "2 bolsas", done: false },
      { item: "Avena", qty: "1 kg", done: true },
      { item: "Huevos", qty: "12 uds", done: false },
    ],
  });

  console.log(`Lista de la compra demo creada para cliente ${client.email}`);
}
