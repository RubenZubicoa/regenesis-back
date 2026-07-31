import { Router } from "express";

import * as workoutHistoryController from "../controllers/workoutHistory.controller";

const workoutHistoryRoutes = Router();

workoutHistoryRoutes.get("/", workoutHistoryController.listWorkoutHistory);
workoutHistoryRoutes.get("/:clientId", workoutHistoryController.listWorkoutHistoryByClient);
workoutHistoryRoutes.post("/", workoutHistoryController.createWorkoutHistory);
workoutHistoryRoutes.put("/:id", workoutHistoryController.updateWorkoutHistory);
workoutHistoryRoutes.delete("/:id", workoutHistoryController.deleteWorkoutHistory);

export default workoutHistoryRoutes;
