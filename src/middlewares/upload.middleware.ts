import type { NextFunction, Request, Response } from "express";
import upload from "../libs/multer";

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

  upload.array("images")(req, res, (err: unknown) => {
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

  upload.single("logo")(req, res, (err: unknown) => {
    if (err) return next(err);
    next();
  });
}

/** Foto de perfil del cliente: campos "avatar" o "image". Si no es multipart, sigue (JSON). */
export function uploadClientAvatar(req: Request, res: Response, next: NextFunction) {
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

  upload.fields([
    { name: "avatar", maxCount: 1 },
    { name: "image", maxCount: 1 },
  ])(req, res, (err: unknown) => {
    if (err) {
      const message = err instanceof Error ? err.message : "Error al subir la imagen";
      return res.status(400).json({ message });
    }
    const files = req.files as Record<string, Express.Multer.File[]> | undefined;
    req.file = files?.avatar?.[0] ?? files?.image?.[0];
    next();
  });
}
