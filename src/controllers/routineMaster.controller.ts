import type { NextFunction, Request, Response } from "express";

import * as routineMasterService from "../services/routineMaster.service";

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

export async function listRoutineMasters(_req: Request, res: Response, next: NextFunction) {
  try {
    const masters = await routineMasterService.listRoutineMasters();
    res.json(masters);
  } catch (err) {
    next(err);
  }
}

export async function getRoutineMaster(req: Request, res: Response, next: NextFunction) {
  try {
    const master = await routineMasterService.getRoutineMasterById(req.params.id as string);
    res.json(master);
  } catch (err) {
    sendServiceError(err, res, next);
  }
}

export async function createRoutineMaster(req: Request, res: Response, next: NextFunction) {
  try {
    const master = await routineMasterService.createRoutineMaster(req.body);
    res.status(201).json(master);
  } catch (err) {
    sendServiceError(err, res, next);
  }
}

export async function updateRoutineMaster(req: Request, res: Response, next: NextFunction) {
  try {
    const master = await routineMasterService.updateRoutineMaster(
      req.params.id as string,
      req.body,
    );
    res.json(master);
  } catch (err) {
    sendServiceError(err, res, next);
  }
}

export async function deleteRoutineMaster(req: Request, res: Response, next: NextFunction) {
  try {
    await routineMasterService.deleteRoutineMaster(req.params.id as string);
    res.status(204).send();
  } catch (err) {
    sendServiceError(err, res, next);
  }
}
