import type { NextFunction, Request, Response } from "express";

import * as specService from "../services/technicalSpecifications.service";

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

/** GET /api/technical-specifications?clientId=... */
export async function listSpecs(req: Request, res: Response, next: NextFunction) {
  try {
    const clientId = typeof req.query.clientId === "string" ? req.query.clientId : undefined;
    const specs = await specService.listSpecs(clientId);
    res.json(specs);
  } catch (err) {
    sendServiceError(err, res, next);
  }
}

/** GET /api/technical-specifications/client/:clientId */
export async function getSpecByClient(req: Request, res: Response, next: NextFunction) {
  try {
    const spec = await specService.getSpecByClientId(req.params.clientId as string);
    if (!spec) {
      return res.status(404).json({ message: "Ficha técnica no encontrada" });
    }
    res.json(spec);
  } catch (err) {
    sendServiceError(err, res, next);
  }
}

/** GET /api/technical-specifications/:id */
export async function getSpecById(req: Request, res: Response, next: NextFunction) {
  try {
    const spec = await specService.getSpecById(req.params.id as string);
    res.json(spec);
  } catch (err) {
    sendServiceError(err, res, next);
  }
}

export async function createSpec(req: Request, res: Response, next: NextFunction) {
  try {
    const spec = await specService.createSpec(req.body);
    res.status(201).json(spec);
  } catch (err) {
    sendServiceError(err, res, next);
  }
}

export async function updateSpec(req: Request, res: Response, next: NextFunction) {
  try {
    const spec = await specService.updateSpec(req.params.id as string, req.body);
    res.json(spec);
  } catch (err) {
    sendServiceError(err, res, next);
  }
}

export async function deleteSpec(req: Request, res: Response, next: NextFunction) {
  try {
    await specService.deleteSpec(req.params.id as string);
    res.status(204).send();
  } catch (err) {
    sendServiceError(err, res, next);
  }
}
