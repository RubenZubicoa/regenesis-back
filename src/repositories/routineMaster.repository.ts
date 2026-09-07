import { ObjectId, type Collection, type WithId } from "mongodb";

import { database } from "../db/database";
import {
  ROUTINE_MASTER_COLLECTION,
  type CreateRoutineMasterInput,
  type RoutineMaster,
  type UpdateRoutineMasterInput,
} from "../entities/RoutineMaster";

function collection(): Collection<RoutineMaster> {
  return database.collection<RoutineMaster>(ROUTINE_MASTER_COLLECTION);
}

function normalizeExercises(data: CreateRoutineMasterInput | UpdateRoutineMasterInput) {
  if (!data.exercises) return data;
  return {
    ...data,
    exercises: data.exercises.map((exercise) => ({
      ...exercise,
      exerciseId:
        exercise.exerciseId instanceof ObjectId
          ? exercise.exerciseId
          : new ObjectId(String(exercise.exerciseId)),
    })),
  };
}

export async function findAllRoutineMasters(): Promise<WithId<RoutineMaster>[]> {
  return collection().find().sort({ day: 1 }).toArray();
}

export async function findRoutineMasterById(id: string): Promise<WithId<RoutineMaster> | null> {
  if (!ObjectId.isValid(id)) return null;
  return collection().findOne({ _id: new ObjectId(id) });
}

export async function insertRoutineMaster(
  data: CreateRoutineMasterInput,
): Promise<WithId<RoutineMaster>> {
  const normalized = normalizeExercises(data) as CreateRoutineMasterInput;
  const doc: RoutineMaster = {
    ...normalized,
    _id: new ObjectId(),
  };
  await collection().insertOne(doc);
  return doc;
}

export async function updateRoutineMasterById(
  id: string,
  data: UpdateRoutineMasterInput,
): Promise<WithId<RoutineMaster> | null> {
  if (!ObjectId.isValid(id)) return null;

  const update = normalizeExercises(data);

  const result = await collection().findOneAndUpdate(
    { _id: new ObjectId(id) },
    { $set: update },
    { returnDocument: "after" },
  );

  return result ?? null;
}

export async function deleteRoutineMasterById(id: string): Promise<boolean> {
  if (!ObjectId.isValid(id)) return false;
  const result = await collection().deleteOne({ _id: new ObjectId(id) });
  return result.deletedCount === 1;
}
