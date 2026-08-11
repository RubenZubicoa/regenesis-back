import { Router } from "express";

import * as exerciseMasterController from "../controllers/exerciseMaster.controller";

const router = Router();

router.get("/", exerciseMasterController.listExerciseMasters);
router.get("/:id", exerciseMasterController.getExerciseMaster);
router.post("/", exerciseMasterController.createExerciseMaster);
router.put("/:id", exerciseMasterController.updateExerciseMaster);
router.delete("/:id", exerciseMasterController.deleteExerciseMaster);

export default router;
