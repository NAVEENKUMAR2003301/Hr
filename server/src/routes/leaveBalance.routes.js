import { Router } from "express";
import { authMiddleware } from "../middleware/auth.js";
import { roleMiddleware } from "../middleware/roleCheck.js";
import { index, update, remove } from "../controllers/leaveBalance.controller.js";

const router = Router();

router.use(authMiddleware, roleMiddleware(["ADMIN"]));

router.get("/", index);
router.patch("/:id", update);
router.delete("/:id", remove);

export default router;
