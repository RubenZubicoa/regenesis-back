import { Router } from "express";

import * as videoLibraryController from "../controllers/videoLibrary.controller";

const videoLibraryRoutes = Router();

videoLibraryRoutes.get("/", videoLibraryController.listVideoLibraries);
videoLibraryRoutes.get("/:id", videoLibraryController.getVideoLibrary);
videoLibraryRoutes.post("/", videoLibraryController.createVideoLibrary);
videoLibraryRoutes.put("/:id", videoLibraryController.updateVideoLibrary);
videoLibraryRoutes.delete("/:id", videoLibraryController.deleteVideoLibrary);

export default videoLibraryRoutes;
