import { ObjectId, type Collection, type Filter, type WithId } from "mongodb";

import { database } from "../db/database";
import {
  WELLNESS_COLLECTION,
  type CreateWellnessInput,
  type UpdateWellnessInput,
  type Wellness,
} from "../entities/Wellness";

function collection(): Collection<Wellness> {
  return database.collection<Wellness>(WELLNESS_COLLECTION);
}

export async function findAllWellness(
  filter: Filter<Wellness> = {},
): Promise<WithId<Wellness>[]> {
  return collection().find(filter).sort({ date: -1 }).toArray();
}

export async function findWellnessByClient(
  clientId: string,
): Promise<WithId<Wellness>[]> {
  if (!ObjectId.isValid(clientId)) return [];
  const oid = new ObjectId(clientId);
  /** Contempla `clientId` como ObjectId o string (datos antiguos). */
  return findAllWellness({
    $or: [{ clientId: oid }, { clientId: clientId as unknown as ObjectId }],
  });
}

/**
 * Corrige registros antiguos: `wellnessId` string ("well-energia" / "energia") → ObjectId,
 * y añade `date` si falta.
 */
export async function migrateWellnessRefs(
  resolveMasterId: (key: string) => ObjectId | null,
): Promise<number> {
  const docs = await collection().find({}).toArray();
  let updated = 0;

  for (const doc of docs) {
    const patch: Partial<Wellness> = {};
    const wellnessIdRaw = doc.wellnessId as unknown;
    const clientIdRaw = doc.clientId as unknown;

    if (typeof wellnessIdRaw === "string") {
      const key = wellnessIdRaw.startsWith("well-") ? wellnessIdRaw.slice(5) : wellnessIdRaw;
      const masterId = resolveMasterId(key);
      if (masterId) patch.wellnessId = masterId;
    }

    if (typeof clientIdRaw === "string" && ObjectId.isValid(clientIdRaw)) {
      patch.clientId = new ObjectId(clientIdRaw);
    }

    if (!doc.date) {
      patch.date = new Date("2026-07-20");
    }

    if (Object.keys(patch).length === 0) continue;
    await collection().updateOne({ _id: doc._id }, { $set: patch });
    updated += 1;
  }

  return updated;
}

export async function findWellnessById(id: string): Promise<WithId<Wellness> | null> {
  if (!ObjectId.isValid(id)) return null;
  return collection().findOne({ _id: new ObjectId(id) });
}

export async function insertWellness(data: CreateWellnessInput): Promise<WithId<Wellness>> {
  const doc: Wellness = {
    ...data,
    _id: new ObjectId(),
    clientId: data.clientId instanceof ObjectId ? data.clientId : new ObjectId(String(data.clientId)),
    wellnessId:
      data.wellnessId instanceof ObjectId
        ? data.wellnessId
        : new ObjectId(String(data.wellnessId)),
    date: data.date instanceof Date ? data.date : new Date(data.date),
  };
  await collection().insertOne(doc);
  return doc;
}

export async function updateWellnessById(
  id: string,
  data: UpdateWellnessInput,
): Promise<WithId<Wellness> | null> {
  if (!ObjectId.isValid(id)) return null;

  const update: UpdateWellnessInput = { ...data };
  if (update.clientId !== undefined && !(update.clientId instanceof ObjectId)) {
    update.clientId = new ObjectId(String(update.clientId));
  }
  if (update.wellnessId !== undefined && !(update.wellnessId instanceof ObjectId)) {
    update.wellnessId = new ObjectId(String(update.wellnessId));
  }
  if (update.date !== undefined && !(update.date instanceof Date)) {
    update.date = new Date(update.date);
  }

  const result = await collection().findOneAndUpdate(
    { _id: new ObjectId(id) },
    { $set: update },
    { returnDocument: "after" },
  );

  return result ?? null;
}

export async function deleteWellnessById(id: string): Promise<boolean> {
  if (!ObjectId.isValid(id)) return false;
  const result = await collection().deleteOne({ _id: new ObjectId(id) });
  return result.deletedCount === 1;
}
