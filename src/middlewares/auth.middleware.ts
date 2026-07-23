import type { NextFunction, Request, Response } from "express";
import { verifyToken } from "../libs/jwt";

type JwtPayloadLike = {
  user?: unknown;
  [key: string]: unknown;
};

function getBearerToken(req: Request): string | null {
  const header = req.header("authorization") || req.header("Authorization");
  if (!header) return null;
  const [scheme, token] = header.split(" ");
  if (!scheme || scheme.toLowerCase() !== "bearer" || !token) return null;
  return token.trim();
}

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const token = getBearerToken(req);
  if (!token) {
    return res.status(401).json({ message: "No autenticado: falta JWT (Bearer token)" });
  }

  try {
    const decoded = verifyToken(token) as JwtPayloadLike;
    (req as Request & { user?: unknown }).user = decoded?.user ?? decoded;
    return next();
  } catch {
    return res.status(401).json({ message: "No autenticado: JWT inválido o expirado" });
  }
}

