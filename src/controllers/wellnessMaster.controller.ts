import type { NextFunction, Request, Response } from "express";

import * as wellnessMasterService from "../services/wellnessMaster.service";

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

export async function listWellnessMasters(_req: Request, res: Response, next: NextFunction) {
  try {
    const masters = await wellnessMasterService.listWellnessMasters();
    res.json(masters);
  } catch (err) {
    next(err);
  }
}

export async function getWellnessMaster(req: Request, res: Response, next: NextFunction) {
  try {
    const master = await wellnessMasterService.getWellnessMasterById(req.params.id as string);
    res.json(master);
  } catch (err) {
    sendServiceError(err, res, next);
  }
}

export async function createWellnessMaster(req: Request, res: Response, next: NextFunction) {
  try {
    const master = await wellnessMasterService.createWellnessMaster(req.body);
    res.status(201).json(master);
  } catch (err) {
    sendServiceError(err, res, next);
  }
}

export async function updateWellnessMaster(req: Request, res: Response, next: NextFunction) {
  try {
    const master = await wellnessMasterService.updateWellnessMaster(
      req.params.id as string,
      req.body,
    );
    res.json(master);
  } catch (err) {
    sendServiceError(err, res, next);
  }
}

export async function deleteWellnessMaster(req: Request, res: Response, next: NextFunction) {
  try {
    await wellnessMasterService.deleteWellnessMaster(req.params.id as string);
    res.status(204).send();
  } catch (err) {
    sendServiceError(err, res, next);
  }
}
