import { ObjectId, type Collection, type Filter, type WithId } from "mongodb";

import { database } from "../db/database";
import {
  REVIEW_COLLECTION,
  type CreateReviewInput,
  type Review,
  type UpdateReviewInput,
} from "../entities/Review";

function collection(): Collection<Review> {
  return database.collection<Review>(REVIEW_COLLECTION);
}

export async function findAllReviews(
  filter: Filter<Review> = {},
): Promise<WithId<Review>[]> {
  return collection().find(filter).sort({ date: -1 }).toArray();
}

export async function findReviewsByClient(clientId: string): Promise<WithId<Review>[]> {
  if (!ObjectId.isValid(clientId)) return [];
  const oid = clientId;
  return findAllReviews({
    $or: [{ clientId: oid }, { clientId: new ObjectId(clientId) as unknown as string }],
  });
}

export async function findReviewById(id: string): Promise<WithId<Review> | null> {
  if (!ObjectId.isValid(id)) return null;
  return collection().findOne({ _id: new ObjectId(id) });
}

export async function insertReview(data: CreateReviewInput): Promise<WithId<Review>> {
  const doc: Review = {
    ...data,
    _id: new ObjectId(),
    clientId: String(data.clientId),
  };
  await collection().insertOne(doc);
  return doc;
}

export async function updateReviewById(
  id: string,
  data: UpdateReviewInput,
): Promise<WithId<Review> | null> {
  if (!ObjectId.isValid(id)) return null;

  const update: UpdateReviewInput = { ...data };
  if (update.clientId !== undefined) {
    update.clientId = String(update.clientId);
  }

  const result = await collection().findOneAndUpdate(
    { _id: new ObjectId(id) },
    { $set: update },
    { returnDocument: "after" },
  );

  return result ?? null;
}

export async function deleteReviewById(id: string): Promise<boolean> {
  if (!ObjectId.isValid(id)) return false;
  const result = await collection().deleteOne({ _id: new ObjectId(id) });
  return result.deletedCount === 1;
}
