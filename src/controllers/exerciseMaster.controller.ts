import type { NextFunction, Request, Response } from "express";

import * as exerciseMasterService from "../services/exerciseMaster.service";

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

export async function listExerciseMasters(_req: Request, res: Response, next: NextFunction) {
  try {
    const masters = await exerciseMasterService.listExerciseMasters();
    res.json(masters);
  } catch (err) {
    next(err);
  }
}

export async function getExerciseMaster(req: Request, res: Response, next: NextFunction) {
  try {
    const master = await exerciseMasterService.getExerciseMasterById(req.params.id as string);
    res.json(master);
  } catch (err) {
    sendServiceError(err, res, next);
  }
}

export async function createExerciseMaster(req: Request, res: Response, next: NextFunction) {
  try {
    const master = await exerciseMasterService.createExerciseMaster(req.body);
    res.status(201).json(master);
  } catch (err) {
    sendServiceError(err, res, next);
  }
}

export async function updateExerciseMaster(req: Request, res: Response, next: NextFunction) {
  try {
    const master = await exerciseMasterService.updateExerciseMaster(
      req.params.id as string,
      req.body,
    );
    res.json(master);
  } catch (err) {
    sendServiceError(err, res, next);
  }
}

export async function deleteExerciseMaster(req: Request, res: Response, next: NextFunction) {
  try {
    await exerciseMasterService.deleteExerciseMaster(req.params.id as string);
    res.status(204).send();
  } catch (err) {
    sendServiceError(err, res, next);
  }
}
