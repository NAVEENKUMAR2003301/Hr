import { Router } from "express";
import { login, refresh, logout, me, changePassword } from "../controllers/auth.controller.js";
import { authMiddleware } from "../middleware/auth.js";

const router = Router();

router.post("/login", login);
router.post("/refresh", refresh);
router.post("/logout", authMiddleware, logout);
router.get("/me", me);
router.post("/change-password", authMiddleware, changePassword);

export default router;
