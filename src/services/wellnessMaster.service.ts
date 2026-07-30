import type {
  CreateWellnessMasterInput,
  UpdateWellnessMasterInput,
} from "../entities/WellnessMaster";
import * as wellnessMasterRepository from "../repositories/wellnessMaster.repository";

const REQUIRED_FIELDS: (keyof CreateWellnessMasterInput)[] = ["key", "label", "icon", "tone"];

function assertCreatePayload(
  body: Partial<CreateWellnessMasterInput>,
): asserts body is CreateWellnessMasterInput {
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

export async function listWellnessMasters() {
  return wellnessMasterRepository.findAllWellnessMasters();
}

export async function getWellnessMasterById(id: string) {
  const master = await wellnessMasterRepository.findWellnessMasterById(id);
  if (!master) {
    throw Object.assign(new Error("Tipo de bienestar no encontrado"), { status: 404 });
  }
  return master;
}

export async function createWellnessMaster(body: Partial<CreateWellnessMasterInput>) {
  assertCreatePayload(body);

  const existing = await wellnessMasterRepository.findWellnessMasterByKey(body.key);
  if (existing) {
    throw Object.assign(new Error("Ya existe un tipo de bienestar con esa key"), { status: 409 });
  }

  return wellnessMasterRepository.insertWellnessMaster({
    key: body.key,
    label: body.label,
    icon: body.icon,
    tone: body.tone,
  });
}

export async function updateWellnessMaster(id: string, body: UpdateWellnessMasterInput) {
  const current = await wellnessMasterRepository.findWellnessMasterById(id);
  if (!current) {
    throw Object.assign(new Error("Tipo de bienestar no encontrado"), { status: 404 });
  }

  if (body.key && body.key.trim().toLowerCase() !== current.key) {
    const existing = await wellnessMasterRepository.findWellnessMasterByKey(body.key);
    if (existing) {
      throw Object.assign(new Error("Ya existe un tipo de bienestar con esa key"), { status: 409 });
    }
  }

  const updated = await wellnessMasterRepository.updateWellnessMasterById(id, body);
  if (!updated) {
    throw Object.assign(new Error("Tipo de bienestar no encontrado"), { status: 404 });
  }
  return updated;
}

export async function deleteWellnessMaster(id: string) {
  const deleted = await wellnessMasterRepository.deleteWellnessMasterById(id);
  if (!deleted) {
    throw Object.assign(new Error("Tipo de bienestar no encontrado"), { status: 404 });
  }
}

/** Inserta tipos de bienestar demo si la colección está vacía. */
export async function seedDemoWellnessMastersIfEmpty() {
  const masters = await wellnessMasterRepository.findAllWellnessMasters();
  if (masters.length > 0) return;

  const demos: CreateWellnessMasterInput[] = [
    { key: "energia", label: "Energía", icon: "flash-outline", tone: "amber" },
    { key: "sueno", label: "Sueño", icon: "moon-outline", tone: "indigo" },
    { key: "animo", label: "Ánimo", icon: "happy-outline", tone: "green" },
    { key: "estres", label: "Estrés", icon: "pulse-outline", tone: "rose" },
  ];

  for (const demo of demos) {
    await wellnessMasterRepository.insertWellnessMaster(demo);
  }

  console.log("Tipos de bienestar demo creados (4)");
}
