import type { NextFunction, Request, Response } from "express";

import * as videoLibraryService from "../services/videoLibrary.service";

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

export async function listVideoLibraries(req: Request, res: Response, next: NextFunction) {
  try {
    const libraries = await videoLibraryService.listVideoLibraries(req.query.phase);
    res.json(libraries);
  } catch (err) {
    sendServiceError(err, res, next);
  }
}

export async function getVideoLibrary(req: Request, res: Response, next: NextFunction) {
  try {
    const library = await videoLibraryService.getVideoLibraryById(
      req.params.id as string,
      req.query.phase,
    );
    res.json(library);
  } catch (err) {
    sendServiceError(err, res, next);
  }
}

export async function createVideoLibrary(req: Request, res: Response, next: NextFunction) {
  try {
    const library = await videoLibraryService.createVideoLibrary(req.body);
    res.status(201).json(library);
  } catch (err) {
    sendServiceError(err, res, next);
  }
}

export async function updateVideoLibrary(req: Request, res: Response, next: NextFunction) {
  try {
    const library = await videoLibraryService.updateVideoLibrary(
      req.params.id as string,
      req.body,
    );
    res.json(library);
  } catch (err) {
    sendServiceError(err, res, next);
  }
}

export async function deleteVideoLibrary(req: Request, res: Response, next: NextFunction) {
  try {
    await videoLibraryService.deleteVideoLibrary(req.params.id as string);
    res.status(204).send();
  } catch (err) {
    sendServiceError(err, res, next);
  }
}
