import { Router } from "express";

import * as measurementController from "../controllers/measurement.controller";

const measurementRoutes = Router();

measurementRoutes.get("/", measurementController.listMeasurements);
measurementRoutes.get("/:id", measurementController.getMeasurement);
measurementRoutes.post("/", measurementController.createMeasurement);
measurementRoutes.put("/:id", measurementController.updateMeasurement);
measurementRoutes.delete("/:id", measurementController.deleteMeasurement);

export default measurementRoutes;
