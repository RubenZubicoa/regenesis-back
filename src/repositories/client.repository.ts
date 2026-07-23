import { ObjectId, type Collection, type WithId } from "mongodb";

import { database } from "../db/database";
import {
  CLIENT_COLLECTION,
  type Client,
  type CreateClientInput,
  type UpdateClientInput,
} from "../entities/Client";

function collection(): Collection<Client> {
  return database.collection<Client>(CLIENT_COLLECTION);
}

export async function findAllClients(): Promise<WithId<Client>[]> {
  return collection().find().sort({ fullName: 1 }).toArray();
}

export async function findClientById(id: string): Promise<WithId<Client> | null> {
  if (!ObjectId.isValid(id)) return null;
  return collection().findOne({ _id: new ObjectId(id) });
}

export async function findClientByEmail(email: string): Promise<WithId<Client> | null> {
  return collection().findOne({ email: email.trim().toLowerCase() });
}

export async function insertClient(data: CreateClientInput): Promise<WithId<Client>> {
  const doc: Client = {
    ...data,
    _id: new ObjectId(),
    email: data.email.trim().toLowerCase(),
  };
  await collection().insertOne(doc);
  return doc;
}

export async function updateClientById(
  id: string,
  data: UpdateClientInput,
): Promise<WithId<Client> | null> {
  if (!ObjectId.isValid(id)) return null;

  const update: UpdateClientInput = { ...data };
  if (typeof update.email === "string") {
    update.email = update.email.trim().toLowerCase();
  }

  const result = await collection().findOneAndUpdate(
    { _id: new ObjectId(id) },
    { $set: update },
    { returnDocument: "after" },
  );

  return result ?? null;
}

export async function deleteClientById(id: string): Promise<boolean> {
  if (!ObjectId.isValid(id)) return false;
  const result = await collection().deleteOne({ _id: new ObjectId(id) });
  return result.deletedCount === 1;
}
