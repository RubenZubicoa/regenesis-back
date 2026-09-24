import { Router } from "express";

import * as exerciseMasterController from "../controllers/exerciseMaster.controller";
import { uploadExerciseImage } from "../middlewares/upload.middleware";

const router = Router();

router.get("/", exerciseMasterController.listExerciseMasters);
router.get("/:id", exerciseMasterController.getExerciseMaster);
router.post("/", uploadExerciseImage, exerciseMasterController.createExerciseMaster);
router.put("/:id", uploadExerciseImage, exerciseMasterController.updateExerciseMaster);
router.delete("/:id", exerciseMasterController.deleteExerciseMaster);

export default router;
