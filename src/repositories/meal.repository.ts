import { ObjectId, type Collection, type Filter, type WithId } from "mongodb";

import { database } from "../db/database";
import {
  MEAL_COLLECTION,
  type CreateMealInput,
  type Meal,
  type UpdateMealInput,
} from "../entities/Meal";

function collection(): Collection<Meal> {
  return database.collection<Meal>(MEAL_COLLECTION);
}

export async function findAllMeals(filter: Filter<Meal> = {}): Promise<WithId<Meal>[]> {
  return collection().find(filter).toArray();
}

export async function findMealByClientId(clientId: string): Promise<WithId<Meal> | null> {
  if (!ObjectId.isValid(clientId)) return null;
  const oid = new ObjectId(clientId);
  return collection().findOne({
    $or: [{ clientId: oid }, { clientId: clientId as unknown as ObjectId }],
  });
}

export async function findMealById(id: string): Promise<WithId<Meal> | null> {
  if (!ObjectId.isValid(id)) return null;
  return collection().findOne({ _id: new ObjectId(id) });
}

export async function insertMeal(data: CreateMealInput): Promise<WithId<Meal>> {
  const doc: Meal = {
    ...data,
    _id: new ObjectId(),
    clientId:
      data.clientId instanceof ObjectId ? data.clientId : new ObjectId(String(data.clientId)),
  };
  await collection().insertOne(doc);
  return doc;
}

export async function updateMealById(
  id: string,
  data: UpdateMealInput,
): Promise<WithId<Meal> | null> {
  if (!ObjectId.isValid(id)) return null;

  const update: UpdateMealInput = { ...data };
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

export async function deleteMealById(id: string): Promise<boolean> {
  if (!ObjectId.isValid(id)) return false;
  const result = await collection().deleteOne({ _id: new ObjectId(id) });
  return result.deletedCount === 1;
}
