import { ObjectId } from "mongodb";

export const PROGRESS_IMAGE_COLLECTION = "ProgressImage";

export interface ProgressImage {
  _id: ObjectId;
  clientId: string;
  image: string;
  createdAt: Date;
  updatedAt: Date;
}

export type CreateProgressImageInput = Omit<ProgressImage, "_id">;
export type UpdateProgressImageInput = Partial<Pick<ProgressImage, "image" | "updatedAt">>;
