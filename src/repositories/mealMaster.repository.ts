import { ObjectId, type Collection, type WithId } from "mongodb";

import { database } from "../db/database";
import {
  MEAL_MASTER_COLLECTION,
  type CreateMealMasterInput,
  type MealMaster,
  type UpdateMealMasterInput,
} from "../entities/MealMaster";

function collection(): Collection<MealMaster> {
  return database.collection<MealMaster>(MEAL_MASTER_COLLECTION);
}

export async function findAllMealMasters(): Promise<WithId<MealMaster>[]> {
  return collection().find().toArray();
}

export async function findMealMasterById(id: string): Promise<WithId<MealMaster> | null> {
  if (!ObjectId.isValid(id)) return null;
  return collection().findOne({ _id: new ObjectId(id) });
}

export async function insertMealMaster(
  data: CreateMealMasterInput,
): Promise<WithId<MealMaster>> {
  const doc: MealMaster = {
    ...data,
    _id: new ObjectId(),
    slots: data.slots ?? [],
  };
  await collection().insertOne(doc);
  return doc;
}

export async function updateMealMasterById(
  id: string,
  data: UpdateMealMasterInput,
): Promise<WithId<MealMaster> | null> {
  if (!ObjectId.isValid(id)) return null;

  const result = await collection().findOneAndUpdate(
    { _id: new ObjectId(id) },
    { $set: data },
    { returnDocument: "after" },
  );

  return result ?? null;
}

export async function deleteMealMasterById(id: string): Promise<boolean> {
  if (!ObjectId.isValid(id)) return false;
  const result = await collection().deleteOne({ _id: new ObjectId(id) });
  return result.deletedCount === 1;
}
