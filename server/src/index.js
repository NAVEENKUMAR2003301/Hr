import "dotenv/config";
import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import path from "node:path";

import authRoutes from "./routes/auth.routes.js";
import dashboardRoutes from "./routes/dashboard.routes.js";
import employeeRoutes from "./routes/employee.routes.js";
import departmentRoutes from "./routes/department.routes.js";
import designationRoutes from "./routes/designation.routes.js";
import leaveRoutes from "./routes/leave.routes.js";
import leavePolicyRoutes from "./routes/leavePolicy.routes.js";
import leaveBalanceRoutes from "./routes/leaveBalance.routes.js";
import onboardingRoutes from "./routes/onboarding.routes.js";
import onboardingTemplateRoutes from "./routes/onboardingTemplate.routes.js";
import performanceRoutes from "./routes/performance.routes.js";
import feedbackCategoryRoutes from "./routes/feedbackCategory.routes.js";
import holidayRoutes from "./routes/holiday.routes.js";
import auditLogRoutes from "./routes/auditLog.routes.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { authMiddleware } from "./middleware/auth.js";
import { ownershipMiddleware } from "./middleware/ownership.js";
import { UPLOAD_ROOT } from "./middleware/upload.js";

const app = express();

app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.get("/api/health", (req, res) => res.json({ ok: true }));

app.use("/api/auth", authRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api/departments", departmentRoutes);
app.use("/api/designations", designationRoutes);
app.use("/api/leaves", leaveRoutes);
app.use("/api/leave-policies", leavePolicyRoutes);
app.use("/api/leave-balances", leaveBalanceRoutes);
app.use("/api/onboarding", onboardingRoutes);
app.use("/api/onboarding-templates", onboardingTemplateRoutes);
app.use("/api/performance", performanceRoutes);
app.use("/api/feedback-categories", feedbackCategoryRoutes);
app.use("/api/holidays", holidayRoutes);
app.use("/api/audit-log", auditLogRoutes);

// Employee documents are PII (ID proofs, etc.) — gate them behind the same auth +
// ownership check as the employee record itself, instead of a blanket express.static
// that would let anyone with the URL download a file unauthenticated.
const SAFE_DOCUMENT_EXTENSIONS = new Set([".pdf", ".jpg", ".jpeg", ".png", ".webp", ".doc", ".docx"]);

app.get(
  "/uploads/employee-documents/:id/:filename",
  authMiddleware,
  ownershipMiddleware("id"),
  (req, res) => {
    // path.basename strips any directory components regardless of encoding tricks
    // (e.g. an encoded "../"), so this can never resolve outside UPLOAD_ROOT/:id.
    const safeName = path.basename(req.params.filename);
    if (!SAFE_DOCUMENT_EXTENSIONS.has(path.extname(safeName).toLowerCase())) {
      return res.status(400).json({ error: "Unsupported file type" });
    }

    const filePath = path.join(UPLOAD_ROOT, req.params.id, safeName);
    res.sendFile(filePath, (err) => {
      if (err && !res.headersSent) res.status(404).json({ error: "File not found" });
    });
  }
);

app.use(errorHandler);

const port = process.env.PORT || 4000;
app.listen(port, () => console.log(`HR portal API listening on :${port}`));
