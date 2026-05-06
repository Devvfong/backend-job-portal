import express from "express";
import { z } from "zod";
import protect from "../middlewares/protect.middleware.js";
import authorize from "../middlewares/authorize.middleware.js";
import validate from "../middlewares/validate.middleware.js";
import decryptMiddleware from "../middlewares/decrypt.middleware.js";
import {
  createJobController,
  getJobsController,
  getJobByIdController,
  updateJobController,
  deleteJobController,
  toggleSaveJobController,
  getSavedJobsController,
} from "../controllers/job.controller.js";

const router = express.Router();
const createJobSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  location: z.string().min(1),
  jobType: z.enum([
    "full_time",
    "part_time",
    "contract",
    "internship",
    "remote",
  ]),
  requirements: z.string().min(1),
  benefits: z.string().min(1),
  salaryMin: z.number().min(0),
  salaryMax: z.number().min(0),
  companyId: z.number().optional(),
});
const updateJobSchema = createJobSchema.partial(); // All fields are optional for update
router.post(
  "/create",
  protect,
  validate(createJobSchema),
  authorize("company_admin"),
  createJobController,
);
router.put(
  "/:id",
  decryptMiddleware,
  protect,
  validate(updateJobSchema),
  authorize("company_admin"),
  updateJobController,
);
router.delete("/:id", decryptMiddleware, protect, authorize("company_admin"), deleteJobController);

router.get("/", getJobsController);
router.get("/saved", protect, getSavedJobsController);
router.get("/:id", decryptMiddleware, getJobByIdController);
router.post("/:id/save", decryptMiddleware, protect, toggleSaveJobController);

export default router;
