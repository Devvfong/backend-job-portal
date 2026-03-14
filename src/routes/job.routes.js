import express from "express";
import protect from "../middlewares/protect.middleware.js";
import authorize from "../middlewares/authorize.middleware.js";
import {
  createJob,
  getJobsController,
  getJobByIdController,
} from "../controllers/job.controller.js";

const router = express.Router();

// router.post("/create", protect, createJob);
router.post("/create", protect, authorize("company_admin"), createJob);
router.get("/", getJobsController);
router.get("/:id", getJobByIdController);

export default router;
