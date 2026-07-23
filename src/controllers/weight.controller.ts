import type { NextFunction, Request, Response } from "express";

import * as weightService from "../services/weight.service";

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

export async function listWeights(req: Request, res: Response, next: NextFunction) {
  try {
    const clientId = typeof req.query.client === "string" ? req.query.client : undefined;
    const weights = await weightService.listWeights(clientId);
    res.json(weights);
  } catch (err) {
    sendServiceError(err, res, next);
  }
}

/** GET /api/clients/:id/weights */
export async function getWeightByClient(req: Request, res: Response, next: NextFunction) {
  try {
    const weight = await weightService.getWeightByClientId(req.params.id as string);
    if (!weight) {
      return res.status(404).json({ message: "Serie de peso no encontrada" });
    }
    res.json(weight);
  } catch (err) {
    sendServiceError(err, res, next);
  }
}

export async function getWeight(req: Request, res: Response, next: NextFunction) {
  try {
    const weight = await weightService.getWeightById(req.params.id as string);
    res.json(weight);
  } catch (err) {
    sendServiceError(err, res, next);
  }
}

export async function createWeight(req: Request, res: Response, next: NextFunction) {
  try {
    const weight = await weightService.createWeight(req.body);
    res.status(201).json(weight);
  } catch (err) {
    sendServiceError(err, res, next);
  }
}

export async function updateWeight(req: Request, res: Response, next: NextFunction) {
  try {
    const weight = await weightService.updateWeight(req.params.id as string, req.body);
    res.json(weight);
  } catch (err) {
    sendServiceError(err, res, next);
  }
}

export async function deleteWeight(req: Request, res: Response, next: NextFunction) {
  try {
    await weightService.deleteWeight(req.params.id as string);
    res.status(204).send();
  } catch (err) {
    sendServiceError(err, res, next);
  }
}
