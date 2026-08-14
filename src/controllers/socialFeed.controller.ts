import type { NextFunction, Request, Response } from "express";

import type { SocialFeedKind } from "../entities/SocialFeed";
import * as socialFeedService from "../services/socialFeed.service";

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

const VALID_KINDS: SocialFeedKind[] = [
  "workout",
  "weight",
  "measurement",
  "steps",
  "wellness",
  "photos",
  "challenge",
];

function parseKind(value: unknown): SocialFeedKind | undefined {
  const kind = String(value ?? "");
  return VALID_KINDS.includes(kind as SocialFeedKind) ? (kind as SocialFeedKind) : undefined;
}

/** GET /api/social-feed?kind=workout&limit=50 */
export async function listSocialFeed(req: Request, res: Response, next: NextFunction) {
  try {
    const kind = parseKind(req.query.kind);
    const limitRaw = Number(req.query.limit ?? 100);
    const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(1, limitRaw), 200) : 100;
    const feed = await socialFeedService.listSocialFeed(kind, limit);
    res.json(feed);
  } catch (err) {
    sendServiceError(err, res, next);
  }
}
