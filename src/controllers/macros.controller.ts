import type { NextFunction, Request, Response } from "express";

import * as macrosService from "../services/macros.service";

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

/** GET /api/macros?clientId=... */
export async function listMacros(req: Request, res: Response, next: NextFunction) {
  try {
    const clientId = typeof req.query.clientId === "string" ? req.query.clientId : undefined;
    const macros = await macrosService.listMacros(clientId);
    res.json(macros);
  } catch (err) {
    sendServiceError(err, res, next);
  }
}

/** GET /api/macros/:clientId */
export async function getMacrosByClient(req: Request, res: Response, next: NextFunction) {
  try {
    const macros = await macrosService.getMacrosByClientId(req.params.clientId as string);
    if (!macros) {
      return res.status(404).json({ message: "Macros no encontrados" });
    }
    res.json(macros);
  } catch (err) {
    sendServiceError(err, res, next);
  }
}

export async function createMacros(req: Request, res: Response, next: NextFunction) {
  try {
    const macros = await macrosService.createMacros(req.body);
    res.status(201).json(macros);
  } catch (err) {
    sendServiceError(err, res, next);
  }
}

export async function updateMacros(req: Request, res: Response, next: NextFunction) {
  try {
    const macros = await macrosService.updateMacros(req.params.id as string, req.body);
    res.json(macros);
  } catch (err) {
    sendServiceError(err, res, next);
  }
}

export async function deleteMacros(req: Request, res: Response, next: NextFunction) {
  try {
    await macrosService.deleteMacros(req.params.id as string);
    res.status(204).send();
  } catch (err) {
    sendServiceError(err, res, next);
  }
}
