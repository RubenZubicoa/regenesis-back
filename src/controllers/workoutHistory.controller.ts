import type { NextFunction, Request, Response } from "express";

import * as workoutHistoryService from "../services/workoutHistory.service";

type HttpError = Error & { status?: number };

function getErrorStatus(err: unknown): number {
  if (err && typeof err === "object" && "status" in err) {
    const status = (err as HttpError).status;
    if (typeof status === "number") return status;
  }
  return 500;
}

function sendServiceError(err: unknown, res: Response, next: NextFunction) {
  const status = getErrorStatus(err);
  if (status < 500) {
    return res.status(status).json({ message: (err as Error).message });
  }
  next(err);
}

/** GET /api/workout-history?clientId=... */
export async function listWorkoutHistory(req: Request, res: Response, next: NextFunction) {
  try {
    const clientId = typeof req.query.clientId === "string" ? req.query.clientId : undefined;
    const records = await workoutHistoryService.listWorkoutHistory(clientId);
    res.json(records);
  } catch (err) {
    sendServiceError(err, res, next);
  }
}

/** GET /api/workout-history/:clientId */
export async function listWorkoutHistoryByClient(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const records = await workoutHistoryService.getWorkoutHistoryByClientId(
      req.params.clientId as string,
    );
    res.json(records);
  } catch (err) {
    sendServiceError(err, res, next);
  }
}

export async function createWorkoutHistory(req: Request, res: Response, next: NextFunction) {
  try {
    const record = await workoutHistoryService.createWorkoutHistory(req.body);
    res.status(201).json(record);
  } catch (err) {
    sendServiceError(err, res, next);
  }
}

export async function updateWorkoutHistory(req: Request, res: Response, next: NextFunction) {
  try {
    const record = await workoutHistoryService.updateWorkoutHistory(
      req.params.id as string,
      req.body,
    );
    res.json(record);
  } catch (err) {
    sendServiceError(err, res, next);
  }
}

export async function deleteWorkoutHistory(req: Request, res: Response, next: NextFunction) {
  try {
    await workoutHistoryService.deleteWorkoutHistory(req.params.id as string);
    res.status(204).send();
  } catch (err) {
    sendServiceError(err, res, next);
  }
}
