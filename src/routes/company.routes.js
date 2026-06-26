import express from "express";
import {
  createCompanyController,
  getCompanyController,
  getCompanyControllerById,
  getMyCompanyController,
  updateMyCompanyController,
  updateCompanyController,
  deleteCompanyController,
  uploadLogoController,
  deleteLogoController,
  uploadCoverController,
  deleteCoverController,
  deleteCoverByIdController,
  uploadGalleryController,
  getCompanyStatsController,
  suspendCompanyController,
  warnCompanyController,
} from "../controllers/company.controller.js";
import { getMyCompanyJobsController } from "../controllers/job.controller.js";
import protect from "../middlewares/protect.middleware.js";
import authorize from "../middlewares/authorize.middleware.js";
import { uploadCompanyAsset, handleUploadError } from "../middlewares/upload.middleware.js";
import decryptMiddleware from "../middlewares/decrypt.middleware.js";
import validate from "../middlewares/validate.middleware.js";
import { z } from "zod";

const router = express.Router();

const updateCompanySchema = z.object({
  companyName: z.string().optional(),
  website: z.string().optional(),
  description: z.string().optional(),
  industry: z.string().optional(),
  companySize: z.string().optional(),
  foundedYear: z.number().optional(),
  headquarters: z.string().optional(),
  officeCount: z.number().optional(),
  specialties: z.array(z.string()).optional(),
  mapUrl: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
}).passthrough();

const createCompanySchema = z.object({
  companyName: z.string().min(1),
}).passthrough();

const suspendSchema = z.object({
  suspend: z.boolean(),
  reason: z.any().optional(),
});

const warnSchema = z.object({
  reason: z.any(),
});
router.get("/", getCompanyController);

router.post(
  "/logo",
  protect,
  authorize("company_admin"),
  handleUploadError(uploadCompanyAsset.single("logo")),
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
  handleUploadError(uploadCompanyAsset.single("cover")),
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

router.put(
  "/me",
  protect,
  authorize("company_admin"),
  validate(updateCompanySchema),
  updateMyCompanyController,
);

router.post(
  "/upload",
  protect,
  authorize("company_admin"),
  handleUploadError(uploadCompanyAsset.single("file")),
  uploadGalleryController,
);

router.post(
  "/create",
  protect,
  authorize("company_admin"),
  validate(createCompanySchema),
  createCompanyController,
);

router.delete(
  "/:id/cover",
  decryptMiddleware,
  protect,
  authorize("super_admin"),
  deleteCoverByIdController,
);

router.get("/:id", decryptMiddleware, getCompanyControllerById);
router.put(
  "/:id",
  decryptMiddleware,
  protect,
  validate(updateCompanySchema),
  updateCompanyController,
);
router.put(
  "/:id/suspend",
  decryptMiddleware,
  protect,
  authorize("super_admin"),
  validate(suspendSchema),
  suspendCompanyController,
);
router.put(
  "/:id/warn",
  decryptMiddleware,
  protect,
  authorize("super_admin"),
  validate(warnSchema),
  warnCompanyController,
);
router.delete("/:id", decryptMiddleware, protect, deleteCompanyController);

export default router;
