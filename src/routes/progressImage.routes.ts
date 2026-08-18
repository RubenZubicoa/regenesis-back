import type { NextFunction, Request, Response } from "express";
import { Router } from "express";

import * as progressImageController from "../controllers/progressImage.controller";
import upload from "../libs/multer";

const progressImageRoutes = Router();

function handleUpload(req: Request, res: Response, next: NextFunction) {
  upload.single("image")(req, res, (err: unknown) => {
    if (err) {
      const message = err instanceof Error ? err.message : "Error al subir la imagen";
      return res.status(400).json({ message });
    }
    next();
  });
}

progressImageRoutes.get("/", progressImageController.listImages);
progressImageRoutes.get("/:id", progressImageController.getImage);
progressImageRoutes.post("/", handleUpload, progressImageController.uploadImage);
progressImageRoutes.delete("/:id", progressImageController.deleteImage);

export default progressImageRoutes;
