import { Router } from "express";
import { authMiddleware } from "../middleware/auth.js";
import { roleMiddleware } from "../middleware/roleCheck.js";
import {
  listProcesses,
  myProcess,
  completeTask,
  updateDates,
  setPaymentStatus,
  sendOfferLetter,
  sendAppointmentLetter,
  removeProcess,
} from "../controllers/onboarding.controller.js";

const router = Router();

router.use(authMiddleware);

router.get("/", roleMiddleware(["ADMIN"]), listProcesses);
router.get("/me", myProcess);
router.patch("/tasks/:taskId/complete", completeTask);

router.patch("/:processId/dates", roleMiddleware(["ADMIN"]), updateDates);
router.post("/:processId/payment", roleMiddleware(["ADMIN"]), setPaymentStatus);
router.post("/:processId/offer-letter", roleMiddleware(["ADMIN"]), sendOfferLetter);
router.post("/:processId/appointment-letter", roleMiddleware(["ADMIN"]), sendAppointmentLetter);
router.delete("/:processId", roleMiddleware(["ADMIN"]), removeProcess);

export default router;
