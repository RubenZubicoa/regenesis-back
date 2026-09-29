import { ObjectId } from "mongodb";

export const RENOVATION_HISTORY_COLLECTION = "RenovationHistory";

export interface RenovationHistory {
  _id: ObjectId;
  clientId: string;
  startDate: string;
  endDate: string;
  totalWeeks: number;
  createdAt: string;
  updatedAt: string;
}

/** Datos para crear un registro de renovación (sin `_id`). */
export type CreateRenovationHistoryInput = Omit<RenovationHistory, "_id">;
