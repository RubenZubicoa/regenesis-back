import type { NextFunction, Request, Response } from "express";

import * as reviewService from "../services/review.service";

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

/** GET /api/reviews?status=upcoming|done|canceled */
export async function listReviews(req: Request, res: Response, next: NextFunction) {
  try {
    const status = typeof req.query.status === "string" ? req.query.status : undefined;
    const reviews = await reviewService.listReviews(status);
    res.json(reviews);
  } catch (err) {
    sendServiceError(err, res, next);
  }
}

/** GET /api/reviews/client/:clientId */
export async function listReviewsByClient(req: Request, res: Response, next: NextFunction) {
  try {
    const reviews = await reviewService.getReviewsByClientId(req.params.clientId as string);
    res.json(reviews);
  } catch (err) {
    sendServiceError(err, res, next);
  }
}

export async function getReview(req: Request, res: Response, next: NextFunction) {
  try {
    const review = await reviewService.getReviewById(req.params.id as string);
    res.json(review);
  } catch (err) {
    sendServiceError(err, res, next);
  }
}

export async function createReview(req: Request, res: Response, next: NextFunction) {
  try {
    const review = await reviewService.createReview(req.body);
    res.status(201).json(review);
  } catch (err) {
    sendServiceError(err, res, next);
  }
}

export async function updateReview(req: Request, res: Response, next: NextFunction) {
  try {
    const review = await reviewService.updateReview(req.params.id as string, req.body);
    res.json(review);
  } catch (err) {
    sendServiceError(err, res, next);
  }
}

export async function deleteReview(req: Request, res: Response, next: NextFunction) {
  try {
    await reviewService.deleteReview(req.params.id as string);
    res.status(204).send();
  } catch (err) {
    sendServiceError(err, res, next);
  }
}
