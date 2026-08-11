import type { NextFunction, Request, Response } from "express";

import * as mealService from "../services/meal.service";

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

/** GET /api/meals?clientId=... */
export async function listMeals(req: Request, res: Response, next: NextFunction) {
  try {
    const clientId = typeof req.query.clientId === "string" ? req.query.clientId : undefined;
    const meals = await mealService.listMeals(clientId);
    res.json(meals);
  } catch (err) {
    sendServiceError(err, res, next);
  }
}

/** GET /api/meals/client/:clientId */
export async function getMealByClient(req: Request, res: Response, next: NextFunction) {
  try {
    const meal = await mealService.getMealByClientId(req.params.clientId as string);
    if (!meal) {
      return res.status(404).json({ message: "Plan de comidas no encontrado" });
    }
    res.json(meal);
  } catch (err) {
    sendServiceError(err, res, next);
  }
}

/** GET /api/meals/:id */
export async function getMealById(req: Request, res: Response, next: NextFunction) {
  try {
    const meal = await mealService.getMealById(req.params.id as string);
    res.json(meal);
  } catch (err) {
    sendServiceError(err, res, next);
  }
}

export async function createMeal(req: Request, res: Response, next: NextFunction) {
  try {
    const meal = await mealService.createMeal(req.body);
    res.status(201).json(meal);
  } catch (err) {
    sendServiceError(err, res, next);
  }
}

export async function updateMeal(req: Request, res: Response, next: NextFunction) {
  try {
    const meal = await mealService.updateMeal(req.params.id as string, req.body);
    res.json(meal);
  } catch (err) {
    sendServiceError(err, res, next);
  }
}

export async function deleteMeal(req: Request, res: Response, next: NextFunction) {
  try {
    await mealService.deleteMeal(req.params.id as string);
    res.status(204).send();
  } catch (err) {
    sendServiceError(err, res, next);
  }
}
