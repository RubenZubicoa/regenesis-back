import type { NextFunction, Request, Response } from "express";

import * as measurementMasterService from "../services/measurementMaster.service";

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

export async function listMeasurementMasters(_req: Request, res: Response, next: NextFunction) {
  try {
    const masters = await measurementMasterService.listMeasurementMasters();
    res.json(masters);
  } catch (err) {
    next(err);
  }
}

export async function getMeasurementMaster(req: Request, res: Response, next: NextFunction) {
  try {
    const master = await measurementMasterService.getMeasurementMasterById(req.params.id as string);
    res.json(master);
  } catch (err) {
    sendServiceError(err, res, next);
  }
}

export async function createMeasurementMaster(req: Request, res: Response, next: NextFunction) {
  try {
    const master = await measurementMasterService.createMeasurementMaster(req.body);
    res.status(201).json(master);
  } catch (err) {
    sendServiceError(err, res, next);
  }
}

export async function updateMeasurementMaster(req: Request, res: Response, next: NextFunction) {
  try {
    const master = await measurementMasterService.updateMeasurementMaster(
      req.params.id as string,
      req.body,
    );
    res.json(master);
  } catch (err) {
    sendServiceError(err, res, next);
  }
}

export async function deleteMeasurementMaster(req: Request, res: Response, next: NextFunction) {
  try {
    await measurementMasterService.deleteMeasurementMaster(req.params.id as string);
    res.status(204).send();
  } catch (err) {
    sendServiceError(err, res, next);
  }
}
