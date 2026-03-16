import express from "express";
import protect from "../middlewares/protect.middleware.js";
import authorize from "../middlewares/authorize.middleware.js";
import {
  createJobController,
  getJobsController,
  getJobByIdController,
  updateJobController,
  deleteJobController,
} from "../controllers/job.controller.js";

const router = express.Router();

// router.post("/create", protect, createJob);
router.post(
  "/create",
  protect,
  authorize("company_admin"),
  createJobController,
); // only company admin can create job, protect middleware will check if the user is authenticated, authorize middleware will check if the user has the role of company admin before calling the createJobController);
router.put("/:id", protect, authorize("company_admin"), updateJobController);
router.delete("/:id", protect, authorize("company_admin"), deleteJobController);
router.get("/", getJobsController);
router.get("/:id", getJobByIdController);
export default router;
