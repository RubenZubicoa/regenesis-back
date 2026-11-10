import { ObjectId } from "mongodb";

export const PROGRESS_IMAGE_COLLECTION = "ProgressImage";

export const PROGRESS_IMAGE_POSES = ["De frente", "Lateral", "De espaldas"] as const;

export type ProgressImagePose = (typeof PROGRESS_IMAGE_POSES)[number];

export const DEFAULT_PROGRESS_IMAGE_POSE: ProgressImagePose = "De frente";

export interface ProgressImage {
  _id: ObjectId;
  clientId: string;
  image: string;
  /** Orientación de la foto. Si no se indica, se asume "De frente". */
  pose?: ProgressImagePose;
  createdAt: Date;
  updatedAt: Date;
}

export type CreateProgressImageInput = Omit<ProgressImage, "_id">;
export type UpdateProgressImageInput = Partial<Pick<ProgressImage, "image" | "pose" | "updatedAt">>;
