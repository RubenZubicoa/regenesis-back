import { ObjectId } from "mongodb";

export const REVIEW_COLLECTION = "Review";

export type ReviewStatus = "upcoming" | "done" | "canceled";

export interface Review {
  _id: ObjectId;
  /** Id del cliente (colección Client). */
  clientId: string;
  title: string;
  date: string;
  status: ReviewStatus;
  note: string;
}

/** Datos para crear una revisión (sin `_id`). */
export type CreateReviewInput = Omit<Review, "_id">;

/** Datos parciales para actualizar una revisión. */
export type UpdateReviewInput = Partial<CreateReviewInput>;
