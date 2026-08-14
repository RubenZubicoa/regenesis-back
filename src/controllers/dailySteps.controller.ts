import type { NextFunction, Request, Response } from "express";

import * as dailyStepsService from "../services/dailySteps.service";

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

/** GET /api/daily-steps/ranking?period=week|month */
export async function getStepsRanking(req: Request, res: Response, next: NextFunction) {
  try {
    const period = typeof req.query.period === "string" ? req.query.period : "week";
    const ranking = await dailyStepsService.getStepsRanking(period);
    res.json(ranking);
  } catch (err) {
    sendServiceError(err, res, next);
  }
}

/** GET /api/daily-steps?clientId=... */
export async function listDailySteps(req: Request, res: Response, next: NextFunction) {
  try {
    const clientId = typeof req.query.clientId === "string" ? req.query.clientId : undefined;
    const records = await dailyStepsService.listDailySteps(clientId);
    res.json(records);
  } catch (err) {
    sendServiceError(err, res, next);
  }
}

/** GET /api/daily-steps/:clientId */
export async function listDailyStepsByClient(req: Request, res: Response, next: NextFunction) {
  try {
    const records = await dailyStepsService.getDailyStepsByClientId(
      req.params.clientId as string,
    );
    res.json(records);
  } catch (err) {
    sendServiceError(err, res, next);
  }
}

export async function createDailySteps(req: Request, res: Response, next: NextFunction) {
  try {
    const record = await dailyStepsService.createDailySteps(req.body);
    res.status(201).json(record);
  } catch (err) {
    sendServiceError(err, res, next);
  }
}

export async function updateDailySteps(req: Request, res: Response, next: NextFunction) {
  try {
    const record = await dailyStepsService.updateDailySteps(req.params.id as string, req.body);
    res.json(record);
  } catch (err) {
    sendServiceError(err, res, next);
  }
}

export async function deleteDailySteps(req: Request, res: Response, next: NextFunction) {
  try {
    await dailyStepsService.deleteDailySteps(req.params.id as string);
    res.status(204).send();
  } catch (err) {
    sendServiceError(err, res, next);
  }
}
