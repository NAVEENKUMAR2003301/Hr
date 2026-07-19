import { Router } from "express";
import { authMiddleware } from "../middleware/auth.js";
import { roleMiddleware } from "../middleware/roleCheck.js";
import {
  listCycles,
  createCycle,
  updateCycle,
  activateCycle,
  closeCycle,
  removeCycle,
  listAllReviews,
  myReviews,
  submitRating,
  acknowledgeReview,
} from "../controllers/performance.controller.js";

const router = Router();

router.use(authMiddleware);

router.get("/cycles", listCycles);
router.post("/cycles", roleMiddleware(["ADMIN"]), createCycle);
router.patch("/cycles/:id", roleMiddleware(["ADMIN"]), updateCycle);
router.post("/cycles/:id/activate", roleMiddleware(["ADMIN"]), activateCycle);
router.post("/cycles/:id/close", roleMiddleware(["ADMIN"]), closeCycle);
router.delete("/cycles/:id", roleMiddleware(["ADMIN"]), removeCycle);

router.get("/reviews", roleMiddleware(["ADMIN"]), listAllReviews);
router.get("/reviews/me", myReviews);
router.post("/reviews/:id/ratings", submitRating);
router.post("/reviews/:id/acknowledge", acknowledgeReview);

export default router;
