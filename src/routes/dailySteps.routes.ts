import { Router } from "express";

import * as dailyStepsController from "../controllers/dailySteps.controller";

const dailyStepsRoutes = Router();

dailyStepsRoutes.get("/", dailyStepsController.listDailySteps);
dailyStepsRoutes.get("/:clientId", dailyStepsController.listDailyStepsByClient);
dailyStepsRoutes.post("/", dailyStepsController.createDailySteps);
dailyStepsRoutes.put("/:id", dailyStepsController.updateDailySteps);
dailyStepsRoutes.delete("/:id", dailyStepsController.deleteDailySteps);

export default dailyStepsRoutes;
