import express from "express";
import { z } from "zod";
import {
  register,
  login,
  logout,
  getMe,
} from "../controllers/auth.controller.js";
import validate from "../middlewares/validate.middleware.js";
import protect from "../middlewares/protect.middleware.js";
import authorize from "../middlewares/authorize.middleware.js";

const router = express.Router();
// Validation schemas for registration and login
const registerSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
});
// Validation schema for login
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

router.post("/register", validate(registerSchema), register); // validate middleware will validate the request body against the registerSchema before calling the register controller
router.post("/login", validate(loginSchema), login); // validate middleware will validate the request body against the loginSchema before calling the login controller
router.get("/", protect, authorize("company_admin"), (req, res) => { // protect middleware will check if the user is authenticated and authorize middleware will check if the user has the required role
  return res.status(200).json({
    status: "success",
    message: "Authenticated auth endpoint",
    data: {
      userId: req.user.id,
      email: req.user.email,
      role: req.user.role,
    },
  });
});
router.post("/logout", protect, logout);
router.get("/me", protect, getMe);
export default router;
