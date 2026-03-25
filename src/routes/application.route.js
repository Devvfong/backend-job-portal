import express from "express";
import {
  applyToJobController,
  getMyApplicationsController,
  getApplicantsController,
  updateApplicationStatusController,
} from "../controllers/application.controller.js";
import protect from "../middlewares/protect.middleware.js";
import authorize from "../middlewares/authorize.middleware.js";

const router = express.Router();

// 💼 USER (Job Seeker) ENDPOINTS
router.post("/job/:id/apply", protect, applyToJobController);
router.get("/me", protect, getMyApplicationsController);

// 🏢 RECRUITER (Company Admin) ENDPOINTS
router.get("/job/:id/applicants", protect, authorize("company_admin"), getApplicantsController);
router.patch("/:id/status", protect, authorize("company_admin"), updateApplicationStatusController);

export default router;
