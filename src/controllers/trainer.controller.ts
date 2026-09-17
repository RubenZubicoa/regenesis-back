import type { NextFunction, Request, Response } from "express";

import * as trainerService from "../services/trainer.service";

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

export async function loginTrainer(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, contraseña, password } = req.body ?? {};
    const result = await trainerService.loginTrainer(email, contraseña ?? password);
    res.json(result);
  } catch (err) {
    sendServiceError(err, res, next);
  }
}

export async function createTrainer(req: Request, res: Response, next: NextFunction) {
  try {
    const trainer = await trainerService.createTrainer(req.body);
    res.status(201).json(trainer);
  } catch (err) {
    sendServiceError(err, res, next);
  }
}
