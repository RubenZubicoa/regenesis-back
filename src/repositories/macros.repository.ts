import { ObjectId, type Collection, type Filter, type WithId } from "mongodb";

import { database } from "../db/database";
import {
  MACROS_COLLECTION,
  type CreateMacrosInput,
  type Macros,
  type UpdateMacrosInput,
} from "../entities/Macros";

function collection(): Collection<Macros> {
  return database.collection<Macros>(MACROS_COLLECTION);
}

export async function findAllMacros(filter: Filter<Macros> = {}): Promise<WithId<Macros>[]> {
  return collection().find(filter).toArray();
}

/**
 * Macros de un cliente.
 * Contempla `clientId` como ObjectId o string (datos antiguos).
 */
export async function findMacrosByClientId(clientId: string): Promise<WithId<Macros> | null> {
  if (!ObjectId.isValid(clientId)) return null;
  const oid = new ObjectId(clientId);
  return collection().findOne({
    $or: [{ clientId: oid }, { clientId: clientId as unknown as ObjectId }],
  });
}

export async function findMacrosById(id: string): Promise<WithId<Macros> | null> {
  if (!ObjectId.isValid(id)) return null;
  return collection().findOne({ _id: new ObjectId(id) });
}

export async function insertMacros(data: CreateMacrosInput): Promise<WithId<Macros>> {
  const doc: Macros = {
    ...data,
    _id: new ObjectId(),
    clientId:
      data.clientId instanceof ObjectId ? data.clientId : new ObjectId(String(data.clientId)),
  };
  await collection().insertOne(doc);
  return doc;
}

export async function updateMacrosById(
  id: string,
  data: UpdateMacrosInput,
): Promise<WithId<Macros> | null> {
  if (!ObjectId.isValid(id)) return null;

  const update: UpdateMacrosInput = { ...data };
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

export async function deleteMacrosById(id: string): Promise<boolean> {
  if (!ObjectId.isValid(id)) return false;
  const result = await collection().deleteOne({ _id: new ObjectId(id) });
  return result.deletedCount === 1;
}
