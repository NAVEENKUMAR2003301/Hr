import { Router } from "express";
import { authMiddleware } from "../middleware/auth.js";
import { roleMiddleware } from "../middleware/roleCheck.js";
import { summary } from "../controllers/dashboard.controller.js";

const router = Router();

router.use(authMiddleware, roleMiddleware(["ADMIN", "MANAGER"]));

router.get("/", summary);

export default router;
