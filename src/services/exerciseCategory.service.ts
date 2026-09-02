import type {
  CreateExerciseCategoryInput,
  UpdateExerciseCategoryInput,
} from "../entities/ExerciseCategory";
import * as exerciseCategoryRepository from "../repositories/exerciseCategory.repository";

const REQUIRED_FIELDS: (keyof CreateExerciseCategoryInput)[] = ["key", "label"];

function assertCreatePayload(
  body: Partial<CreateExerciseCategoryInput>,
): asserts body is CreateExerciseCategoryInput {
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

export async function listExerciseCategories() {
  return exerciseCategoryRepository.findAllExerciseCategories();
}

export async function getExerciseCategoryById(id: string) {
  const category = await exerciseCategoryRepository.findExerciseCategoryById(id);
  if (!category) {
    throw Object.assign(new Error("Categoría no encontrada"), { status: 404 });
  }
  return category;
}

export async function createExerciseCategory(body: Partial<CreateExerciseCategoryInput>) {
  assertCreatePayload(body);

  const existing = await exerciseCategoryRepository.findExerciseCategoryByKey(body.key);
  if (existing) {
    throw Object.assign(new Error("Ya existe una categoría con esa key"), { status: 409 });
  }

  return exerciseCategoryRepository.insertExerciseCategory({
    key: body.key,
    label: body.label,
  });
}

export async function updateExerciseCategory(id: string, body: UpdateExerciseCategoryInput) {
  const current = await exerciseCategoryRepository.findExerciseCategoryById(id);
  if (!current) {
    throw Object.assign(new Error("Categoría no encontrada"), { status: 404 });
  }

  if (body.key && body.key.trim().toLowerCase() !== current.key) {
    const existing = await exerciseCategoryRepository.findExerciseCategoryByKey(body.key);
    if (existing) {
      throw Object.assign(new Error("Ya existe una categoría con esa key"), { status: 409 });
    }
  }

  const updated = await exerciseCategoryRepository.updateExerciseCategoryById(id, body);
  if (!updated) {
    throw Object.assign(new Error("Categoría no encontrada"), { status: 404 });
  }
  return updated;
}

export async function deleteExerciseCategory(id: string) {
  const deleted = await exerciseCategoryRepository.deleteExerciseCategoryById(id);
  if (!deleted) {
    throw Object.assign(new Error("Categoría no encontrada"), { status: 404 });
  }
}
