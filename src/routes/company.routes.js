import express from "express";
import {
  createCompanyController,
  getCompanyController,
  getCompanyControllerById,
  updateCompanyController,
  deleteCompanyController,
  uploadLogoController,
  deleteLogoController
} from "../controllers/company.controller.js";
import protect from "../middlewares/protect.middleware.js";
import authorize from "../middlewares/authorize.middleware.js";
import { uploadLogo } from "../middlewares/upload.middleware.js";
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
  uploadLogo.single("logo"),
  uploadLogoController,
);

router.delete(
  "/logo",
  protect,
  authorize("company_admin"),
  deleteLogoController,
);

router.post(
  "/create",
  protect,
  validate(createCompanySchema),
  createCompanyController,
);

router.get("/:id", getCompanyControllerById);
router.put(
  "/:id",
  protect,
  validate(updateCompanySchema),
  updateCompanyController,
);
router.delete("/:id", protect, deleteCompanyController);

export default router;
