import { ObjectId, type Collection, type Filter, type WithId } from "mongodb";

import { database } from "../db/database";
import {
  ROUTINE_DAY_COLLECTION,
  type CreateRoutineDayInput,
  type RoutineDay,
  type UpdateRoutineDayInput,
} from "../entities/RoutineDay";

function collection(): Collection<RoutineDay> {
  return database.collection<RoutineDay>(ROUTINE_DAY_COLLECTION);
}

export async function findAllRoutineDays(
  filter: Filter<RoutineDay> = {},
): Promise<WithId<RoutineDay>[]> {
  return collection().find(filter).toArray();
}

/**
 * Días de rutina de un cliente.
 * Contempla `clientId` como ObjectId o string (datos antiguos).
 */
export async function findRoutineDaysByClient(
  clientId: string,
): Promise<WithId<RoutineDay>[]> {
  if (!ObjectId.isValid(clientId)) return [];
  const oid = new ObjectId(clientId);
  return findAllRoutineDays({
    $or: [{ clientId: oid }, { clientId: clientId as unknown as ObjectId }],
  });
}

export async function findRoutineDayById(id: string): Promise<WithId<RoutineDay> | null> {
  if (!ObjectId.isValid(id)) return null;
  return collection().findOne({ _id: new ObjectId(id) });
}

export async function insertRoutineDay(
  data: CreateRoutineDayInput,
): Promise<WithId<RoutineDay>> {
  const doc: RoutineDay = {
    ...data,
    _id: new ObjectId(),
    clientId:
      data.clientId instanceof ObjectId ? data.clientId : new ObjectId(String(data.clientId)),
  };
  await collection().insertOne(doc);
  return doc;
}

export async function insertManyRoutineDays(
  items: CreateRoutineDayInput[],
): Promise<WithId<RoutineDay>[]> {
  const docs: RoutineDay[] = items.map((data) => ({
    ...data,
    _id: new ObjectId(),
    clientId:
      data.clientId instanceof ObjectId ? data.clientId : new ObjectId(String(data.clientId)),
  }));
  if (docs.length === 0) return [];
  await collection().insertMany(docs);
  return docs;
}

export async function updateRoutineDayById(
  id: string,
  data: UpdateRoutineDayInput,
): Promise<WithId<RoutineDay> | null> {
  if (!ObjectId.isValid(id)) return null;

  const update: UpdateRoutineDayInput = { ...data };
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

export async function deleteRoutineDayById(id: string): Promise<boolean> {
  if (!ObjectId.isValid(id)) return false;
  const result = await collection().deleteOne({ _id: new ObjectId(id) });
  return result.deletedCount === 1;
}
