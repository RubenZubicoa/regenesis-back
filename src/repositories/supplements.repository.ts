import { ObjectId, type Collection, type Filter, type WithId } from "mongodb";

import { database } from "../db/database";
import {
  SUPPLEMENTS_COLLECTION,
  type CreateSupplementsInput,
  type Supplements,
  type UpdateSupplementsInput,
} from "../entities/Supplements";

function collection(): Collection<Supplements> {
  return database.collection<Supplements>(SUPPLEMENTS_COLLECTION);
}

export async function findAllSupplements(
  filter: Filter<Supplements> = {},
): Promise<WithId<Supplements>[]> {
  return collection().find(filter).toArray();
}

/**
 * Suplementos de un cliente.
 * Contempla `clientId` como ObjectId o string (datos antiguos).
 */
export async function findSupplementsByClientId(
  clientId: string,
): Promise<WithId<Supplements> | null> {
  if (!ObjectId.isValid(clientId)) return null;
  const oid = new ObjectId(clientId);
  return collection().findOne({
    $or: [{ clientId: oid }, { clientId: clientId as unknown as ObjectId }],
  });
}

export async function findSupplementsById(id: string): Promise<WithId<Supplements> | null> {
  if (!ObjectId.isValid(id)) return null;
  return collection().findOne({ _id: new ObjectId(id) });
}

export async function insertSupplements(
  data: CreateSupplementsInput,
): Promise<WithId<Supplements>> {
  const doc: Supplements = {
    ...data,
    _id: new ObjectId(),
    clientId:
      data.clientId instanceof ObjectId ? data.clientId : new ObjectId(String(data.clientId)),
  };
  await collection().insertOne(doc);
  return doc;
}

export async function updateSupplementsById(
  id: string,
  data: UpdateSupplementsInput,
): Promise<WithId<Supplements> | null> {
  if (!ObjectId.isValid(id)) return null;

  const update: UpdateSupplementsInput = { ...data };
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

export async function deleteSupplementsById(id: string): Promise<boolean> {
  if (!ObjectId.isValid(id)) return false;
  const result = await collection().deleteOne({ _id: new ObjectId(id) });
  return result.deletedCount === 1;
}
