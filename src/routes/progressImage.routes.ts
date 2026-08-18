import { Router } from "express";

import * as progressImageController from "../controllers/progressImage.controller";
import upload from "../libs/multer";

const progressImageRoutes = Router();

progressImageRoutes.get("/", progressImageController.listImages);
progressImageRoutes.get("/:id", progressImageController.getImage);
progressImageRoutes.post(
  "/",
  upload.single("image"),
  progressImageController.uploadImage,
);
progressImageRoutes.delete("/:id", progressImageController.deleteImage);

export default progressImageRoutes;
