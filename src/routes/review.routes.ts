import { Router } from "express";

import * as reviewController from "../controllers/review.controller";

const reviewRoutes = Router();

reviewRoutes.get("/", reviewController.listReviews);
reviewRoutes.get("/client/:clientId", reviewController.listReviewsByClient);
reviewRoutes.get("/:id", reviewController.getReview);
reviewRoutes.post("/", reviewController.createReview);
reviewRoutes.put("/:id", reviewController.updateReview);
reviewRoutes.delete("/:id", reviewController.deleteReview);

export default reviewRoutes;
