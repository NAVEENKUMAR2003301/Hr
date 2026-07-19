import { Router } from "express";
import {
  login,
  refresh,
  logout,
  me,
  changePassword,
  signup,
  forgotPassword,
  resetPassword,
} from "../controllers/auth.controller.js";
import { authMiddleware } from "../middleware/auth.js";
import { authLimiter } from "../middleware/rateLimit.js";

const router = Router();

router.post("/login", authLimiter, login);
router.post("/signup", authLimiter, signup);
router.post("/forgot-password", authLimiter, forgotPassword);
router.post("/reset-password", authLimiter, resetPassword);
router.post("/refresh", refresh);
router.post("/logout", authMiddleware, logout);
router.get("/me", me);
router.post("/change-password", authMiddleware, authLimiter, changePassword);

export default router;
