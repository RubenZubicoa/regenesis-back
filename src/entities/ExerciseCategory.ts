import { ObjectId } from "mongodb";

export const EXERCISE_CATEGORY_COLLECTION = "ExerciseCategory";

export interface ExerciseCategory {
  _id: ObjectId;
  key: string;
  label: string;
}