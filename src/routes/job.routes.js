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
const baseJobSchema = z.object({
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
  requirements: z.string().optional().or(z.literal("")),
  benefits: z.string().optional().or(z.literal("")),
  salaryNegotiable: z.boolean().optional().default(false),
  salaryMin: z.coerce.number().min(0).optional(),
  salaryMax: z.coerce.number().min(0).optional(),
  category: z.string().optional().or(z.literal("")),
  skills: z.array(z.string()).optional().default([]),
  tags: z.array(z.string()).optional().default([]),
  companyId: z.number().optional(),
  status: z.enum(["open", "closed"]).optional(),
});
const createJobSchema = baseJobSchema.refine((data) => data.salaryNegotiable || (data.salaryMin != null && data.salaryMax != null), {
  message: "Provide salaryMin and salaryMax unless salaryNegotiable is true",
  path: ["salaryMin"],
});
const updateJobSchema = baseJobSchema.partial(); // All fields are optional for update
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
