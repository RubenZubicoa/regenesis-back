import { ObjectId, type Collection, type Filter, type WithId } from "mongodb";

import { database } from "../db/database";
import {
  WEIGHT_COLLECTION,
  type CreateWeightInput,
  type UpdateWeightInput,
  type Weight,
} from "../entities/Weight";

function collection(): Collection<Weight> {
  return database.collection<Weight>(WEIGHT_COLLECTION);
}

export async function findAllWeights(filter: Filter<Weight> = {}): Promise<WithId<Weight>[]> {
  return collection().find(filter).toArray();
}

/**
 * Serie de peso de un cliente.
 * Contempla `clientId` como ObjectId o string (datos antiguos).
 */
export async function findWeightByClientId(clientId: string): Promise<WithId<Weight> | null> {
  if (!ObjectId.isValid(clientId)) return null;
  const oid = new ObjectId(clientId);
  return collection().findOne({
    $or: [{ clientId: oid }, { clientId: clientId as unknown as ObjectId }],
  });
}

export async function findWeightById(id: string): Promise<WithId<Weight> | null> {
  if (!ObjectId.isValid(id)) return null;
  return collection().findOne({ _id: new ObjectId(id) });
}

export async function insertWeight(data: CreateWeightInput): Promise<WithId<Weight>> {
  const doc: Weight = {
    ...data,
    _id: new ObjectId(),
    clientId:
      data.clientId instanceof ObjectId ? data.clientId : new ObjectId(String(data.clientId)),
  };
  await collection().insertOne(doc);
  return doc;
}

export async function updateWeightById(
  id: string,
  data: UpdateWeightInput,
): Promise<WithId<Weight> | null> {
  if (!ObjectId.isValid(id)) return null;

  const update: UpdateWeightInput = { ...data };
  if (update.clientId !== undefined && !(update.clientId instanceof ObjectId)) {
    update.clientId = new ObjectId(String(update.clientId));
  }

  const result = await collection().findOneAndUpdate(
    { _id: new ObjectId(id) },
    { $set: update },
    { returnDocument: "after" },
  );

  return result ?? null;
}

export async function deleteWeightById(id: string): Promise<boolean> {
  if (!ObjectId.isValid(id)) return false;
  const result = await collection().deleteOne({ _id: new ObjectId(id) });
  return result.deletedCount === 1;
}
