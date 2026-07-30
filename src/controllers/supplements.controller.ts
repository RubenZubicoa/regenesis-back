import type { NextFunction, Request, Response } from "express";

import * as supplementsService from "../services/supplements.service";

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

/** GET /api/supplements?clientId=... */
export async function listSupplements(req: Request, res: Response, next: NextFunction) {
  try {
    const clientId = typeof req.query.clientId === "string" ? req.query.clientId : undefined;
    const supplements = await supplementsService.listSupplements(clientId);
    res.json(supplements);
  } catch (err) {
    sendServiceError(err, res, next);
  }
}

/** GET /api/supplements/:clientId */
export async function getSupplementsByClient(req: Request, res: Response, next: NextFunction) {
  try {
    const supplements = await supplementsService.getSupplementsByClientId(
      req.params.clientId as string,
    );
    if (!supplements) {
      return res.status(404).json({ message: "Suplementos no encontrados" });
    }
    res.json(supplements);
  } catch (err) {
    sendServiceError(err, res, next);
  }
}

export async function createSupplements(req: Request, res: Response, next: NextFunction) {
  try {
    const supplements = await supplementsService.createSupplements(req.body);
    res.status(201).json(supplements);
  } catch (err) {
    sendServiceError(err, res, next);
  }
}

export async function updateSupplements(req: Request, res: Response, next: NextFunction) {
  try {
    const supplements = await supplementsService.updateSupplements(
      req.params.id as string,
      req.body,
    );
    res.json(supplements);
  } catch (err) {
    sendServiceError(err, res, next);
  }
}

export async function deleteSupplements(req: Request, res: Response, next: NextFunction) {
  try {
    await supplementsService.deleteSupplements(req.params.id as string);
    res.status(204).send();
  } catch (err) {
    sendServiceError(err, res, next);
  }
}
