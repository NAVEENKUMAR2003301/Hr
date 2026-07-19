import { Router } from "express";
import { authMiddleware } from "../middleware/auth.js";
import { roleMiddleware } from "../middleware/roleCheck.js";
import { index, create, update, remove } from "../controllers/onboardingTemplate.controller.js";

const router = Router();

router.use(authMiddleware, roleMiddleware(["ADMIN"]));

router.get("/", index);
router.post("/", create);
router.patch("/:id", update);
router.delete("/:id", remove);

export default router;
