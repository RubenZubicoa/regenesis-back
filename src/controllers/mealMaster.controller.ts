import type { NextFunction, Request, Response } from "express";

import * as mealMasterService from "../services/mealMaster.service";

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

export async function listMealMasters(_req: Request, res: Response, next: NextFunction) {
  try {
    const masters = await mealMasterService.listMealMasters();
    res.json(masters);
  } catch (err) {
    next(err);
  }
}

export async function getMealMaster(req: Request, res: Response, next: NextFunction) {
  try {
    const master = await mealMasterService.getMealMasterById(req.params.id as string);
    res.json(master);
  } catch (err) {
    sendServiceError(err, res, next);
  }
}

export async function createMealMaster(req: Request, res: Response, next: NextFunction) {
  try {
    const master = await mealMasterService.createMealMaster(req.body);
    res.status(201).json(master);
  } catch (err) {
    sendServiceError(err, res, next);
  }
}

export async function updateMealMaster(req: Request, res: Response, next: NextFunction) {
  try {
    const master = await mealMasterService.updateMealMaster(req.params.id as string, req.body);
    res.json(master);
  } catch (err) {
    sendServiceError(err, res, next);
  }
}

export async function deleteMealMaster(req: Request, res: Response, next: NextFunction) {
  try {
    await mealMasterService.deleteMealMaster(req.params.id as string);
    res.status(204).send();
  } catch (err) {
    sendServiceError(err, res, next);
  }
}
