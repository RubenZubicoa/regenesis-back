import { ObjectId } from "mongodb";

import type {
  CreateSupplementsInput,
  SupplementElement,
  UpdateSupplementsInput,
} from "../entities/Supplements";
import * as clientRepository from "../repositories/client.repository";
import * as supplementsRepository from "../repositories/supplements.repository";

const REQUIRED_FIELDS: (keyof CreateSupplementsInput)[] = ["clientId", "elements"];

function assertCreatePayload(
  body: Partial<CreateSupplementsInput> & Record<string, unknown>,
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

function assertElements(value: unknown): SupplementElement[] {
  if (!Array.isArray(value)) {
    throw Object.assign(new Error("elements debe ser un array"), { status: 400 });
  }

  return value.map((entry, index) => {
    if (!entry || typeof entry !== "object") {
      throw Object.assign(new Error(`elements[${index}] inválido`), { status: 400 });
    }
    const item = entry as Record<string, unknown>;
    const name = String(item.name ?? "").trim();
    const dose = String(item.dose ?? "").trim();
    const when = String(item.when ?? "").trim();
    const icon = String(item.icon ?? "flask-outline").trim();

    if (!name) {
      throw Object.assign(new Error(`elements[${index}].name es obligatorio`), {
        status: 400,
      });
    }
    if (!dose) {
      throw Object.assign(new Error(`elements[${index}].dose es obligatorio`), {
        status: 400,
      });
    }
    if (!when) {
      throw Object.assign(new Error(`elements[${index}].when es obligatorio`), {
        status: 400,
      });
    }

    return { name, dose, when, icon };
  });
}

async function assertClientExists(clientId: ObjectId) {
  const client = await clientRepository.findClientById(clientId.toHexString());
  if (!client) {
    throw Object.assign(new Error("Cliente no encontrado"), { status: 400 });
  }
  return client;
}

/** Lista suplementos. Requiere `clientId`. */
export async function listSupplements(clientId?: string) {
  if (!clientId) {
    throw Object.assign(new Error("El parámetro clientId es obligatorio"), { status: 400 });
  }
  const supplements = await getSupplementsByClientId(clientId);
  return supplements ? [supplements] : [];
}

/** Suplementos de un cliente concreto. */
export async function getSupplementsByClientId(clientId: string) {
  if (!ObjectId.isValid(clientId)) {
    throw Object.assign(new Error("Id de cliente inválido"), { status: 400 });
  }

  const client = await clientRepository.findClientById(clientId);
  if (!client) {
    throw Object.assign(new Error("Cliente no encontrado"), { status: 404 });
  }

  return supplementsRepository.findSupplementsByClientId(clientId);
}

export async function getSupplementsById(id: string) {
  const record = await supplementsRepository.findSupplementsById(id);
  if (!record) {
    throw Object.assign(new Error("Suplementos no encontrados"), { status: 404 });
  }
  return record;
}

export async function createSupplements(
  body: Partial<CreateSupplementsInput> & Record<string, unknown>,
) {
  assertCreatePayload(body);

  const clientId = parseObjectId(body.clientId, "cliente");
  await assertClientExists(clientId);

  const existing = await supplementsRepository.findSupplementsByClientId(
    clientId.toHexString(),
  );
  if (existing) {
    throw Object.assign(new Error("El cliente ya tiene un registro de suplementos"), {
      status: 409,
    });
  }

  const payload: CreateSupplementsInput = {
    clientId,
    elements: assertElements(body.elements),
  };

  return supplementsRepository.insertSupplements(payload);
}

export async function updateSupplements(
  id: string,
  body: UpdateSupplementsInput & Record<string, unknown>,
) {
  const current = await supplementsRepository.findSupplementsById(id);
  if (!current) {
    throw Object.assign(new Error("Suplementos no encontrados"), { status: 404 });
  }

  const update: UpdateSupplementsInput = {};

  if (body.clientId !== undefined) {
    const clientId = parseObjectId(body.clientId, "cliente");
    await assertClientExists(clientId);
    const existing = await supplementsRepository.findSupplementsByClientId(
      clientId.toHexString(),
    );
    if (existing && existing._id.toHexString() !== id) {
      throw Object.assign(new Error("El cliente ya tiene un registro de suplementos"), {
        status: 409,
      });
    }
    update.clientId = clientId;
  }

  if (body.elements !== undefined) {
    update.elements = assertElements(body.elements);
  }

  const updated = await supplementsRepository.updateSupplementsById(id, update);
  if (!updated) {
    throw Object.assign(new Error("Suplementos no encontrados"), { status: 404 });
  }
  return updated;
}

export async function deleteSupplements(id: string) {
  const deleted = await supplementsRepository.deleteSupplementsById(id);
  if (!deleted) {
    throw Object.assign(new Error("Suplementos no encontrados"), { status: 404 });
  }
}

/** Inserta suplementos demo para el primer cliente si la colección está vacía. */
export async function seedDemoSupplementsIfEmpty() {
  const existing = await supplementsRepository.findAllSupplements();
  if (existing.length > 0) return;

  const clients = await clientRepository.findAllClients();
  const client = clients[0];
  if (!client) {
    console.warn("No hay cliente para seed de Supplements");
    return;
  }

  await supplementsRepository.insertSupplements({
    clientId: client._id,
    elements: [
      { name: "Proteína Whey", dose: "1 scoop", when: "Post-entreno", icon: "flask-outline" },
      { name: "Creatina", dose: "5 g", when: "Diario", icon: "water-outline" },
      { name: "Omega 3", dose: "2 cáps", when: "Con la comida", icon: "leaf-outline" },
      { name: "Vitamina D", dose: "1 cáp", when: "Desayuno", icon: "sunny-outline" },
    ],
  });

  console.log(`Suplementos demo creados para cliente ${client.email}`);
}
