import type { NextFunction, Request, Response } from "express";

import * as clientService from "../services/client.service";

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

export async function listClients(_req: Request, res: Response, next: NextFunction) {
  try {
    const clients = await clientService.listClients();
    res.json(clients);
  } catch (err) {
    next(err);
  }
}

export async function getClient(req: Request, res: Response, next: NextFunction) {
  try {
    const client = await clientService.getClientById(req.params.id as string);
    res.json(client);
  } catch (err) {
    sendServiceError(err, res, next);
  }
}

export async function loginClient(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, contraseña, password } = req.body ?? {};
    const client = await clientService.loginClient(email, contraseña ?? password);
    res.json(client);
  } catch (err) {
    sendServiceError(err, res, next);
  }
}

export async function createClient(req: Request, res: Response, next: NextFunction) {
  try {
    const client = await clientService.createClient(req.body);
    res.status(201).json(client);
  } catch (err) {
    sendServiceError(err, res, next);
  }
}

export async function updateClient(req: Request, res: Response, next: NextFunction) {
  try {
    const client = await clientService.updateClient(req.params.id as string, req.body);
    res.json(client);
  } catch (err) {
    sendServiceError(err, res, next);
  }
}

export async function deleteClient(req: Request, res: Response, next: NextFunction) {
  try {
    await clientService.deleteClient(req.params.id as string);
    res.status(204).send();
  } catch (err) {
    sendServiceError(err, res, next);
  }
}
