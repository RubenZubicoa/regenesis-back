import type { NextFunction, Request, Response } from "express";

export function errorMiddleware(err: Error, _req: Request, res: Response, _next: NextFunction) {
  console.error(err.message, err.stack);

  if (err.message === "request entity too large" || (err as { type?: string }).type === "entity.too.large") {
    return res.status(413).json({
      message: "El archivo o la petición supera el tamaño máximo permitido (10 MB)",
    });
  }

  const status = (err as Error & { status?: number }).status;
  if (typeof status === "number" && status >= 400 && status < 500) {
    return res.status(status).json({ message: err.message });
  }

  res.status(500).json({ message: "Error interno del servidor", error: err.message });
}
