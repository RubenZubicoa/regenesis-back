import { ObjectId, type Collection, type WithId } from "mongodb";

import { database } from "../db/database";
import {
  WELLNESS_MASTER_COLLECTION,
  type CreateWellnessMasterInput,
  type UpdateWellnessMasterInput,
  type WellnessMaster,
} from "../entities/WellnessMaster";

function collection(): Collection<WellnessMaster> {
  return database.collection<WellnessMaster>(WELLNESS_MASTER_COLLECTION);
}

export async function findAllWellnessMasters(): Promise<WithId<WellnessMaster>[]> {
  return collection().find().sort({ label: 1 }).toArray();
}

export async function findWellnessMasterById(
  id: string,
): Promise<WithId<WellnessMaster> | null> {
  if (!ObjectId.isValid(id)) return null;
  return collection().findOne({ _id: new ObjectId(id) });
}

export async function findWellnessMasterByKey(
  key: string,
): Promise<WithId<WellnessMaster> | null> {
  return collection().findOne({ key: key.trim().toLowerCase() });
}

export async function insertWellnessMaster(
  data: CreateWellnessMasterInput,
): Promise<WithId<WellnessMaster>> {
  const doc: WellnessMaster = {
    ...data,
    _id: new ObjectId(),
    key: data.key.trim().toLowerCase(),
    label: data.label.trim(),
    icon: data.icon.trim(),
    tone: data.tone.trim(),
  };
  await collection().insertOne(doc);
  return doc;
}

export async function updateWellnessMasterById(
  id: string,
  data: UpdateWellnessMasterInput,
): Promise<WithId<WellnessMaster> | null> {
  if (!ObjectId.isValid(id)) return null;

  const update: UpdateWellnessMasterInput = { ...data };
  if (typeof update.key === "string") update.key = update.key.trim().toLowerCase();
  if (typeof update.label === "string") update.label = update.label.trim();
  if (typeof update.icon === "string") update.icon = update.icon.trim();
  if (typeof update.tone === "string") update.tone = update.tone.trim();

  const result = await collection().findOneAndUpdate(
    { _id: new ObjectId(id) },
    { $set: update },
    { returnDocument: "after" },
  );

  return result ?? null;
}

export async function deleteWellnessMasterById(id: string): Promise<boolean> {
  if (!ObjectId.isValid(id)) return false;
  const result = await collection().deleteOne({ _id: new ObjectId(id) });
  return result.deletedCount === 1;
}
