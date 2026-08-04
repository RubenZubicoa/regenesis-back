import type { Request, Response } from "express";

type MulterCallback = (err?: unknown) => void;

type MulterMiddleware = (req: Request, res: Response, callback: MulterCallback) => void;

type MulterLike = {
  array: (field: string) => MulterMiddleware;
  single: (field: string) => MulterMiddleware;
};

/** Stub local: multer aún no está instalado/configurado. */
const notConfigured: MulterMiddleware = (_req, _res, callback) => {
  callback(new Error("Upload no configurado"));
};

const multer: MulterLike = {
  array: () => notConfigured,
  single: () => notConfigured,
};

export default multer;
