import { ObjectId, type Collection, type WithId } from "mongodb";

import { database } from "../db/database";
import {
  TECHNICAL_SPECIFICATIONS_COLLECTION,
  type CreateTechnicalSpecificationsInput,
  type TechnicalSpecifications,
  type UpdateTechnicalSpecificationsInput,
} from "../entities/TechnicalSpecifications";

function collection(): Collection<TechnicalSpecifications> {
  return database.collection<TechnicalSpecifications>(TECHNICAL_SPECIFICATIONS_COLLECTION);
}

export async function findSpecByClientId(
  clientId: string,
): Promise<WithId<TechnicalSpecifications> | null> {
  if (!clientId.trim()) return null;
  return collection().findOne({ clientId: clientId.trim() });
}

export async function findSpecById(id: string): Promise<WithId<TechnicalSpecifications> | null> {
  if (!ObjectId.isValid(id)) return null;
  return collection().findOne({ _id: new ObjectId(id) });
}

export async function insertSpec(
  data: CreateTechnicalSpecificationsInput,
): Promise<WithId<TechnicalSpecifications>> {
  const now = new Date();
  const doc: TechnicalSpecifications = {
    ...data,
    _id: new ObjectId(),
    clientId: String(data.clientId).trim(),
    createdAt: data.createdAt ?? now,
    updatedAt: data.updatedAt ?? now,
  };
  await collection().insertOne(doc);
  return doc;
}

export async function updateSpecById(
  id: string,
  data: UpdateTechnicalSpecificationsInput,
): Promise<WithId<TechnicalSpecifications> | null> {
  if (!ObjectId.isValid(id)) return null;

  const update: UpdateTechnicalSpecificationsInput = { ...data };
  if (typeof update.clientId === "string") update.clientId = update.clientId.trim();
  update.updatedAt = new Date();

  const result = await collection().findOneAndUpdate(
    { _id: new ObjectId(id) },
    { $set: update },
    { returnDocument: "after" },
  );

  return result ?? null;
}

export async function deleteSpecById(id: string): Promise<boolean> {
  if (!ObjectId.isValid(id)) return false;
  const result = await collection().deleteOne({ _id: new ObjectId(id) });
  return result.deletedCount === 1;
}
