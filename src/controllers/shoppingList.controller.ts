import type { NextFunction, Request, Response } from "express";

import * as shoppingListService from "../services/shoppingList.service";

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

/** GET /api/shopping-lists?clientId=... */
export async function listShoppingLists(req: Request, res: Response, next: NextFunction) {
  try {
    const clientId = typeof req.query.clientId === "string" ? req.query.clientId : undefined;
    const lists = await shoppingListService.listShoppingLists(clientId);
    res.json(lists);
  } catch (err) {
    sendServiceError(err, res, next);
  }
}

/** GET /api/shopping-lists/:clientId */
export async function getShoppingListByClient(req: Request, res: Response, next: NextFunction) {
  try {
    const list = await shoppingListService.getShoppingListByClientId(
      req.params.clientId as string,
    );
    if (!list) {
      return res.status(404).json({ message: "Lista de la compra no encontrada" });
    }
    res.json(list);
  } catch (err) {
    sendServiceError(err, res, next);
  }
}

export async function createShoppingList(req: Request, res: Response, next: NextFunction) {
  try {
    const list = await shoppingListService.createShoppingList(req.body);
    res.status(201).json(list);
  } catch (err) {
    sendServiceError(err, res, next);
  }
}

export async function updateShoppingList(req: Request, res: Response, next: NextFunction) {
  try {
    const list = await shoppingListService.updateShoppingList(
      req.params.id as string,
      req.body,
    );
    res.json(list);
  } catch (err) {
    sendServiceError(err, res, next);
  }
}

export async function deleteShoppingList(req: Request, res: Response, next: NextFunction) {
  try {
    await shoppingListService.deleteShoppingList(req.params.id as string);
    res.status(204).send();
  } catch (err) {
    sendServiceError(err, res, next);
  }
}
