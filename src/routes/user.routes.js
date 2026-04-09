import express from "express";
import { z } from "zod";
import multer from "multer";
import protect from "../middlewares/protect.middleware.js";
import validate from "../middlewares/validate.middleware.js";
import { uploadAvatar, uploadResume } from "../middlewares/upload.middleware.js";
import {
  createProfileController,
  getProfileController,
  updateProfileController,
  updateUserController,
  uploadAvatarController,
  uploadResumeController,
} 
from "../controllers/user.controller.js";
import authorize from "../middlewares/authorize.middleware.js";

const router = express.Router();

const createProfileSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  headline: z.string().max(100).optional(),
  bio: z.string().max(200).optional(),
  location: z.string().max(100).optional(),
  phone: z.string().max(20).optional(),
  avatar: z.string().url().optional(),
  skills: z.array(z.string()).optional(),
  resume: z.string().url().optional(),
});
const updateProfileSchema = createProfileSchema.partial();

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
router.post("/profile", protect, validate(createProfileSchema), createProfileController);
router.put("/profile", protect, validate(updateProfileSchema), updateProfileController);

// ─── Admin User Routes ──────────────────────────────────────────────────────
// Super Admin can manage any user
router.put("/profile/:id", protect, authorize("super_admin"), validate(updateProfileSchema), updateUserController);

// ─── Uploads ───────────────────────────────────────────────────────────────
router.post("/avatar", protect, handleUploadError(uploadAvatar.single("avatar")), uploadAvatarController);
router.post("/resume", protect, handleUploadError(uploadResume.single("resume")), uploadResumeController);

export default router;


