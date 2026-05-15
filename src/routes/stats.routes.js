import express from "express";
import { getGlobalStatsController } from "../controllers/stats.controller.js";

const router = express.Router();

router.get("/", getGlobalStatsController);

export default router;
