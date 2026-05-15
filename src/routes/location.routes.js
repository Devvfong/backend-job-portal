import express from "express";
import { getJobLocationsController } from "../controllers/location.controller.js";

const router = express.Router();

router.get("/", getJobLocationsController);

export default router;
