import type { NextFunction, Request, Response } from "express";

import * as routineDayService from "../services/routineDay.service";

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

/** GET /api/routine-days?clientId=... */
export async function listRoutineDays(req: Request, res: Response, next: NextFunction) {
  try {
    const clientId = typeof req.query.clientId === "string" ? req.query.clientId : undefined;
    const records = await routineDayService.listRoutineDays(clientId);
    res.json(records);
  } catch (err) {
    sendServiceError(err, res, next);
  }
}

/** GET /api/routine-days/:clientId */
export async function listRoutineDaysByClient(req: Request, res: Response, next: NextFunction) {
  try {
    const records = await routineDayService.getRoutineDaysByClientId(
      req.params.clientId as string,
    );
    res.json(records);
  } catch (err) {
    sendServiceError(err, res, next);
  }
}

export async function createRoutineDay(req: Request, res: Response, next: NextFunction) {
  try {
    const record = await routineDayService.createRoutineDay(req.body);
    res.status(201).json(record);
  } catch (err) {
    sendServiceError(err, res, next);
  }
}

export async function updateRoutineDay(req: Request, res: Response, next: NextFunction) {
  try {
    const record = await routineDayService.updateRoutineDay(req.params.id as string, req.body);
    res.json(record);
  } catch (err) {
    sendServiceError(err, res, next);
  }
}

export async function deleteRoutineDay(req: Request, res: Response, next: NextFunction) {
  try {
    await routineDayService.deleteRoutineDay(req.params.id as string);
    res.status(204).send();
  } catch (err) {
    sendServiceError(err, res, next);
  }
}
