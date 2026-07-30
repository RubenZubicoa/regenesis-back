import type { NextFunction, Request, Response } from "express";

import * as wellnessService from "../services/wellness.service";

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

export async function listWellness(req: Request, res: Response, next: NextFunction) {
  try {
    const clientId = typeof req.query.clientId === "string" ? req.query.clientId : undefined;
    const wellness = await wellnessService.listWellness(clientId);
    res.json(wellness);
  } catch (err) {
    sendServiceError(err, res, next);
  }
}

/** GET /api/wellness/:clientId */
export async function listWellnessByClient(req: Request, res: Response, next: NextFunction) {
  try {
    const wellness = await wellnessService.getWellnessByClientId(
      (req.params.clientId ?? req.params.id) as string,
    );
    res.json(wellness);
  } catch (err) {
    sendServiceError(err, res, next);
  }
}

export async function getWellness(req: Request, res: Response, next: NextFunction) {
  try {
    const wellness = await wellnessService.getWellnessById(req.params.id as string);
    res.json(wellness);
  } catch (err) {
    sendServiceError(err, res, next);
  }
}

export async function createWellness(req: Request, res: Response, next: NextFunction) {
  try {
    const wellness = await wellnessService.createWellness(req.body);
    res.status(201).json(wellness);
  } catch (err) {
    sendServiceError(err, res, next);
  }
}

export async function updateWellness(req: Request, res: Response, next: NextFunction) {
  try {
    const wellness = await wellnessService.updateWellness(req.params.id as string, req.body);
    res.json(wellness);
  } catch (err) {
    sendServiceError(err, res, next);
  }
}

export async function deleteWellness(req: Request, res: Response, next: NextFunction) {
  try {
    await wellnessService.deleteWellness(req.params.id as string);
    res.status(204).send();
  } catch (err) {
    sendServiceError(err, res, next);
  }
}
