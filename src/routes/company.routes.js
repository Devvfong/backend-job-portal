import express from "express";
import {
  createCompanyController,
  getCompanyController,
  getCompanyControllerById,
  getMyCompanyController,
  updateCompanyController,
  deleteCompanyController,
  uploadLogoController,
  deleteLogoController,
  uploadCoverController,
  deleteCoverController,
  getCompanyStatsController,
} from "../controllers/company.controller.js";
import { getMyCompanyJobsController } from "../controllers/job.controller.js";
import protect from "../middlewares/protect.middleware.js";
import authorize from "../middlewares/authorize.middleware.js";
import { uploadCompanyAsset } from "../middlewares/upload.middleware.js";
import decryptMiddleware from "../middlewares/decrypt.middleware.js";
const router = express.Router();
import validate from "../middlewares/validate.middleware.js";
import { z } from "zod";
const createCompanySchema = z.object({
  companyName: z.string().min(1),
  description: z.string().min(1),
  location: z.string().min(1),
  website: z.string().url().optional(),
  industry: z.string().min(1),
  size: z.string().min(1),
  logo: z.string().url().optional(),
  email: z.string().email(),
});
const updateCompanySchema = createCompanySchema.partial(); // All fields are optional for update

router.get("/", getCompanyController);

router.post(
  "/logo",
  protect,
  authorize("company_admin"),
  uploadCompanyAsset.single("logo"),
  uploadLogoController,
);

router.delete(
  "/logo",
  protect,
  authorize("company_admin"),
  deleteLogoController,
);

router.post(
  "/cover",
  protect,
  authorize("company_admin"),
  uploadCompanyAsset.single("cover"),
  uploadCoverController,
);

router.delete(
  "/cover",
  protect,
  authorize("company_admin"),
  deleteCoverController,
);

router.get(
  "/me/stats",
  protect,
  authorize("company_admin"),
  getCompanyStatsController,
);

router.get(
  "/me/jobs",
  protect,
  authorize("company_admin"),
  getMyCompanyJobsController,
);

router.get(
  "/me",
  protect,
  authorize("company_admin"),
  getMyCompanyController,
);

router.post(
  "/create",
  protect,
  validate(createCompanySchema),
  createCompanyController,
);

router.get("/:id", decryptMiddleware, getCompanyControllerById);
router.put(
  "/:id",
  decryptMiddleware,
  protect,
  validate(updateCompanySchema),
  updateCompanyController,
);
router.delete("/:id", decryptMiddleware, protect, deleteCompanyController);

export default router;
