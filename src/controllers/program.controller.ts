import type { NextFunction, Request, Response } from "express";

import * as programService from "../services/program.service";

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

export async function listPrograms(_req: Request, res: Response, next: NextFunction) {
  try {
    const programs = await programService.listPrograms();
    res.json(programs);
  } catch (err) {
    next(err);
  }
}

export async function getProgram(req: Request, res: Response, next: NextFunction) {
  try {
    const program = await programService.getProgramById(req.params.id as string);
    res.json(program);
  } catch (err) {
    sendServiceError(err, res, next);
  }
}

export async function createProgram(req: Request, res: Response, next: NextFunction) {
  try {
    const program = await programService.createProgram(req.body);
    res.status(201).json(program);
  } catch (err) {
    sendServiceError(err, res, next);
  }
}

export async function updateProgram(req: Request, res: Response, next: NextFunction) {
  try {
    const program = await programService.updateProgram(req.params.id as string, req.body);
    res.json(program);
  } catch (err) {
    sendServiceError(err, res, next);
  }
}

export async function deleteProgram(req: Request, res: Response, next: NextFunction) {
  try {
    await programService.deleteProgram(req.params.id as string);
    res.status(204).send();
  } catch (err) {
    sendServiceError(err, res, next);
  }
}
