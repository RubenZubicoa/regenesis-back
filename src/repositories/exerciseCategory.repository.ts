import { ObjectId, type Collection, type WithId } from "mongodb";

import { database } from "../db/database";
import {
  EXERCISE_CATEGORY_COLLECTION,
  type ExerciseCategory,
} from "../entities/ExerciseCategory";

function collection(): Collection<ExerciseCategory> {
  return database.collection<ExerciseCategory>(EXERCISE_CATEGORY_COLLECTION);
}

export async function findExerciseCategoryById(
  id: string,
): Promise<WithId<ExerciseCategory> | null> {
  if (!ObjectId.isValid(id)) return null;
  return collection().findOne({ _id: new ObjectId(id) });
}

export async function findExerciseCategoryByKey(
  key: string,
): Promise<WithId<ExerciseCategory> | null> {
  const trimmed = key.trim();
  if (!trimmed) return null;
  return collection().findOne({
    key: { $regex: `^${trimmed.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, $options: "i" },
  });
}
