import express from "express";
import { z } from "zod";
import protect from "../middlewares/protect.middleware.js";
import validate from "../middlewares/validate.middleware.js";
import {
  createProfileController,
  getProfileController,
  updateProfileController,
} from "../controllers/user.controller.js";
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
const updateProfileSchema = createProfileSchema.partial(); // All fields are optional for update

router.get("/profile", protect, getProfileController);
router.post(
  "/profile",
  protect,
  validate(createProfileSchema),
  createProfileController,
);
router.put(
  "/profile",
  protect,
  validate(updateProfileSchema),
  updateProfileController,
);

export default router;
