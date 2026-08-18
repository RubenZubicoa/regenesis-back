import { ObjectId, type Collection, type WithId } from "mongodb";

import { database } from "../db/database";
import {
  PROGRESS_IMAGE_COLLECTION,
  type CreateProgressImageInput,
  type ProgressImage,
  type UpdateProgressImageInput,
} from "../entities/ProgressImage";

function collection(): Collection<ProgressImage> {
  return database.collection<ProgressImage>(PROGRESS_IMAGE_COLLECTION);
}

export async function findImagesByClient(clientId: string): Promise<WithId<ProgressImage>[]> {
  return collection()
    .find({ clientId })
    .sort({ createdAt: -1 })
    .toArray();
}

export async function findImageById(id: string): Promise<WithId<ProgressImage> | null> {
  if (!ObjectId.isValid(id)) return null;
  return collection().findOne({ _id: new ObjectId(id) });
}

export async function insertImage(
  data: CreateProgressImageInput,
): Promise<WithId<ProgressImage>> {
  const doc: ProgressImage = { ...data, _id: new ObjectId() };
  await collection().insertOne(doc);
  return doc;
}

export async function updateImageById(
  id: string,
  data: UpdateProgressImageInput,
): Promise<WithId<ProgressImage> | null> {
  if (!ObjectId.isValid(id)) return null;
  const result = await collection().findOneAndUpdate(
    { _id: new ObjectId(id) },
    { $set: data },
    { returnDocument: "after" },
  );
  return result ?? null;
}

export async function deleteImageById(id: string): Promise<boolean> {
  if (!ObjectId.isValid(id)) return false;
  const result = await collection().deleteOne({ _id: new ObjectId(id) });
  return result.deletedCount === 1;
}
