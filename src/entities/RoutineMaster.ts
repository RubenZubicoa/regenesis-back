import { RoutineDay } from "./RoutineDay";

export type RoutineMaster = Omit<RoutineDay, "clientId">;

export const ROUTINE_MASTER_COLLECTION = "RoutineMaster";

/** Datos para crear una rutina maestra (sin `_id`). */
export type CreateRoutineMasterInput = Omit<RoutineMaster, "_id">;

/** Datos parciales para actualizar una rutina maestra. */
export type UpdateRoutineMasterInput = Partial<CreateRoutineMasterInput>;