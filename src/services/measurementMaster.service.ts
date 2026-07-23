import type {
  CreateMeasurementMasterInput,
  UpdateMeasurementMasterInput,
} from "../entities/MeasurementMaster";
import * as measurementMasterRepository from "../repositories/measurementMaster.repository";

const REQUIRED_FIELDS: (keyof CreateMeasurementMasterInput)[] = ["key", "label", "unit", "icon"];

function assertCreatePayload(
  body: Partial<CreateMeasurementMasterInput>,
): asserts body is CreateMeasurementMasterInput {
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

export async function listMeasurementMasters() {
  return measurementMasterRepository.findAllMeasurementMasters();
}

export async function getMeasurementMasterById(id: string) {
  const master = await measurementMasterRepository.findMeasurementMasterById(id);
  if (!master) {
    throw Object.assign(new Error("Tipo de medida no encontrado"), { status: 404 });
  }
  return master;
}

export async function createMeasurementMaster(body: Partial<CreateMeasurementMasterInput>) {
  assertCreatePayload(body);

  const existing = await measurementMasterRepository.findMeasurementMasterByKey(body.key);
  if (existing) {
    throw Object.assign(new Error("Ya existe un tipo de medida con esa key"), { status: 409 });
  }

  return measurementMasterRepository.insertMeasurementMaster({
    key: body.key,
    label: body.label,
    unit: body.unit,
    icon: body.icon,
  });
}

export async function updateMeasurementMaster(id: string, body: UpdateMeasurementMasterInput) {
  const current = await measurementMasterRepository.findMeasurementMasterById(id);
  if (!current) {
    throw Object.assign(new Error("Tipo de medida no encontrado"), { status: 404 });
  }

  if (body.key && body.key.trim().toLowerCase() !== current.key) {
    const existing = await measurementMasterRepository.findMeasurementMasterByKey(body.key);
    if (existing) {
      throw Object.assign(new Error("Ya existe un tipo de medida con esa key"), { status: 409 });
    }
  }

  const updated = await measurementMasterRepository.updateMeasurementMasterById(id, body);
  if (!updated) {
    throw Object.assign(new Error("Tipo de medida no encontrado"), { status: 404 });
  }
  return updated;
}

export async function deleteMeasurementMaster(id: string) {
  const deleted = await measurementMasterRepository.deleteMeasurementMasterById(id);
  if (!deleted) {
    throw Object.assign(new Error("Tipo de medida no encontrado"), { status: 404 });
  }
}

/** Inserta tipos de medida demo si la colección está vacía. */
export async function seedDemoMeasurementMastersIfEmpty() {
  const masters = await measurementMasterRepository.findAllMeasurementMasters();
  if (masters.length > 0) return;

  const demos: CreateMeasurementMasterInput[] = [
    { key: "cintura", label: "Cintura", unit: "cm", icon: "body-outline" },
    { key: "cadera", label: "Cadera", unit: "cm", icon: "ellipse-outline" },
    { key: "pecho", label: "Pecho", unit: "cm", icon: "fitness-outline" },
    { key: "brazo", label: "Brazo", unit: "cm", icon: "barbell-outline" },
  ];

  for (const demo of demos) {
    await measurementMasterRepository.insertMeasurementMaster(demo);
  }

  console.log("Tipos de medida demo creados (4)");
}
