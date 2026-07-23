import { Router } from "express";

import * as measurementMasterController from "../controllers/measurementMaster.controller";

const measurementMasterRoutes = Router();

measurementMasterRoutes.get("/", measurementMasterController.listMeasurementMasters);
measurementMasterRoutes.get("/:id", measurementMasterController.getMeasurementMaster);
measurementMasterRoutes.post("/", measurementMasterController.createMeasurementMaster);
measurementMasterRoutes.put("/:id", measurementMasterController.updateMeasurementMaster);
measurementMasterRoutes.delete("/:id", measurementMasterController.deleteMeasurementMaster);

export default measurementMasterRoutes;
