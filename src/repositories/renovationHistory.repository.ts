import { ObjectId, type Collection, type WithId } from "mongodb";

import { database } from "../db/database";
import {
  RENOVATION_HISTORY_COLLECTION,
  type CreateRenovationHistoryInput,
  type RenovationHistory,
} from "../entities/RenovationHistory";

function collection(): Collection<RenovationHistory> {
  return database.collection<RenovationHistory>(RENOVATION_HISTORY_COLLECTION);
}

export async function insertRenovationHistory(
  data: CreateRenovationHistoryInput,
): Promise<WithId<RenovationHistory>> {
  const doc: RenovationHistory = {
    ...data,
    _id: new ObjectId(),
    clientId: String(data.clientId),
  };
  await collection().insertOne(doc);
  return doc;
}
