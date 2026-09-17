import { ObjectId, type Collection, type WithId } from "mongodb";

import { database } from "../db/database";
import {
  TRAINER_COLLECTION,
  type CreateTrainerInput,
  type Trainer,
} from "../entities/Trainer";

function collection(): Collection<Trainer> {
  return database.collection<Trainer>(TRAINER_COLLECTION);
}

export async function findAllTrainers(): Promise<WithId<Trainer>[]> {
  return collection().find().sort({ email: 1 }).toArray();
}

export async function findTrainerById(id: string): Promise<WithId<Trainer> | null> {
  if (!ObjectId.isValid(id)) return null;
  return collection().findOne({ _id: new ObjectId(id) });
}

export async function findTrainerByEmail(email: string): Promise<WithId<Trainer> | null> {
  return collection().findOne({ email: email.trim().toLowerCase() });
}

export async function insertTrainer(data: CreateTrainerInput): Promise<WithId<Trainer>> {
  const doc: Trainer = {
    ...data,
    _id: new ObjectId(),
    email: data.email.trim().toLowerCase(),
  };
  await collection().insertOne(doc);
  return doc;
}
