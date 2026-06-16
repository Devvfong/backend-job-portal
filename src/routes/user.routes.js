import express from "express";
import { z } from "zod";
import multer from "multer";
import protect from "../middlewares/protect.middleware.js";
import validate from "../middlewares/validate.middleware.js";
import { uploadAvatar, uploadResume } from "../middlewares/upload.middleware.js";
import decryptMiddleware from "../middlewares/decrypt.middleware.js";
import {
  createProfileController,
  getProfileController,
  getProfileByIdController,
  updateProfileController,
  updateUserController,
  getAllUsersController,
  deleteUserController,
  uploadAvatarController,
  uploadResumeController,
  getUserStatsController,
  suspendUserController,
  warnUserController,
} from "../controllers/user.controller.js";
import authorize from "../middlewares/authorize.middleware.js";

const router = express.Router();

const createProfileSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  headline: z.string().max(200).nullable().optional(),
  bio: z.string().max(500).nullable().optional(),
  location: z.string().max(500).nullable().optional(),
  phone: z.string().max(20).nullable().optional(),
  avatar: z.string().url().nullable().optional(),
  skills: z.array(z.string()).nullable().optional(),
  resume: z.string().url().nullable().optional(),
});
const updateProfileSchema = createProfileSchema.partial();
const adminUpdateProfileSchema = updateProfileSchema.extend({
  role: z.enum(["job_seeker", "company_admin", "super_admin"]).optional(),
  companyId: z.union([z.coerce.number().int().positive(), z.string().min(1)]).nullable().optional(),
});

// Wraps a multer .single() call and returns a clean JSON error on failure
const handleUploadError = (multerMiddleware) => (req, res, next) => {
  multerMiddleware(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      // e.g. file too large
      return res.status(400).json({ status: "error", message: err.message });
    }
    if (err) {
      // fileFilter rejection (wrong file type)
      return res.status(400).json({ status: "error", message: err.message });
    }
    next();
  });
};

// ─── Profile ───────────────────────────────────────────────────────────────
router.get("/profile", protect, getProfileController);
router.get("/profile/:id", decryptMiddleware, getProfileByIdController);
router.get("/me/stats", protect, getUserStatsController);
router.post("/profile", protect, validate(createProfileSchema), createProfileController);
router.put("/profile", protect, validate(updateProfileSchema), updateProfileController);

// ─── Admin User Routes ──────────────────────────────────────────────────────
// Super Admin can manage any user
router.get("/", protect, authorize("super_admin"), getAllUsersController);
router.put("/profile/:id", decryptMiddleware, protect, authorize("super_admin"), validate(adminUpdateProfileSchema), updateUserController);
router.delete("/:id", decryptMiddleware, protect, authorize("super_admin"), deleteUserController);
router.put("/:id/suspend", decryptMiddleware, protect, authorize("super_admin"), suspendUserController);
router.put("/:id/warn", decryptMiddleware, protect, authorize("super_admin"), warnUserController);

// ─── Uploads ───────────────────────────────────────────────────────────────
router.post("/avatar", protect, handleUploadError(uploadAvatar.single("avatar")), uploadAvatarController);
router.post("/resume", protect, handleUploadError(uploadResume.single("resume")), uploadResumeController);

export default router;


