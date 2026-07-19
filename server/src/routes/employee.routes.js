import { Router } from "express";
import { authMiddleware } from "../middleware/auth.js";
import { roleMiddleware } from "../middleware/roleCheck.js";
import { ownershipMiddleware } from "../middleware/ownership.js";
import { uploadDocument, uploadSpreadsheet } from "../middleware/upload.js";
import {
  index,
  show,
  create,
  createCandidateIntake,
  update,
  setIdCardStatus,
  deactivate,
  nextEmployeeCode,
} from "../controllers/employee.controller.js";
import * as documents from "../controllers/employeeDocument.controller.js";
import { exportEmployees, importEmployees } from "../controllers/excelImportExport.controller.js";

const router = Router();

router.use(authMiddleware);

router.get("/next-code", roleMiddleware(["ADMIN"]), nextEmployeeCode);
router.get("/export", roleMiddleware(["ADMIN"]), exportEmployees);
router.post("/import", roleMiddleware(["ADMIN"]), uploadSpreadsheet.single("file"), importEmployees);
router.get("/", roleMiddleware(["ADMIN", "MANAGER"]), index);
router.get("/:id", ownershipMiddleware("id"), show);
router.post("/", roleMiddleware(["ADMIN"]), create);
router.post("/candidates", roleMiddleware(["ADMIN"]), createCandidateIntake);
router.patch("/:id", roleMiddleware(["ADMIN"]), update);
router.patch("/:id/id-card", roleMiddleware(["ADMIN"]), setIdCardStatus);
router.delete("/:id", roleMiddleware(["ADMIN"]), deactivate);

router.get("/:id/documents", ownershipMiddleware("id"), documents.index);
router.post("/:id/documents", roleMiddleware(["ADMIN"]), uploadDocument.single("file"), documents.upload);
router.delete("/:id/documents/:docId", roleMiddleware(["ADMIN"]), documents.remove);

export default router;
