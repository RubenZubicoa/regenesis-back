import { ObjectId, type Collection, type WithId } from "mongodb";

import { database } from "../db/database";
import {
  EXERCISE_MASTER_COLLECTION,
  type CreateExerciseMasterInput,
  type ExerciseMaster,
  type UpdateExerciseMasterInput,
} from "../entities/ExerciseMaster";

function collection(): Collection<ExerciseMaster> {
  return database.collection<ExerciseMaster>(EXERCISE_MASTER_COLLECTION);
}

export async function findAllExerciseMasters(): Promise<WithId<ExerciseMaster>[]> {
  return collection().find().sort({ name: 1 }).toArray();
}

export async function findExerciseMasterById(
  id: string,
): Promise<WithId<ExerciseMaster> | null> {
  if (!ObjectId.isValid(id)) return null;
  return collection().findOne({ _id: new ObjectId(id) });
}

export async function findExerciseMastersByIds(
  ids: ObjectId[],
): Promise<WithId<ExerciseMaster>[]> {
  if (ids.length === 0) return [];
  return collection()
    .find({ _id: { $in: ids } })
    .toArray();
}

export async function findExerciseMasterByName(
  name: string,
): Promise<WithId<ExerciseMaster> | null> {
  const trimmed = name.trim();
  if (!trimmed) return null;
  return collection().findOne({
    name: { $regex: `^${trimmed.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, $options: "i" },
  });
}

export async function insertExerciseMaster(
  data: CreateExerciseMasterInput,
): Promise<WithId<ExerciseMaster>> {
  const doc: ExerciseMaster = {
    ...data,
    _id: new ObjectId(),
    name: data.name.trim(),
    type: data.type,
    ...(data.imageUrl ? { imageUrl: data.imageUrl.trim() } : {}),
    ...(data.explanation ? { explanation: data.explanation.trim() } : {}),
    ...(data.category ? { category: data.category } : {}),
  };
  await collection().insertOne(doc);
  return doc;
}

export async function insertManyExerciseMasters(
  items: CreateExerciseMasterInput[],
): Promise<WithId<ExerciseMaster>[]> {
  const docs: ExerciseMaster[] = items.map((data) => ({
    ...data,
    _id: new ObjectId(),
    name: data.name.trim(),
    type: data.type,
    ...(data.imageUrl ? { imageUrl: data.imageUrl.trim() } : {}),
    ...(data.explanation ? { explanation: data.explanation.trim() } : {}),
    ...(data.category ? { category: data.category } : {}),
  }));
  if (docs.length === 0) return [];
  await collection().insertMany(docs);
  return docs;
}

export async function updateExerciseMasterById(
  id: string,
  data: UpdateExerciseMasterInput,
): Promise<WithId<ExerciseMaster> | null> {
  if (!ObjectId.isValid(id)) return null;

  const update: UpdateExerciseMasterInput = { ...data };
  if (typeof update.name === "string") update.name = update.name.trim();
  if (typeof update.imageUrl === "string") update.imageUrl = update.imageUrl.trim();
  if (typeof update.explanation === "string") update.explanation = update.explanation.trim();

  const unset: Record<string, ""> = {};
  if ("category" in data && data.category === undefined) {
    delete update.category;
    unset.category = "";
  }

  const result = await collection().findOneAndUpdate(
    { _id: new ObjectId(id) },
    {
      ...(Object.keys(update).length > 0 ? { $set: update } : {}),
      ...(Object.keys(unset).length > 0 ? { $unset: unset } : {}),
    },
    { returnDocument: "after" },
  );

  return result ?? null;
}

export async function deleteExerciseMasterById(id: string): Promise<boolean> {
  if (!ObjectId.isValid(id)) return false;
  const result = await collection().deleteOne({ _id: new ObjectId(id) });
  return result.deletedCount === 1;
}
