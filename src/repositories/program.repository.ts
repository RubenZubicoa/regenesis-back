import { ObjectId, type Collection, type WithId } from "mongodb";

import { database } from "../db/database";
import {
  PROGRAM_COLLECTION,
  type CreateProgramInput,
  type Program,
  type UpdateProgramInput,
} from "../entities/Program";

function collection(): Collection<Program> {
  return database.collection<Program>(PROGRAM_COLLECTION);
}

export async function findAllPrograms(): Promise<WithId<Program>[]> {
  return collection().find().sort({ name: 1 }).toArray();
}

export async function findProgramById(id: string): Promise<WithId<Program> | null> {
  if (!ObjectId.isValid(id)) return null;
  return collection().findOne({ _id: new ObjectId(id) });
}

export async function findProgramByName(name: string): Promise<WithId<Program> | null> {
  return collection().findOne({ name: name.trim() });
}

export async function insertProgram(data: CreateProgramInput): Promise<WithId<Program>> {
  const doc: Program = {
    ...data,
    _id: new ObjectId(),
    name: data.name.trim(),
    description: data.description.trim(),
  };
  await collection().insertOne(doc);
  return doc;
}

export async function updateProgramById(
  id: string,
  data: UpdateProgramInput,
): Promise<WithId<Program> | null> {
  if (!ObjectId.isValid(id)) return null;

  const update: UpdateProgramInput = { ...data };
  if (typeof update.name === "string") update.name = update.name.trim();
  if (typeof update.description === "string") update.description = update.description.trim();

  const result = await collection().findOneAndUpdate(
    { _id: new ObjectId(id) },
    { $set: update },
    { returnDocument: "after" },
  );

  return result ?? null;
}

export async function deleteProgramById(id: string): Promise<boolean> {
  if (!ObjectId.isValid(id)) return false;
  const result = await collection().deleteOne({ _id: new ObjectId(id) });
  return result.deletedCount === 1;
}
