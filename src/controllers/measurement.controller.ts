import type { NextFunction, Request, Response } from "express";

import * as measurementService from "../services/measurement.service";

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

export async function listMeasurements(req: Request, res: Response, next: NextFunction) {
  try {
    const clientId = typeof req.query.client === "string" ? req.query.client : undefined;
    const measurements = await measurementService.listMeasurements(clientId);
    res.json(measurements);
  } catch (err) {
    sendServiceError(err, res, next);
  }
}

/** GET /api/clients/:id/measurements */
export async function listMeasurementsByClient(req: Request, res: Response, next: NextFunction) {
  try {
    const measurements = await measurementService.getMeasurementsByClientId(
      req.params.id as string,
    );
    res.json(measurements);
  } catch (err) {
    sendServiceError(err, res, next);
  }
}

export async function getMeasurement(req: Request, res: Response, next: NextFunction) {
  try {
    const measurement = await measurementService.getMeasurementById(req.params.id as string);
    res.json(measurement);
  } catch (err) {
    sendServiceError(err, res, next);
  }
}

export async function createMeasurement(req: Request, res: Response, next: NextFunction) {
  try {
    const measurement = await measurementService.createMeasurement(req.body);
    res.status(201).json(measurement);
  } catch (err) {
    sendServiceError(err, res, next);
  }
}

export async function updateMeasurement(req: Request, res: Response, next: NextFunction) {
  try {
    const measurement = await measurementService.updateMeasurement(
      req.params.id as string,
      req.body,
    );
    res.json(measurement);
  } catch (err) {
    sendServiceError(err, res, next);
  }
}

export async function deleteMeasurement(req: Request, res: Response, next: NextFunction) {
  try {
    await measurementService.deleteMeasurement(req.params.id as string);
    res.status(204).send();
  } catch (err) {
    sendServiceError(err, res, next);
  }
}
