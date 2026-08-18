import { Router } from "express";

import * as socialFeedController from "../controllers/socialFeed.controller";

const socialFeedRoutes = Router();

socialFeedRoutes.get("/stats", socialFeedController.getCommunityStats);
socialFeedRoutes.get("/", socialFeedController.listSocialFeed);

export default socialFeedRoutes;
