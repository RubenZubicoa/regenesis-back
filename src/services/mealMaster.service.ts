import type { MealOption, MealSlot } from "../entities/Meal";
import type {
  CreateMealMasterInput,
  UpdateMealMasterInput,
} from "../entities/MealMaster";
import * as mealMasterRepository from "../repositories/mealMaster.repository";

const REQUIRED_FIELDS: (keyof CreateMealMasterInput)[] = ["nombre", "slots"];

function assertCreatePayload(
  body: Partial<CreateMealMasterInput> & Record<string, unknown>,
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

export async function listMealMasters() {
  return mealMasterRepository.findAllMealMasters();
}

export async function getMealMasterById(id: string) {
  const master = await mealMasterRepository.findMealMasterById(id);
  if (!master) {
    throw Object.assign(new Error("Plan de comidas maestro no encontrado"), { status: 404 });
  }
  return master;
}

export async function createMealMaster(
  body: Partial<CreateMealMasterInput> & Record<string, unknown>,
) {
  assertCreatePayload(body);

  const nombre = String(body.nombre).trim();
  const existing = await mealMasterRepository.findMealMasterByNombre(nombre);
  if (existing) {
    throw Object.assign(new Error("Ya existe un plan de comidas maestro con ese nombre"), {
      status: 409,
    });
  }

  return mealMasterRepository.insertMealMaster({
    nombre,
    descripcion: String(body.descripcion ?? "").trim(),
    slots: assertSlots(body.slots),
  });
}

export async function updateMealMaster(
  id: string,
  body: UpdateMealMasterInput & Record<string, unknown>,
) {
  const current = await mealMasterRepository.findMealMasterById(id);
  if (!current) {
    throw Object.assign(new Error("Plan de comidas maestro no encontrado"), { status: 404 });
  }

  const update: UpdateMealMasterInput = {};

  if (body.nombre !== undefined) {
    const nombre = String(body.nombre).trim();
    if (!nombre) {
      throw Object.assign(new Error("nombre no puede estar vacío"), { status: 400 });
    }
    if (nombre.toLowerCase() !== (current.nombre ?? "").toLowerCase()) {
      const existing = await mealMasterRepository.findMealMasterByNombre(nombre);
      if (existing) {
        throw Object.assign(new Error("Ya existe un plan de comidas maestro con ese nombre"), {
          status: 409,
        });
      }
    }
    update.nombre = nombre;
  }

  if (body.descripcion !== undefined) {
    update.descripcion = String(body.descripcion ?? "").trim();
  }

  if (body.slots !== undefined) {
    update.slots = assertSlots(body.slots);
  }

  const updated = await mealMasterRepository.updateMealMasterById(id, update);
  if (!updated) {
    throw Object.assign(new Error("Plan de comidas maestro no encontrado"), { status: 404 });
  }
  return updated;
}

export async function deleteMealMaster(id: string) {
  const deleted = await mealMasterRepository.deleteMealMasterById(id);
  if (!deleted) {
    throw Object.assign(new Error("Plan de comidas maestro no encontrado"), { status: 404 });
  }
}
