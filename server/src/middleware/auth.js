import jwt from "jsonwebtoken";

// Verifies the access token cookie and attaches { id, role, employeeId } to req.user.
export function authMiddleware(req, res, next) {
  const token = req.cookies?.accessToken;
  if (!token) return res.status(401).json({ error: "Not authenticated" });

  try {
    const payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    req.user = payload;
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}
