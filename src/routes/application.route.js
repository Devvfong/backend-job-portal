import express from "express";
import {
  applyToJobController,
  getMyApplicationsController,
  getApplicantsController,
  updateApplicationStatusController,
  withdrawApplicationController,
  getCompanyApplicantsController,
} from "../controllers/application.controller.js";
import protect from "../middlewares/protect.middleware.js";
import authorize from "../middlewares/authorize.middleware.js";
import decryptMiddleware from "../middlewares/decrypt.middleware.js";

const router = express.Router();

// 💼 USER (Job Seeker) ENDPOINTS
router.post("/job/:id/apply", decryptMiddleware, protect, applyToJobController);
router.get("/me", protect, getMyApplicationsController);
router.delete("/:id", decryptMiddleware, protect, withdrawApplicationController);

// 🏢 RECRUITER (Company Admin) ENDPOINTS
router.get("/company", protect, authorize("company_admin"), getCompanyApplicantsController);
router.get("/job/:id/applicants", decryptMiddleware, protect, authorize("company_admin"), getApplicantsController);
router.patch("/:id/status", decryptMiddleware, protect, authorize("company_admin"), updateApplicationStatusController);

export default router;
