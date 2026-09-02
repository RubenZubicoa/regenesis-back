import { ObjectId, type Collection, type WithId } from "mongodb";

import { database } from "../db/database";
import type { ExerciseCategory } from "../entities/ExerciseCategory";
import {
  EXERCISE_MASTER_COLLECTION,
  type CreateExerciseMasterInput,
  type ExerciseMaster,
  type UpdateExerciseMasterInput,
} from "../entities/ExerciseMaster";
import * as exerciseCategoryRepository from "./exerciseCategory.repository";

/** En Mongo, `category` puede ser ObjectId o el documento embebido. */
type ExerciseMasterStored = Omit<ExerciseMaster, "category"> & {
  category?: ObjectId | ExerciseCategory;
};

function collection(): Collection<ExerciseMasterStored> {
  return database.collection<ExerciseMasterStored>(EXERCISE_MASTER_COLLECTION);
}

function extractCategoryId(category: unknown): ObjectId | null {
  if (!category) return null;
  if (category instanceof ObjectId) return category;
  if (typeof category === "string" && ObjectId.isValid(category)) return new ObjectId(category);
  if (typeof category === "object" && category !== null && "_id" in category) {
    const id = (category as { _id: unknown })._id;
    if (id instanceof ObjectId) return id;
    if (typeof id === "string" && ObjectId.isValid(id)) return new ObjectId(id);
  }
  return null;
}

function toCategoryRef(category: ExerciseCategory | undefined): ObjectId | undefined {
  const id = extractCategoryId(category);
  return id ?? undefined;
}

async function hydrateCategories(
  masters: WithId<ExerciseMasterStored>[],
): Promise<WithId<ExerciseMaster>[]> {
  const ids = masters
    .map((master) => extractCategoryId(master.category))
    .filter((id): id is ObjectId => id !== null);

  const uniqueIds = [...new Map(ids.map((id) => [id.toHexString(), id])).values()];
  const categories =
    uniqueIds.length > 0
      ? await exerciseCategoryRepository.findExerciseCategoriesByIds(uniqueIds)
      : [];
  const byId = new Map(categories.map((category) => [category._id.toHexString(), category]));

  return masters.map((master) => {
    const id = extractCategoryId(master.category);
    const category = id ? byId.get(id.toHexString()) : undefined;
    const { category: _stored, ...rest } = master;
    return {
      ...rest,
      ...(category ? { category } : {}),
    } as WithId<ExerciseMaster>;
  });
}

async function hydrateCategory(
  master: WithId<ExerciseMasterStored> | null,
): Promise<WithId<ExerciseMaster> | null> {
  if (!master) return null;
  const [hydrated] = await hydrateCategories([master]);
  return hydrated;
}

export async function findAllExerciseMasters(): Promise<WithId<ExerciseMaster>[]> {
  const masters = await collection().find().sort({ name: 1 }).toArray();
  return hydrateCategories(masters);
}

export async function findExerciseMasterById(
  id: string,
): Promise<WithId<ExerciseMaster> | null> {
  if (!ObjectId.isValid(id)) return null;
  const master = await collection().findOne({ _id: new ObjectId(id) });
  return hydrateCategory(master);
}

export async function findExerciseMastersByIds(
  ids: ObjectId[],
): Promise<WithId<ExerciseMaster>[]> {
  if (ids.length === 0) return [];
  const masters = await collection()
    .find({ _id: { $in: ids } })
    .toArray();
  return hydrateCategories(masters);
}

export async function findExerciseMasterByName(
  name: string,
): Promise<WithId<ExerciseMaster> | null> {
  const trimmed = name.trim();
  if (!trimmed) return null;
  const master = await collection().findOne({
    name: { $regex: `^${trimmed.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, $options: "i" },
  });
  return hydrateCategory(master);
}

export async function insertExerciseMaster(
  data: CreateExerciseMasterInput,
): Promise<WithId<ExerciseMaster>> {
  const { category: _category, ...rest } = data;
  const categoryRef = toCategoryRef(_category);
  const doc: ExerciseMasterStored = {
    ...rest,
    _id: new ObjectId(),
    name: data.name.trim(),
    type: data.type,
    ...(data.imageUrl ? { imageUrl: data.imageUrl.trim() } : {}),
    ...(data.explanation ? { explanation: data.explanation.trim() } : {}),
    ...(categoryRef ? { category: categoryRef } : {}),
  };
  await collection().insertOne(doc);
  const [hydrated] = await hydrateCategories([doc as WithId<ExerciseMasterStored>]);
  return hydrated;
}

export async function insertManyExerciseMasters(
  items: CreateExerciseMasterInput[],
): Promise<WithId<ExerciseMaster>[]> {
  const docs: ExerciseMasterStored[] = items.map((data) => {
    const { category: _category, ...rest } = data;
    const categoryRef = toCategoryRef(_category);
    return {
      ...rest,
      _id: new ObjectId(),
      name: data.name.trim(),
      type: data.type,
      ...(data.imageUrl ? { imageUrl: data.imageUrl.trim() } : {}),
      ...(data.explanation ? { explanation: data.explanation.trim() } : {}),
      ...(categoryRef ? { category: categoryRef } : {}),
    };
  });
  if (docs.length === 0) return [];
  await collection().insertMany(docs);
  return hydrateCategories(docs as WithId<ExerciseMasterStored>[]);
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
  const set: Record<string, unknown> = { ...update };

  if ("category" in data) {
    delete set.category;
    if (data.category === undefined) {
      unset.category = "";
    } else {
      const categoryRef = toCategoryRef(data.category);
      if (categoryRef) set.category = categoryRef;
      else unset.category = "";
    }
  }

  const result = await collection().findOneAndUpdate(
    { _id: new ObjectId(id) },
    {
      ...(Object.keys(set).length > 0 ? { $set: set } : {}),
      ...(Object.keys(unset).length > 0 ? { $unset: unset } : {}),
    },
    { returnDocument: "after" },
  );

  return hydrateCategory(result ?? null);
}

export async function deleteExerciseMasterById(id: string): Promise<boolean> {
  if (!ObjectId.isValid(id)) return false;
  const result = await collection().deleteOne({ _id: new ObjectId(id) });
  return result.deletedCount === 1;
}
