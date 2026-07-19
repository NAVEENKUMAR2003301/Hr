import { Router } from "express";
import { authMiddleware } from "../middleware/auth.js";
import { roleMiddleware } from "../middleware/roleCheck.js";
import { myRequests, apply, listAll, managerDecision, hrDecision } from "../controllers/leave.controller.js";

const router = Router();

router.use(authMiddleware);

router.get("/me", myRequests);
router.post("/me", apply);

router.get("/", roleMiddleware(["ADMIN", "MANAGER"]), listAll);
router.post("/:id/manager-decision", roleMiddleware(["MANAGER", "ADMIN"]), managerDecision);
router.post("/:id/hr-decision", roleMiddleware(["ADMIN"]), hrDecision);

export default router;
