import type { NextFunction, Request, Response } from "express";
import multer from "../libs/multer";

export function uploadProductImages(req: Request, res: Response, next: NextFunction) {
  const contentType = req.headers["content-type"] ?? "";

  if (!contentType.includes("multipart/form-data")) {
    return next();
  }

  if (!contentType.includes("boundary=")) {
    return res.status(400).json({
      message:
        'Content-Type inválido. Usa FormData y no establezcas "Content-Type" manualmente; el cliente debe incluir el boundary automáticamente.',
    });
  }

  multer.array("images")(req, res, (err: unknown) => {
    if (err) return next(err);
    next();
  });
}

export function uploadBrandImage(req: Request, res: Response, next: NextFunction) {
  const contentType = req.headers["content-type"] ?? "";

  if (!contentType.includes("multipart/form-data")) {
    return next();
  }
  
  if (!contentType.includes("boundary=")) {
    return res.status(400).json({
      message:
        'Content-Type inválido. Usa FormData y no establezcas "Content-Type" manualmente; el cliente debe incluir el boundary automáticamente.',
    });
  }
  
  multer.single("logo")(req, res, (err: unknown) => {
    if (err) return next(err);
    next();
  });
}
