import { ObjectId, type Collection, type WithId } from "mongodb";

import { database } from "../db/database";
import {
  MEAL_MASTER_COLLECTION,
  type CreateMealMasterInput,
  type MealMaster,
  type UpdateMealMasterInput,
} from "../entities/MealMaster";

function collection(): Collection<MealMaster> {
  return database.collection<MealMaster>(MEAL_MASTER_COLLECTION);
}

export async function findAllMealMasters(): Promise<WithId<MealMaster>[]> {
  return collection().find().sort({ nombre: 1 }).toArray();
}

export async function findMealMasterByNombre(
  nombre: string,
): Promise<WithId<MealMaster> | null> {
  const trimmed = nombre.trim();
  if (!trimmed) return null;
  return collection().findOne({
    nombre: { $regex: `^${trimmed.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, $options: "i" },
  });
}

export async function findMealMasterById(id: string): Promise<WithId<MealMaster> | null> {
  if (!ObjectId.isValid(id)) return null;
  return collection().findOne({ _id: new ObjectId(id) });
}

export async function insertMealMaster(
  data: CreateMealMasterInput,
): Promise<WithId<MealMaster>> {
  const doc: MealMaster = {
    ...data,
    _id: new ObjectId(),
    nombre: data.nombre.trim(),
    descripcion: data.descripcion.trim(),
    slots: data.slots ?? [],
  };
  await collection().insertOne(doc);
  return doc;
}

export async function updateMealMasterById(
  id: string,
  data: UpdateMealMasterInput,
): Promise<WithId<MealMaster> | null> {
  if (!ObjectId.isValid(id)) return null;

  const update: UpdateMealMasterInput = { ...data };
  if (typeof update.nombre === "string") update.nombre = update.nombre.trim();
  if (typeof update.descripcion === "string") update.descripcion = update.descripcion.trim();

  const result = await collection().findOneAndUpdate(
    { _id: new ObjectId(id) },
    { $set: update },
    { returnDocument: "after" },
  );

  return result ?? null;
}

export async function deleteMealMasterById(id: string): Promise<boolean> {
  if (!ObjectId.isValid(id)) return false;
  const result = await collection().deleteOne({ _id: new ObjectId(id) });
  return result.deletedCount === 1;
}
