import { Router } from "express";
import { authMiddleware } from "../middleware/auth.js";
import { roleMiddleware } from "../middleware/roleCheck.js";
import { index } from "../controllers/auditLog.controller.js";

const router = Router();

router.use(authMiddleware, roleMiddleware(["ADMIN"]));

router.get("/", index);

export default router;
