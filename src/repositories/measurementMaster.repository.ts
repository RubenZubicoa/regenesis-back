import { ObjectId, type Collection, type WithId } from "mongodb";

import { database } from "../db/database";
import {
  MEASUREMENT_MASTER_COLLECTION,
  type CreateMeasurementMasterInput,
  type MeasurementMaster,
  type UpdateMeasurementMasterInput,
} from "../entities/MeasurementMaster";

function collection(): Collection<MeasurementMaster> {
  return database.collection<MeasurementMaster>(MEASUREMENT_MASTER_COLLECTION);
}

export async function findAllMeasurementMasters(): Promise<WithId<MeasurementMaster>[]> {
  return collection().find().sort({ label: 1 }).toArray();
}

export async function findMeasurementMasterById(
  id: string,
): Promise<WithId<MeasurementMaster> | null> {
  if (!ObjectId.isValid(id)) return null;
  return collection().findOne({ _id: new ObjectId(id) });
}

export async function findMeasurementMasterByKey(
  key: string,
): Promise<WithId<MeasurementMaster> | null> {
  return collection().findOne({ key: key.trim().toLowerCase() });
}

export async function insertMeasurementMaster(
  data: CreateMeasurementMasterInput,
): Promise<WithId<MeasurementMaster>> {
  const doc: MeasurementMaster = {
    ...data,
    _id: new ObjectId(),
    key: data.key.trim().toLowerCase(),
    label: data.label.trim(),
    unit: data.unit.trim(),
    icon: data.icon.trim(),
  };
  await collection().insertOne(doc);
  return doc;
}

export async function updateMeasurementMasterById(
  id: string,
  data: UpdateMeasurementMasterInput,
): Promise<WithId<MeasurementMaster> | null> {
  if (!ObjectId.isValid(id)) return null;

  const update: UpdateMeasurementMasterInput = { ...data };
  if (typeof update.key === "string") update.key = update.key.trim().toLowerCase();
  if (typeof update.label === "string") update.label = update.label.trim();
  if (typeof update.unit === "string") update.unit = update.unit.trim();
  if (typeof update.icon === "string") update.icon = update.icon.trim();

  const result = await collection().findOneAndUpdate(
    { _id: new ObjectId(id) },
    { $set: update },
    { returnDocument: "after" },
  );

  return result ?? null;
}

export async function deleteMeasurementMasterById(id: string): Promise<boolean> {
  if (!ObjectId.isValid(id)) return false;
  const result = await collection().deleteOne({ _id: new ObjectId(id) });
  return result.deletedCount === 1;
}
