import express from "express";
import multer from "multer";
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
  logo: z.string().optional(),
  email: z.string().email(),
  foundedYear: z.number().nullable().optional(),
  officeCount: z.number().nullable().optional(),
  gallery: z.array(z.string()).optional(),
  specialties: z.array(z.string()).optional(),
});
const updateCompanySchema = createCompanySchema.partial().extend({
  isVerified: z.boolean().optional(),
  coverImage: z.string().url().nullable().optional(),
  logo: z.union([z.string().url(), z.literal("logo.dev"), z.null()]).optional(),
}); // All fields are optional for update
const warnSchema = z.object({
  reason: z.union([
    z.string().min(1, "Reason is required and cannot be empty"),
    z.array(z.string().min(1)).min(1, "At least one reason is required")
  ]),
});
const suspendSchema = z.object({
  suspend: z.boolean(),
  reason: z.union([
    z.string().min(1, "Reason is required and cannot be empty"),
    z.array(z.string().min(1)).min(1, "At least one reason is required")
  ]).optional(),
});

const handleUploadError = (multerMiddleware) => (req, res, next) => {
  multerMiddleware(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ status: "error", code: "BAD_REQUEST", message: err.message });
    }
    if (err) {
      return res.status(400).json({ status: "error", code: "BAD_REQUEST", message: err.message });
    }
    next();
  });
};

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
