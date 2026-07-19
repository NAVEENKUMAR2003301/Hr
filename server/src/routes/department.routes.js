import { Router } from "express";
import { authMiddleware } from "../middleware/auth.js";
import { roleMiddleware } from "../middleware/roleCheck.js";
import { index, show, create, update, remove } from "../controllers/department.controller.js";

const router = Router();

router.use(authMiddleware);

router.get("/", index);
router.get("/:id", show);
router.post("/", roleMiddleware(["ADMIN"]), create);
router.patch("/:id", roleMiddleware(["ADMIN"]), update);
router.delete("/:id", roleMiddleware(["ADMIN"]), remove);

export default router;
