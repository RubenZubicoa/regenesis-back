import { ObjectId, type Collection, type Filter, type WithId } from "mongodb";

import { database } from "../db/database";
import {
  WORKOUT_HISTORY_COLLECTION,
  type CreateWorkoutHistoryInput,
  type UpdateWorkoutHistoryInput,
  type WorkoutHistory,
} from "../entities/WorkoutHistory";

function collection(): Collection<WorkoutHistory> {
  return database.collection<WorkoutHistory>(WORKOUT_HISTORY_COLLECTION);
}

export async function findAllWorkoutHistory(
  filter: Filter<WorkoutHistory> = {},
): Promise<WithId<WorkoutHistory>[]> {
  return collection().find(filter).sort({ week: -1 }).toArray();
}

/**
 * Histórico de un cliente.
 * Contempla `clientId` como ObjectId o string (datos antiguos).
 */
export async function findWorkoutHistoryByClient(
  clientId: string,
): Promise<WithId<WorkoutHistory>[]> {
  if (!ObjectId.isValid(clientId)) return [];
  const oid = new ObjectId(clientId);
  return findAllWorkoutHistory({
    $or: [{ clientId: oid }, { clientId: clientId as unknown as ObjectId }],
  });
}

export async function findWorkoutHistoryById(
  id: string,
): Promise<WithId<WorkoutHistory> | null> {
  if (!ObjectId.isValid(id)) return null;
  return collection().findOne({ _id: new ObjectId(id) });
}

export async function insertWorkoutHistory(
  data: CreateWorkoutHistoryInput,
): Promise<WithId<WorkoutHistory>> {
  const doc: WorkoutHistory = {
    ...data,
    _id: new ObjectId(),
    clientId:
      data.clientId instanceof ObjectId ? data.clientId : new ObjectId(String(data.clientId)),
  };
  await collection().insertOne(doc);
  return doc;
}

export async function insertManyWorkoutHistory(
  items: CreateWorkoutHistoryInput[],
): Promise<WithId<WorkoutHistory>[]> {
  const docs: WorkoutHistory[] = items.map((data) => ({
    ...data,
    _id: new ObjectId(),
    clientId:
      data.clientId instanceof ObjectId ? data.clientId : new ObjectId(String(data.clientId)),
  }));
  if (docs.length === 0) return [];
  await collection().insertMany(docs);
  return docs;
}

export async function updateWorkoutHistoryById(
  id: string,
  data: UpdateWorkoutHistoryInput,
): Promise<WithId<WorkoutHistory> | null> {
  if (!ObjectId.isValid(id)) return null;

  const update: UpdateWorkoutHistoryInput = { ...data };
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

export async function deleteWorkoutHistoryById(id: string): Promise<boolean> {
  if (!ObjectId.isValid(id)) return false;
  const result = await collection().deleteOne({ _id: new ObjectId(id) });
  return result.deletedCount === 1;
}
