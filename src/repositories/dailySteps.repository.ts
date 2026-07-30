import { ObjectId, type Collection, type Filter, type WithId } from "mongodb";

import { database } from "../db/database";
import {
  DAILY_STEPS_COLLECTION,
  type CreateDailyStepsInput,
  type DailySteps,
  type UpdateDailyStepsInput,
} from "../entities/DailySteps";

function collection(): Collection<DailySteps> {
  return database.collection<DailySteps>(DAILY_STEPS_COLLECTION);
}

export async function findAllDailySteps(
  filter: Filter<DailySteps> = {},
): Promise<WithId<DailySteps>[]> {
  return collection().find(filter).sort({ week: -1 }).toArray();
}

/**
 * Pasos de un cliente.
 * Contempla `clientId` como ObjectId o string (datos antiguos).
 */
export async function findDailyStepsByClient(
  clientId: string,
): Promise<WithId<DailySteps>[]> {
  if (!ObjectId.isValid(clientId)) return [];
  const oid = new ObjectId(clientId);
  return findAllDailySteps({
    $or: [{ clientId: oid }, { clientId: clientId as unknown as ObjectId }],
  });
}

export async function findDailyStepsById(id: string): Promise<WithId<DailySteps> | null> {
  if (!ObjectId.isValid(id)) return null;
  return collection().findOne({ _id: new ObjectId(id) });
}

export async function findDailyStepsByClientAndWeek(
  clientId: string,
  week: number,
): Promise<WithId<DailySteps> | null> {
  if (!ObjectId.isValid(clientId)) return null;
  const oid = new ObjectId(clientId);
  return collection().findOne({
    week,
    $or: [{ clientId: oid }, { clientId: clientId as unknown as ObjectId }],
  });
}

export async function insertDailySteps(
  data: CreateDailyStepsInput,
): Promise<WithId<DailySteps>> {
  const doc: DailySteps = {
    ...data,
    _id: new ObjectId(),
    clientId:
      data.clientId instanceof ObjectId ? data.clientId : new ObjectId(String(data.clientId)),
  };
  await collection().insertOne(doc);
  return doc;
}

export async function updateDailyStepsById(
  id: string,
  data: UpdateDailyStepsInput,
): Promise<WithId<DailySteps> | null> {
  if (!ObjectId.isValid(id)) return null;

  const update: UpdateDailyStepsInput = { ...data };
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

export async function deleteDailyStepsById(id: string): Promise<boolean> {
  if (!ObjectId.isValid(id)) return false;
  const result = await collection().deleteOne({ _id: new ObjectId(id) });
  return result.deletedCount === 1;
}
