import { ObjectId, type Collection, type Filter, type WithId } from "mongodb";

import { database } from "../db/database";
import {
  MEASUREMENT_COLLECTION,
  type CreateMeasurementInput,
  type Measurement,
  type UpdateMeasurementInput,
} from "../entities/Measurement";

function collection(): Collection<Measurement> {
  return database.collection<Measurement>(MEASUREMENT_COLLECTION);
}

export async function findAllMeasurements(
  filter: Filter<Measurement> = {},
): Promise<WithId<Measurement>[]> {
  return collection().find(filter).sort({ date: -1 }).toArray();
}

/**
 * Busca por cliente. En datos antiguos `client` puede ser string;
 * en los nuevos es ObjectId. Se contemplan ambos.
 */
export async function findMeasurementsByClient(
  clientId: string,
): Promise<WithId<Measurement>[]> {
  if (!ObjectId.isValid(clientId)) return [];
  const oid = new ObjectId(clientId);
  return findAllMeasurements({
    $or: [{ client: oid }, { client: clientId as unknown as ObjectId }],
  });
}

export async function findMeasurementById(id: string): Promise<WithId<Measurement> | null> {
  if (!ObjectId.isValid(id)) return null;
  return collection().findOne({ _id: new ObjectId(id) });
}

export async function insertMeasurement(
  data: CreateMeasurementInput,
): Promise<WithId<Measurement>> {
  const doc: Measurement = {
    ...data,
    _id: new ObjectId(),
    client: data.client instanceof ObjectId ? data.client : new ObjectId(String(data.client)),
    MeasurementId:
      data.MeasurementId instanceof ObjectId
        ? data.MeasurementId
        : new ObjectId(String(data.MeasurementId)),
  };
  await collection().insertOne(doc);
  return doc;
}

export async function updateMeasurementById(
  id: string,
  data: UpdateMeasurementInput,
): Promise<WithId<Measurement> | null> {
  if (!ObjectId.isValid(id)) return null;

  const update: UpdateMeasurementInput = { ...data };
  if (update.client !== undefined && !(update.client instanceof ObjectId)) {
    update.client = new ObjectId(String(update.client));
  }
  if (update.MeasurementId !== undefined && !(update.MeasurementId instanceof ObjectId)) {
    update.MeasurementId = new ObjectId(String(update.MeasurementId));
  }

  const result = await collection().findOneAndUpdate(
    { _id: new ObjectId(id) },
    { $set: update },
    { returnDocument: "after" },
  );

  return result ?? null;
}

export async function deleteMeasurementById(id: string): Promise<boolean> {
  if (!ObjectId.isValid(id)) return false;
  const result = await collection().deleteOne({ _id: new ObjectId(id) });
  return result.deletedCount === 1;
}

/** Convierte `client` y `MeasurementId` string → ObjectId en documentos antiguos. */
export async function migrateMeasurementObjectIds(): Promise<number> {
  const docs = await collection().find({}).toArray();
  let updated = 0;

  for (const doc of docs) {
    const patch: Partial<Measurement> = {};

    if (typeof doc.client === "string" && ObjectId.isValid(doc.client)) {
      patch.client = new ObjectId(doc.client);
    }
    if (typeof doc.MeasurementId === "string" && ObjectId.isValid(doc.MeasurementId)) {
      patch.MeasurementId = new ObjectId(doc.MeasurementId);
    }

    if (Object.keys(patch).length === 0) continue;

    await collection().updateOne({ _id: doc._id }, { $set: patch });
    updated += 1;
  }

  return updated;
}
