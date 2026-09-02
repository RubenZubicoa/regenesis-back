import type { NextFunction, Request, Response } from "express";

import * as exerciseCategoryService from "../services/exerciseCategory.service";

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

export async function listExerciseCategories(_req: Request, res: Response, next: NextFunction) {
  try {
    const categories = await exerciseCategoryService.listExerciseCategories();
    res.json(categories);
  } catch (err) {
    next(err);
  }
}

export async function getExerciseCategory(req: Request, res: Response, next: NextFunction) {
  try {
    const category = await exerciseCategoryService.getExerciseCategoryById(req.params.id as string);
    res.json(category);
  } catch (err) {
    sendServiceError(err, res, next);
  }
}

export async function createExerciseCategory(req: Request, res: Response, next: NextFunction) {
  try {
    const category = await exerciseCategoryService.createExerciseCategory(req.body);
    res.status(201).json(category);
  } catch (err) {
    sendServiceError(err, res, next);
  }
}

export async function updateExerciseCategory(req: Request, res: Response, next: NextFunction) {
  try {
    const category = await exerciseCategoryService.updateExerciseCategory(
      req.params.id as string,
      req.body,
    );
    res.json(category);
  } catch (err) {
    sendServiceError(err, res, next);
  }
}

export async function deleteExerciseCategory(req: Request, res: Response, next: NextFunction) {
  try {
    await exerciseCategoryService.deleteExerciseCategory(req.params.id as string);
    res.status(204).send();
  } catch (err) {
    sendServiceError(err, res, next);
  }
}
