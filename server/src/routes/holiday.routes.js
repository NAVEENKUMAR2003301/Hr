import { Router } from "express";
import { authMiddleware } from "../middleware/auth.js";
import { roleMiddleware } from "../middleware/roleCheck.js";
import { index, create, remove } from "../controllers/holiday.controller.js";

const router = Router();

router.use(authMiddleware);

router.get("/", index);
router.post("/", roleMiddleware(["ADMIN"]), create);
router.delete("/:id", roleMiddleware(["ADMIN"]), remove);

export default router;
