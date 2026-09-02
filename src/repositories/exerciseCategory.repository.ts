import { ObjectId, type Collection, type WithId } from "mongodb";

import { database } from "../db/database";
import {
  EXERCISE_CATEGORY_COLLECTION,
  type CreateExerciseCategoryInput,
  type ExerciseCategory,
  type UpdateExerciseCategoryInput,
} from "../entities/ExerciseCategory";

function collection(): Collection<ExerciseCategory> {
  return database.collection<ExerciseCategory>(EXERCISE_CATEGORY_COLLECTION);
}

export async function findAllExerciseCategories(): Promise<WithId<ExerciseCategory>[]> {
  return collection().find().sort({ label: 1 }).toArray();
}

export async function findExerciseCategoryById(
  id: string,
): Promise<WithId<ExerciseCategory> | null> {
  if (!ObjectId.isValid(id)) return null;
  return collection().findOne({ _id: new ObjectId(id) });
}

export async function findExerciseCategoryByKey(
  key: string,
): Promise<WithId<ExerciseCategory> | null> {
  const trimmed = key.trim();
  if (!trimmed) return null;
  return collection().findOne({ key: trimmed.toLowerCase() });
}

export async function findExerciseCategoriesByIds(
  ids: Array<string | ObjectId>,
): Promise<WithId<ExerciseCategory>[]> {
  const objectIds = ids
    .map((id) => (id instanceof ObjectId ? id : ObjectId.isValid(id) ? new ObjectId(id) : null))
    .filter((id): id is ObjectId => id !== null);

  if (objectIds.length === 0) return [];
  return collection()
    .find({ _id: { $in: objectIds } })
    .toArray();
}

export async function insertExerciseCategory(
  data: CreateExerciseCategoryInput,
): Promise<WithId<ExerciseCategory>> {
  const doc: ExerciseCategory = {
    ...data,
    _id: new ObjectId(),
    key: data.key.trim().toLowerCase(),
    label: data.label.trim(),
  };
  await collection().insertOne(doc);
  return doc;
}

export async function updateExerciseCategoryById(
  id: string,
  data: UpdateExerciseCategoryInput,
): Promise<WithId<ExerciseCategory> | null> {
  if (!ObjectId.isValid(id)) return null;

  const update: UpdateExerciseCategoryInput = { ...data };
  if (typeof update.key === "string") update.key = update.key.trim().toLowerCase();
  if (typeof update.label === "string") update.label = update.label.trim();

  const result = await collection().findOneAndUpdate(
    { _id: new ObjectId(id) },
    { $set: update },
    { returnDocument: "after" },
  );

  return result ?? null;
}

export async function deleteExerciseCategoryById(id: string): Promise<boolean> {
  if (!ObjectId.isValid(id)) return false;
  const result = await collection().deleteOne({ _id: new ObjectId(id) });
  return result.deletedCount === 1;
}
