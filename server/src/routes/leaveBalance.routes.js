import { Router } from "express";
import { authMiddleware } from "../middleware/auth.js";
import { roleMiddleware } from "../middleware/roleCheck.js";
import { index, update } from "../controllers/leaveBalance.controller.js";

const router = Router();

router.use(authMiddleware, roleMiddleware(["ADMIN"]));

router.get("/", index);
router.patch("/:id", update);

export default router;
