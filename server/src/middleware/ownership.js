// For /user/* routes: ensures the caller can only touch their own employee record.
// ADMIN and MANAGER bypass this check (managers still get scoped filtering in the service layer).
export function ownershipMiddleware(paramName = "employeeId") {
  return (req, res, next) => {
    if (req.user.role === "ADMIN" || req.user.role === "MANAGER") return next();

    const targetId = req.params[paramName];
    if (targetId && targetId !== req.user.employeeId) {
      return res.status(403).json({ error: "Forbidden" });
    }
    next();
  };
}
