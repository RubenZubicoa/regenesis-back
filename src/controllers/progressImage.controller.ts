import type { NextFunction, Request, Response } from "express";

import * as progressImageService from "../services/progressImage.service";

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

/** GET /api/progress-images?clientId=... */
export async function listImages(req: Request, res: Response, next: NextFunction) {
  try {
    const clientId = typeof req.query.clientId === "string" ? req.query.clientId : undefined;
    if (!clientId) {
      return res.status(400).json({ message: "El parámetro clientId es obligatorio" });
    }
    const images = await progressImageService.listImagesByClient(clientId);
    res.json(images);
  } catch (err) {
    sendServiceError(err, res, next);
  }
}

/** GET /api/progress-images/:id */
export async function getImage(req: Request, res: Response, next: NextFunction) {
  try {
    const image = await progressImageService.getImageById(req.params.id as string);
    res.json(image);
  } catch (err) {
    sendServiceError(err, res, next);
  }
}

/**
 * POST /api/progress-images
 * Body: multipart/form-data con campo "image" (archivo) y "clientId" (texto)
 */
export async function uploadImage(req: Request, res: Response, next: NextFunction) {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ message: "Se requiere un archivo de imagen (campo: image)" });
    }

    const clientId = typeof req.body.clientId === "string" ? req.body.clientId.trim() : "";
    if (!clientId) {
      return res.status(400).json({ message: "clientId es obligatorio" });
    }

    const image = await progressImageService.uploadProgressImage(clientId, file);
    res.status(201).json(image);
  } catch (err) {
    sendServiceError(err, res, next);
  }
}

/** DELETE /api/progress-images/:id */
export async function deleteImage(req: Request, res: Response, next: NextFunction) {
  try {
    await progressImageService.deleteProgressImage(req.params.id as string);
    res.status(204).send();
  } catch (err) {
    sendServiceError(err, res, next);
  }
}
