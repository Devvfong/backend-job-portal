import express from "express";
import protect from "../middlewares/protect.middleware.js";
import {
  createProfileController,
  getProfileController,
  updateProfileController,
} from "../controllers/user.controller.js";

const router = express.Router();
router.get("/profile", protect, getProfileController);
router.post("/profile", protect, createProfileController);
router.put("/profile", protect, updateProfileController);

export default router;
